import BMap from 'BMap'

import { updateCircle, onLineupdate } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Circle extends BMap.Circle {
  constructor (center, radius, settings, options) {
    super(center, radius, settings)
    this.settings = settings
    this.options = options
  }

  lineupdate (e) {
    onLineupdate(e, this.options)
  }

  enableEditing () {
    if (this.disabled) return
    this.addEventListener('lineupdate', this.lineupdate)
    super.enableEditing()
  }

  disableEditing () {
    this.removeEventListener('lineupdate', this.lineupdate)
    super.disableEditing()
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updateCircle(key, value, this)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Circle
