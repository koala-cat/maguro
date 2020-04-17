import BMap from 'BMap'

import { showOverlays } from './calc/clusterer'
// import { getOverlaySettings } from './setting'
import { initDrawing, breakDrawing } from './overlay/operate/drawing-overlay'
import { deselectOverlays } from './overlay/operate/deselect-overlay'
import { selectOverlay } from './overlay/operate/select-overlay'
import { getLegend, getLegendType } from './overlay/legend'

export default {
  watch: {
    baseMapVisible (val) {
      this.map.setNormalMapDisplay(val)
    }
  },
  methods: {
    init () {
      this.bindMapEvents()
      this.bindDocumentEvents()

      initDrawing(this.$data)
    },
    bindMapEvents () {
      this.map.addEventListener('zoomend', () => {
        // showOverlays(this.map, this.overlays, this.specialOverlays)
      })

      this.map.addEventListener('click', (e) => {
        if ((this.activeLegend && !this.activeLegend.type) || !this.activeLegend) {
          if (!e.overlay) {
            deselectOverlays(this.$data)
            this.activeOverlay = null
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
        // 点击覆盖物方法
        selectOverlay(e, overlay, this.$data)
      }

      this.events.click = click
    },
    initOverlays () {
      if (this.overlays.length === 0) return

      const wholePoints = []
      const overlays = []

      this.clearOverlays()
      this.specialOverlays = {}

      for (const oly of this.overlays) {
        const legend = getLegend(this.legends, oly)
        const type = oly.type = getLegendType(legend)
        const { id, projectGeoKey, points = [] } = oly
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
            if (!this.specialOverlays[key]) this.specialOverlays[key] = []
            oly.points = mPoints
            this.specialOverlays[key].push(oly)
            continue
          }

          const overlay = this.draw.overlay(oly, mPoints, this.events) // 加覆盖物到地图
          overlay.hide()
          overlays.push(overlay)
          this.map.addOverlay(overlay)
        } catch {
          continue
        }
      }
      this.overlays.splice(0, this.overlays.length, ...overlays)
      this.initSpecialOverlays()

      if (this.view) {
        const viewPort = this.map.getViewport(wholePoints)
        this.map.centerAndZoom(viewPort.center, viewPort.zoom)
      } else {
        showOverlays(this.map, this.overlays, this.specialOverlays)
      }
    },
    initSpecialOverlays () {
      for (const key in this.specialOverlays) {
        const specials = this.specialOverlays[key]
        specials.sort((a, b) => a.invented * 1 - b.invented * 1)

        // const overlay = specials[specials.length - 1]
        // const type = overlay.type
        // const options = {
        //   ...getOverlaySettings(overlay),
        //   type
        // }

        // 加特殊元件到地图上
        // this.draw.special(overlay.points, options, null, (olys) => {
        //   for (let i = 0; i < olys.length; i++) {
        //     olys[i].id = specials[i].id
        //     olys[i].hide()
        //   }
        // })
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
