import BMap from 'BMap'
import { notify } from 'mussel'
import clonedeep from 'lodash.clonedeep'
import debounce from 'lodash.debounce'

import CustomSvg from '../map/overlay/overlay-svg'
import CustomSpecial from './overlay/overlay-special'

import { showOverlays } from './calc/clusterer'
import { isPointInRect } from './calc/geo'
import { getSpecialAttachPolyline } from './calc/overlay'
import { getOverlaySettings } from './overlay/setting'
import { getLegend, getLegendType } from './overlay/legend'

import { addOverlay } from './overlay/operate/add-overlay'
import { drawOverlay, drawUploadLine } from './overlay/operate/draw-overlay'
import { initDrawing, breakDrawing, startDrawing, endDrawing } from './overlay/operate/drawing-overlay'
import { deselectOverlays } from './overlay/operate/deselect-overlay'
import { selectOverlay } from './overlay/operate/select-overlay'
import { getSaveData } from './overlay/operate/save-overlay'

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
        if (keyCode === 46) { // Delete 46
          overlays.map(oly => {
            oly.delete()
          })
        }

        if (keyCode === 27) { // Escape
          breakDrawing(this.$data)
        }
      })
      document.addEventListener('mousedown', (e) => {
        if (!e.point || !(this.areaRestriction instanceof BMap.Bounds)) return
        if (!isPointInRect(e.point, this.areaRestriction)) {
          endDrawing(this.$data)
          notify('warning', '请在有效区域内绘制。')
        }
      })
    },
    bindOverlayEvents () {
      const click = (e, overlay) => {
        selectOverlay(e, overlay, this.$data)
      }

      if (!this.overlayEvents.click) {
        this.overlayEvents.click = click
      }
    },
    initOverlays () {
      if (this.overlays.length === 0) return

      const overlays = clonedeep(this.overlays)
      const wholePoints = []

      this.clearOverlays()
      this.overlays.splice(0)
      this.specialOverlays = {}

      for (const oly of overlays) {
        const legend = getLegend(this.legends, oly)
        oly.type = getLegendType(legend)
        this.setOverlay(oly, wholePoints)
      }
      this.initSpecialOverlays()

      if (this.view && this.mapType !== 'graphic') {
        const zoom = this.map.getZoom()
        const viewPort = this.map.getViewport(wholePoints)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
        if (zoom === viewPort.zoom) {
          showOverlays(this.$data)
        }
      } else {
        showOverlays(this.$data)
      }
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
    setOverlay (oly, wholePoints) {
      const { id, type = '', projectGeoKey, points } = oly
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

          return
        }

        this.$data.settings = {
          ...getOverlaySettings(oly),
          type
        }
        const overlay = drawOverlay(oly, mPoints, this.$data)
        if (this.mapType !== 'graphic') overlay.hide()

        addOverlay(overlay, this.$data)
      } catch (err) {
        console.log('initSpecial' + err)
      }
    },
    clearOverlays () {
      const overlays = this.map.getOverlays()
      overlays.map(oly => {
        if (oly.type) {
          this.map.removeOverlay(oly)
        }
      })
    },
    restoreToolkit () {
      this.switchOverlayWindow('overlayListVisible')
      this.overlayListVisible = false
    },

    drawSvg (point, options) {
      const overlay = new CustomSvg(point, options)
      return overlay
    },
    setMapType (val) {
      this.$emit('setMapMode', val)
    },
    setMapZoomSettings (key, value) {
      this.$emit('setMapZoomSettings', key, value, () => {
        showOverlays(this.$data)
      })
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
    updateOverlay: debounce(function (key, value, overlay) {
      overlay = overlay || this.activeOverlay
      try {
        overlay.update(key, value)
      } catch (err) {
        console.log('update' + err)
      }
    }, 500),
    selectOverlay (overlay) {
      let points = null
      const type = overlay.type
      if (type === 'hotspot') {
        selectOverlay(null, overlay, this.$data)
        return
      }
      try {
        points = overlay.getPath()
      } catch {
        points = [overlay.getPosition()]
      }

      if (type.includes('special')) {
        overlay = this.specialOverlays[overlay.parentId].find(item => item.invented)
      }
      const viewPort = this.map.getViewport(points)
      this.map.centerAndZoom(viewPort.center, viewPort.zoom)
      selectOverlay(null, overlay, this.$data)
    },
    saveOverlays () {
      const result = getSaveData(this.$data)
      if (result) {
        this.$emit('save', result, () => {
          notify('success', '保存成功。')
        })
      } else {
        notify('info', '没有需要修改的信息。')
      }
    }
  }
}
