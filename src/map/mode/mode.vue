<template>
  <mu-h-box
    class="mode">
    <div
      v-for="type in mapTypes"
      :key="type.value"
      :class="{active: type.value === mode}"
      :style="{ backgroundPosition: type.backgroundPosition }"
      @click="setMapType(type.value)">
      <span>{{ type.label }}</span>
    </div>
  </mu-h-box>
</template>
<script>
  import { mapTypes } from '../../constants'

  export default {
    inject: ['baiduMap'],
    data () {
      return {
        modes: {
          normal: BMAP_NORMAL_MAP,
          earth: BMAP_HYBRID_MAP
        }
      }
    },
    computed: {
      mapTypes () {
        return mapTypes
      },
      mode () {
        return this.baiduMap.active.mode
      }
    },
    methods: {
      setMapType (val) {
        this.baiduMap.setMapType(val, this.modes[val])
      }
    }
  }
</script>

<style scoped>
  .mode {
    position: absolute !important;
    right: 32px;
    bottom: 32px;
    height: 60px;
    width: 172px;
    font-size: $fontSize;
    z-index: 5;
    & > * {
      width: 50%;
      height: 100%;
      margin-left: 4px;
      background: url(assets/images/maptype.png) no-repeat 0 0;
      background-size: 86px 240px;
      border: 1px solid transparent;
      border-radius: 2px;
      &:hover {
        cursor: pointer;
        & > span {
          background-color: $primaryColor;
        }
      }
      &.active {
        border-color: $primaryColor;
        & > span {
          background-color: $primaryColor;
        }
      }
      & > span {
        position: absolute;
        bottom: 0;
        right: 0;
        padding: 2px;
        color: $fontColorWhite;
      }
    }
  }
</style>
