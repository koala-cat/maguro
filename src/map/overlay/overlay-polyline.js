import BMap from 'BMap'

import { getPolylineIncludeSpecials } from '../calc/overlay'

import { updatePolyline, onLineupdate } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polyline extends BMap.Polyline {
  constructor (points, options) {
    super(points, options.settings)
    this.options = options
  }

  enableEditing () {
    const { overlays } = this.options
    if (getPolylineIncludeSpecials(this, overlays).length === 0 &&
      !this.projectGeoKey) {
      this.addEventListener('lineupdate', onLineupdate)
      super.enableEditing()
    }
  }

  disableEditing () {
    this.removeEventListener('lineupdate', onLineupdate)
    super.disableEditing()
  }

  drag () {
    if (this.projectGeoKey) return
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updatePolyline(key, value, this, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Polyline
