import BMap from 'BMap'
import CustomSvg from 'CustomSvg'

import { addEvents } from './event'
import { getOverlaySettings, setOverlaySettings, settingsToStyle } from '../setting'
import { updateOverlay, showOverlay } from './operate/update-overlay'
import { removeOverlay } from './operate/remove-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Marker extends BMap.Marker {
  constructor (baiduMap, options) {
    super()
    this.baiduMap = baiduMap
    this.options = options
  }

  draw (point, isSymbol, options) {
    const { settings, svg, events, callback } = options
    let marker = null

    if (svg) {
      marker = this.drawSvg(point, settings)
    } else {
      const icon = isSymbol ? this.drawSymbol(settings) : this.drawIcon(settings)
      marker = new BMap.Marker(point, { icon })
    }

    setOverlaySettings(marker, settings)
    addEvents(events, marker)
    if (callback) callback(marker)

    this.marker = marker
    return marker
  }

  enableEditing () {
    const space = 4
    if (this.marker instanceof BMap.Overlay) {
      this.marker.setBorder('#5E87DB')
    } else {
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
  }

  disableEditing () {
    if (this.marker instanceof BMap.Overlay) {
      this.marker.setBorder('transparent')
    } else {
      const icon = this.marker.getIcon()
      this.marker.setShadow(icon)
    }
  }

  drag () {
    dragOverlay(this.baiduMap, this.marker, this.options)
  }

  update (options) {
    const { key, value, legend, updateOverlays, polylinePointIds, callback } = options

    if (['name', 'isLocked', 'isDisplay', 'isCommandDisplay', 'projectStructureId'].includes(key)) {
      showOverlay(this.marker, { key, value })
      return
    }

    if (key !== 'projectMapLegendId' && this.marker.svg) {
      const style = settingsToStyle({ [key]: value })
      for (const s in style) {
        this.marker.setStyle(s, style[s])
      }
      if (key === 'width') {
        this.marker.setSize(value)
      }
      return
    }

    const point = this.marker.getPosition()
    const settings = {
      ...getOverlaySettings(this.marker),
      iconUrl: legend?.iconUrl || this.marker.iconUrl,
      svg: legend?.svg || this.marker.svg
    }

    this.marker.disableEditing()
    this.baiduMap.removeOverlay(this.marker)
    if (this.marker instanceof BMap.Overlay) {
      this.marker.remove()
    }

    const index = this.options.overlays.findIndex(item => item.id === this.marker.id)
    const newOverlay = this.draw(point, false, settings, this._events)
    this.baiduMap.addOverlay(newOverlay)
    this.options.overlays.splice(index, 1, newOverlay)
    updateOverlay(newOverlay, { key, value, updateOverlays, polylinePointIds })
    if (callback) callback(newOverlay)
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

  drawSvg (point, options = {}, events) {
    const svg = new CustomSvg(this.baiduMap, point, options)
    return svg
  }
}

export default Marker
