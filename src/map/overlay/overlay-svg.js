import BMap from 'BMap'
import CustomOverlay from './overlay'
import { calcOnePixelToPoint } from '../calc/point'

class CustomSvg extends CustomOverlay {
  constructor (point, options) {
    super()
    this.point = point
    this.options = options
  }

  initialize () {
    const {
      fill,
      fillOpacity: opacity,
      svg,
      width,
      height
    } = this.options.settings
    const viewBox = svg.getAttribute('viewBox')
    const _class = svg.getAttribute('class')
    this.div.innerHTML = `
      <svg class="${_class}" viewBox="${viewBox}">
        ${svg.innerHTML}
      </svg>
    `
    const svgDoc = this.div.querySelector('svg')
    Object.assign(
      svgDoc.style,
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
    this.getBounds()
    return this.div
  }

  draw () {
    super.setPosition(this.point)
    this.setBounds()
  }

  enableEditing () {
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

    const dLng = entry.lng * width / 2
    const dLat = entry.lat * height / 2
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

    const width = Math.abs(pixelNe.x - pixelSw.x)
    const height = Math.abs(pixelNe.y - pixelSw.y)
    Object.assign(
      this.div.querySelector('svg').style,
      {
        width: `${width}px`,
        height: `${height}px`
      }
    )
    Object.assign(
      this.options.settings,
      {
        width: `${width}px`,
        height: `${height}px`
      }
    )
    this.setTransform()
  }

  setStyle (key, value) {
    this.div.querySelector('svg').style[key] = value
  }

  setBorder (color) {
    this.div.style.border = '1px solid ' + color
  }
}

export default CustomSvg
