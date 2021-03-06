import BMap from 'BMap'
import CustomOverlay from './overlay'
import { calcOnePixelToPoint } from '../../calc/point'

class CustomSvg extends CustomOverlay {
  constructor (point, settings, options) {
    super()
    this.point = point
    this.settings = settings
    this.options = options

    this._errorCount = 16
  }

  initialize () {
    const {
      fillColor: fill,
      fillOpacity: opacity,
      svg,
      width,
      height
    } = this.settings
    const viewBox = svg.getAttribute('viewBox')
    this.class = svg.getAttribute('class')

    this.div.innerHTML = `
      <svg class="${this.class}" viewBox="${viewBox}">
        ${svg.innerHTML}
      </svg>
    `
    const svgEl = this.div.querySelector(`.${this.class}`)
    Object.assign(
      svgEl.style,
      {
        display: 'inherit',
        width: `${width}px`,
        height: height ? `${height}px` : `${width}px`,
        fill,
        opacity
      }
    )
    Object.assign(
      this.div.style,
      {
        position: 'absolute',
        border: '1px solid transparent',
        transition: 'all 0'
      }
    )
    this.options.map.getPanes().labelPane.appendChild(this.div)
    if (this.class && this.class.includes('vtk')) {
      this.getBounds()
    }

    this.setLabel()
    return this.div
  }

  draw () {
    if (this.class && this.class.includes('vtk')) {
      this.setBounds()
    } else {
      const width = this.width || this.settings.width
      const height = this.height
      Object.assign(
        this.settings,
        {
          width,
          height
        }
      )
      super.setPosition(this.point)
    }
  }

  enableEditing () {
    if (this.disabled) return

    this.setBorder('#5E87DB')
  }

  disableEditing () {
    this.setBorder('transparent')
  }

  getBounds () {
    const { map } = this.options
    const width = this.div.clientWidth
    const height = this.div.clientHeight
    const entry = calcOnePixelToPoint(map)
    const { lng, lat } = this.point

    const dLng = entry.lng * (width + this._errorCount) / 2
    const dLat = entry.lat * (height + this._errorCount) / 2
    const sw = new BMap.Point(lng - dLng, lat - dLat)
    const ne = new BMap.Point(lng + dLng, lat + dLat)
    this.bounds = new BMap.Bounds(sw, ne)

    return this.bounds
  }

  setBounds () {
    const { map } = this.options
    const sw = this.bounds.getSouthWest()
    const ne = this.bounds.getNorthEast()

    const pixelSw = map.pointToOverlayPixel(sw)
    const pixelNe = map.pointToOverlayPixel(ne)

    const width = Math.abs(pixelNe.x - pixelSw.x) - this._errorCount
    const height = Math.abs(pixelNe.y - pixelSw.y) - this._errorCount
    Object.assign(
      this.div.querySelector(`.${this.class}`).style,
      {
        width: `${width}px`,
        height: `${height}px`
      }
    )
    Object.assign(
      this.settings,
      {
        width,
        height
      }
    )
    this.setTransform()
  }

  setLabel () {
    const { label: opts } = this.settings
    if (!opts) {
      return
    }
    const { name, offsetX: x = 0, offsetY: y = 0 } = opts
    const label = new BMap.Label(name, {
      offset: new BMap.Size(x, y),
      position: this.point
    })
    label.hide()
    label.setStyle(opts)
    this.options.map.addOverlay(label)
    setTimeout(() => {
      let el = label.ba
      const style = el.getAttribute('style')
      const innerHTML = el.innerHTML
      el = document.createElement('label')
      el.setAttribute('style', style)
      Object.assign(
        el.style,
        {
          display: 'block',
          left: `${x}px`,
          top: `${y}px`
        }
      )
      el.innerHTML = innerHTML
      this.div.appendChild(el)
      this.options.map.removeOverlay(label)
    })
  }

  setBorder (color, radius) {
    const style = {}
    style.border = '1px solid ' + color
    if (radius) {
      style.borderRadius = radius
    }
    Object.assign(
      this.div.style,
      style
    )
  }

  setStyle (key, value) {
    this.div.querySelector('svg').style[key] = value
  }
}

export default CustomSvg
