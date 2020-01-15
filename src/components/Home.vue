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
        <Graph ref="graph1" />
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

        @Ref() readonly graph1!: Graph

        isComponentModalActive = false;
        isDatesModalActive = false;

        private store: Promise<Data> = openDb().then(it => new Data(it));

        async created() {
            const store = await this.store;

            try {
                let latest = await store.getLatestDataDate();
                if (latest) {
                    this.graph1.setDates(latest, 3);
                }
            } catch (err) {
                console.error(err);
            }
        }

        async datesSelected(dates: Array<Date>) {
            let [from, to] = dates;
            console.log(from);
            console.log(to);
            if (from && to) {
                this.graph1.from = from;
                this.graph1.to = to;
                this.isDatesModalActive = false;
            } else {
                this.$buefy.snackbar.open({
                    message: "Please select a range of dates",
                    type: "is-warning",
                    indefinite: true
                });
            }
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

    .date-arrows {
        margin-top: 5px;
    }

    .dates-column {
        line-height: 55px;
        font-size: 18px;
    }
</style>
