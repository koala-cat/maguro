import BMap from 'BMap'
import CustomSvg from './overlay-svg'

import { addEvents } from './event'
import { getOverlaySettings, setOverlaySettings } from './setting'
import { updateMarker } from './operate/update-overlay'
import { removeOverlay } from './operate/remove-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Marker {
  constructor (baiduMap, point, options) {
    this.baiduMap = baiduMap
    this.point = point
    this.options = options

    this.draw()
    return this.marker
  }

  draw () {
    const { events, activeLegend, settings, isSymbol, callback } = this.options
    const { svg } = activeLegend
    let marker = null
    if (svg) {
      marker = this.drawSvg(this.point, settings)
    } else {
      const icon = isSymbol ? this.drawSymbol(settings) : this.drawIcon(settings)
      marker = new BMap.Marker(this.point, { icon })
    }
    setOverlaySettings(marker, settings)
    addEvents(events, marker)
    if (callback) callback(marker)

    this.marker = marker
  }

  enableEditing () {
    const space = 4
    const markerIcon = this.marker.getIcon()
    const { anchor, imageOffset: offset, size } = markerIcon
    const iconSize = new BMap.Size(size.width + space, size.height + space)
    const shadow = new BMap.Icon('assets/images/bullet.png', iconSize, {
      imageOffset: new BMap.Size(offset.width, offset.height),
      anchor: new BMap.Size(anchor.width + space / 2, anchor.height + space / 2),
      imageSize: iconSize
    })
    this.marker.setShadow(shadow)
  }

  disableEditing () {
    const icon = this.marker.getIcon()
    this.marker.setShadow(icon)
  }

  drag () {
    dragOverlay(this.baiduMap, this.marker, this.options)
  }

  update (key, value) {
    const { activeLegend: legend } = this.options
    this.options.settings = {
      ...getOverlaySettings(this.marker),
      iconUrl: legend?.iconUrl || this.marker.iconUrl,
      svg: legend?.svg || this.marker.svg
    }
    const newOverlay = this.draw()
    this.options.newOverlay = newOverlay
    updateMarker(key, value, this.options)
  }

  remove () {
    removeOverlay(this.baiduMap, this.marker, this.options)
  }

  drawIcon (options) {
    const {
      width: sizeWidth = 16,
      width: sizeHeight = 16,
      imageOffset: offset = [0, 0],
      _anchor: anchor = [sizeWidth / 2, sizeHeight / 2]
    } = options

    return new BMap.Icon(options.iconUrl,
      new BMap.Size(sizeWidth, sizeHeight), {
        anchor: new BMap.Size(anchor[0], anchor[1]),
        imageSize: new BMap.Size(sizeWidth, sizeHeight),
        imageOffset: new BMap.Size(offset[0], offset[1])
      }
    )
  }

  drawSymbol (options) {
    const {
      _rotation: rotation = 0,
      _scale: scale = 4,
      _symbol: symbol = BMap_Symbol_SHAPE_CIRCLE,
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

  drawSvg (point, settings = {}, events) {
    this.options.settings = settings
    const svg = new CustomSvg(this.baiduMap, point, this.options)
    return svg
  }
}

export default Marker
