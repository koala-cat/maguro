import cloneDeep from 'lodash.clonedeep'

import CustomSpecial from '../overlay/custom/overlay-special'

import { showOverlays } from '../calc/clusterer'
import { getSpecialAttachPolyline } from '../calc/overlay'
import { getOverlaySettings } from '../overlay/setting'
import { getLegend, getLegendType } from '../overlay/legend'

import { initDrawing } from '../overlay/operate/drawing-overlay'
import { deselectOverlays } from '../overlay/operate/deselect-overlay'

export default {
  methods: {
    init () {
      this.bindMapEvents()
      this.bindDocumentEvents()

      initDrawing(this.$data)
    },
    initOverlays () {
      if (this.overlays.length === 0) {
        this.drawCursor()
        return
      }
      const overlays = cloneDeep(this.overlays)
      const wholePoints = []

      this.clearOverlays()
      this.overlays.splice(0)
      this.specialOverlays = {}
      for (const oly of overlays) {
        const legend = getLegend(this.legends, oly)
        oly.type = oly.type || getLegendType(legend)
        this.drawOverlay(oly, wholePoints)
      }
      this.initSpecialOverlays()
      this.drawCursor()
      if (this.mapType !== 'graphic' && this.isReset) {
        const zoom = this.map.getZoom()
        const viewPort = this.map.getViewport(wholePoints)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
        if (zoom === viewPort.zoom) {
          showOverlays(this.mapType, this.$data)
        }
      } else {
        showOverlays(this.mapType, this.$data)
      }
      this.isReset = true
    },
    initSpecialOverlays () {
      for (const key in this.specialOverlays) {
        const specials = this.specialOverlays[key]
        specials.sort((a, b) => {
          return b.parentId - a.parentId ? b.parentId - a.parentId : a.id - b.id
        })
        const settings = {
          ...getOverlaySettings(specials[0]),
          type: specials[0].type
        }

        const overlay = specials[specials.length - 1]
        const polyline = getSpecialAttachPolyline(overlay, this.overlays)
        const special = new CustomSpecial(null, polyline, settings, this.$data)
        const newSpecials = special.drawSpecial(overlay.points)
        newSpecials.map((oly, i) => {
          oly.id = specials[i].id
          oly.hide()
        })
        this.specialOverlays[key] = newSpecials
        deselectOverlays(this.$data)
      }
    },
    switchToolkit (val) {
      this.activeOverlay = val || null
      this.activeLegend = val || null
      this.overlayListVisible = !!val
    },
    switchOverlayWindow (key) {
      this.activeLegend = null
      this[key] = !this[key]
    },
    switchMapType (val) {
      this.$emit('switchMapType', val)
    },
    setMapDefaultType (val) {
      this.$emit('setMapDefaultType', val)
    },
    setMapZoomSettings (key, value) {
      this.$emit('setMapZoomSettings', key, value, () => {
        showOverlays(this.mapType, this.$data)
      })
    }
  }
}
