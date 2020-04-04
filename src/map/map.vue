<template>
  <div class="mu-absolute-fit">
    <div
      id="map"
      class="mu-absolute-fit" />
    <mode />
    <slot />
  </div>
</template>
<script>
  import BMap from 'BMap'
  import cloneDeep from 'lodash.clonedeep'

  import MapMixin from './map'
  // import debounce from 'lodash.debounce'
  // import { notify } from 'mussel'
  // import { getCreateOverlays, getUpdateOverlays } from './calc/overlay'

  import { selectLegend } from './overlay/legend'

  import Mode from './mode/mode.vue'

  export default {
    components: {
      Mode
    },
    provide () {
      return {
        baiduMap: this
      }
    },
    mixins: [MapMixin],
    props: {
      mapEvents: {
        type: Object,
        default: () => ({})
      },
      mapLegends: {
        type: Array,
        default: () => ([])
      },
      mapOverlays: {
        type: Array,
        default: () => ([])
      },
      mapStructures: {
        type: Array,
        default: () => ([])
      }
    },
    data () {
      return {
        baiduMap: null,
        drawingManager: null,
        events: this.mapEvents,
        legends: this.mapLegends,
        overlays: [],
        structures: this.mapStructures,
        overlayListVisible: false,
        selectedOverlays: [],
        updateOverlays: {},
        removeOverlays: [],
        specialOverlays: {},
        polylineCenters: {},
        polylinePointIds: {},
        activeMode: 'normal',
        activeOverlay: null,
        activeLegend: null,
        markerOverlays: [],
        markerPoints: [],
        markerPositions: [],
        view: true
      }
    },
    watch: {
      mapOverlays () {
        this.overlays = cloneDeep(this.mapOverlays)
        // 比较一下events
        this.bindOverlayEvents()
        this.initOverlays()
      }
    },
    mounted () {
      this.baiduMap = new BMap.Map('map', { enableMapClick: false })
      this.baiduMap.centerAndZoom(new BMap.Point(116.404, 39.915), 13)
      this.baiduMap.setCurrentCity('北京')
      this.baiduMap.enableScrollWheelZoom(true)

      this.init()
    },
    methods: {
      // setMapType (val, mode) {
      //   this.activeMode = val
      //   this.baiduMap.setMapType(mode)
      //   this.$emit('setMapType', val)
      // }
      // switchOverlayWindow (key) {
      //   this.activeLegend = null
      //   this[key] = !this[key]
      // },
      // addLegend (legend) {
      //   this.$emit('addLegend', legend)
      // },
      // removeLegend (legend) {
      //   this.$emit('removeLegend', legend)
      // },
      selectLegend (val, style = {}) {
        if (this.overlayListVisible) {
          this.overlayListVisible = false
        }

        this.activeLegend = val
        selectLegend(this.$data)
      }
      // updateOverlay: debounce(function (key, value) {
      //   let legend = null
      //   if (key === 'projectMapLegendId') {
      //     legend = getLegend(this.legends, value)
      //   }
      //   this.update.setSetting(key, value, legend, (oly) => {
      //     this.initial._select.overlay(oly)
      //   })
      // }, 500),
      // selectOverlay (overlay) {
      //   let points = null
      //   const type = overlay.type

      //   try {
      //     points = overlay.getPath()
      //   } catch {
      //     points = [overlay.getPosition()]
      //   }

      //   const viewPort = this.map.getViewport(points)
      //   this.map.centerAndZoom(viewPort.center, viewPort.zoom)
      //   if (type.includes('special')) {
      //     overlay = this.specialOverlays[overlay.parentId].find(item => item.invented)
      //   }
      //   this.initial._select.overlay(overlay)
      // },
      // saveOverlays () {
      //   const result = {}

      //   result.creates = getCreateOverlays(this.overlays, this.polylineCenters)
      //   if (Object.keys(this.updateOverlays).length === 0 &&
      //     this.removeOverlays.length === 0 && !result.creates) {
      //     notify('info', '没有需要修改的信息。')
      //     return
      //   }
      //   if (this.removeOverlays.length > 0) {
      //     result.removes = this.removeOverlays
      //   }
      //   if (Object.keys(this.updateOverlays).length > 0) {
      //     result.updates = getUpdateOverlays(this.updateOverlays)
      //   }
      //   this.$emit('save', result)
      // }
    }
  }
</script>
