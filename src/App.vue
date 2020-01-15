<template>
    <div id="app">
        <Home />
    </div>
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import Home from "./components/Home.vue";

    @Component({
        components: {
            Home
        }
    })
    export default class App extends Vue {}
</script>

<style lang="scss">
    @import "./components/config";
    @import "./components/common";

    // Import Bulma and Buefy styles
    @import "~bulma";
    @import "~buefy/src/scss/buefy";
</style>
