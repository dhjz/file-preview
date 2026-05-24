<template>
   <div v-loading="loading">
       <vue-office-excel
           :src="excel"
           :options="options"
           style="height: 100vh;"
           @rendered="renderedHandler"
           @error="errorHandler"
       />
   </div>
</template>

<script>
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'

export default {
    name: "VueOfficeExcelDemo",
    components: {
        VueOfficeExcel
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
            options:{
                xls: false,
                minColLength: 0,
                minRowLength: 0,
                widthOffset: 10,
                heightOffset: 10,
                beforeTransformData: (workbookData) => {return workbookData},
                transformData: (workbookData) => {return workbookData},
            },
            excel: ''
        }
    },
    watch: {
        fileUrl: {
            immediate: true,
            handler(url) {
                if (url) {
                    this.excel = url
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