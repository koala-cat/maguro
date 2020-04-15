import BMap from 'BMap'

import { updateCircle } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Circle extends BMap.Circle {
  constructor (center, radius, options) {
    super(center, radius, options.settings)
    console.log(options.settings)
    this.options = options
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updateCircle(key, value, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Circle
