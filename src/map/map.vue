<template>
  <div class="mu-absolute-fit">
    <div
      id="map"
      class="mu-absolute-fit"
      :invisible="!baseMapVisible" />
    <mode />
    <slot />
  </div>
</template>
<script>
  import BMap from 'BMap'
  import cloneDeep from 'lodash.clonedeep'
  import debounce from 'lodash.debounce'

  import MapMixin from './map'
  import CustomSvg from '../map/overlay/overlay-svg'
  import { addOverlay } from '../map/overlay/operate/add-overlay'
  import { selectOverlay } from '../map/overlay/operate/select-overlay'

  // import { notify } from 'mussel'
  // import { getCreateOverlays, getUpdateOverlays } from './calc/overlay'

  import { startDrawing } from './overlay/operate/drawing-overlay'

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
      baseMapVisible: {
        type: Boolean,
        default: true
      },
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
        map: null,
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
        id: -1,
        parentId: -1,
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
      this.map = new BMap.Map('map', { enableMapClick: false })
      this.map.centerAndZoom(new BMap.Point(116.404, 39.915), 13)
      this.map.setCurrentCity('北京')
      this.map.enableScrollWheelZoom(true)

      this.init()
    },
    methods: {
      // setMapType (val, mode) {
      //   this.activeMode = val
      //   this.map.setMapType(mode)
      //   this.$emit('setMapType', val)
      // }
      switchOverlayWindow (key) {
        this.activeLegend = null
        this[key] = !this[key]
      },
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
        startDrawing(this.$data)
      },
      updateOverlay: debounce(function (key, value) {
        this.activeOverlay.update(key, value)
      }, 500),
      selectOverlay (overlay) {
        let points = null
        const type = overlay.type

        try {
          points = overlay.getPath()
        } catch {
          points = [overlay.getPosition()]
        }

        if (type.includes('special')) {
          overlay = this.specialOverlays[overlay.parentId].find(item => item.invented)
        }
        selectOverlay(null, overlay, this.$data)
        const viewPort = this.map.getViewport(points)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
      },
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
      drawSvg (point, options) {
        const overlay = new CustomSvg(point, options)
        return overlay
      },
      addOverlay (overlay) {
        addOverlay(overlay, this.$data)
      }
    }
  }
</script>

<style>
  [invisible] .anchorBL {
    display: none;
  }

  #map {
    top: 60px;
    left: 72px;
    right: 16px;
    bottom: 16px;
  }
</style>
