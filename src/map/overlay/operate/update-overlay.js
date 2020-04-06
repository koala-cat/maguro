import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../../calc/overlay'

import { settingsToStyle } from '../setting'

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
  const { updateOverlays, polylinePointIds, activeOverlay: overlay } = options
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
  const {
    baiduMap,
    overlays,
    activeOverlay: overlay,
    newOverlay,
    callback
  } = options

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

  const index = overlays.findIndex(item => item.id === overlay.id)

  if (index > -1) {
    overlay.disableEditing()
    overlay.remove()

    baiduMap.addOverlay(newOverlay)
    overlays.splice(index, 1, newOverlay)
  }
  updateOverlay(key, value, options)

  if (callback) callback(newOverlay)
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
  showOverlay,
  onLineupdate
}
