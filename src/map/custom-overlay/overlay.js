import BMap from 'BMap'

class CustomOverlay extends BMap.Overlay {
  constructor () {
    super()
    this.div = document.createElement('div')
  }

  remove () {
    this.div.remove()
  }

  addEventListener (type, fn, capture = false) {
    this.div.addEventListener(type, fn, capture)
  }

  removeEventListener (type, fn, capture = false) {
    this.div.removeEventListener(type, fn, capture)
  }

  getPosition (mpoint) {
    return this.options.point
  }

  setPosition (mpoint) {
    this.options.point = mpoint
    this.setTransform()
  }

  setSize (value) {
    this.options.width = value
    this.setTransform()
  }

  setTransform () {
    const { offsetX: x = 0, offsetY: y = 0, point, width } = this.options
    const offset = {
      x: x - parseFloat(width) / 2,
      y: y - parseFloat(width) / 2
    }
    const pixel = this.baiduMap.pointToOverlayPixel(point)
    const px = pixel.x + offset.x + 'px'
    const py = pixel.y + offset.y + 'px'
    this.div.style.transform = `translate3d(${px}, ${py}, 0)`
  }
}

export default CustomOverlay
