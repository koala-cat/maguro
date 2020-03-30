import BMap from 'BMap'
import { notify } from 'mussel'
import { getPolylineIncludeSpecials } from './calc/overlay'

function removeOverlays (map, overlays, options) {
  const { selectedOverlays, removedOverlays } = options
  if (selectedOverlays.length === 0) return

  for (const oly of selectedOverlays) {
    if (oly.disabled) continue

    const type = oly.type
    if (type === 'polyline') {
      const specials = getPolylineIncludeSpecials(oly)
      if (specials.length > 0) {
        notify('info', '请先删除线上的特殊线（桥、隧道等）。')
        return
      }
    }
    if (oly.id) {
      removedOverlays.push(parseInt(oly.id))
    }
  }

  removeSelectedOverlays(map, overlays, options)
  removeMarkers(map, options)
}

function removeSelectedOverlays (map, overlays, options) {
  const { selectedOverlays } = options
  for (const oly of selectedOverlays) {
    if (oly.isLocked || oly.disabled) continue

    const idx = overlays.findIndex(item => item === oly)
    if (idx > -1) {
      overlays.splice(idx, 1)
      if (oly instanceof BMap.Overlay) {
        oly.remove()
      }
      map.removeOverlay(oly)
    }
  }
  selectedOverlays.splice(0)
}

function removeMarkers (map, options) {
  const { marker } = options

  marker.overlays.map(item => {
    map.removeOverlay(item)
  })
  marker.overlays.splice(0)
  marker.points.splice(0)
  marker.positions.splice(0)
}

export {
  removeOverlays,
  removeSelectedOverlays,
  removeMarkers
}
