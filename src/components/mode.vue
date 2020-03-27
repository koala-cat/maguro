<template>
  <mu-h-box
    class="map-mode">
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
  import { mapTypes } from '../constants'

  export default {
    inject: ['map'],
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
        return this.map.active.mode
      }
    },
    methods: {
      setMapType (val) {
        this.map.setMapType(val, this.modes[val])
      }
    }
  }
</script>
