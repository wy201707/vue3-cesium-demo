import { createApp } from 'vue'
import App from './App.vue'
import "cesium/Build/Cesium/Widgets/widgets.css"
import { watch, onUnmounted } from 'vue'

const app = createApp(App)

// 注册自定义指令
app.directive('loading', {
  mounted(el, binding) {
    const loadingRef = binding.value;
    if (!loadingRef || !loadingRef.value) return;

    // 监听 ref 变化
    const unwatch = watch(
      () => loadingRef.value,
      (newVal) => {
        if (newVal) el.classList.add('loading');
        else el.classList.remove('loading');
      }
    );

    // 清理逻辑
    onUnmounted(() => {
      unwatch();
      el.classList.remove('loading');
    });
  }
});

app.mount('#app') 