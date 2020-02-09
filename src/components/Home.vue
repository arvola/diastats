<template>
    <div class="main-wrap">
        <section class="main-header is-hidden-print">
            <div class="container">
                <nav class="level">
                    <div class="level-left">
                        <div class="level-item">
                            <h1 class="is-size-2">Diastats</h1>
                        </div>
                    </div>
                    <div class="level-right">
                        <div class="level-item">
                            <b-field>
                                <b-select size="is-small" v-model="graphCount">
                                    <option value="1">
                                        Single Graph
                                    </option>
                                    <option value="2">
                                        Double Graph
                                    </option>
                                    <option value="3">
                                        Triple Graph
                                    </option>
                                </b-select>
                            </b-field>
                        </div>
                        <div class="level-item">
                            <button class="button is-primary is-small" @click="isDatesModalActive = true">Dates</button>
                            <b-modal
                                :active.sync="isDatesModalActive"
                                has-modal-card
                                trap-focus
                                aria-role="dialog"
                                aria-modal
                            >
                                <div class="modal-card" style="width: auto;">
                                    <header class="modal-card-head">
                                        <p class="modal-card-title">Select Date Range</p>
                                    </header>
                                    <div class="modal-card-body">
                                        <RangeSelector @dates="datesSelected" />
                                    </div>
                                    <footer class="modal-card-foot"></footer>
                                </div>
                            </b-modal>
                        </div>
                        <div class="level-item">
                            <button class="button is-primary" @click="isComponentModalActive = true">Add Data</button>
                            <b-modal
                                :active.sync="isComponentModalActive"
                                has-modal-card
                                trap-focus
                                aria-role="dialog"
                                aria-modal
                            >
                                <div class="modal-card" style="width: auto;">
                                    <header class="modal-card-head">
                                        <p class="modal-card-title">Add Data</p>
                                    </header>
                                    <div class="modal-card-body">
                                        <DataLoader />
                                    </div>
                                    <footer class="modal-card-foot"></footer>
                                </div>
                            </b-modal>
                        </div>
                    </div>
                </nav>
            </div>
        </section>
        <div class="columns is-centered has-text-centered is-marginless date-arrows">
            <div class="column is-2 is-paddingless is-hidden-print">
                <b-button @click="datesBack" icon-right="arrow-left" size="is-large" type="is-text" />
            </div>
            <div class="column is-4 is-paddingless is-hidden-print"></div>
            <div class="column is-2 is-paddingless is-hidden-print">
                <b-button @click="datesForward" icon-right="arrow-right" size="is-large" type="is-text" />
            </div>
        </div>
        <div class="graphs-container">
            <template v-for="n in graphNumbers">
                <Graph ref="graphs" v-bind:key="n" :height="graphHeight" :showDates="n !== 1" />
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch, Ref } from "vue-property-decorator";
    import DataLoader from "./DataLoader.vue";
    import RangeSelector from "./RangeSelector.vue";
    import Data from "../data/Data";
    import openDb from "../data/db";
    import moment from "moment";
    import { ApexOptions } from "apexcharts";
    import Graph from "./Graph.vue";

    @Component({
        components: { DataLoader, RangeSelector, Graph }
    })
    export default class HelloWorld extends Vue {
        @Prop() private msg!: string;

        @Ref() readonly graphs!: Graph[];

        isComponentModalActive = false;
        isDatesModalActive = false;
        graphCount = 1;

        from: Date = moment()
            .subtract(3, "days")
            .endOf("day")
            .add(3, "hours")
            .toDate();
        to: Date = moment()
            .endOf("day")
            .add(3, "hours")
            .toDate();

        private store: Promise<Data> = openDb().then(it => new Data(it));

        get graphHeight() {
            switch (this.graphCount) {
                case 1:
                    return 800;
                case 2:
                    return 500;
                default:
                    return 450;
            }
        }

        get graphNumbers() {
            return Array.from({ length: this.graphCount }, (v, i) => i + 1);
        }

        async created() {
            const store = await this.store;

            try {
                let latest = await store.getLatestDataDate();
                if (latest) {
                    this.setDates(latest, 3);
                }
            } catch (err) {
                console.error(err);
            }
        }

        setDates(to: any, days: number = 1) {
            let m = moment(to)
                .endOf("day")
                .add(3, "hours");
            let toDate = m.toDate();
            this.from = m.subtract(days, "days").toDate();
            this.to = toDate;

            console.log(`${this.from} to ${this.to}`);

            this.applyDates();
        }

        async datesSelected(dates: Array<Date>) {
            this.from = dates[0];
            this.to = dates[1];
            this.applyDates();
        }

        @Watch("graphNumbers")
        async applyDates() {
            let from = this.from;
            let to = this.to;
            if (from && to) {
                for (let graph of this.graphs) {
                    graph.from = from;
                    graph.to = to;

                    let fromT = from.getTime() - (to.getTime() - from.getTime());
                    to = from;
                    from = new Date(fromT);
                }
                this.isDatesModalActive = false;
            } else {
                this.$buefy.snackbar.open({
                    message: "Please select a range of dates",
                    type: "is-warning",
                    indefinite: true
                });
            }
        }

        async datesForward() {
            let diff = (this.to.getTime() - this.from.getTime()) * this.graphCount;
            this.from = new Date(this.from.getTime() + diff);
            this.to = new Date(this.to.getTime() + diff);
            this.applyDates();
        }

        async datesBack() {
            let diff = (this.to.getTime() - this.from.getTime()) * this.graphCount;
            this.from = new Date(this.from.getTime() - diff);
            this.to = new Date(this.to.getTime() - diff);
            this.applyDates();
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
    @import "./config";
    .main-header {
        background: $dark;

        h1 {
            color: $light;
        }
    }

    .graphs-container {
        margin-top: -54px;
        @media print {
            margin-top: 0;
        }
    }

    .date-arrows {
        position: relative;
        z-index: 10;
    }

    .dates-column {
        line-height: 55px;
        font-size: 18px;
    }
</style>
