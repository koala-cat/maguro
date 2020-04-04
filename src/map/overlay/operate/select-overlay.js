import Marker from '../overlay-marker'

import { getPolylineIncludeSpecials } from '../../calc/overlay'
import { defaultStyle } from '../setting'

function selectOverlay (e, overlay, options) {
  const {
    baiduMap,
    selectedOverlays,
    activeOverlay,
    activeLegend
  } = options
  const type = overlay.type
  const activeLegendType = activeLegend?.type || ''

  if ((!overlay.isLocked && selectedOverlays.includes(overlay)) ||
    activeOverlay === overlay) {
    return
  }

  if (activeLegendType && type === 'polyline' && e) {
    options.settings = {
      ...defaultStyle(),
      type: activeLegend?.value || '',
      iconUrl: activeLegend.iconUrl,
      projectMapLegendId: activeLegend.id
    }
    Object.assign(
      options,
      {
        settings: {
          ...defaultStyle(),
          type: activeLegend?.value || '',
          iconUrl: activeLegend.iconUrl,
          projectMapLegendId: activeLegend.id
        },
        isSymbol: true
      }
    )
    const marker = new Marker(baiduMap, e.point, options)
    baiduMap.addOverlay(marker)
  } else {
    multipleOverlays(e, overlay, options)
  }
}

function multipleOverlays (e, overlay, options) {
  const { overlays, selectedOverlays, specialOverlays, activeOverlay } = options
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
    if (getPolylineIncludeSpecials(overlay, overlays).length === 0) {
      overlay.enableEditing()
    }
    overlay.drag()
  }
}

export {
  selectOverlay
}
