import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../calc/overlay'

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
    updateOverlay(oly, { key, value })
  })
}

function updateOverlay (overlay, options) {
  let { key, value, updateOverlays, polylinePointIds } = options
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

function onLineupdate (overlay, options) {
  const { editable, lineupdate } = options

  const update = (e) => {
    if (!lineupdate) {
      let points = null
      try {
        points = [overlay.getCenter()]
        updateOverlay(overlay, { key: 'width', value: overlay.getRadius() })
      } catch {
        points = overlay.getPath()
      }
      updateOverlay(overlay, { key: 'points', value: points })
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
  showOverlay,
  onLineupdate
}
