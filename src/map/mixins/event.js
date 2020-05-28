import BMap from 'BMap'
import { notify } from 'mussel'

import { showOverlays } from '../calc/clusterer'
import { isPointInRect } from '../calc/geo'
import { lazyTrigger } from '../calc/trigger'

import { adsorbOverlay } from '../overlay/operate/adsorb-overlay'
import { breakDrawing } from '../overlay/operate/drawing-overlay'
import { deselectOverlays } from '../overlay/operate/deselect-overlay'
import { selectOverlay } from '../overlay/operate/select-overlay'

export default {
  methods: {
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
            this.events[key].event = e => {
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
      const onKeydown = e => {
        this.docKeydown(e)
      }
      const onMousedown = e => {
        this.docMousedown(e)
      }

      const timer = lazyTrigger(20)
      const onMousemove = e => {
        const callback = () => {
          this.docMouseMove(e)
        }
        timer(callback)
      }

      document.addEventListener('keydown', onKeydown)
      document.addEventListener('mousedown', onMousedown)
      document.addEventListener('mousemove', onMousemove)
    },
    bindOverlayEvents () {
      const click = (e, overlay) => {
        selectOverlay(e, overlay, this.$data)
      }

      if (!this.overlayEvents.click) {
        this.overlayEvents.click = click
      }
    },

    getDefaultEvents () {
      return {
        click: {
          event: e => {
            const { point, polyline } = this.adsorbData
            if (point && polyline) {
              e.point = point
              this.map.setDefaultCursor('pointer')
              selectOverlay(e, polyline, this.$data)
            }
            if (
              (this.activeLegend && !this.activeLegend.type) ||
              !this.activeLegend
            ) {
              this.activeLegend = null
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
    },
    docKeydown (e) {
      e = e || window.event
      const keyCode = e.keyCode || e.which || e.charCode
      if (keyCode === 46) {
        // Delete 46
        this.selectedOverlays.map(oly => {
          oly.delete()
        })
        this.selectedOverlays.splice(0)
      }

      if (keyCode === 27) {
        // Escape
        breakDrawing(this.$data)
      }
    },
    docMousedown (e) {
      if (!e.point || !(this.areaRestriction instanceof BMap.Bounds)) return
      if (!isPointInRect(e.point, this.areaRestriction)) {
        breakDrawing(this.$data)
        notify('warning', '请在有效区域内绘制。')
      }
    },
    docMouseMove (e) {
      const { cursorOverlay } = this.adsorbData

      if (this.mapType === 'graphic' || !cursorOverlay) return
      if (this.clientX === e.clientX && this.clientY === e.clientY) {
        return
      }

      if (cursorOverlay.visible) {
        const mapEl = document.querySelector('#map')
        const { top, left } = mapEl.getBoundingClientRect()
        const mPoint = this.map.pixelToPoint(
          new BMap.Pixel(e.clientX - left, e.clientY - top)
        )
        this.clientX = e.clientX
        this.clientY = e.clientY

        const { point, polyline } = adsorbOverlay(
          this.map,
          mPoint,
          this.polylineOverlays
        )
        if (point && polyline) {
          this.map.setDefaultCursor('crosshair')
          cursorOverlay.setPosition(point)
          cursorOverlay.show()
        } else {
          this.map.setDefaultCursor('pointer')
          cursorOverlay.hide()
        }
        Object.assign(this.adsorbData, { point, polyline })
      }
    }
  }
}
