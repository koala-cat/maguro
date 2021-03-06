function defaultSettings (type) {
  let strokeWeight = 2
  if (['polyline', 'special'].includes(type)) {
    strokeWeight = 5
  }
  return {
    orgId: null,
    orgName: '',
    id: null,
    name: '元件名称',
    type: null,
    width: 0,
    height: null,
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
    strokeWeight,
    offsetX: 0,
    offsetY: 0,
    label: null,
    level: 1,
    invented: false,
    isLocked: false,
    isDisplay: true,
    isCommandDisplay: true,
    hotspotMark: '',
    remark: '',
    structureName: '未关联',
    isCommand: null,
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
    if (key === 'strokeWeight' && !oly[key]) {
      map[key] = 5
    } else if (settings.includes(key) || key === 'opacity') {
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
      case 'width':
        if (type === 'label') {
          style.fontSize = `${value}px`
        } else {
          style.width = `${value}px`
          style.height = `${value}px`
        }
        break
      default:
        break
    }
  }
  return style
}

export {
  defaultSettings,
  getOverlaySettings,
  setOverlaySettings,
  settingsToStyle
}
