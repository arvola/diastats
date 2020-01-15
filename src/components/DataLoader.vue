<template>
    <div class="data-upload container">
        <div>
            <b-field grouped group-multiline>
                <div class="control">
                    <b-taglist attached>
                        <b-tag type="is-dark">Dexcom</b-tag>
                        <b-tag type="is-info">{{dexcomCount}}</b-tag>
                    </b-taglist>
                </div>

                <div class="control">
                    <b-taglist attached>
                        <b-tag type="is-dark">Freestyle</b-tag>
                        <b-tag type="is-success">{{freestyleCount}}</b-tag>
                    </b-taglist>
                </div>

                <div class="control">
                    <b-taglist attached>
                        <b-tag type="is-dark">Other</b-tag>
                        <b-tag type="is-primary">{{otherCount}}</b-tag>
                    </b-taglist>
                </div>
            </b-field>
            <b-field grouped position="is-centered">
                <b-upload v-model="dropFiles" @input="uploaded" drag-drop>
                    <section class="section">
                        <div class="content has-text-centered">
                            <p>
                                <b-icon icon="upload" size="is-large"></b-icon>
                            </p>
                            <p>Drop your files here or click to upload</p>
                        </div>
                    </section>
                </b-upload>
            </b-field>
        </div>
        <div class="added_files">
            <b-table :data="added" :columns="columns"></b-table>
        </div>
    </div>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";
    import { parse } from "papaparse";
    import Data from "../data/Data";
    import openDb from "../data/db";
    import { camelCase } from "change-case";

    @Component
    export default class DataLoader extends Vue {
        dropFiles: File | null = null;
        added: any[] = [];
        dexcomCount = 0;
        freestyleCount = 0;
        otherCount = 0;

        private store: Promise<Data> = openDb().then(it => new Data(it));

        columns = [
            {
                field: "name",
                label: "File"
            },
            {
                field: "type",
                label: "Type"
            },
            {
                field: "status",
                label: "Status"
            },
            {
                field: "count",
                label: "Added Records"
            }
        ];

        async created() {
            const store = await this.store;
            let counts = await store.getCounts();
            this.dexcomCount = counts.dexcom;
            this.freestyleCount = counts.freestyle;
            this.otherCount = counts.other;
        }

        uploaded(value: File) {
            let add = {
                name: value.name,
                type: "",
                status: "Processing",
                count: <number | string>""
            };

            this.added.push(add);

            parse(value, {
                header: true,
                transformHeader: header => {
                    let parsed = camelCase(header.replace(/(\s+)?\([^)]*\)/, ""));
                    console.log(`${header} -> ${parsed}`);
                    return parsed;
                },
                complete: async ({ data }) => {
                    const store = await this.store;
                    let result = await store.addData(data);
                    add.status = "Added";
                    add.count = result.count;
                    add.type = result.type;
                }
            });
        }
    }
</script>

<style scoped lang="scss">
</style>
