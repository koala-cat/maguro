import CustomSpecial from '../overlay-special'

function selectOverlay (e, overlay, options) {
  const { selectedOverlays, activeOverlay, activeLegend } = options
  const type = overlay.type
  const activeLegendType = activeLegend?.type || ''

  if ((!overlay.isLocked && selectedOverlays.includes(overlay)) ||
    activeOverlay === overlay) {
    return
  }
  if (activeLegendType === 'special' && type === 'polyline' && e) {
    const special = new CustomSpecial(e.point, overlay, options)
    special.draw()
  } else {
    multipleOverlays(e, overlay, options)
  }
}

function multipleOverlays (e, overlay, options) {
  const { selectedOverlays, specialOverlays, activeOverlay } = options
  // removeMarkers(this._map, this._options)

  // const mac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
  const modKey = e?.ctrlKey || false
  const type = overlay.type

  if (!modKey) selectedOverlays.splice(0)

  if (type.includes('special')) {
    selectedOverlays.push(...specialOverlays[overlay.parentId])
  } else {
    selectedOverlays.push(overlay)
  }

  options.activeOverlay = modKey ? activeOverlay || selectedOverlays[0] : selectedOverlays[0]

  if (!overlay.disabled) {
    overlay.enableEditing()
    overlay.drag()
  }
}

export {
  selectOverlay
}
