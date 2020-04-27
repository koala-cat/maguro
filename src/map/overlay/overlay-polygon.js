import BMap from 'BMap'

import { updatePolygon, onLineupdate } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polygon extends BMap.Polygon {
  constructor (points, options) {
    super(points, options.settings)
    this.options = options
  }

  enableEditing () {
    this.addEventListener('lineupdate', onLineupdate)
    super.enableEditing()
  }

  disableEditing () {
    this.removeEventListener('lineupdate', onLineupdate)
    super.disableEditing()
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updatePolygon(key, value, this, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Polygon
