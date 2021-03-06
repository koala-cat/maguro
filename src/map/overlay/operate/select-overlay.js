import CustomSpecial from '../custom/overlay-special'

import { isOverlayInFrame } from '../../calc/geo.js'
import { getPolylineIncludeSpecials } from '../../calc/overlay'
import { defaultSettings } from '../setting'

import { deselectOverlays } from './deselect-overlay'

function selectOverlay (e, overlay, options) {
  const { currentOrg, selectedOverlays, specialOverlays, activeOverlay, activeLegend } = options
  const type = overlay.type
  const activeLegendType = activeLegend?.type || ''

  if ((!overlay.isLocked && selectedOverlays.includes(overlay)) ||
    activeOverlay === overlay) {
    return
  }
  if (activeLegendType === 'special' && type === 'polyline' && !overlay.disabled && e) {
    const settings = {
      ...defaultSettings(activeLegendType),
      orgId: currentOrg.id,
      orgName: currentOrg.shortName
    }
    const special = new CustomSpecial(e.point, overlay, settings, options)
    special.draw((overlays) => {
      const parentOverlay = overlays.find(oly => oly.invented)
      overlays.map(oly => {
        oly.parentId = parentOverlay.id
      })
      parentOverlay.enableEditing()
      parentOverlay.drag()
      options.activeOverlay = overlays[0]
      specialOverlays[parentOverlay.id] = overlays
      selectedOverlays.push(...overlays)
    })
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
  if (!modKey) {
    deselectOverlays(options)
  }

  if (type.includes('special')) {
    selectedOverlays.push(...specialOverlays[overlay.parentId])
  } else {
    selectedOverlays.push(overlay)
  }

  options.activeOverlay = modKey ? activeOverlay || selectedOverlays[0] : selectedOverlays[0]

  if (!overlay.disabled && overlay.isVisible()) {
    overlay.enableEditing()
    overlay.drag()
  }
}

function frameSelectOverlays (overlay, options) {
  const { map, overlays, selectedOverlays } = options

  for (const oly of overlays) {
    const parentIds = []
    const type = oly.type
    if (parentIds.includes(oly.parentId) || !oly.visible) continue
    const { result, parentId } = isOverlayInFrame(oly, overlay)
    if (result) {
      if (!type.includes('special')) {
        selectedOverlays.push(oly)
        if (getPolylineIncludeSpecials(oly, overlays).length === 0) {
          oly.enableEditing()
        }
      }
      oly.drag()
    }
    if (parentId) parentIds.push(parentId)
    map.removeOverlay(overlay)
  }
}

export {
  selectOverlay,
  frameSelectOverlays
}
