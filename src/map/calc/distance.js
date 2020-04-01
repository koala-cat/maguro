import BMap from 'BMap'

function distanceToPointAndPixel (map, realDistance) {
  realDistance = realDistance + 2
  const pointA = new BMap.Point(115, 38.752)
  const pointB = new BMap.Point(pointA.lng, pointA.lat + 0.001)
  const distance = map.getDistance(pointA, pointB)
  const pointD = calcPointDistance(pointA, pointB)
  const pixelD = calcPixelDistance(map, pointA, pointB)
  return {
    wPoint: realDistance / (distance / pointD),
    wPixel: realDistance / (distance / pixelD)
  }
}

function calcPointDistance (pointA, pointB) {
  const pointDx = Math.abs(pointA.lng - pointB.lng)
  const pointDy = Math.abs(pointA.lat - pointB.lat)
  return Math.sqrt(Math.pow(pointDx, 2) + Math.pow(pointDy, 2))
}

function calcPixelDistance (map, pointA, pointB) {
  const pixelA = map.pointToPixel(pointA)
  const pixelB = map.pointToPixel(pointB)
  const pixelDx = Math.abs(pixelA.x - pixelB.x)
  const pixelDy = Math.abs(pixelA.y - pixelB.y)
  return Math.sqrt(Math.pow(pixelDx, 2) + Math.pow(pixelDy, 2))
}

export {
  distanceToPointAndPixel,
  calcPointDistance,
  calcPixelDistance
}
