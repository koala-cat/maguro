import BMap from 'BMap'
import { getOverlayPoints } from './point'
import { getOverlaySettings } from '../setting'

function getCreateOverlays (overlays, polylineCenters) {
  const creates = []
  const specialMap = {}
  for (let oly of overlays) {
    const points = getOverlayPoints(oly)
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
            projectMapLegendId: oly.projectMapLegendId,
            nodes: []
          }
          creates.push(specialMap[oly.parentId])
        }
        if (oly.invented) {
          specialMap[oly.parentId].points = oly.points
          specialMap[oly.parentId].width = oly.width
          specialMap[oly.parentId].parentLineId = oly.parentLineId
          continue
        }
        oly = getOverlaySettings(oly)
        oly.opacity = oly.fillOpacity
        specialMap[oly.parentId].nodes.push(oly)
      } else {
        oly = getOverlaySettings(oly)
        oly.opacity = oly.fillOpacity
        creates.push(oly)
      }
      delete oly.id
      delete oly.orgId
      delete oly.orgName
      delete oly.fillOpacity
    }
  }
  return creates
}

function getUpdateOverlays (updateOverlays) {
  const updates = []
  for (const key in updateOverlays) {
    if (updateOverlays[key].fillOpacity) {
      updateOverlays[key].opacity = updateOverlays[key].fillOpacity
      delete updateOverlays[key].fillOpacity
    }
    updates.push(updateOverlays[key])
  }
  return updates
}

function getSpecialAttachPolyline (special, overlays) {
  if (special.parentLineId) {
    return overlays.find(item => item.id === special.parentLineId)
  }
  return null
}

function getPolylineIncludeSpecials (polyline, overlays) {
  const specials = []
  if (!(polyline instanceof BMap.Polyline)) return specials
  for (const oly of overlays) {
    const type = oly.type
    if (!type.includes('special')) {
      continue
    }
    if (oly.parentLineId === polyline.id) specials.push(oly)
  }
  return specials
}

export {
  getCreateOverlays,
  getUpdateOverlays,
  getSpecialAttachPolyline,
  getPolylineIncludeSpecials
}
