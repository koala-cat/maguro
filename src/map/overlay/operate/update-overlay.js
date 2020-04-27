import BMap from 'BMap'

import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../../calc/overlay'

import { addAndSelectOverlay } from './add-overlay'
import { setOverlaySettings, settingsToStyle } from '../setting'

const ignoreFields = [
  'name',
  'isLocked',
  'isDisplay',
  'isCommandDisplay',
  'projectStructureId',
  'remark'
]
let lineUpdate = null

function showOverlay (key, value, options) {
  const { overlays, activeOverlay: overlay } = options
  const type = overlay.type

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
    data.push(...getPolylineIncludeSpecials(overlay, overlays))
  }

  data.map(oly => {
    if (value && polylineVisible) {
      oly.show()
    } else {
      oly.hide()
      oly.disableEditing()
    }
    updateOverlay(key, value, options, oly)
  })
}

function updateOverlay (key, value, options, overlay) {
  const { updateOverlays, polylinePointIds, activeOverlay } = options
  overlay = overlay || activeOverlay
  const { id, name, projectGeoKey, invented } = overlay

  overlay[key] = value
  lineUpdate = key

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
  lineUpdate = null

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

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, options)
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
      addAndSelectOverlay(newOverlay, options)
      overlays.splice(index, 1, newOverlay)
    }
  }
}

function updatePolyline (key, value, options) {
  const { activeOverlay: overlay, settings } = options

  settings[key] = value
  updateOverlay(key, value, options)

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, options)
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

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, options)
    return
  }

  const style = settingsToStyle({ [key]: value }, 'label')
  overlay.setStyle(style)
}

function updateSpecial (key, value, options) {
  updateOverlay(key, value, options)
}

function onLineupdate (e) {
  const overlay = e instanceof BMap.Overlay ? e : e.target

  if (!lineUpdate) {
    let points = null
    try {
      points = [overlay.getCenter()]
      updateOverlay('width', overlay.getRadius(), overlay.options)
    } catch {
      points = overlay.getPath()
    }
    updateOverlay('points', points, overlay.options)
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
