import BMap from 'BMap'

import { addEvents } from '../event'
import { setOverlaySettings } from '../setting'

import Marker from '../overlay-marker'
import CustomSvg from '../overlay-svg'

function drawMarker (point, options) {
  const { events, activeLegend, settings, isSymbol, callback } = options
  const { svg } = activeLegend
  let marker = null
  if (svg) {
    marker = drawSvg(point, options)
  } else {
    const icon = isSymbol ? drawSymbol(settings) : drawIcon(settings)
    options.icon = icon
    marker = new Marker(point, options)
  }

  setOverlaySettings(marker, settings)
  addEvents(events, marker)
  if (callback) callback(marker)
  return marker
}

function drawIcon (options) {
  const {
    width: sizeWidth = 16,
    width: sizeHeight = 16,
    imageOffset: offset = [0, 0],
    anchor = [sizeWidth / 2, sizeHeight / 2]
  } = options

  return new BMap.Icon(options.iconUrl,
    new BMap.Size(sizeWidth, sizeHeight), {
      anchor: new BMap.Size(anchor[0], anchor[1]),
      imageSize: new BMap.Size(sizeWidth, sizeHeight),
      imageOffset: new BMap.Size(offset[0], offset[1])
    }
  )
}

function drawSymbol (options) {
  const {
    rotation = 0,
    scale = 4,
    symbol = BMap_Symbol_SHAPE_CIRCLE,
    height: anchorHeight = 0,
    width: anchorWidth = 0,
    fillColor,
    fillOpacity,
    strokeColor
  } = options

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

export {
  drawMarker
}
