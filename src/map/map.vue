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
  import { modes } from '../constants'

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
      mapType: {
        type: String,
        default: 'normal'
      },
      mapAreaRestriction: Object,
      mapZoomSettings: {
        type: Object,
        default: () => ({})
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
        areaRestriction: null,
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
      mapAreaRestriction (val) {
        this.areaRestriction = val
      },
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
          this.restoreToolkit()
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
    }
  }
</script>

<style>
  [invisible] .anchorBL {
    display: none;
  }

  .mu-list-item {
    font-size: 12px;
  }
</style>
