<template>
    <div id="app-wrapper">
        <IndexView />
    </div>
</template>

<script>
import IndexView from '@/views/index.vue'

export default {
    name: 'App',
    components: {
        IndexView
    }
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
[v-cloak]{display:none}

#app-wrapper {
    width: 100%;
    height: 100vh;
}
</style>
