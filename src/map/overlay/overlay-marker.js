import BMap from 'BMap'

import { getOverlaySettings } from './setting'
import { updateMarker } from './operate/update-overlay'
import { removeOverlay } from './operate/remove-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Marker extends BMap.Marker {
  constructor (point, options) {
    super(point, { icon: options.icon })
    this.options = options
  }

  enableEditing () {
    const space = 4
    const markerIcon = this.getIcon()
    const { anchor, imageOffset: offset, size } = markerIcon
    const iconSize = new BMap.Size(size.width + space, size.height + space)
    const shadow = new BMap.Icon('assets/images/bullet.png', iconSize, {
      imageOffset: new BMap.Size(offset.width, offset.height),
      anchor: new BMap.Size(anchor.width + space / 2, anchor.height + space / 2),
      imageSize: iconSize
    })
    this.setShadow(shadow)
  }

  disableEditing () {
    const icon = this.getIcon()
    this.setShadow(icon)
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    const { events, activeLegend: legend, svg, icon } = this.options
    const point = this.getPosition()
    const settings = {
      ...getOverlaySettings(this),
      iconUrl: legend?.iconUrl || this.iconUrl || this.imageUrl,
      svg: legend?.svg || svg
    }
    // const newOverlay = this.draw(point, { icon })
    // this.options.xnewOverlay = newOverlay
    updateMarker(key, value, this.options)
  }

  remove () {
    removeOverlay(this)
  }
}

export default Marker
