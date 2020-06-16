import BMap from 'BMap'
import { notify } from 'mussel'
import debounce from 'lodash.debounce'

import CustomSvg from '../overlay/custom/overlay-svg'
import CustomCursor from '../overlay/custom/overlay-cursor'

import { getOverlaySettings } from '../overlay/setting'
import { addOverlay } from '../overlay/operate/add-overlay'
import { deselectOverlays } from '../overlay/operate/deselect-overlay'
import { drawOverlay, drawUploadLine } from '../overlay/operate/draw-overlay'
import { getSaveData } from '../overlay/operate/save-overlay'
import { selectOverlay } from '../overlay/operate/select-overlay'

export default {
  methods: {
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
    clearOverlays () {
      const overlays = this.map.getOverlays()
      overlays.map(oly => {
        if (oly.type) {
          this.map.removeOverlay(oly)
        }
      })
    },
    getSaveData () {
      return getSaveData(this.$data)
    },
    clearSaveData () {
      this.$data.updateOverlays = {}
      this.$data.removeOverlays = []
    },
    saveOverlays () {
      const result = this.getSaveData() || {}
      const { creates = [], updates = [], removes = [] } = result
      if (creates.length > 0 || updates.length > 0 || removes.length > 0) {
        this.$emit('save', result, true, () => {
          this.clearSaveData()
          this.isReset = false
          if (this.activeOverlay) {
            deselectOverlays(this.$data)
          }
          notify('success', '保存成功。')
        })
      } else {
        notify('info', '无需保存(超出绘制区域不予保存)')
      }
    }
  }
}
