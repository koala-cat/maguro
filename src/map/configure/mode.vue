<template>
  <mu-h-box
    v-show="visible"
    class="mode">
    <div
      v-for="type in mapTypes"
      :key="type.value"
      :class="{active: type.value === mode}"
      :style="{ backgroundPosition: type.backgroundPosition }"
      @click="switchMapType(type.value)">
      <label :class="{ active: defaultMode === type.value }">
        <input
          type="checkbox"
          :checked="defaultMode === type.value"
          @click.stop=""
          @change="setDefaultMapType(type.value)">
        设为默认
      </label>
      <span>{{ type.label }}</span>
    </div>
  </mu-h-box>
</template>
<script>
  import { mapTypes } from '../../constants'

  export default {
    inject: ['baiduMap'],
    computed: {
      mapTypes () {
        return mapTypes
      },
      visible () {
        return this.baiduMap.configureVisible
      },
      defaultMode () {
        return this.baiduMap.mapDefaultType
      },
      mode () {
        return this.baiduMap.mapType
      }
    },
    methods: {
      setDefaultMapType (val) {
        this.baiduMap.setMapDefaultType(val)
      },
      switchMapType (val) {
        this.baiduMap.switchMapType(val)
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
      border: 1px solid $normalColor;
      border-radius: 2px;
      &:hover {
        cursor: pointer;
      }
      &.active {
        border-color: $primaryColor;
        & > span {
          background-color: $primaryColor;
        }
      }
      & > * {
        padding: 0 2px;
        color: $fontColorWhite;
        background-color: $normalColor;
      }
      & > label {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        &.active {
          background-color: $primaryColor;
        }
      }
      & > span {
        position: absolute;
        bottom: 0;
        right: 0;
      }
    }
  }
</style>
