<template>
  <div class="mu-absolute-fit">
    <div
      id="map"
      class="mu-absolute-fit"
      :invisible="!baseMapVisible"
      style="top: 40px;" />
    <mode />
    <scale />
    <slot />
  </div>
</template>
<script>
  import BMap from 'BMap'
  import cloneDeep from 'lodash.clonedeep'
  import debounce from 'lodash.debounce'
  import { notify } from 'mussel'
  import { modes } from '../constants'

  import CustomSvg from '../map/overlay/overlay-svg'
  import { getOverlaySettings } from '../map/overlay/setting.js'

  import { drawUploadLine } from './overlay/operate/draw-overlay.js'
  import { startDrawing } from './overlay/operate/drawing-overlay'
  import { getSaveData } from './overlay/operate/save-overlay'
  import { selectOverlay } from './overlay/operate/select-overlay'
  import { updateOverlay } from './overlay/operate/update-overlay.js'

  import MapMixin from './map'
  import Mode from './configure/mode.vue'
  import Scale from './configure/scale.vue'

  export default {
    components: {
      Mode,
      Scale
    },
    provide () {
      return {
        baiduMap: this
      }
    },
    mixins: [MapMixin],
    props: {
      mapZoomSettings: {
        type: Object,
        default: () => ({})
      },
      mapType: {
        type: String,
        default: 'normal'
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
      },
      mapConfigureVisible: {
        type: Boolean,
        default: true
      }
    },
    data () {
      return {
        map: null,
        drawingManager: null,
        zoomSettings: {},
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
    computed: {
      baseMapVisible () {
        return this.mapType !== 'graphic'
      },
      configureVisible () {
        return this.baseMapVisible && this.mapConfigureVisible
      }
    },
    watch: {
      mapZoomSettings (val) {
        this.zoomSettings = val
      },
      mapOverlays () {
        this.overlays = cloneDeep(this.mapOverlays)
        this.bindOverlayEvents()
        this.initOverlays()
      },
      baseMapVisible (val) {
        this.map.setNormalMapDisplay(this.baseMapVisible)
      },
      mapType (val) {
        if (modes[val]) {
          this.map.setMapType(modes[val])
        }
      }
    },
    mounted () {
      this.map = new BMap.Map('map', { enableMapClick: false })
      this.map.centerAndZoom(new BMap.Point(116.404, 39.915), 13)
      this.map.setCurrentCity('北京')
      this.map.enableScrollWheelZoom(true)
      this.map.setNormalMapDisplay(this.baseMapVisible)
      this.init()
    },
    methods: {
      drawSvg (point, options) {
        const overlay = new CustomSvg(point, options)
        return overlay
      },
      setMapType (val) {
        this.$emit('setMapMode', val)
      },
      setMapZoomSettings (key, value) {
        this.$emit('setMapZoomSettings', key, value)
      },
      getOverlaySettings (overlay) {
        return getOverlaySettings(overlay)
      },
      addLegend () {
        this.$emit('addLegend')
      },
      removeLegend (legend) {
        this.$emit('removeLegend', legend)
      },
      switchOverlayWindow (key) {
        this.activeLegend = null
        this[key] = !this[key]
      },
      selectLegend (legend) {
        if (this.overlayListVisible) {
          this.overlayListVisible = false
        }

        this.activeLegend = legend
        if (legend.value !== 'scale') {
          startDrawing(this.$data)
        }
      },
      drawUploadLine (data) {
        drawUploadLine(data, this.$data)
      },
      updateOverlay: debounce(function (key, value) {
        try {
          this.activeOverlay.update(key, value)
        } catch {
          updateOverlay(key, value, this.$data)
        }
      }, 500),
      selectOverlay (overlay) {
        if (!(overlay instanceof BMap.Overlay)) {
          selectOverlay(null, overlay, this.$data)
          return
        }

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
      saveOverlays () {
        const result = getSaveData(this.$data)
        if (result) {
          this.$emit('save', result)
        } else {
          notify('info', '没有需要修改的信息。')
        }
      }
    }
  }
</script>

<style>
  [invisible] .anchorBL {
    display: none;
  }
</style>
