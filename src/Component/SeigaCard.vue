<template>
    <div class="seiga-card" :class="{'seiga-card-frosted': frosted}">
        <div class="seiga-card-header" v-if="title">
            <slot name="header">{{ title }}</slot>
        </div>
        <div class="seiga-card-content">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps({
    title: {
        type: String,
        default: ''
    },
    frosted:{
        type: Boolean,
        default: false
    }
})
</script>

<style scoped lang="scss">
</style>