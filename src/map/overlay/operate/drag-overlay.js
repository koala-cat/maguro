import BMap from 'BMap'
import cloneDeep from 'lodash.clonedeep'
import { notify } from 'mussel'

import { calcRectAllPoints } from '../../calc/point'
import { calcMarkerOnLinePosition } from '../../calc/position'
import { getPolylineIncludeSpecials, getSpecialAttachPolyline } from '../../calc/overlay'

let startPoint = null
let startPixel = null

function dragOverlay (overlay, options, callback) {
  if (overlay.type.includes('rectangle')) {
    dragRectAnchorOverlay(overlay, options)
  }

  if (overlay.type.includes('special')) {
    dragSpecialAnchorOverlay(overlay, options, callback)
    return
  }
  if (overlay.bindEvent) return

  const start = (e) => {
    dragStart(e, options)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
  }

  const move = (e) => {
    dragMove(e, options)
  }

  const end = (e) => {
    dragEnd(e, options)
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', end)
  }

  overlay.bindEvent = true
  overlay.addEventListener('mousedown', start)
}

function dragStart (e, options) {
  const { map } = options
  try {
    e.domEvent.stopPropagation()
  } catch {
    e.stopPropagation()
  }
  startPixel = { x: e.clientX, y: e.clientY }
  startPoint = map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
}

function dragMove (e, options) {
  e.stopPropagation()
  const { map, overlays, selectedOverlays } = options
  const movePixel = { x: e.clientX, y: e.clientY }
  const movePoint = map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))

  const dx = movePixel.x - startPixel.x
  const dy = movePixel.y - startPixel.y
  const dlng = movePoint.lng - startPoint.lng
  const dlat = movePoint.lat - startPoint.lat

  if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
  for (let i = 0; i < selectedOverlays.length; i++) {
    const oly = selectedOverlays[i]
    const type = oly.type

    if (type.includes('special') || oly.disabled || oly.isLocked) {
      continue
    }

    if (['marker', 'label'].includes(type)) {
      const point = oly.getPosition()
      const mPoint = getPoint(point, dlng, dlat)

      oly.setPosition(mPoint)
    } else if (['circle'].includes(type)) {
      const point = oly.getCenter()
      const mPoint = getPoint(point, dlng, dlat)

      oly.setCenter(new BMap.Point(mPoint.lng, mPoint.lat))
    } else {
      setPath(oly, dlng, dlat)
      const specialOlys = getPolylineIncludeSpecials(oly, overlays)
      specialOlys.map(item => setPath(item, dlng, dlat))
    }

    oly.disableEditing()
  }
  startPixel = movePixel
  startPoint = movePoint
}

function dragEnd (e, options) {
  e.stopPropagation()

  const { overlays, selectedOverlays } = options

  selectedOverlays.map(oly => {
    const specials = getPolylineIncludeSpecials(oly, overlays)
    const type = oly.type
    let points = null
    try {
      points = [oly.getCenter()]
    } catch {
      try {
        points = oly.getPath()
      } catch {
        points = [oly.getPosition()]
      }
    }

    if (!type.includes('special') && specials.length === 0) {
      oly.enableEditing()
      if (type === 'rectangle') {
        dragRectAnchorOverlay(oly, options)
      }
    }
    oly.update('points', points)
    specials.map(item => {
      item.update('points', item.getPath())
    })
  })
}

function dragRectAnchorOverlay (overlay, options) {
  let endPoint = null
  const count = 6

  const mPoints = overlay.getPath()
  let points = calcRectAllPoints(mPoints[0], mPoints[2], count)
  let pointsTmp = cloneDeep(points)

  const { markerOverlays } = options
  const markers = markerOverlays.filter(item => item.parentId === overlay.id)
  markers.map(marker => {
    marker.addEventListener('mousedown', (e) => {
      endPoint = e.target.point
    })
    marker.addEventListener('dragging', (e) => {
      const point = e.point
      for (let j = 0; j < pointsTmp.length; j++) {
        if (endPoint.lng === pointsTmp[j].lng) {
          points[j].lng = point.lng
        }

        if (endPoint.lat === pointsTmp[j].lat) {
          points[j].lat = point.lat
        }
      }
      points = calcRectAllPoints(points[0], points[4], count)
      for (let j = 0; j < markers.length; j++) {
        markers[j].setPosition(points[j])
      }

      const rectPoints = [points[0], points[2], points[4], points[6]]
      overlay.setPath(rectPoints)
    })
    marker.addEventListener('dragend', (e) => {
      pointsTmp = cloneDeep(points)
    })
  })
}

function dragSpecialAnchorOverlay (overlay, options, callback) {
  let endPoint = null
  let movePointIdx = null
  const { map, overlays, markerOverlays, markerPoints, markerPositions } = options
  const polyline = getSpecialAttachPolyline(overlay, overlays)
  const markers = markerOverlays.filter(item => item.parentId === overlay.id)

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]
    marker.addEventListener('mousedown', (e) => {
      endPoint = e.point
      const distanceA = map.getDistance(endPoint, markerPoints[0])
      const distanceB = map.getDistance(endPoint, markerPoints[1])
      movePointIdx = distanceA < distanceB ? 0 : 1
    })
    marker.addEventListener('dragend', (e) => {
      const dragIdx = calcMarkerOnLinePosition(e.point, polyline, true)
      if (dragIdx > -1) {
        markerPoints.splice(movePointIdx, 1, e.point)
        markerPositions.splice(movePointIdx, 1, dragIdx)
        if (callback) callback(polyline)
      } else {
        marker.setPosition(markerPoints[movePointIdx])
        notify('info', '拖动后点的不在线上，请放大地图重新拖动。')
      }
    })
  }
}

function getPoint (point, dlng, dlat) {
  const mPoint = new BMap.Point(point.lng + dlng, point.lat + dlat)
  return mPoint
}

function setPath (oly, dlng, dlat) {
  const points = oly.getPath()
  const newPoints = []
  points.map(point => {
    const mPoint = getPoint(point, dlng, dlat)
    newPoints.push(new BMap.Point(mPoint.lng, mPoint.lat))
  })
  oly.setPath(newPoints)
}

export {
  dragOverlay,
  dragSpecialAnchorOverlay
}
