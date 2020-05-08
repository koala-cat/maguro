import BMap from 'BMap'

import { updateMarker } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Marker extends BMap.Marker {
  constructor (point, settings, options) {
    super(point, { icon: options.icon })
    this.settings = settings
    this.options = options
  }

  enableEditing () {
    if (this.disabled) return

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
    updateMarker(key, value, this)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Marker
