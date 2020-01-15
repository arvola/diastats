<template>
    <b-datepicker inline v-model="dates" @input="selected" range> </b-datepicker>
</template>

<script lang="ts">
    import { Component, Prop, Vue } from "vue-property-decorator";
    import moment from "moment";

    @Component
    export default class RangeSelector extends Vue {
        dates: Array<Date> = [];

        selected() {
            let from = moment(this.dates[0])
                .startOf("day")
                .add(3, "hours");
            let to = moment(this.dates[1])
                .endOf("day")
                .add(3, "hours");
            this.$emit("dates", [from.toDate(), to.toDate()]);
        }
    }
</script>
