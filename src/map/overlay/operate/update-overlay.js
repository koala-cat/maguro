import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../../calc/overlay'

import { addOverlay } from './add-overlay'
import { setOverlaySettings, settingsToStyle } from '../setting'

function showOverlay (overlay, options) {
  const { key, value, overlays } = options
  const { type } = overlay

  let polylineVisible = true
  const data = []

  if (!['isDisplay', 'isCommandDisplay'].includes(key)) return

  if (type.includes('special')) {
    overlays.map(oly => {
      if (oly.parentId === overlay.parentId) {
        data.push(oly)
      }
    })
    polylineVisible = getSpecialAttachPolyline(overlay).isVisible()
  } else {
    data.push(overlay)
  }

  if (type === 'polyline') {
    data.push(...getPolylineIncludeSpecials(overlay))
  }

  data.map(oly => {
    if (value && polylineVisible) {
      oly.show()
    } else {
      oly.hide()
      oly.disableEditing()
    }
    updateOverlay(key, value, options)
  })
}

function updateOverlay (key, value, options) {
  const { updateOverlays, polylinePointIds } = options
  const overlay = options.overlay || options.activeOverlay
  const { id, name, projectGeoKey, invented } = overlay

  overlay[key] = value

  if (id < 0) return
  if (invented && !['width', 'points', 'isDisplay', 'isCommandDisplay'].includes(key)) return

  if (!updateOverlays[id]) updateOverlays[id] = {}

  if (key === 'points') {
    value = value.reduce((arr, item, index) => {
      const point = {
        longitude: item.lng,
        latitude: item.lat
      }
      if (polylinePointIds[id]) {
        point.id = polylinePointIds[id][index]
      }
      arr.push(point)
      return arr
    }, [])
  } else {
    overlay[key] = value
  }

  Object.assign(
    updateOverlays[id],
    {
      id,
      name,
      projectGeoKey,
      [key]: value
    }
  )
}

function updateMarker (key, value, options) {
  const { map, overlays, activeOverlay: overlay, settings } = options

  settings[key] = value
  updateOverlay(key, value, options)

  if (['name', 'isLocked', 'isDisplay', 'isCommandDisplay', 'projectStructureId'].includes(key)) {
    showOverlay(overlay, { key, value })
    return
  }

  if (key !== 'projectMapLegendId' && overlay.svg) {
    const style = settingsToStyle({ [key]: value })
    for (const s in style) {
      overlay.setStyle(s, style[s])
    }
    if (key === 'width') {
      overlay.setSize(value)
    }
    return
  }

  if (['projectMapLegendId', 'width'].includes(key)) {
    const index = overlays.findIndex(item => item.id === overlay.id)
    if (index > -1) {
      overlay.disableEditing()
      overlay.delete()

      const newOverlay = overlay.redraw(options)
      map.removeOverlay(overlay)
      setOverlaySettings(newOverlay, settings)
      addOverlay(newOverlay, options)
      overlays.splice(index, 1, newOverlay)
    }
  }
}

function updatePolyline (key, value, options) {
  const { activeOverlay: overlay, settings } = options

  settings[key] = value
  updateOverlay(key, value, options)

  if (['name', 'isLocked', 'isDisplay', 'isCommandDisplay', 'projectStructureId'].includes(key)) {
    showOverlay(overlay, { key, value })
    return
  }

  if (key !== 'points') {
    overlay[`set${key.replace(key[0], key[0].toUpperCase())}`](value)
  }
}

function updateCircle (key, value, options) {
  updatePolyline(key, value, options)
}

function updateRectangle (key, value, options) {
  updatePolyline(key, value, options)
}

function updatePolygon (key, value, options) {
  updatePolyline(key, value, options)
}

function updateLabel (key, value, options) {
  const { activeOverlay: overlay, settings } = options

  settings[key] = value
  updateOverlay(key, value, options)

  if (key === 'name') {
    overlay.setContent(value, { key, value })
    return
  }

  if (['isLocked', 'isDisplay', 'isCommandDisplay', 'projectStructureId'].includes(key)) {
    showOverlay(overlay, { key, value })
    return
  }

  const style = settingsToStyle(options, 'label')
  overlay.setStyle(style)
}

function updateSpecial (key, value, options) {
  updateOverlay(key, value, options)
}

function onLineupdate (overlay, options) {
  const { editable, lineupdate } = options

  const update = (e) => {
    if (!lineupdate) {
      let points = null
      try {
        points = [overlay.getCenter()]
        updateOverlay('width', overlay.getRadius(), options)
      } catch {
        points = overlay.getPath()
      }
      updateOverlay('points', points, options)
    }
  }
  if (editable) {
    overlay.addEventListener('lineupdate', update)
  } else {
    overlay.removeEventListener('lineupdate', update)
  }
}

export {
  updateOverlay,
  updateMarker,
  updatePolyline,
  updateCircle,
  updateRectangle,
  updatePolygon,
  updateLabel,
  updateSpecial,
  showOverlay,
  onLineupdate
}
