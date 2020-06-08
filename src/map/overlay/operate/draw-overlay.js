import BMap from 'BMap'

import { addEvents } from '../event'
import { getLegend, getLegendType } from '../legend'
import { defaultSettings, setOverlaySettings } from '../setting'
import { addOverlay } from './add-overlay'

import Marker from '../overlay-marker'
import CustomSvg from '../custom/overlay-svg'
import Polyline from '../overlay-polyline'
import Circle from '../overlay-circle'
import Rectangle from '../overlay-rectangle'
import Polygon from '../overlay-polygon'
import Label from '../overlay-label'
import Hotspot from '../overlay-hotspot'

function drawOverlay (overlay, points, settings, options) {
  const { legends } = options
  const legend = getLegend(legends, overlay)
  const type = getLegendType(legend)

  let newOverlay = null
  if (!type) {
    Object.assign(settings, { type: 'hotspot' })
    newOverlay = drawHotspot(overlay, settings, options)
  } else {
    if (type === 'marker') {
      Object.assign(settings, { legendUrl: legend.iconUrl })
      newOverlay = drawMarker(points[0], settings, options)
    } else if (type === 'polyline') {
      newOverlay = drawPolyline(points, settings, options)
    } else if (type === 'circle') {
      newOverlay = drawCircle(points[0], overlay.width, settings, options)
    } else if (type === 'rectangle') {
      newOverlay = drawRectangle(points, settings, options)
    } else if (type === 'polygon') {
      newOverlay = drawPolygon(points, settings, options)
    } else if (type === 'label') {
      newOverlay = drawLabel(points[0], settings, options)
    }
  }
  setOverlaySettings(newOverlay, settings)
  return newOverlay
}

function drawMarker (point, settings, options) {
  const { legends, activeLegend, isSymbol } = options
  const { projectMapLegendId: legendId } = settings
  const legend = legendId ? getLegend(legends, legendId) : activeLegend
  const { svg } = legend
  let marker = null
  Object.assign(settings, { svg, legendUrl: legend.iconUrl })
  if (svg) {
    marker = drawSvg(point, settings, options)
  } else {
    const icon = isSymbol ? drawSymbol(settings) : drawIcon(settings)
    options.icon = icon
    marker = new Marker(point, settings, options)
  }
  marker.redraw = function (_settings) {
    const mPoint = this.getPosition()
    return drawMarker(mPoint, _settings, options)
  }

  return setOverlay(marker, options)
}

function drawIcon (settings) {
  const {
    width: sizeWidth = 16,
    width: sizeHeight = 16,
    imageOffset: offset = [0, 0],
    anchor = [sizeWidth / 2, sizeHeight / 2]
  } = settings

  return new BMap.Icon(settings.legendUrl,
    new BMap.Size(sizeWidth, sizeHeight), {
      anchor: new BMap.Size(anchor[0], anchor[1]),
      imageSize: new BMap.Size(sizeWidth, sizeHeight),
      imageOffset: new BMap.Size(offset[0], offset[1])
    }
  )
}

function drawSymbol (settings) {
  const {
    rotation = 0,
    scale = 4,
    symbol = BMap_Symbol_SHAPE_CIRCLE,
    height: anchorHeight = 0,
    width: anchorWidth = 0,
    fillColor,
    fillOpacity,
    strokeColor
  } = settings

  return new BMap.Symbol(symbol, {
    rotation,
    scale,
    fillColor,
    fillOpacity,
    strokeColor,
    anchor: new BMap.Size(anchorHeight, anchorWidth),
    strokeWeight: 1
  })
}

function drawSvg (point, settings, options) {
  const svg = new CustomSvg(point, settings, options)
  return svg
}

function drawPolyline (points, settings, options) {
  const polyline = new Polyline(points, settings, options)
  return setOverlay(polyline, options)
}

function drawCircle (center, radius, settings, options) {
  const circle = new Circle(center, radius, settings, options)
  return setOverlay(circle, options)
}

function drawRectangle (points, settings, options) {
  const rectangle = new Rectangle(points, settings, options)
  return setOverlay(rectangle, options)
}

function drawPolygon (points, settings, options) {
  const polygon = new Polygon(points, settings, options)
  return setOverlay(polygon, options)
}

function drawLabel (point, settings, options) {
  if (!settings.id || settings.id < 0) {
    Object.assign(
      settings,
      {
        strokeColor: '#333',
        fillOpacity: 1,
        width: 12
      }
    )
  }

  const style = {
    color: settings.strokeColor,
    fontSize: `${settings.width}px`,
    lineHeight: '20px',
    textAlign: 'center',
    padding: '0 10px',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(0, 0, 0, 0)'
  }
  const label = new Label(point, settings, options)
  label.setStyle(style)
  return setOverlay(label, options)
}

function drawUploadLine (data, options) {
  const centers = []
  const legend = options.legends.find(item => item.value === 'solid')

  const settings = {
    ...defaultSettings(legend.type),
    name: data.name,
    projectMapLegendId: legend.id,
    projectGeoKey: -1
  }

  const mPoints = []
  data.points.map(item => {
    centers.push(item.center)
    mPoints.push(new BMap.Point(item.lng, item.lat))
  })
  const overlay = drawPolyline(mPoints, settings, options)
  setOverlaySettings(overlay, settings)
  overlay.centers = centers
  overlay.type = legend.type
  addOverlay(overlay, options)
}

function drawHotspot (overlay, settings, options) {
  if (!overlay.hotspotMark) return
  const el = document.querySelector(`#${overlay.hotspotMark}`)
  const hotspot = new Hotspot(el, settings, options)
  return setOverlay(hotspot, options)
}

function setOverlay (overlay, options) {
  const { overlayEvents: events, callback } = options

  addEvents(events, overlay)
  if (callback) callback(overlay)
  return overlay
}

export {
  drawOverlay,
  drawMarker,
  drawSymbol,
  drawPolyline,
  drawCircle,
  drawRectangle,
  drawPolygon,
  drawLabel,
  drawUploadLine
}
