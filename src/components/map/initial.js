import BMap from 'BMap'
import { showOverlays } from './calc/clusterer'
import { getOverlaySettings } from './setting'

import Draw from './draw'
import DrawingManager from './drawingManager'
import { getLegend, getLegendType } from './legend'
import { removeOverlays } from './remove'
import Select from './select'

let me = null
class Initial {
  constructor (
    map,
    events,
    legends,
    overlays,
    options
  ) {
    me = this
    this._map = map
    this._events = events
    this._legends = legends
    this._overlays = overlays
    this._options = options

    this._draw = new Draw(
      map,
      options.marker
    )
    this._drawingManager = new DrawingManager(
      map,
      overlays
    )
    this._select = new Select(
      map,
      events,
      overlays,
      options
    )

    this.map()
    this.keyboard()
  }

  map () {
    this._map.addEventListener('zoomend', () => {
      showOverlays(this._map, this._overlays, this._options.specialOverlays)
    })

    this._map.addEventListener('click', (e) => {
      if ((this._options.active.tool && !this._options.active.tool.type) || !this._active.tool) {
        this._options.active.tool = null
        if (!e.overlay) {
          this._select.unSelectOverlays()
        }
      }
    })
  }

  bindEvents (events) {
    const click = (e, overlay) => {
      this._select.overlay(overlay, e)
    }

    this._events.click = click
  }

  keyboard () {
    document.onkeydown = (e) => {
      e = e || window.event
      const keyCode = e.keyCode || e.which || e.charCode
      if (keyCode === 46) { // Delete
        removeOverlays(this._map, this._overlays, this._options)
      }

      if (keyCode === 27) { // Escape
        this._drawingManager.break()
        this._select.unSelectTool()
      }
    }
  }

  overlays (initMap) {
    if (this._overlays.length === 0) return

    const wholePoints = []
    const overlays = []

    this._map.clearOverlays()
    this._options.specialOverlays = {}

    for (const oly of this._overlays) {
      const legend = getLegend(this._legends, oly)
      const type = oly.type = getLegendType(legend)
      const { id, projectGeoKey, points } = oly
      const mPoints = []

      if (projectGeoKey) {
        this._options.polylinePointIds[id] = points.map(point => { return point.id })
      }

      try {
        points.map(p => {
          p = new BMap.Point(p.longitude, p.latitude)
          mPoints.push(p)
          if (oly.visible) wholePoints.push(p)
        })

        if (type.includes('special')) {
          const key = oly.parentId > 0 ? oly.parentId : oly.id
          if (!this._options.specialOverlays[key]) this._options.specialOverlays[key] = []
          oly.points = mPoints
          this._options.specialOverlays[key].push(oly)
          continue
        }

        const overlay = this._draw.overlay(oly, mPoints, this._events)
        overlay.hide()
        overlays.push(overlay)
        this._map.addOverlay(overlay)
      } catch {
        continue
      }
    }
    this._overlays.splice(0, this._overlays.length, ...overlays)
    this.specialOverlays()

    if (initMap) {
      const viewPort = this._map.getViewport(wholePoints)
      this._map.centerAndZoom(viewPort.center, viewPort.zoom)
    } else {
      const zoom = this._map.getZoom()
      const center = this._map.getCenter()
      this._map.centerAndZoom(center, zoom)
      showOverlays(this._map, this._overlays, this._options.specialOverlays)
    }
  }

  specialOverlays () {
    for (const key in this._options.specialOverlays) {
      const specials = this._options.specialOverlays[key]
      specials.sort((a, b) => a.invented * 1 - b.invented * 1)

      const overlay = specials[specials.length - 1]
      const type = overlay.type
      const options = {
        ...getOverlaySettings(overlay),
        type
      }

      this._draw.special(overlay.points, options, null, (olys) => {
        for (let i = 0; i < olys.length; i++) {
          olys[i].id = specials[i].id
          olys[i].hide()
        }
      })
    }
  }
}

function refresh () {
  me.bindEvents()
  me.overlays(true)
}
export {
  Initial,
  refresh
}
