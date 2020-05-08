import BMap from 'BMap'
import { notify } from 'mussel'
import clonedeep from 'lodash.clonedeep'
import debounce from 'lodash.debounce'

import CustomSvg from './overlay/custom/overlay-svg'
import CustomSpecial from './overlay/custom/overlay-special'
import CustomCursor from './overlay/custom/overlay-cursor'

import { showOverlays } from './calc/clusterer'
import { isPointInRect } from './calc/geo'
import { getSpecialAttachPolyline } from './calc/overlay'
import { getOverlaySettings } from './overlay/setting'
import { getLegend, getLegendType } from './overlay/legend'

import { addOverlay } from './overlay/operate/add-overlay'
import { drawOverlay, drawUploadLine } from './overlay/operate/draw-overlay'
import { initDrawing, breakDrawing, startDrawing } from './overlay/operate/drawing-overlay'
import { deselectOverlays } from './overlay/operate/deselect-overlay'
import { selectOverlay } from './overlay/operate/select-overlay'
import { getSaveData } from './overlay/operate/save-overlay'

import { adsorbOverlay } from '../map/overlay/operate/adsorb-overlay'

export default {
  methods: {
    init () {
      this.bindMapEvents()
      this.bindDocumentEvents()

      initDrawing(this.$data)
    },
    bindMapEvents () {
      const defaultEvents = this.getDefaultEvents()
      const defaultKeys = Object.keys(defaultEvents)
      const mapKeys = Object.keys(this.mapEvents)
      const eventKeys = [...defaultKeys, ...mapKeys]
      this.unbindMapEvents()

      for (const key of eventKeys) {
        if (mapKeys.includes(key)) {
          const item = this.mapEvents[key]
          if (item.isMerge) {
            this.events[key].event = (e) => {
              if (defaultEvents[key]) defaultEvents[key].event(e)
              item.event(e)
            }
          } else {
            this.events[key] = item
          }
          continue
        }
        this.events[key] = defaultEvents[key]
      }
      for (const key in this.events) {
        this.map.addEventListener(key, this.events[key].event)
      }
    },
    unbindMapEvents () {
      for (const key in this.events) {
        this.map.removeEventListener(key, this.events[key].event)
      }
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
          breakDrawing(this.$data)
          notify('warning', '请在有效区域内绘制。')
        }
      })
      document.addEventListener('mousemove', (e) => {
        const mapEl = document.querySelector('#map')
        const { top, left } = mapEl.getBoundingClientRect()
        const mPoint = this.map.pixelToPoint(new BMap.Pixel(e.clientX - left, e.clientY - top))
        const { cursorOverlay } = this.adsorbData
        if (cursorOverlay.visible) {
          cursorOverlay.show()
        }
        if (cursorOverlay && cursorOverlay.visible) {
          const { point, polyline } = adsorbOverlay(this.map, mPoint, this.polylineOverlays)
          console.log(point, polyline)
          if (point && polyline) {
            cursorOverlay.setPosition(point)
            cursorOverlay.show()
          } else {
            cursorOverlay.hide()
          }
          Object.assign(
            this.adsorbData,
            { point, polyline }
          )
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
      if (this.overlays.length === 0) {
        this.drawCursor()
        return
      }
      const overlays = clonedeep(this.overlays)
      const wholePoints = []

      this.clearOverlays()
      this.overlays.splice(0)
      this.specialOverlays = {}

      for (const oly of overlays) {
        const legend = getLegend(this.legends, oly)
        oly.type = getLegendType(legend)
        this.drawOverlay(oly, wholePoints)
      }
      this.initSpecialOverlays()
      this.drawCursor()
      if (this.isReset && this.mapType !== 'graphic') {
        const zoom = this.map.getZoom()
        const viewPort = this.map.getViewport(wholePoints)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
        if (zoom === viewPort.zoom) {
          showOverlays(this.$data)
        }
      } else {
        showOverlays(this.$data)
      }
      this.isReset = true
    },
    initSpecialOverlays () {
      for (const key in this.specialOverlays) {
        const specials = this.specialOverlays[key]
        const settings = {
          ...getOverlaySettings(specials[0]),
          type: specials[0].type
        }
        specials.sort((a, b) => a.invented * 1 - b.invented * 1)

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
    switchOverlayWindow (key) {
      this.activeLegend = null
      this[key] = !this[key]
    },
    restoreToolkit () {
      this.switchOverlayWindow('overlayListVisible')
      this.overlayListVisible = false
    },
    setMapType (val) {
      this.$emit('setMapMode', val)
    },
    setMapZoomSettings (key, value) {
      this.$emit('setMapZoomSettings', key, value, () => {
        showOverlays(this.$data)
      })
    },
    addLegend () {
      this.$emit('addLegend')
    },
    removeLegend (legend) {
      this.$emit('removeLegend', legend)
    },
    selectLegend (legend) {
      if (this.overlayListVisible) {
        this.overlayListVisible = false
      }
      this.activeLegend = legend

      if (!this.mapEditPermission) return
      if (legend.value !== 'scale') {
        startDrawing(this.$data)
      }
    },
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
      selectOverlay(null, overlay, this.$data)

      const viewPort = this.map.getViewport(points)
      this.map.centerAndZoom(viewPort.center, viewPort.zoom)
    },
    updateOverlay: debounce(function (key, value, overlay) {
      overlay = overlay || this.activeOverlay
      if (overlay.type && overlay.type.includes('special')) {
        const specials = this.specialOverlays[overlay.parentId]
        overlay = specials.find(oly => oly.invented)
      }
      try {
        overlay.update(key, value)
      } catch (err) {
        console.log(err)
      }
    }, 500),
    saveOverlays () {
      const result = getSaveData(this.$data)
      if (result) {
        this.$emit('save', result, () => {
          this.$data.updateOverlays = {}
          this.$data.removeOverlays = []
          this.isReset = false
          if (this.activeOverlay) {
            deselectOverlays(this.$data)
          }
          notify('success', '保存成功。')
        })
      } else {
        notify('info', '没有需要修改的信息。')
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
    drawOverlay (oly, wholePoints) {
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

        const settings = {
          ...getOverlaySettings(oly),
          type
        }
        const overlay = drawOverlay(oly, mPoints, settings, this.$data)
        if (this.mapType !== 'graphic') overlay.hide()

        addOverlay(overlay, this.$data)
      } catch (err) {
        console.log('initOverlay' + err)
      }
    },
    drawUploadLine (data) {
      drawUploadLine(data, this.$data)
    },
    drawSvg (point, settings, options) {
      const overlay = new CustomSvg(point, settings, options)
      return overlay
    },
    drawCursor (point) {
      const center = this.map.getCenter()
      point = point || center
      const settings = {
        width: 32,
        innerBgColor: 'rgb(69, 123, 216)',
        outerBgColor: 'rgba(68, 123, 216, 0.2)'
      }
      const overlay = new CustomCursor(point, settings, this.$data)
      this.map.addOverlay(overlay)
      overlay.hide()
      this.adsorbData.cursorOverlay = overlay
    },
    getOverlaySettings (overlay) {
      return getOverlaySettings(overlay)
    },
    getDefaultEvents () {
      return {
        click: {
          event: (e) => {
            const { point, polyline } = this.adsorbData
            if (point && polyline) {
              e.point = point
              selectOverlay(e, polyline, this.$data)
            }
            if ((this.activeLegend && !this.activeLegend.type) || !this.activeLegend) {
              if (!e.overlay) {
                deselectOverlays(this.$data)
              }
            }
          }
        },
        zoomend: {
          event: () => {
            showOverlays(this.$data)
          }
        }
      }
    }
  }
}
