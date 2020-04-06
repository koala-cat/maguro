import BMap from 'BMap'
import BMapLib from 'BMapLib'

import { drawMarker } from '../operate/draw-overlay'
import { setOverlaySettings } from '../setting'

import Marker from '../overlay-marker'

function initDrawing (options) {
  if (!options.drawingManager) {
    options.drawingManager = new BMapLib.DrawingManager(options.baiduMap, {
      isOpen: false,
      enableDrawingTool: false
    })
  } else {
    options.drawingManager.open()
  }
}

function breakDrawing (options) {
  const { baiduMap, overlays } = options

  baiduMap.getOverlays().map(oly => {
    if (!overlays.includes(oly)) {
      baiduMap.removeOverlay(oly)
    }
  })
  closeDrawing(options)
}

function openDrawing (options) {
  const { baiduMap, drawingManager } = options

  if (!drawingManager) return
  drawingManager.open()
  baiduMap.setDefaultCursor('crosshair')
}

function closeDrawing (options) {
  const { baiduMap, drawingManager } = options

  if (!drawingManager) return
  drawingManager.close()
  baiduMap.setDefaultCursor('pointer')
}

function drawingOverlay (settings = {}, callback, options) {
  const { baiduMap, drawingManager, activeLegend } = options
  const type = activeLegend.value || activeLegend.type
  const modes = {
    marker: BMAP_DRAWING_MARKER,
    polyline: BMAP_DRAWING_POLYLINE,
    circle: BMAP_DRAWING_CIRCLE,
    rectangle: BMAP_DRAWING_RECTANGLE,
    polygon: BMAP_DRAWING_POLYGON
  }
  const complete = {
    marker: markerComplete,
    polyline: polylineComplete,
    circle: circleComplete,
    rectangle: rectangleComplete,
    polygon: polygonComplete
  }

  drawingManager[`${type}Options`] = settings

  if (type === 'label') {
    const click = (e) => {
      // super.label(e.point, this.options, events)
      const label = null
      if (callback) callback(label)
      drawingManager._mask.removeEventListener('click', click)
      drawingManager.close()
    }
    drawingManager.open()
    drawingManager.setDrawingMode(null)
    drawingManager._mask.addEventListener('click', click)
    return
  } else {
    listenerEvent(`${type}complete`, complete[type], drawingManager)
  }

  drawingManager.open()
  drawingManager.setDrawingMode(modes[type])

  function listenerEvent (e, overlayComplete) {
    const listeners = drawingManager.__listeners || {}

    if (listeners[`on${e}`]) {
      const handlers = listeners[`on${e}`]
      drawingManager.removeEventListener(e, handlers[Object.keys(handlers)[0]])
    }
    drawingManager.addEventListener(e, overlayComplete)
  }

  function drawNewOverlay (overlay, newOverlay) {
    setOverlaySettings(newOverlay, settings)
    baiduMap.removeOverlay(overlay)
    drawingManager.close()
    // super.bindEvents(this.events, newOverlay)
    if (callback) callback(newOverlay)
  }

  function markerComplete (marker) {
    const { point } = marker
    Object.assign(
      options,
      {
        settings: {
          ...settings,
          width: 16,
          fillColor: '#333',
          fillOpacity: 1
        },
        isSymbol: false,
        callback
      }
    )

    const newMarker = drawMarker(point, options)
    baiduMap.clearOverlays()
    baiduMap.addOverlay(newMarker)
    drawingManager.close()
  }

  function polylineComplete (line) {
    const points = line.getPath()
    const newLine = new BMap.Polyline(points, settings)
    drawNewOverlay(line, newLine)
  }

  function circleComplete (circle) {
    const center = circle.getCenter()
    const radius = circle.getRadius()
    const newCircle = new BMap.Circle(center, radius, settings)
    drawNewOverlay(circle, newCircle)
  }

  function rectangleComplete (polygon) {
    polygonComplete(polygon)
  }

  function polygonComplete (polygon) {
    const newPolygon = new BMap.Polygon(polygon.getPath(), settings)
    newPolygon.type = type
    drawNewOverlay(polygon, newPolygon)
  }
}

export {
  initDrawing,
  breakDrawing,
  openDrawing,
  closeDrawing,
  drawingOverlay
}
