import BMap from 'BMap'
import BMapLib from 'BMapLib'

import Draw from './draw'
import Remove from './remove'
import { setOverlaySettings } from './setting'

class DrawingManager extends Draw {
  constructor (map, overlays, id) {
    super()
    this._map = map
    this._overlays = overlays

    if (!this._drawingManager) {
      this._drawingManager = new BMapLib.DrawingManager(map, {
        isOpen: true,
        enableDrawingTool: false
      })
    } else {
      this._drawingManager.open()
    }

    this._remove = new Remove(this._map)
  }

  break () {
    this._map.getOverlays().map(oly => {
      if (!this._overlays.includes(oly)) {
        this._map.removeOverlay(oly)
      }
    })
    this.close()
  }

  open () {
    if (!this._drawingManager) return
    this._drawingManager.open()
    this._map.setDefaultCursor('crosshair')
  }

  close () {
    if (!this._drawingManager) return
    this._drawingManager.close()
    this._map.setDefaultCursor('pointer')
  }

  draw (options = {}, events, callback) {
    const type = this._type = options.type
    this._options = options
    this._events = events
    this._callback = callback
    this._listeners = this._drawingManager.__listeners || {}
    this._drawingManager[`${type}Options`] = options

    if (type === 'label') {
      const click = (e) => {
        const label = super.label(e.point, this._options, events)
        if (callback) callback(label)
        this._drawingManager._mask.removeEventListener('click', click)
        this._drawingManager.close()
      }
      this._drawingManager.open()
      this._drawingManager.setDrawingMode(null)
      this._drawingManager._mask.addEventListener('click', click)
      return
    } else {
      this.listenerEvent(`${type}complete`, this[`${type}Complete`].bind(this))
    }

    const modes = {
      marker: BMAP_DRAWING_MARKER,
      polyline: BMAP_DRAWING_POLYLINE,
      circle: BMAP_DRAWING_CIRCLE,
      rectangle: BMAP_DRAWING_RECTANGLE,
      polygon: BMAP_DRAWING_POLYGON
    }
    this._drawingManager.open()
    this._drawingManager.setDrawingMode(modes[type])
  }

  listenerEvent (e, complete) {
    if (this._listeners[`on${e}`]) {
      const handlers = this._listeners[`on${e}`]
      this._drawingManager.removeEventListener(e, handlers[Object.keys(handlers)[0]])
    }
    this._drawingManager.addEventListener(e, complete)
  }

  drawNewOverlay (overlay, newOverlay) {
    setOverlaySettings(newOverlay, this._options)
    this._map.removeOverlay(overlay)
    this._drawingManager.close()
    super.bindEvents(this._events, newOverlay)
    if (this._callback) this._callback(newOverlay)
  }

  markerComplete (marker) {
    const options = {
      ...this._options,
      width: 16
    }
    this._map.removeOverlay(marker)
    this._drawingManager.close()
    super.marker(marker.point, false, options, this._events, this._callback)
  }

  polylineComplete (line) {
    const points = line.getPath()
    const newLine = new BMap.Polyline(points, this._options)
    this.drawNewOverlay(line, newLine)
  }

  circleComplete (circle) {
    const center = circle.getCenter()
    const radius = circle.getRadius()
    const newCircle = new BMap.Circle(center, radius, this._options)
    this.drawNewOverlay(circle, newCircle)
  }

  rectangleComplete (ply) {
    this.polygonComplete(ply)
  }

  polygonComplete (ply) {
    const newPly = new BMap.Polygon(ply.getPath(), this._options)
    newPly.type = this._type
    this.drawNewOverlay(ply, newPly)
  }
}

export default DrawingManager
