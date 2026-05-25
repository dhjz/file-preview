<template>
  <div class="vue-office-ofd" ref="containerRef">
    <div v-if="loading" class="vue-office-ofd-loading">
      <span class="loading-spinner"></span>
      <span>文档加载中...</span>
    </div>
    <div v-if="errorMsg" class="vue-office-ofd-loading">{{ errorMsg }}</div>
    <div class="vue-office-ofd-main" ref="mainRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { parseOfdDocument, renderOfd, renderOfdByScale } from './ofd.es.min.js';
// import { parseOfdDocument, renderOfd, renderOfdByScale } from './ofd.es.min.js';
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  src: {
    type: [String, ArrayBuffer, Blob, File],
    default: null
  },
  options: {
    type: Object,
    default: () => ({})
  },
  requestOptions: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['rendered', 'error', 'loading']);

const containerRef = ref(null);
const mainRef = ref(null);
const loading = ref(false);
const errorMsg = ref('');
const ofdData = ref(null);

const loadOfd = async () => {
  if (!props.src) {
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  emit('loading', true);

  try {
    let data = props.src;

    if (typeof props.src === 'string') {
      const fetchOptions = {
        method: 'GET',
        ...props.requestOptions
      };
      const response = await fetch(props.src, fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to fetch OFD: ${response.status} ${response.statusText}`);
      }
      data = await response.arrayBuffer();
    }
    const startTime = Date.now();
    console.log("开始解析OFD文档");
    const parseOptions = {
      ...props.options,
      ofd: data,
      success: async (res) => {
        ofdData.value = res[0];
        await renderPages();
        console.log(`解析OFD文档耗时: ${Date.now() - startTime}ms`);
        loading.value = false;
        emit('loading', false);
      },
      fail: (err) => {
        throw err;
      }
    };
    parseOfdDocument(parseOptions);
  } catch (err) {
    errorMsg.value = '文档加载失败或者网路错误';
    emit('error', err);
    loading.value = false;
    emit('loading', false);
  }
};

const renderPages = async () => {
  if (!ofdData.value || !mainRef.value) {
    return;
  }

  await nextTick();

  const screenWidth = props.options?.width || containerRef.value?.clientWidth || 800;
  const scale = props.options?.scale;

  let pageDivs;
  if (scale) {
    pageDivs = renderOfdByScale(ofdData.value);
  } else {
    pageDivs = renderOfd(screenWidth, ofdData.value);
  }
  mainRef.value.innerHTML = '';
  pageDivs.forEach(pageDiv => {
    mainRef.value.appendChild(pageDiv);
  });

  emit('rendered', {
    pages: ofdData.value.pages,
    document: ofdData.value.document
  });
};

watch(() => props.src, () => {
  props.src && loadOfd();
}, { immediate: true });

defineExpose({
  loadOfd,
  getOfdData: () => ofdData.value
});
</script>

<style>
.vue-office-ofd {
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.vue-office-ofd-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vue-office-ofd-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  color: #f56c6c;
}

.vue-office-ofd-main {
  background: gray;
  padding: 30px;
  padding-bottom: 0px;
  display: flex;
  flex-flow: column;
  align-items: center;
  min-height: 100%;
  box-sizing: border-box;
}
@media screen and (max-width: 768px) {
  .vue-office-ofd-main {
    padding: 10px;
  }
}
</style>