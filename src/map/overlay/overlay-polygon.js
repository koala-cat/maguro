import BMap from 'BMap'

import { updatePolygon, onLineupdate } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polygon extends BMap.Polygon {
  constructor (points, settings, options) {
    super(points, settings)
    this.settings = settings
    this.options = options
  }

  lineupdate (e) {
    onLineupdate(e, this.options)
  }

  enableEditing () {
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
    updatePolygon(key, value, this)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Polygon
