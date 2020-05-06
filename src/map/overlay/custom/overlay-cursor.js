import BMap from 'BMap'
import CustomOverlay from './overlay'

class CustomCursor extends CustomOverlay {
  constructor (point, settings, options) {
    super()
    this.point = point
    this.settings = settings
    this.options = options
    this.type = this.settings.type
  }

  initialize () {
    let { width, height, innerBgColor, outerBgColor, opacity } = this.settings
    const childEl = document.createElement('div')
    height = height || width
    Object.assign(
      childEl.style,
      {
        position: 'absolute',
        zIndex: BMap.Overlay.getZIndex(this.point.lat),
        backgroundColor: innerBgColor,
        width: `${width / 4}px`,
        height: `${height / 4}px`,
        margin: `${height / 2}px ${width / 2}px`,
        transform: `translate3d(-${width / 4 / 2}px, -${height / 4 / 2}px, 0)`,
        borderRadius: '50%',
        opacity
      }
    )
    this.div.appendChild(childEl)

    Object.assign(
      this.div.style,
      {
        position: 'absolute',
        zIndex: BMap.Overlay.getZIndex(this.point.lat),
        backgroundColor: outerBgColor,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: '50%',
        opacity: opacity / 2
      }
    )
    this.options.map.getPanes().labelPane.appendChild(this.div)
    return this.div
  }

  draw () {
    super.setPosition(this.point)
  }
}

export default CustomCursor
