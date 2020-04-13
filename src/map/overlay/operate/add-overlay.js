import { setOverlaySettings } from '../setting'

function addOverlay (data, options) {
  let overlay = null
  const { map, overlays, polylineCenters, settings } = options

  if (!Array.isArray(data)) {
    overlay = data
    data = [data]
  }
  for (const oly of data) {
    const type = oly.type
    setOverlaySettings(oly, settings)
    if (!oly.id) {
      options.id--
      oly.id = options.id
    }
    if (oly.centers && polylineCenters) {
      polylineCenters[oly.id] = []
      polylineCenters[oly.id].push(...oly.centers)
    }
    if (type === 'polyline') oly.parentLineId = oly.id
    if (oly.invented) overlay = oly
    map.addOverlay(oly)
    overlays.push(oly)
  }
  overlay.enableEditing()
  options.activeOverlay = overlay
  return overlay
}

export {
  addOverlay
}
