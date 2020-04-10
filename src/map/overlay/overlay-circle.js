import BMap from 'BMap'

import { updateOverlay } from './operate/update-overlay'
import { removeOverlay } from './operate/remove-overlay'
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
    updateOverlay(key, value, this.options)
  }

  remove () {
    removeOverlay(this)
  }
}

export default Circle