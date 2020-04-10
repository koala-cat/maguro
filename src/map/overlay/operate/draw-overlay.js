import BMap from 'BMap'

import { addEvents } from '../event'

import Marker from '../overlay-marker'
import CustomSvg from '../overlay-svg'
import Polyline from '../overlay-polyline'
import Circle from '../overlay-circle'
import Rectangle from '../overlay-rectangle'
import Polygon from '../overlay-polygon'
import Label from '../overlay-label'

function drawMarker (point, options) {
  const { activeLegend, settings, isSymbol } = options
  const { svg } = activeLegend
  let marker = null
  if (svg) {
    marker = drawSvg(point, options)
  } else {
    const icon = isSymbol ? drawSymbol(settings) : drawIcon(settings)
    options.icon = icon
    marker = new Marker(point, options)
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

  return new BMap.Icon(settings.iconUrl,
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

function drawSvg (point, options) {
  const svg = new CustomSvg(point, options)
  return svg
}

function drawPolyline (points, options) {
  const polyline = new Polyline(points, options)
  return setOverlay(polyline, options)
}

function drawCircle (center, radius, options) {
  const circle = new Circle(center, radius, options)
  return setOverlay(circle, options)
}

function drawRectangle (points, options) {
  const rectangle = new Rectangle(points, options)
  return setOverlay(rectangle, options)
}

function drawPolygon (points, options) {
  const polygon = new Polygon(points, options)
  return setOverlay(polygon, options)
}

function drawLabel (point, options) {
  const settings = {
    ...options.settings,
    strokeColor: '#333',
    fillOpacity: 1,
    width: 12
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
  const label = new Label(point, options)
  label.setStyle(style)
  return setOverlay(label, options)
}

function setOverlay (overlay, options) {
  const { events, callback } = options

  addEvents(events, overlay)
  if (callback) callback(overlay)
  return overlay
}

export {
  drawMarker,
  drawSymbol,
  drawPolyline,
  drawCircle,
  drawRectangle,
  drawPolygon,
  drawLabel
}
