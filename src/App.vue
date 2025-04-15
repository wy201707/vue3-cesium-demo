<template>
  <div class="app-container">
    <div id="cesiumContainer"></div>
    <!-- 加载中提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">拼命加载中...</div>
    </div>
    <div class="control-panel">
      <div class="input-group">
        <input v-model="longitude" type="number" placeholder="经度" step="0.000001" id="longitude" name="longitude" />
        <input v-model="latitude" type="number" placeholder="纬度" step="0.000001" id="latitude" name="latitude" />
        <button @click="flyToLocation" :disabled="!isValidCoordinates">定位</button>
      </div>
    </div>
    <div
      v-if="popup.visible"
      class="cesium-popup"
      :style="{
      left: popup.x + 'px',
      top: popup.y + 'px',
    }"
    >
  
    弹窗: {{ popup.content }}
  </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import * as Cesium from 'cesium'
import "cesium/Build/Cesium/Widgets/widgets.css"


import { TianDiTuToken, MyToken} from "./config.my";
console.log("需要替换自己的token")

// 设置 Cesium 的静态资源路径
window.CESIUM_BASE_URL = '/node_modules/cesium/Build/Cesium/';

const longitude = ref('')
const latitude = ref('')
const isLoading = ref(true) // 添加加载状态变量

const popup=reactive({ 
  visible:false,
  content:'',
  x:'',
  y:''
})
let viewer = null
let marker = null
// 坐标验证
const isValidCoordinates = computed(() => {
  const lon = parseFloat(longitude.value)
  const lat = parseFloat(latitude.value)
  return !isNaN(lon) && !isNaN(lat) && 
         lon >= -180 && lon <= 180 && 
         lat >= -90 && lat <= 90
})

const flyToLocation = () => {
  if (!isValidCoordinates.value) {
    console.log('经纬度不合法')
    return
  }
  
  const lon = parseFloat(longitude.value)
  const lat = parseFloat(latitude.value)
  
  // 修改相机飞行参数
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000), // 增加高度到5000米
    orientation: {
      heading: 0,
      pitch: -Cesium.Math.PI_OVER_TWO,
      roll: 0
    },
    duration: 2 // 飞行时间2秒
  })

  // 移除之前的标记
  if (marker) {
    viewer.entities.remove(marker)
  }
  const position = Cesium.Cartesian3.fromDegrees(lon, lat)
  // 添加新的标记（使用PointGraphics实现随缩放变化的红色圆圈）
  marker = viewer.entities.add({
    position: position,
    name: `位置: ${lon.toFixed(6)}, ${lat.toFixed(6)}`,
    point: {
      pixelSize: 20,
      color: Cesium.Color.RED.withAlpha(0.9),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 4,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保始终可见
    },

    // label: {
    //   text: '定位点',
    //   font: '14px sans-serif',
    //   fillColor: Cesium.Color.WHITE,
    //   outlineColor: Cesium.Color.BLACK,
    //   outlineWidth: 2,
    //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //   verticalOrigin: Cesium.VerticalOrigin.TOP,
    //   pixelOffset: new Cesium.Cartesian2(0, -20)
    // },
    /* //方法2
    description: 'Hello World' // 添加默认描述  */
  })

  // 创建一个屏幕空间事件处理器，用于处理鼠标点击事件
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
  // 为左键点击事件设置处理函数
  handler.setInputAction(function (movement) {
    // 获取鼠标点击位置对应的场景对象
    const pickedObject = viewer.scene.pick(movement.position)
    console.log('Picked object:', pickedObject);
    console.log('viewer.scene', viewer.scene);
    // 检查点击的对象是否为有效的实体、是否点击了标记
    if (Cesium.defined(pickedObject) && pickedObject.id === marker) {
        popup.visible = true  
        popup.content = 'Hello World'
        const rect = viewer.canvas.getBoundingClientRect()
        // 弹窗位置不遮挡标记点
        popup.x = Math.min(
          movement.position.x - rect.left + 30, 
          window.innerWidth - 220
        )
        popup.y = Math.max(
          movement.position.y - rect.top - 50, 
          20
        )
        // console.log('movement.position',movement.position)
        // console.log('rect',rect)
        // console.log('DOM popup element:', document.querySelector('.cesium-popup'))
       
      } else {
        // 隐藏弹窗
        popup.visible = false
      }
       
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        


}

onMounted(async() => {
 
  Cesium.Ion.defaultAccessToken = MyToken;
  const terrainProvider = await Cesium.Terrain.fromWorldTerrain();
  viewer = new Cesium.Viewer('cesiumContainer', {
    terrain:terrainProvider ,
    //Cesium.Terrain.fromWorldTerrain(),//创建全球地形服务 支持3D现实高精度地形高程数据，支持地形照明、水面效果等高级渲染特性
    animation: false,
    baseLayerPicker: true,
    fullscreenButton: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    sceneModePicker: false,
    timeline: false,
    infoBox: false, // 禁用默认信息框  方法2
   /*  tilingScheme: new Cesium.WebMercatorTilingScheme()
    Cesium Ion 的默认底图使用 WGS84 坐标系（GeographicTilingScheme），
    而此处强制指定了 WebMercatorTilingScheme（墨卡托投影），导致与 Ion 影像服务的切片方案不兼容。 */
    creditContainer: document.createElement('div'), //移除左下角的版权信息
  })

  // // 解决沙箱iframe不允许执行JavaScript的问题
  // const iframe = document.getElementsByClassName('cesium-infoBox-iframe')[0]
  // if (iframe) {
  //   iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
  //   iframe.setAttribute('src', '') //必须设置src为空 否则不会生效
  // }

  // let tianditu = new Cesium.WebMapTileServiceImageryProvider({
  //   url:"http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk="+TianDiTuToken,
  //   layer: "tdtBasicLayer",
  //   style: "default",
  //   format: "image/jpeg",
  //   tileMatrixSetID: "GoogleMapsCompatible",
  //   show: false,
  // })



  // 设置默认视角
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.3915, 39.9053, 25000000), // 默认北京上空
    orientation: {
      heading: 0,
      pitch: -Cesium.Math.PI_OVER_TWO, //pi/3
      roll: 0
    }
  })
  
  // 监听地球加载完成事件
  viewer.scene.globe.tileLoadProgressEvent.addEventListener(() => {
    if (viewer.scene.globe.tilesLoaded) {
      // 所有瓦片加载完成，关闭加载状态
      setTimeout(() => {
        isLoading.value = false;
      }, 1000); // 延迟1秒关闭加载状态，确保地球完全显示
    }
  });
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
/* 修改html/body样式 */
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 确保容器层级 */
.app-container {
  position: fixed; /* 关键修改 */
  width: 100%;
  height: 100%;
}

#cesiumContainer {
  width: 100%;
  height: 100%;
}

#cesiumContainer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 加载中样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

.loading-text {
  color: white;
  font-size: 18px;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.input-group {
  display: flex;
  gap: 10px;
}

input {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100px;
}

button {
  padding: 5px 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #cccccc;
  cursor: not-allowed;
}



.cesium-popup {
  position: absolute;
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1001;
  max-width: 400px;
  font-size: 24px;
  word-wrap: break-word;
}
</style>