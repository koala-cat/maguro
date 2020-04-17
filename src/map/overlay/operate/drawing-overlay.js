import BMap from 'BMap'
import BMapLib from 'BMapLib'

import { addOverlay } from './add-overlay'
import { deleteAnchorOverlays } from './delete-overlay'
import { deselectOverlays } from './deselect-overlay'
import { drawMarker, drawPolyline, drawCircle, drawRectangle, drawPolygon, drawLabel } from './draw-overlay'
import { frameSelectOverlays } from './select-overlay'
import { defaultStyle, setOverlaySettings } from '../setting'

import { tools } from '../../../constants'

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

function breakDrawing (options) {
  const { map, overlays } = options
  map.getOverlays().map(oly => {
    const overlay = overlays.find(item => item.id === oly.id)
    if (!overlay && !(oly instanceof BMap.GroundOverlay)) {
      map.removeOverlay(oly)
    }
  })
  endDrawing(options)
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

  closeDrawing(options)
  deselectOverlays(options)

  if (type === 'select') {
    Object.assign(
      settings,
      {
        fillOpacity: 0.2,
        strokeWeight: 1,
        strokeStyle: 'dashed'
      }
    )
    drawingOverlay(settings, options, (overlay) => {
      frameSelectOverlays(overlay, options)
    })
  } else if (type !== 'special') {
    deleteAnchorOverlays(options)
    deselectOverlays(options)
    drawingOverlay(settings, options)
  }
}

function endDrawing (options) {
  const { activeLegend } = options
  closeDrawing(options)
  setTimeout(() => {
    let legend = null
    const activeType = activeLegend.type
    if (activeType) {
      legend = tools.find(item => item.value === activeType)
    }
    options.activeLegend = legend
  }, 10)
}

function drawingOverlay (settings = {}, options, callback) {
  const { map, drawingManager, activeLegend } = options
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
  let type = activeLegend.type === 'polyline' ? activeLegend.type : activeLegend.value || activeLegend.type
  type = type === 'select' ? 'rectangle' : type

  Object.assign(options, { settings })
  drawingManager[`${type}Options`] = settings
  drawingManager.open()

  if (type === 'label') {
    const click = (e) => {
      e.stopPropagation()

      const label = drawLabel(e.point, options)
      drawingManager._mask.removeEventListener('click', click)
      drawNewOverlay(label, label)
    }
    drawingManager.setDrawingMode(null)
    drawingManager._mask.addEventListener('click', click)
  } else {
    listenerEvent(`${type}complete`, complete[type])
    drawingManager.setDrawingMode(modes[type])
  }

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
    setOverlaySettings(newOverlay, options.settings)
    if (activeLegend.value !== 'select') {
      addOverlay(newOverlay, options)
    }
    endDrawing(options)
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
    drawNewOverlay(marker, newMarker)
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
  openDrawing,
  closeDrawing,
  breakDrawing,
  startDrawing,
  endDrawing
}
