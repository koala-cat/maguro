import BMap from 'BMap'

function calcCenterPoint (pointA, pointB) {
  const lng = (pointA.lng + pointB.lng) / 2
  const lat = (pointA.lat + pointB.lat) / 2
  return new BMap.Point(lng, lat)
}

function calcCrossPoint (line1pointA, line1pointB, line2pointB, line2pointC) {
  // 二元一次方程，计算交叉点; 处理特殊点
  let lat = 0
  let lng = 0
  if (line1pointA.lat === line1pointB.lat) {
    lat = line1pointB.lat
    if (line2pointB.lat === line2pointC.lat) {
      lng = line2pointB.lng
    } else {
      lng = line2pointB.lng - (line2pointB.lng - line2pointC.lng) * (line2pointB.lat - lat) / (line2pointB.lat - line2pointC.lat)
    }
  } else if (line2pointB.lat === line2pointC.lat) {
    lat = line2pointB.lat
    lng = line1pointA.lng - (line1pointA.lng - line1pointB.lng) * (line1pointA.lat - lat) / (line1pointA.lat - line1pointB.lat)
  } else {
    const m = (line1pointA.lng - line1pointB.lng) / (line1pointA.lat - line1pointB.lat)
    const n = (line2pointB.lng - line2pointC.lng) / (line2pointB.lat - line2pointC.lat)

    if (m === n) {
      lat = line1pointB.lat
      lng = line1pointB.lng
    } else {
      lat = (line2pointB.lng - line1pointA.lng + m * line1pointA.lat - n * line2pointB.lat) / (m - n)
      lng = line1pointA.lng - m * (line1pointA.lat - lat)
    }
  }

  return { lat, lng }
}

function calcDeviationPoints (pointA, pointB, w, wTail) {
  const y = pointB.lat - pointA.lat
  const x = pointB.lng - pointA.lng
  const atanRad = Math.atan(y / x)

  const deviationLng = Math.sin(atanRad) * w
  const deviationLat = Math.cos(atanRad) * w // * Math.sign(tanRad || 1)
  // const deviationLat = Math.sin(Math.atan((pointB.lng - PointA.lng) / (pointB.lat - PointA.lat))) * w
  // console.log(x, y, pointA, pointB)
  // 起点
  const s1 = new BMap.Point(pointA.lng - deviationLng, pointA.lat + deviationLat)
  const s2 = new BMap.Point(pointA.lng + deviationLng, pointA.lat - deviationLat)

  // 终点
  const e1 = new BMap.Point(pointB.lng - deviationLng, pointB.lat + deviationLat)
  const e2 = new BMap.Point(pointB.lng + deviationLng, pointB.lat - deviationLat)

  let sL = s1
  let eL = e1
  let sR = s2
  let eR = e2
  if (x < 0) {
    sL = s2
    eL = e2
    sR = s1
    eR = e1
  }

  return { atanRad, sL, sR, eL, eR }
}

function calcSpecialPoints (points, wPoint, wTail) {
  const lineSL = []
  const lineSR = []
  const lineTail = []
  for (let i = 0; i < points.length - 1; i++) {
    const pointA = points[i]
    const pointB = points[i + 1]
    const { sL, sR, eL, eR } = calcDeviationPoints(pointA, pointB, wPoint, wTail)
    // 起点

    if (i === 0) {
      lineSL.push(sL)
      lineSR.push(sR)
      const { tailSL, tailSR } = calcTailPoints(pointA, pointB, sL, sR, eL, eR, wTail)
      lineTail.push(tailSL, tailSR)
    }

    if (i < points.length - 2) {
      const pointC = points[i + 2]
      const lineBC = calcDeviationPoints(pointB, pointC, wPoint, wTail)
      const lineL = calcCrossPoint(sL, eL, lineBC.sL, lineBC.eL)
      const lineR = calcCrossPoint(sR, eR, lineBC.sR, lineBC.eR)

      lineSL.push(new BMap.Point(lineL.lng, lineL.lat))
      lineSR.push(new BMap.Point(lineR.lng, lineR.lat))
    }

    // 终点
    if (i === points.length - 2) {
      lineSL.push(eL)
      lineSR.push(eR)
      const { tailEL, tailER } = calcTailPoints(pointA, pointB, sL, sR, eL, eR, wTail)
      lineTail.push(tailEL, tailER)
    }
  }
  return { lineSL, lineSR, lineTail }
}

