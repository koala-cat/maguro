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
  import debounce from 'lodash.debounce'
  import { Initial } from './initial'
  import Update from './update'

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

      this.update = new Update(
        map,
        this.events,
        this.overlays,
        this.selectedOverlays,
        this.specialOverlays,
        this.updateOverlays,
        this.removedOverlays,
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
      },
      updateOverlay: debounce(function (key, value) {
        this.update.setSetting(key, value, (oly) => {
          this.initial._select.overlay(oly)
        })
      }, 500),
      selectOverlay (overlay) {
        let points = null
        const type = overlay.type

        try {
          points = overlay.getPath()
        } catch {
          points = [overlay.getPosition()]
        }

        const viewPort = this.map.getViewport(points)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
        if (type.includes('special')) {
          overlay = this.specialOverlays[overlay.parentId].find(item => item.invented)
        }
        this.initial._select.overlay(overlay)
      }
    }
  }
</script>
