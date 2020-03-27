import BMap from 'BMap'

class ComplexCustomOverlay extends BMap.Overlay {
  constructor (mpoint, mpixel, options) {
    super()
    this._badgeNum = options.badge || 0
    this._fill = options.fillColor
    this._imageUrl = options.imageUrl || ''
    this._offsetX = options.offsetX || 0
    this._offsetY = options.offsetY || 0
    this._opacity = options.fillOpacity
    this._point = mpoint
    this._pixel = mpixel
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

  setPosition (mpoint, mpixel) {
    this._point = mpoint
    this._pixel = mpixel
    this.setTransform()
  }

  setSize (value) {
    this._size = value
    this.setTransform()
  }

  setTransform (_div, _pixel, _size) {
    const offset = {
      x: this._offsetX - parseFloat(this._size) / 2,
      y: this._offsetY - parseFloat(this._size) / 2
    }
    const x = this._pixel.x - offset.x + 'px'
    const y = this._pixel.y - offset.y + 'px'
    this._div.style.transform = `translate3d(${x}, ${y}, 0)`
  }
}

class CustomSvg extends ComplexCustomOverlay {
  constructor (_div) {
    super(_div)
    this._div = _div
  }

  initialize (svgDoc) {
    const viewBox = svgDoc.getAttribute('viewBox')
    this._div.innerHTML = `
      <svg class="icon" viewBox="${viewBox}">
        ${svgDoc.innerHTML}
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
  }

  draw (svgDoc) {
    this.initialize(svgDoc)
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
