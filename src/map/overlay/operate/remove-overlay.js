import BMap from 'BMap'
import { notify } from 'mussel'
import { getPolylineIncludeSpecials } from '../../calc/overlay'

function removeOverlay (baiduMap, overlay, options) {
  const { overlays, removedOverlays, marker } = options
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
  removeAnchorOverlays(baiduMap, marker)
}

function removeAnchorOverlays (baiduMap, marker) {
  marker.overlays.map(item => {
    baiduMap.removeOverlay(item)
  })
  marker.overlays.splice(0)
  marker.points.splice(0)
  marker.positions.splice(0)
}

export {
  removeOverlay
}
