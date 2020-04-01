import BMap from 'BMap'
import { showOverlays } from './calc/clusterer'
// import { getOverlaySettings } from './setting'
import { getLegend, getLegendType } from './legend'

export default {
  methods: {
    init () {
      this.initListener()
      this.initKeyboard()
    },
    initListener () {
      this.baiduMap.addEventListener('zoomend', () => {
        showOverlays(this.baiduMap, this.overlays, this.specialOverlays)
      })

      this.baiduMap.addEventListener('click', (e) => {
        if ((this.active.tool && !this.active.tool.type) || !this.active.tool) {
          this.active.tool = null
          if (!e.overlay) {
            // 取消选中覆盖物
          }
        }
      })
    },
    initEvents () {
      const click = (e, overlay) => {
        // 点击覆盖物方法
      }

      this.events.click = click
    },
    initKeyboard () {
      document.onkeydown = (e) => {
        e = e || window.event
        const keyCode = e.keyCode || e.which || e.charCode
        if (keyCode === 46) { // Delete
          // 删除覆盖物 overlay.remove()
        }

        if (keyCode === 27) { // Escape
          // 终止绘制
          // 取消选中覆盖物
        }
      }
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
        const { id, projectGeoKey, points } = oly
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
