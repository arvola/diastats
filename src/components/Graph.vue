<template>
    <section class="graph-section section section-content is-paddingless">
        <div class="columns is-centered has-text-centered is-marginless">
            <div class="column is-4 is-paddingless dates-column">
                {{ dates }}
            </div>
        </div>
        <apexchart width="100%" :height="height" type="line" :options="chartOptions" :series="series"></apexchart>
    </section>
</template>

<script lang="ts">
    import { Component, Prop, Vue, Watch } from "vue-property-decorator";
    import DataLoader from "./DataLoader.vue";
    import RangeSelector from "./RangeSelector.vue";
    import Data from "../data/Data";
    import openDb from "../data/db";
    import moment from "moment";
    import { ApexOptions } from "apexcharts";

    @Component({
        components: { DataLoader, RangeSelector }
    })
    export default class Graph extends Vue {
        @Prop({ default: "" }) readonly height!: string;
        @Prop({ default: true }) readonly showDates!: boolean;

        from: Date = moment()
            .subtract(3, "days")
            .endOf("day")
            .add(3, "hours")
            .toDate();
        to: Date = moment()
            .endOf("day")
            .add(3, "hours")
            .toDate();

        chartOptions: ApexOptions = {
            chart: {
                animations: {
                    enabled: false
                },
                stacked: false,
                zoom: {
                    type: "x",
                    enabled: true
                },
                toolbar: {
                    autoSelected: "zoom"
                }
            },
            colors: ["#297bb2", "#ff0000"],
            // @ts-ignore incorrect typings in the library
            dataLabels: {
                enabled: true,
                enabledOnSeries: [1],
                textAnchor: "middle",
                // @ts-ignore incorrect typings in the library
                position: "middle",
                offsetY: 2,
                style: {
                    colors: ["#fff"]
                },
                background: {
                    enabled: false,
                    dropShadow: {}
                }
            },
            // @ts-ignore incorrect typings in the library
            markers: {
                size: [0, 12]
            },
            stroke: {
                curve: "smooth",
                width: 3
            },
            title: {
                align: "left"
            },
            grid: {
                row: {
                    colors: [
                        "#ffb400",
                        "#ffb400",
                        "#ffb400c0",
                        "#ffb400a0",
                        "#ffb40090",
                        "#ffb40070",
                        "#ffb40050",
                        "#ffb40030",
                        "transparent",
                        "transparent",
                        "transparent",
                        "transparent",
                        "#ff000019",
                        "#ff000019"
                    ]
                },
                xaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            xaxis: {
                type: "datetime",
                labels: {
                    // @ts-ignore incorrect typings in the library
                    datetimeUTC: false
                }
            },
            yaxis: {
                min: 60,
                max: 200,
                tickAmount: 14
            }
        };

        series = <{ data: [Date, number | null][]; name: string; type: string }[]>[];

        private store: Promise<Data> = openDb().then(it => new Data(it));

        get dates() {
            let from = moment(this.from);
            let to = moment(this.to);
            let format = "dddd, MMM Do";
            console.log(`Diff is ${to.diff(from, "days")}`);
            if (to.diff(from, "days") < 2) {
                return from.format(format);
            } else {
                return from.format(format) + " - " + to.format(format);
            }
        }

        @Watch("to")
        async loadDates() {
            const store = await this.store;

            let days = (this.to.getTime() - this.from.getTime()) / (24 * 60 * 60 * 1000);

            console.log(`Days ${days}`);

            let { maxima, dexcomGlucose, mysugrGlucose, carbs, insulin, exercise } = await store.getData(
                this.from,
                this.to
            );

            let dexcomData: [Date, number | null][] = [];

            let prev: moment.Moment | null = null;
            dexcomGlucose.forEach(it => {
                let current = moment(it.timestamp);
                if (prev && prev.diff(current, "minutes") < -10) {
                    dexcomData.push([prev.add(1, "minute").toDate(), null]);
                }
                prev = current;
                dexcomData.push([it.timestamp, it.value]);
            });

            let dexcomLast = dexcomData[dexcomData.length - 1];

            if (moment(dexcomLast[0]).diff(this.to, "minutes") < -10) {
                dexcomData.push([this.to, null]);
            }

            console.log("Got data, rendering series");

            this.series = [
                {
                    data: dexcomData,
                    type: "line",
                    name: "Dexcom"
                },
                {
                    data: mysugrGlucose.map(it => {
                        return [it.timestamp, it.value];
                    }),
                    type: "scatter",
                    name: "mySugr"
                }
            ];

            let xAnn = carbs
                .map(it => {
                    let text = it.value.toString();
                    let labelBorder = "#c2c2c2";
                    let ann: XAxisAnnotations = {
                        x: it.timestamp.getTime(),
                        strokeDashArray: 0,
                        borderColor: "#7aa623"
                    };
                    if (it.value === 15 || it.value === 30) {
                        ann.borderColor = "#30db16";
                        ann.strokeDashArray = 5;
                    } else if (it.value === 4 || it.value === 8 || it.value === 12 || it.value === 16) {
                        ann.borderColor = "#30db16";
                        ann.strokeDashArray = 5;
                        labelBorder = "#333";
                    }

                    if (days < 4) {
                        ann.label = {
                            text,
                            borderColor: labelBorder,
                            borderWidth: 2,
                            style: {
                                background: ann.borderColor,
                                color: "#fff"
                            },
                            offsetY: 0
                        };
                    }
                    return ann;
                })
                .concat(
                    exercise.map(it => {
                        let ann: XAxisAnnotations = {
                            x: it.timestamp.getTime() - it.value,
                            x2: it.timestamp.getTime()
                        };

                        switch (it.info) {
                            case "Heavy":
                                ann.fillColor = "#00c2db";
                                break;
                            case "Medium":
                                ann.fillColor = "#73c6d1";
                                break;
                            default:
                                ann.fillColor = "#8bbec4";
                                break;
                        }
                        ann.label = {
                            text: it.info,
                            style: {
                                color: "#fff",
                                background: ann.fillColor
                            },
                            offsetY: 30
                        };

                        return ann;
                    })
                );

            if (days < 4) {
                xAnn = xAnn.concat(
                    insulin.map(it => {
                        let ann: XAxisAnnotations = {
                            x: it.timestamp.getTime(),
                            strokeDashArray: 0,
                            borderColor: "#00000000",
                            label: {
                                text: it.value.toString(),
                                style: {
                                    color: "#fff",
                                    background: "#bb4bcc"
                                },
                                offsetY: -20
                            }
                        };

                        return ann;
                    })
                );
            }

            this.chartOptions = {
                ...this.chartOptions,
                annotations: {
                    xaxis: xAnn,
                    points: maxima.highs.concat(maxima.lows).map(it => {
                        let offset = 0;
                        if (it.diff < 0) {
                            offset = 35;
                        }

                        return {
                            x: it.timestamp.getTime(),
                            y: it.value,
                            marker: {
                                strokeColor: "transparent",
                                fillColor: "transparent",
                                size: 3
                            },
                            label: {
                                borderColor: "#297bb2",
                                offsetY: offset,
                                style: {
                                    color: "#fff",
                                    background: "#297bb2",
                                    padding: {
                                        left: 2,
                                        right: 2,
                                        top: 2,
                                        bottom: 2
                                    }
                                },
                                text: it.value.toString()
                            }
                        };
                    })
                }
            };
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
    .dates-column {
        line-height: 45px;
        font-size: 18px;
    }
</style>
