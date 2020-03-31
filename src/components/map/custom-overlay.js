import BMap from 'BMap'

class ComplexCustomOverlay extends BMap.Overlay {
  constructor (options) {
    super()
    this._badgeNum = options.badge || 0
    this._fill = options.fillColor
    this._imageUrl = options.iconUrl || ''
    this._offsetX = options.offsetX || 0
    this._offsetY = options.offsetY || 0
    this._opacity = options.fillOpacity
    this._position = 'absolute'
    this._size = `${options.width}px`
    this._width = options.width || 0

    this._div = document.createElement('div')
  }

  remove () {
    this._div.remove()
  }

  addEventListener (type, fn, capture = false) {
    if (window.addEventListener) {
      this._div.addEventListener(type, fn, capture)
    } else if (window.attachEvent) {
      this._div.attachEvent('on' + type, fn)
    } else {
      this._div['on' + type] = fn
    }
  }

  removeEventListener (type, fn, capture = false) {
    if (window.removeEventListener) {
      this._div.removeEventListener(type, fn, capture)
    } else if (document.attachEvent) {
      this._div.detachEvent('on' + type, fn)
    } else {
      this._div['on' + type] = null
    }
  }

  getPosition (mpoint) {
    return this._point
  }

  setPosition (mpoint) {
    this._point = mpoint
    this.setTransform()
  }

  setSize (value) {
    this._size = value
    this.setTransform()
  }

  setTransform () {
    const offset = {
      x: this._offsetX - parseFloat(this._size) / 2,
      y: this._offsetY - parseFloat(this._size) / 2
    }
    const pixel = this._map.pointToOverlayPixel(this._point)
    const x = pixel.x + offset.x + 'px'
    const y = pixel.y + offset.y + 'px'
    this._div.style.transform = `translate3d(${x}, ${y}, 0)`
  }
}

class CustomSvg extends ComplexCustomOverlay {
  constructor (map, point, options) {
    super(options)
    this._map = map
    this._point = point
    this._options = options
  }

  initialize () {
    const viewBox = this._options.svg.getAttribute('viewBox')
    this._div.innerHTML = `
      <svg class="icon" viewBox="${viewBox}">
        ${this._options.svg.innerHTML}
      </svg>
    `
    const svg = this._div.firstElementChild
    svg.style.display = 'inherit'
    svg.style.width = this._size
    svg.style.height = this._size
    svg.style.fill = this._fill
    svg.style.opacity = this._opacity
    this._div.style.position = this._position
    this._div.style.border = '1px solid transparent'
    this._div.style.transition = 'all 0'
    this._map.getPanes().labelPane.appendChild(this._div)
    return this._div
  }

  draw () {
    super.setTransform()
  }

  setStyle (key, value) {
    this._div.firstElementChild.style[key] = value
  }

  setBorder (color) {
    this._div.style.border = '1px solid ' + color
  }
}

export {
  CustomSvg
}
