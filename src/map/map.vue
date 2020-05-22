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

  import MapMixin from './mixins'
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
      mapEditPermission: {
        type: Boolean,
        default: true
      },
      mapCurrentOrg: {
        type: Object,
        default: () => ({})
      },
      mapDefaultType: {
        type: String,
        default: 'normal'
      },
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
      mapOverlayEvents: {
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
        currentOrg: this.mapCurrentOrg,
        map: null,
        drawingManager: null,
        areaRestriction: null,
        zoomSettings: {},
        events: {},
        overlayEvents: this.mapOverlayEvents,
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
        adsorbData: {
          point: null,
          polylineOverlay: null,
          cursorOverlay: null
        },
        id: -2,
        parentId: -1,
        isReset: true
      }
    },
    computed: {
      baseMapVisible () {
        return this.mapType !== 'graphic'
      },
      configureVisible () {
        return this.baseMapVisible && this.mapConfigureVisible
      },
      polylineOverlays () {
        const polylineOverlays = this.overlays.filter(oly => oly.type === 'polyline')
        return polylineOverlays
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
        const overlays = cloneDeep(this.mapOverlays)
        this.overlays.splice(0, this.overlays.length, ...overlays)
        this.bindOverlayEvents()
        this.initOverlays()
      },
      mapEvents: {
        handler () {
          this.bindMapEvents()
        },
        deep: true
      },
      baseMapVisible (val) {
        this.map.setNormalMapDisplay(this.baseMapVisible)
      },
      mapType (val) {
        this.switchToolkit()
        if (modes[val]) {
          this.map.setMapType(modes[val])
        }
      },
      activeLegend (val) {
        const { cursorOverlay } = this.adsorbData
        if (!cursorOverlay) return
        if (val && val.type === 'special') {
          cursorOverlay.visible = true
        } else {
          Object.assign(
            this.adsorbData,
            {
              point: null,
              polyline: null
            }
          )
          cursorOverlay.visible = false
          cursorOverlay.hide()
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

  .mu-toggle[disabled] > .mu-toggle-slide-bar {
    background: rgba(255, 255, 255, 0.8);
  }
  .mu-toggle[disabled] > .mu-toggle-slide-bar:after {
    background: rgba(0,0,0,.12);
  }
</style>
