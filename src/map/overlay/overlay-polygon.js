import BMap from 'BMap'

import { updatePolygon } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Polygon extends BMap.Polygon {
  constructor (points, options) {
    super(points, options.settings)
    this.options = options
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updatePolygon(key, value, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Polygon
