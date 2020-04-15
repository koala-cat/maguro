import BMap from 'BMap'
import BMapLib from 'BMapLib'

import { addOverlay } from './add-overlay'
import { defaultStyle, setOverlaySettings } from '../setting'
import { drawMarker, drawPolyline, drawCircle, drawRectangle, drawPolygon, drawLabel } from '../operate/draw-overlay'

function initDrawing (options) {
  if (!options.drawingManager) {
    options.drawingManager = new BMapLib.DrawingManager(options.map, {
      isOpen: false,
      enableDrawingTool: false
    })
  } else {
    options.drawingManager.open()
  }
}

function breakDrawing (options) {
  const { map, overlays } = options
  map.getOverlays().map(oly => {
    const overlay = overlays.find(item => item.id === oly.id)
    if (!overlay && !(oly instanceof BMap.GroundOverlay)) {
      map.removeOverlay(oly)
    }
  })
  closeDrawing(options)
}

function openDrawing (options) {
  const { map, drawingManager } = options

  if (!drawingManager) return
  drawingManager.open()
  map.setDefaultCursor('crosshair')
}

function closeDrawing (options) {
  const { map, drawingManager } = options

  if (!drawingManager) return
  drawingManager.close()
  map.setDefaultCursor('pointer')
}

function startDrawing (options) {
  let type = null
  const { activeLegend: legend } = options
  const settings = {
    ...defaultStyle(),
    iconUrl: legend.iconUrl,
    svg: legend.svg,
    projectMapLegendId: legend.id
  }

  if (!legend.type && ['marker', 'polyline', 'polygon', 'special'].includes(legend.value)) {
    breakDrawing(options)
    return
  }

  if (['polyline', 'special'].includes(legend.type)) {
    type = legend.type
    settings.strokeStyle = type === 'polyline' ? legend.value : 'solid'
  } else {
    type = legend.value || legend.type
    settings.strokeStyle = 'solid'
  }
  settings.type = type

  if (type === 'select') {
    closeDrawing(options)
    this.frameOverlays()
  } else if (type === 'special') {
    closeDrawing(options)
    // this.unSelectOverlays()
  } else {
    const complete = (overlay) => {
      setTimeout(() => {
        // this.unSelectTool()
      }, 10)
    }
    closeDrawing(options)
    // removeMarkers(this._map, this._options)

    // this.unSelectOverlays()
    drawingOverlay(settings, complete, options)
  }
}

function drawingOverlay (settings = {}, callback, options) {
  const { map, drawingManager, activeLegend } = options
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
    map.removeOverlay(overlay)
    setOverlaySettings(newOverlay, settings)
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
    map.removeOverlay(marker)
    setOverlaySettings(newMarker, settings)
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
  startDrawing
}
