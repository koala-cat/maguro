<template>
  <div
    v-show="visible"
    class="scale">
    {{ activeScale }}
  </div>
</template>
<script>
  import cloneDeep from 'lodash.clonedeep'
  import { scaleSpecs } from '../../constants'

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
        const scales = cloneDeep(scaleSpecs)
        scales.push('500km', '1000km', '2000km', '5000km', '10000km')
        scales.reverse()
        const zoom = this.map ? this.map.getZoom() : 13
        return `比例尺：${scales[zoom - 1]}`
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
