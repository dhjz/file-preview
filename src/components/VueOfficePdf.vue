<template>
    <div v-loading="loading">
        <vue-office-pdf
            :src="pdf"
            @rendered="renderedHandler"
            @error="errorHandler"
        />
    </div>
</template>

<script>
import VueOfficePdf from '@vue-office/pdf'

export default {
    name: "VueOfficePdfDemo",
    components: {
        VueOfficePdf
    },
    props: {
        fileUrl: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            loading: true,
            pdf: ''
        }
    },
    watch: {
        fileUrl: {
            immediate: true,
            handler(url) {
                if (url) {
                    this.pdf = url
                    this.loading = true
                }
            }
        }
    },
    methods: {
        renderedHandler() {
            this.loading = false;
            console.log("渲染完成")
        },
        errorHandler() {
            this.loading = false;
            console.log("渲染失败")
        }
    }
};
</script>

<style scoped>

</style>