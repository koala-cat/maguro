import BMap from 'BMap'

import { getPolylineIncludeSpecials } from '../calc/overlay'

import { updateOverlay } from './operate/update-overlay'
import { removeOverlay } from './operate/remove-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polyline extends BMap.Polyline {
  constructor (points, options) {
    super(points, options.settings)
    this.options = options
  }

  enableEditing () {
    const { overlays } = this.options
    if (getPolylineIncludeSpecials(this, overlays).length === 0) {
      super.enableEditing()
    }
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updateOverlay(key, value, this.options)
  }

  remove () {
    removeOverlay(this)
  }
}

export default Polyline