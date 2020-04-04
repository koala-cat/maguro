import CustomOverlay from './overlay'

class CustomSvg extends CustomOverlay {
  constructor (baiduMap, point, options) {
    super()
    this.baiduMap = baiduMap
    this.point = point
    this.options = options
  }

  initialize () {
    const {
      fill,
      fillOpacity: opacity,
      svg,
      width
    } = this.options.settings
    const viewBox = svg.getAttribute('viewBox')
    this.div.innerHTML = `
      <svg class="icon" viewBox="${viewBox}">
        ${svg.innerHTML}
      </svg>
    `
    const svgDoc = this.div.querySelector('svg')
    Object.assign(
      svgDoc.style,
      {
        display: 'inherit',
        width: `${width}px`,
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
    this.baiduMap.getPanes().labelPane.appendChild(this.div)
    return this.div
  }

  draw () {
    super.setPosition(this.point)
  }

  enableEditing () {
    this.setBorder('#5E87DB')
  }

  disableEditing () {
    this.setBorder('transparent')
  }

  setStyle (key, value) {
    this.div.querySelector('svg').style[key] = value
  }

  setBorder (color) {
    this.div.style.border = '1px solid ' + color
  }
}

export default CustomSvg
