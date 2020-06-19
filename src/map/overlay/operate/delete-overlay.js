import { notify } from 'mussel'
import { getPolylineIncludeSpecials } from '../../calc/overlay'

function deleteOverlays (overlay, callback) {
  const {
    map,
    overlays,
    removeOverlays
  } = overlay.options
  const { type } = overlay

  if (!overlay || overlay.isLocked || overlay.disabled) return
  if (type === 'polyline') {
    const specials = getPolylineIncludeSpecials(overlay, overlays)
    if (specials.length > 0) {
      notify('info', '请先删除线上的特殊线（桥、隧道等）。')
      return
    }
  }

  const idx = overlays.findIndex(item => item.id === overlay.id)
  if (idx > -1) {
    overlays.splice(idx, 1)
    overlay.disableEditing()
    map.removeOverlay(overlay)
    if (overlay.id && !removeOverlays.includes(overlay.id)) {
      removeOverlays.push(parseInt(overlay.id))
    }
    deleteAnchorOverlays(overlay.options)
    if (callback) callback()
  }
  console.log(overlays)
}

function deleteSelectedOverlays (options, isRemove = true) {
  const { overlays, selectedOverlays } = options
  for (const oly of selectedOverlays) {
    if (oly.isLocked || oly.disabled) continue

    const idx = overlays.findIndex(item => item.id === oly.id)
    if (idx > -1) {
      oly.delete(isRemove)
    }
  }
  selectedOverlays.splice(0)
}

function deleteAnchorOverlays (options) {
  const { map, markerOverlays, markerPoints, markerPositions } = options
  markerOverlays.map(item => {
    map.removeOverlay(item)
  })
  markerOverlays.splice(0)
  markerPoints.splice(0)
  markerPositions.splice(0)
}

export {
  deleteOverlays,
  deleteSelectedOverlays,
  deleteAnchorOverlays
}
