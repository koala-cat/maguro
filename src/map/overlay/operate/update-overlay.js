import BMap from 'BMap'

import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../../calc/overlay'
import { isPointInRect } from '../../calc/geo'

import { addAndSelectOverlay } from './add-overlay'
import { setOverlaySettings, settingsToStyle } from '../setting'

const ignoreFields = [
  'name',
  'isLocked',
  'isDisplay',
  'isCommandDisplay',
  'projectStructureId',
  'projectMapTagId',
  'remark'
]
let lineUpdate = null

function showOverlay (key, value, overlay) {
  const { overlays } = overlay.options
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
    polylineVisible = getSpecialAttachPolyline(overlay, overlays).isVisible()
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
    updateOverlay(key, value, oly)
  })
}

function updateOverlay (key, value, overlay) {
  const { structures, updateOverlays, polylinePointIds } = overlay.options
  const { id, name, projectGeoKey } = overlay
  lineUpdate = key
  overlay[key] = value
  if (key === 'projectStructureId') {
    const structureId = overlay.projectStructureId
    const structure = structures.find(item => item.id === structureId)
    overlay.structureName = structure?.name || '未关联'
  }

  if (id < 0) return

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

function updateMarker (key, value, overlay) {
  const { settings, options } = overlay
  const { map, overlays } = options
  let newOverlay = overlay
  settings[key] = value

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay)
  } else if (key !== 'projectMapLegendId' && overlay.svg) {
    const style = settingsToStyle({ [key]: value })
    for (const s in style) {
      overlay.setStyle(s, style[s])
    }
    if (key === 'width') {
      overlay.setSize(value)
    }
  } else if (['projectMapLegendId', 'width'].includes(key)) {
    const index = overlays.findIndex(item => item.id === overlay.id)
    if (index > -1) {
      overlay.disableEditing()

      newOverlay = overlay.redraw(settings)
      map.removeOverlay(overlay)
      setOverlaySettings(newOverlay, settings)
      addAndSelectOverlay(newOverlay, options)
      const newIndex = overlays.findIndex(item => item === newOverlay)
      if (newIndex > -1) overlays.splice(newIndex, 1)
      overlays.splice(index, 1, newOverlay)
    }
  }
  updateOverlay(key, value, newOverlay)
}

function updatePolyline (key, value, overlay) {
  const { settings } = overlay
  settings[key] = value
  if (overlay.invented && !['width', 'points', 'isDisplay', 'isCommandDisplay'].includes(key)) return
  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay)
  } else if (key !== 'points') {
    overlay[`set${key.replace(key[0], key[0].toUpperCase())}`](value)
  }

  updateOverlay(key, value, overlay)
}

function updateCircle (key, value, overlay) {
  updatePolyline(key, value, overlay)
}

function updateRectangle (key, value, overlay) {
  updatePolyline(key, value, overlay)
}

function updatePolygon (key, value, overlay) {
  updatePolyline(key, value, overlay)
}

function updateLabel (key, value, overlay) {
  const { settings } = overlay
  settings[key] = value

  if (key === 'name') {
    overlay.setContent(value, { key, value })
  }

  if (ignoreFields.includes(key)) {
    showOverlay(key, value, overlay)
  }
  updateOverlay(key, value, overlay)

  const style = settingsToStyle({ [key]: value }, 'label')
  overlay.setStyle(style)
}

function updateSpecial (key, value, overlay) {
  updateOverlay(key, value, overlay)
}

function updateHotspot (key, value, overlay) {
  updateOverlay(key, value, overlay)
}

function onLineupdate (e, options) {
  const { areaRestriction } = options
  const overlay = e instanceof BMap.Overlay ? e : e.target
  if (!lineUpdate) {
    let points = null
    let saveable = true
    try {
      points = [overlay.getCenter()]
      updateOverlay('width', overlay.getRadius(), overlay)
    } catch {
      points = overlay.getPath()
    }
    for (const p of points) {
      if (areaRestriction && !isPointInRect(p, areaRestriction)) {
        saveable = false
        break
      }
    }
    if (saveable) {
      updateOverlay('points', points, overlay)
    }
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
