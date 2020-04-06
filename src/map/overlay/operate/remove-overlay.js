import BMap from 'BMap'
import { notify } from 'mussel'
import { getPolylineIncludeSpecials } from '../../calc/overlay'

function removeOverlay (overlay) {
  const {
    baiduMap,
    overlays,
    removedOverlays,
    markerOverlays,
    markerPoints,
    markerPositions
  } = overlay.options
  const { type } = overlay

  if (!overlay || overlay.isLocked || overlay.disabled) return
  if (type === 'polyline') {
    const specials = getPolylineIncludeSpecials(overlay)
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
    removedOverlays.push(parseInt(overlay.id))
  }
  removeAnchorOverlays(baiduMap, markerOverlays, markerPoints, markerPositions)
}

function removeAnchorOverlays (baiduMap, markerOverlays, markerPoints, markerPositions) {
  markerOverlays.map(item => {
    baiduMap.removeOverlay(item)
  })
  markerOverlays.splice(0)
  markerPoints.splice(0)
  markerPositions.splice(0)
}

export {
  removeOverlay
}
