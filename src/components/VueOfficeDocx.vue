<template>
   <div v-loading="loading">
       <vue-office-docx
           :src="docx"
           style="height: 100vh;"
           @rendered="renderedHandler"
           @error="errorHandler"
       />
   </div>
</template>

<script>
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'

export default {
    name: "VueOfficeDocxDemo",
    components: {
        VueOfficeDocx
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
            docx: ''
        }
    },
    watch: {
        fileUrl: {
            immediate: true,
            handler(url) {
                if (url) {
                    this.docx = url
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