function calcTailPoints (pointA, pointB, sL, sR, eL, eR, wTail) {
  const y = pointB.lat - pointA.lat
  const x = pointB.lng - pointA.lng
  const atanRad = Math.atan(y / x)
  let tailDeviationLng = Math.cos((45 - (atanRad * 180 / Math.PI)) * Math.PI / 180) * wTail
  let tailDeviationLat = Math.sin((45 - (atanRad * 180 / Math.PI)) * Math.PI / 180) * wTail
  let tailSL = new BMap.Point(sL.lng - tailDeviationLng, sL.lat + tailDeviationLat)
  let tailER = new BMap.Point(eR.lng + tailDeviationLng, eR.lat - tailDeviationLat)
  if (x < 0) {
    tailSL = new BMap.Point(sL.lng + tailDeviationLng, sL.lat - tailDeviationLat)
    tailER = new BMap.Point(eR.lng - tailDeviationLng, eR.lat + tailDeviationLat)
  }
  tailDeviationLng = Math.cos((45 + (atanRad * 180 / Math.PI)) * Math.PI / 180) * wTail
  tailDeviationLat = Math.sin((45 + (atanRad * 180 / Math.PI)) * Math.PI / 180) * wTail
  let tailEL = new BMap.Point(eL.lng + tailDeviationLng, eL.lat + tailDeviationLat)
  let tailSR = new BMap.Point(sR.lng - tailDeviationLng, sR.lat - tailDeviationLat)
  if (x < 0) {
    tailEL = new BMap.Point(eL.lng - tailDeviationLng, eL.lat - tailDeviationLat)
    tailSR = new BMap.Point(sR.lng + tailDeviationLng, sR.lat + tailDeviationLat)
  }
  return { tailSL, tailEL, tailSR, tailER }
}

function calcRectAllPoints (pointA, pointB, count) {
  const pointLT = new BMap.Point(pointA.lng, pointA.lat) // 左上角
  const pointRT = new BMap.Point(pointB.lng, pointA.lat) // 右上角
  const pointRB = new BMap.Point(pointB.lng, pointB.lat) // 右下角
  const pointLB = new BMap.Point(pointA.lng, pointB.lat) // 左上角

  const pointTC = new BMap.Point((pointA.lng + pointB.lng) / 2, pointA.lat)
  const pointRC = new BMap.Point(pointB.lng, (pointA.lat + pointB.lat) / 2)
  const pointBC = new BMap.Point((pointA.lng + pointB.lng) / 2, pointB.lat)
  const pointLC = new BMap.Point(pointA.lng, (pointA.lat + pointB.lat) / 2)

  if (count === 4) {
    return [pointLT, pointRT, pointRB, pointLB]
  } else {
    return [pointLT, pointTC, pointRT, pointRC, pointRB, pointBC, pointLB, pointLC]
  }
}

function calcOnePixelToPoint (map) {
  const pixelA = new BMap.Pixel(392, 118)
  const pixelB = new BMap.Pixel(pixelA.x + 1, pixelA.y + 1)
  const pointA = map.pixelToPoint(pixelA)
  const pointB = map.pixelToPoint(pixelB)
  return { lng: Math.abs(pointA.lng - pointB.lng), lat: Math.abs(pointA.lat - pointB.lat) }
}

export {
  calcCenterPoint,
  calcSpecialPoints,
  calcOnePixelToPoint,
  calcRectAllPoints
}
