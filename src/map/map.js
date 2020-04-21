import BMap from 'BMap'
import clonedeep from 'lodash.clonedeep'

import CustomSpecial from './overlay/overlay-special'

import { showOverlays } from './calc/clusterer'
import { getSpecialAttachPolyline } from './calc/overlay'
import { getOverlaySettings, setOverlaySettings } from './overlay/setting'
import { getLegend, getLegendType } from './overlay/legend'

import { drawOverlay } from './overlay/operate/draw-overlay'
import { initDrawing, breakDrawing } from './overlay/operate/drawing-overlay'
import { deselectOverlays } from './overlay/operate/deselect-overlay'
import { selectOverlay } from './overlay/operate/select-overlay'
import { addOverlay } from './overlay/operate/add-overlay'

export default {
  methods: {
    init () {
      this.bindMapEvents()
      this.bindDocumentEvents()

      initDrawing(this.$data)
    },
    bindMapEvents () {
      this.map.addEventListener('zoomend', () => {
        showOverlays(this.$data)
      })

      this.map.addEventListener('click', (e) => {
        if ((this.activeLegend && !this.activeLegend.type) || !this.activeLegend) {
          if (!e.overlay) {
            deselectOverlays(this.$data)
          }
        }
      })
    },
    bindDocumentEvents () {
      const overlays = this.selectedOverlays
      document.addEventListener('keydown', (e) => {
        e = e || window.event
        const keyCode = e.keyCode || e.which || e.charCode
        if (keyCode === 17) { // Delete 46
          overlays.map(oly => {
            oly.delete()
          })
        }

        if (keyCode === 27) { // Escape
          breakDrawing(this.$data)
        }
      })
    },
    bindOverlayEvents () {
      const click = (e, overlay) => {
        selectOverlay(e, overlay, this.$data)
      }

      if (!this.events.click) {
        this.events.click = click
      }
    },
    initOverlays () {
      if (this.overlays.length === 0) return

      const overlays = clonedeep(this.overlays)
      const wholePoints = []

      this.clearOverlays()
      this.overlays = []
      this.specialOverlays = {}

      for (const oly of overlays) {
        const legend = getLegend(this.legends, oly)
        const type = oly.type = getLegendType(legend)
        const { id, projectGeoKey, points } = oly
        const mPoints = []

        if (projectGeoKey && points) {
          this.polylinePointIds[id] = points.map(point => { return point.id })
        }

        try {
          points.map(p => {
            p = new BMap.Point(p.longitude, p.latitude)
            mPoints.push(p)
            if (oly.visible) wholePoints.push(p)
          })
          if (type.includes('special')) {
            const key = oly.parentId > 0 ? oly.parentId : oly.id
            oly.points = mPoints

            if (!this.specialOverlays[key]) this.specialOverlays[key] = []
            this.specialOverlays[key].push(oly)

            continue
          }

          this.$data.settings = {
            ...getOverlaySettings(oly),
            type
          }
          const overlay = drawOverlay(oly, mPoints, this.$data)
          overlay.hide()
          setOverlaySettings(overlay, this.$data.settings)
          addOverlay(overlay, this.$data)
          deselectOverlays(this.$data)
        } catch {
          continue
        }
      }
      this.initSpecialOverlays()

      if (this.view) {
        const viewPort = this.map.getViewport(wholePoints)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
      }
      showOverlays(this.$data)
    },
    initSpecialOverlays () {
      for (const key in this.specialOverlays) {
        const specials = this.specialOverlays[key]
        specials.sort((a, b) => a.invented * 1 - b.invented * 1)
        this.$data.settings = {
          ...getOverlaySettings(specials[0]),
          type: specials[0].type
        }

        const overlay = specials[specials.length - 1]
        const polyline = getSpecialAttachPolyline(overlay, this.overlays)
        const special = new CustomSpecial(null, polyline, this.$data)
        const newSpecials = special.drawSpecial(overlay.points)
        newSpecials.map((oly, i) => {
          oly.id = specials[i].id
          oly.hide()
        })
        this.specialOverlays[key] = newSpecials
        deselectOverlays(this.$data)
      }
    },
    clearOverlays () {
      const overlays = this.map.getOverlays()
      overlays.map(oly => {
        if (!(oly instanceof BMap.GroundOverlay)) {
          this.map.removeOverlay(oly)
        }
      })
    }
  }
}
