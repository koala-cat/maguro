<template>
  <div class="map-wrapper mu-absolute-fit">
    <div
      id="map"
      class="mu-absolute-fit" />
    <slot />
  </div>
</template>
<script>
  import BMap from 'BMap'
  import debounce from 'lodash.debounce'
  import { notify } from 'mussel'
  import { getCreateOverlays, getUpdateOverlays } from './calc/overlay'

  import { getLegend } from './legend'
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
        this.$data
      )

      this.update = new Update(
        map,
        this.events,
        this.overlays,
        this.$data
      )
    },
    methods: {
      setMapType (val, mode) {
        this.active.mode = val
        map.setMapType(mode)
        this.$emit('setMapType', val)
      },
      switchOverlayWindow (key) {
        this.active.tool = null
        this[key] = !this[key]
      },
      addLegend (legend) {
        this.$emit('addLegend', legend)
      },
      removeLegend (legend) {
        this.$emit('removeLegend', legend)
      },
      selectTool (val, style = {}) {
        if (this.overlayListVisible) {
          this.overlayListVisible = false
        }

        this.active.tool = val
        this.initial._select.tool()
      },
      updateOverlay: debounce(function (key, value) {
        let legend = null
        if (key === 'projectMapLegendId') {
          legend = getLegend(this.legends, value)
        }
        this.update.setSetting(key, value, legend, (oly) => {
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
      },
      saveOverlays () {
        const result = {}

        result.creates = getCreateOverlays(this.overlays, this.polylineCenters)
        if (Object.keys(this.updateOverlays).length === 0 &&
          this.removeOverlays.length === 0 && !result.creates) {
          notify('info', '没有需要修改的信息。')
          return
        }
        if (this.removeOverlays.length > 0) {
          result.removes = this.removeOverlays
        }
        if (Object.keys(this.updateOverlays).length > 0) {
          result.updates = getUpdateOverlays(this.updateOverlays)
        }
        this.$emit('save', result)
      }
    }
  }
</script>
