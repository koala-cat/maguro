import { getOverlaySettings } from '../setting'

function getSaveData (options) {
  const { updateOverlays, removeOverlays } = options
  const data = {
    creates: [],
    updates: [],
    removes: []
  }
  data.creates = getCreates(options)

  if (Object.keys(updateOverlays).length === 0 &&
    removeOverlays.length === 0 &&
    data.creates.length === 0) {
    return
  }

  data.removes = removeOverlays.reduce((arr, item) => {
    if (item > 0) arr.push(item)
    return arr
  }, [])

  for (const key in updateOverlays) {
    if (updateOverlays[key].fillOpacity) {
      updateOverlays[key].opacity = updateOverlays[key].fillOpacity
      delete updateOverlays[key].fillOpacity
    }
    data.updates.push(updateOverlays[key])
  }
  return data
}

function getCreates (options) {
  const { overlays, polylineCenters } = options
  const result = []
  const specialMap = {}

  for (let oly of overlays) {
    const points = getPoints(oly)
    oly.points = points.reduce((arr, item, index) => {
      const point = {
        longitude: item.lng,
        latitude: item.lat
      }
      if (polylineCenters[oly.id]) point.center = polylineCenters[oly.id][index]
      arr.push(point)
      return arr
    }, [])
    if (oly.id < 0) {
      if (oly.parentId !== -1) {
        if (!specialMap[oly.parentId]) {
          specialMap[oly.parentId] = {
            name: '特殊元件父节点',
            parentId: -1,
            projectMapLegendId: oly.projectMapLegendId
          }
          result.push(specialMap[oly.parentId])
        }
        if (oly.invented) {
          specialMap[oly.parentId].points = oly.points
          specialMap[oly.parentId].width = oly.width
          specialMap[oly.parentId].parentLineId = oly.parentLineId
          continue
        }
      }
      oly = getOverlaySettings(oly)
      oly.opacity = oly.fillOpacity
      result.push(oly)

      delete oly.orgId
      delete oly.orgName
      delete oly.fillOpacity
    }
  }
  return result
}

function getPoints (oly) {
  let points = []
  try {
    points = [oly.getCenter()]
    oly.width = oly.getRadius()
  } catch {
    try {
      points = oly.getPath()
    } catch {
      points = [oly.getPosition()]
    }
  }
  return points
}

export {
  getSaveData
}
