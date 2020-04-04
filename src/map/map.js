import BMap from 'BMap'
import BMapLib from 'BMapLib'

import { showOverlays } from './calc/clusterer'
// import { getOverlaySettings } from './setting'
import { initDrawing } from './overlay/operate/drawing-overlay'
import { selectOverlay } from './overlay/operate/select-overlay'
import { getLegend, getLegendType } from './overlay/legend'

export default {
  methods: {
    init () {
      this.bindMapEvents()
      this.bindDocumentEvents()

      if (!this.baseMapVisible) {
        this.baiduMap.setNormalMapDisplay(false)
      }

      initDrawing(this.$data)
    },
    bindMapEvents () {
      this.baiduMap.addEventListener('zoomend', () => {
        showOverlays(this.baiduMap, this.overlays, this.specialOverlays)
      })

      this.baiduMap.addEventListener('click', (e) => {
        if ((this.activeTool && !this.activeTool.type) || !this.activeTool) {
          this.activeTool = null
          if (!e.overlay) {
            this.selectedOverlays.map(oly => {
              oly.disableEditing()
            })
            this.selectedOverlays.splice(0)
            this.activeOverlay = null
          }
        }
      })
    },
    bindDocumentEvents () {
      document.addEventListener('keydown', (e) => {
        e = e || window.event
        const keyCode = e.keyCode || e.which || e.charCode
        if (keyCode === 46) { // Delete
          // 删除覆盖物 overlay.remove()
        }

        if (keyCode === 27) { // Escape
          // 终止绘制
          // 取消选中覆盖物
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

      this.baiduMap.clearOverlays()
      this.specialOverlays = {}

      for (const oly of this.overlays) {
        const legend = getLegend(this.legends, oly)
        const type = oly.type = getLegendType(legend)
        const { id, projectGeoKey, points: points=[] } = oly
        const mPoints = []

        if (projectGeoKey) {
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
          this.baiduMap.addOverlay(overlay)
        } catch {
          continue
        }
      }
      this.overlays.splice(0, this.overlays.length, ...overlays)
      this.initSpecialOverlays()

      if (this.view) {
        const viewPort = this.baiduMap.getViewport(wholePoints)
        this.baiduMap.centerAndZoom(viewPort.center, viewPort.zoom)
      } else {
        showOverlays(this.baiduMap, this.overlays, this.specialOverlays)
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
    }
  }
}
