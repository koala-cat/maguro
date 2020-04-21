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
  import { modes, defaultScaleMap } from '../constants'

  import MapMixin from './map'
  import CustomSvg from '../map/overlay/overlay-svg'
  import { addOverlay } from '../map/overlay/operate/add-overlay'
  import { getSaveData } from '../map/overlay/operate/save-overlay'
  import { selectOverlay } from '../map/overlay/operate/select-overlay'

  import { startDrawing } from './overlay/operate/drawing-overlay'

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
        view: true,
        scaleMap: defaultScaleMap
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
      setMapType (val) {
        this.$emit('set', val)
      },
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
      selectLegend (legend) {
        if (this.overlayListVisible) {
          this.overlayListVisible = false
        }

        this.activeLegend = legend
        if (legend.value !== 'scale') {
          startDrawing(this.$data)
        }
      },
      setOverlayScale (key, value) {
        this.$emit('setOverlayScale', key, value)
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
      saveOverlays () {
        const result = getSaveData(this.$data)
        if (result) {
          this.$emit('save', result)
        } else {
          notify('info', '没有需要修改的信息。')
        }
      },
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
</style>
