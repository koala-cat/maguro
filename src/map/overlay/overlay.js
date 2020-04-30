import BMap from 'BMap'

import { getOverlaySettings } from './setting'
import { updateMarker } from './operate/update-overlay'
import { deleteOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class CustomOverlay extends BMap.Overlay {
  constructor () {
    super()
    this.div = document.createElement('div')
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    const { overlayEvents: events, activeLegend: legend } = this.options
    const point = this.getPosition()
    const settings = {
      ...getOverlaySettings(this),
      iconUrl: legend?.iconUrl || this.iconUrl,
      svg: legend?.svg || this.svg
    }
    const newOverlay = this.draw(point, false, settings, events)
    this.options.newOverlay = newOverlay
    updateMarker(key, value, this, this.options)
  }

  delete () {
    this.div.remove()
    deleteOverlays(this)
  }

  addEventListener (type, fn, capture = false) {
    this.div.addEventListener(type, fn, capture)
  }

  removeEventListener (type, fn, capture = false) {
    this.div.removeEventListener(type, fn, capture)
  }

  getPosition (mpoint) {
    return this.point
  }

  setPosition (mpoint) {
    this.point = mpoint
    this.setTransform()
  }

  setSize (value) {
    this.options.settings.width = value
    this.setTransform()
  }

  setTransform () {
    const { map, settings } = this.options
    const { offsetX: x = 0, offsetY: y = 0, width, height } = settings
    const offset = {
      x: x - parseFloat(width) / 2,
      y: height ? y - parseFloat(height) / 2 : y - parseFloat(width) / 2
    }
    const pixel = map.pointToOverlayPixel(this.point)
    const px = pixel.x + offset.x + 'px'
    const py = pixel.y + offset.y + 'px'
    this.div.style.transform = `translate3d(${px}, ${py}, 0)`
  }
}

export default CustomOverlay
