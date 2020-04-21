import { deselectOverlays } from './deselect-overlay'

function addOverlay (data, options) {
  let overlay = null
  const { map, overlays, selectedOverlays, polylineCenters } = options

  if (!Array.isArray(data)) {
    overlay = data
    data = [data]
  }

  deselectOverlays(options)

  for (const oly of data) {
    const type = oly.type

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
    selectedOverlays.push(oly)
  }
  overlay.enableEditing()
  overlay.drag()
  options.activeOverlay = selectedOverlays[0]
  return overlay
}

export {
  addOverlay
}
