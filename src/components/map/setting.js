function defaultSettings () {
  return {
    orgId: null,
    orgName: '',
    id: null,
    name: '元件名称',
    type: null,
    width: 0,
    points: [],
    projectMapLegendId: null,
    parentId: -1,
    projectStructureId: null,
    parentLineId: null,
    projectGeoKey: null,
    iconUrl: null,
    fillColor: '#457bd8',
    fillOpacity: 0.5,
    strokeStyle: 'solid',
    strokeColor: '#457bd8',
    strokeWeight: 2,
    level: 1,
    isLocked: false,
    isDisplay: true,
    isCommandDisplay: true,
    visible: true,
    disabled: false
  }
}

function defaultStyle (style) {
  for (const key in style) {
    if (style[key] === undefined || style[key] === null) {
      delete style[key]
    }
  }
  return {
    ...defaultSettings(),
    ...style
  }
}

function getOverlaySettings (oly) {
  const map = {}
  const settings = Object.keys(defaultSettings())

  for (let key in oly) {
    if (key === 'opacity') {
      oly.fillOpacity = oly.opacity
      key = 'fillOpacity'
    }
    if (settings.includes(key) || key === 'opacity') {
      map[key] = oly[key]
    }
  }
  return defaultStyle(map)
}

function setOverlaySettings (oly, options) {
  for (const key in options) {
    oly[key] = options[key]
  }
}

function settingsToStyle (options, type) {
  const style = {}
  for (const key in options) {
    const value = options[key]
    switch (key) {
      case 'fillColor':
        style.fill = value
        break
      case 'strokeColor':
        style.color = value
        break
      case 'fillOpacity':
        style.opacity = value
        break
      default:
        if (type === 'label') {
          style.fontSize = `${value}px`
        } else {
          style.width = `${value}px`
          style.height = `${value}px`
        }
    }
  }
  return style
}

export {
  defaultStyle,
  getOverlaySettings,
  setOverlaySettings,
  settingsToStyle
}
