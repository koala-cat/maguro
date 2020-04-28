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

function showOverlay (key, value, overlay, options) {
  const { overlays } = options
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

  console.log(data)

  data.map(oly => {
    if (value && polylineVisible) {
      oly.show()
    } else {
      oly.hide()
      oly.disableEditing()
    }
    updateOverlay(key, value, oly, options)
  })
}

function updateOverlay (key, value, overlay, options) {
  const { updateOverlays, polylinePointIds } = options
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

function updateMarker (key, value, overlay, options) {
  const { map, overlays, settings } = options
  settings[key] = value

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay, options)
  }

  if (key !== 'projectMapLegendId' && overlay.svg) {
    const style = settingsToStyle({ [key]: value })
    for (const s in style) {
      overlay.setStyle(s, style[s])
    }
    if (key === 'width') {
      overlay.setSize(value)
    }
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
  updateOverlay(key, value, overlay, options)
}

function updatePolyline (key, value, overlay, options) {
  const { settings } = options
  settings[key] = value

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay, options)
  }

  if (key !== 'points') {
    overlay[`set${key.replace(key[0], key[0].toUpperCase())}`](value)
  }

  updateOverlay(key, value, overlay, options)
}

function updateCircle (key, value, overlay, options) {
  updatePolyline(key, value, overlay, options)
}

function updateRectangle (key, value, overlay, options) {
  updatePolyline(key, value, overlay, options)
}

function updatePolygon (key, value, overlay, options) {
  updatePolyline(key, value, overlay, options)
}

function updateLabel (key, value, overlay, options) {
  const { settings } = options
  settings[key] = value

  if (key === 'name') {
    overlay.setContent(value, { key, value })
  }

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay, options)
  }
  updateOverlay(key, value, options)

  const style = settingsToStyle({ [key]: value }, 'label')
  overlay.setStyle(style)
}

function updateSpecial (key, value, overlay, options) {
  updateOverlay(key, value, overlay, options)
}

function updateHotspot (key, value, overlay, options) {
  console.log(options)
  updateOverlay(key, value, overlay, options)
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
  updateHotspot,
  onLineupdate
}
