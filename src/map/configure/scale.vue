<template>
  <div
    v-show="visible"
    class="scale">
    {{ activeScale }}
  </div>
</template>
<script>
  import { scaleSpecs, zoomSpecs } from '../../constants'

  export default {
    inject: ['baiduMap'],
    computed: {
      map () {
        return this.baiduMap.map
      },
      visible () {
        return this.baiduMap.configureVisible
      },
      activeScale () {
        const zoom = this.map ? this.map.getZoom() : null
        const idx = zoomSpecs.indexOf(zoom)
        return `比例尺：${scaleSpecs[idx]}`
      }
    }
  }
</script>
<style>
  .scale {
    position: absolute;
    padding: 0 4px;
    top: auto;
    right: auto;
    bottom: 20px;
    left: 80px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.701961);
  }
</style>
