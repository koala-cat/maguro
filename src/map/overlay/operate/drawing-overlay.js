import BMap from 'BMap'
import BMapLib from 'BMapLib'

import { addOverlay } from './add-overlay'
import { drawMarker, drawPolyline, drawCircle, drawRectangle, drawPolygon, drawLabel } from '../operate/draw-overlay'

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
    const overlay = overlays.find(item => item.id === oly.id)
    if (!overlay && !(oly instanceof BMap.GroundOverlay)) {
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
  const type = activeLegend.type === 'polyline' ? activeLegend.type : activeLegend.value || activeLegend.type
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
  Object.assign(options, { settings })

  drawingManager[`${type}Options`] = settings

  if (type === 'label') {
    const click = (e) => {
      const label = drawLabel(e.point, { ...options, settings })
      drawingManager._mask.removeEventListener('click', click)
      drawingManager.close()
      if (callback) callback(label)
    }
    drawingManager.open()
    drawingManager.setDrawingMode(null)
    drawingManager._mask.addEventListener('click', click)
    return
  } else {
    listenerEvent(`${type}complete`, complete[type])
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
    baiduMap.removeOverlay(overlay)
    addOverlay(newOverlay, options)
    drawingManager.close()
    if (callback) callback(newOverlay)
  }

  function markerComplete (e, marker) {
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
        isSymbol: false
      }
    )

    const newMarker = drawMarker(point, options)
    baiduMap.removeOverlay(marker)
    addOverlay(newMarker, options)
    drawingManager.close()
    if (callback) callback(newMarker)
  }

  function polylineComplete (line) {
    const points = line.getPath()
    const newLine = drawPolyline(points, options)
    drawNewOverlay(line, newLine)
  }

  function circleComplete (circle) {
    const center = circle.getCenter()
    const radius = circle.getRadius()
    const newCircle = drawCircle(center, radius, options)
    drawNewOverlay(circle, newCircle)
  }

  function rectangleComplete (rectangle) {
    const newRectangle = drawRectangle(rectangle.getPath(), options)
    drawNewOverlay(rectangle, newRectangle)
  }

  function polygonComplete (polygon) {
    const newPolygon = drawPolygon(polygon.getPath(), options)
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
