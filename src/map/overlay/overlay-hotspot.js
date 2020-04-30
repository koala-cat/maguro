import { updateHotspot } from '../overlay/operate/update-overlay'

class Hotspot {
  constructor (el, options) {
    this.el = el
    this.options = options
  }

  isVisible () {
    return true
  }

  enableEditing () {
    this.el.classList.add('active')
  }

  disableEditing () {
    this.el.classList.remove('active')
  }

  addEventListener (type, fn, capture = false) {
    this.el.addEventListener(type, fn, capture)
  }

  removeEventListener (type, fn, capture = false) {
    this.el.removeEventListener(type, fn, capture)
  }

  drag () {
    return false
  }

  update (key, value) {
    updateHotspot(key, value, this, this.options)
  }

  delete () {
    return false
  }

  hide () {
    return false
  }

  show () {
    return false
  }

  getPosition () {
    return false
  }
}

export default Hotspot
