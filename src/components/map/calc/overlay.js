import BMap from 'BMap'

function getSpecialAttachPolyline (special, overlays) {
  if (special.parentLineId) {
    return overlays.find(item => item.id === special.parentLineId)
  }
  return null
}

function getPolylineIncludeSpecials (polyline, overlays) {
  const specials = []
  if (polyline instanceof BMap.Polyline) return specials
  for (const oly of overlays) {
    const type = oly.type
    if (type !== 'special') {
      continue
    }
    if (oly.parentLineId === polyline.id) specials.push(oly)
  }
  return specials
}

export {
  getSpecialAttachPolyline,
  getPolylineIncludeSpecials
}
