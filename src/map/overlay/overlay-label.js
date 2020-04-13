import BMap from 'BMap'

import { updateOverlay } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Label extends BMap.Label {
  constructor (point, options) {
    super(options.settings.name, {
      position: point,
      offset: new BMap.Size(-30, -12)
    })
    this.options = options
  }

  enableEditing () {
    this.setStyle({ borderColor: '#5E87DB' })
  }

  disableEditing () {
    this.setStyle({ borderColor: 'rgba(0, 0, 0, 0)' })
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updateOverlay(key, value, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Label
