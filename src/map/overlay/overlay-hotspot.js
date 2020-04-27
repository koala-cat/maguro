class Hotspot {
  constructor (el) {
    this.el = el
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
