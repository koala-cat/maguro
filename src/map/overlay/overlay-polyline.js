import BMap from 'BMap'

import { getPolylineIncludeSpecials } from '../calc/overlay'

import { updatePolyline, onLineupdate } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polyline extends BMap.Polyline {
  constructor (points, settings, options) {
    super(points, settings)
    this.settings = settings
    this.options = options
  }

  lineupdate (e) {
    onLineupdate(e, this.options)
  }

  enableEditing () {
    if (this.disabled) return

    const { overlays } = this.options
    if (getPolylineIncludeSpecials(this, overlays).length === 0 &&
      !this.projectGeoKey) {
      this.addEventListener('lineupdate', this.lineupdate)
      super.enableEditing()
    }
  }

  disableEditing () {
    this.removeEventListener('lineupdate', this.lineupdate)
    super.disableEditing()
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updatePolyline(key, value, this)
  }

  delete (callback) {
    deleteOverlays(this, callback)
  }
}

export default Polyline
