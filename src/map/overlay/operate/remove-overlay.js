import BMap from 'BMap'
import { notify } from 'mussel'
import { getPolylineIncludeSpecials } from '../../calc/overlay'

function removeOverlay (overlay) {
  const {
    baiduMap,
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

  const idx = overlays.findIndex(item => item === overlay)
  if (idx > -1) {
    overlays.splice(idx, 1)
    if (overlay instanceof BMap.Overlay) {
      overlay.remove()
    }
    baiduMap.removeOverlay(overlay)
  }

  if (overlay.id) {
    removeOverlays.push(parseInt(overlay.id))
  }
  removeAnchorOverlays(overlay.options)
}

function removeSelectedOverlays (options) {
  const { baiduMap, overlays, selectedOverlays } = options
  for (const oly of selectedOverlays) {
    if (oly.isLocked || oly.disabled) continue

    const idx = overlays.findIndex(item => item === oly)
    if (idx > -1) {
      oly.remove()
      overlays.splice(idx, 1)
      baiduMap.removeOverlay(oly)
    }
  }
  selectedOverlays.splice(0)
}

function removeAnchorOverlays (options) {
  const { baiduMap, markerOverlays, markerPoints, markerPositions } = options
  markerOverlays.map(item => {
    baiduMap.removeOverlay(item)
  })
  markerOverlays.splice(0)
  markerPoints.splice(0)
  markerPositions.splice(0)
}

export {
  removeOverlay,
  removeSelectedOverlays,
  removeAnchorOverlays
}
