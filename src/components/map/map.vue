<template>
  <div class="map-wrapper">
    <div
      id="map"
      class="mu-absolute-fit" />
    <slot />
  </div>
</template>
<script>
  import BMap from 'BMap'
  import { Initial } from './initial'

  let map = null

  export default {
    provide () {
      return {
        map: this
      }
    },
    props: {
      commandOrg: {
        type: Boolean,
        default: false
      },
      legends: {
        type: Array,
        default: () => ([])
      },
      events: {
        type: Object,
        default: () => ({})
      },
      overlays: {
        type: Array,
        default: () => ([])
      },
      structures: {
        type: Array,
        default: () => ([])
      }
    },
    data () {
      return {
        map: null,
        overlayListVisible: false,
        selectedOverlays: [],
        updateOverlays: {},
        removeOverlays: [],
        specialOverlays: {},
        polylineCenters: {},
        polylinePointIds: {},
        active: {
          mode: 'normal',
          overlay: null,
          tool: null
        },
        marker: {
          overlays: [],
          points: [],
          positions: []
        }
      }
    },
    watch: {
      // events: {
      //   handler (val) {
      //     this.suspend = true
      //     this.initial.bindEvents(val)
      //     this.initial.overlays(true)
      //   },
      //   deep: true
      // }
    },
    mounted () {
      map = new BMap.Map('map', { enableMapClick: false })
      map.centerAndZoom(new BMap.Point(116.404, 39.915), 13)
      map.setCurrentCity('北京')
      map.enableScrollWheelZoom(true)
      this.map = map

      this.initial = new Initial(
        map,
        this.events,
        this.legends,
        this.overlays,
        this.selectedOverlays,
        this.specialOverlays,
        this.updateOverlays,
        this.removedOverlays,
        this.polylineCenters,
        this.polylinePointIds,
        this.active,
        this.marker
      )
    },
    methods: {
      switchOverlayWindow (key) {
        this[key] = !this[key]
      },
      setMapType (val, mode) {
        this.active.mode = val
        map.setMapType(mode)
        this.$emit('setMapType', val)
      },
      addLegend (legend) {
        console.log('addLegend')
      },
      removeLegend (legend) {
        console.log('removeLegend')
      },
      onSelectTool (val, style = {}) {
        this.suspend = true
        this.active.tool = val
        this.initial._select.tool()
      }
    //   if (zoom) {
    //   let points = null
    //   try {
    //     points = overlay.getPath()
    //   } catch {
    //     points = [overlay.getPosition()]
    //   }
    //   const viewPort = this._map.getViewport(points)
    //   this._map.centerAndZoom(viewPort.center, viewPort.zoom)
    //   if (type.includes('special')) {
    //     overlay = this._overlays.find(
    //       item => item.invented && item.parentId === overlay.parentId
    //     )
    //   }
    // }
    }
  }
</script>
