import BMap from 'BMap'
import { notify } from 'mussel'

import { distanceToPointAndPixel } from '../calc/distance'
import { calcSpecialPoints } from '../calc/point'
import { calcMarkerOnLinePosition } from '../calc/position'
import { getSpecialAttachPolyline } from '../calc/overlay'

import { addOverlay } from './operate/add-overlay'
import { drawSymbol } from './operate/draw-overlay'
import { dragOverlay } from './operate/drag-overlay'
import { updateOverlay } from './operate/update-overlay'
import { removeSelectedOverlays, removeAnchorOverlays } from './operate/remove-overlay'

import { addEvents } from './event'
import { defaultStyle } from './setting'

class CustomSpecial {
  constructor (point, polyline, options) {
    this.point = point
    this.polyline = polyline
    this.options = options
  }

  draw () {
    const {
      baiduMap,
      activeLegend,
      markerOverlays,
      markerPoints,
      markerPositions,
      settings
    } = this.options
    Object.assign(
      this.options,
      {
        settings: {
          ...defaultStyle(),
          type: activeLegend?.value || '',
          iconUrl: activeLegend.iconUrl,
          projectMapLegendId: activeLegend.id
        },
        isSymbol: true
      }
    )

    if (markerOverlays.length > 0) {
      const marker = markerOverlays[0]
      if (marker.parentLineId !== this.polyline.id) {
        removeAnchorOverlays(this.options)
      }
    }

    const idx = calcMarkerOnLinePosition(this.point, this.polyline)

    if (idx > -1) {
      const icon = drawSymbol({ ...settings, fillOpacity: 1 })
      const marker = new BMap.Marker(this.point, { icon })
      baiduMap.addOverlay(marker)
      marker.parentLineId = this.polyline.id
      markerOverlays.push(marker)
      markerPoints.push(this.point)
      markerPositions.push(idx)
    } else {
      notify('info', '请放大地图，重新打点。')
    }

    if (markerPoints.length < 2) return

    this.options.settings.width = 32
    this.options.parentId--
    this.drawSpecial(this.polyline)
  }

  drawSpecial (data, callback) {
    // data -- points or polylineOverlay
    const {
      baiduMap,
      specialOverlays,
      markerPoints,
      markerPositions,
      parentId,
      settings
    } = this.options
    let newPoints = []

    if (data instanceof BMap.Polyline) {
      const points = data.getPath()
      if (markerPositions[0] > markerPositions[1]) {
        markerPoints.reverse()
        markerPositions.reverse()
      }
      const start = markerPositions[0] + 1
      const end = markerPositions[1] + 1
      newPoints = points.slice(start, end)
      newPoints.unshift(markerPoints[0])
      newPoints.push(markerPoints[1])
    } else {
      newPoints = data
    }

    const { type, width } = settings
    const { wPoint, wPixel } = distanceToPointAndPixel(baiduMap, width)
    let overlays = []

    Object.assign(
      settings,
      {
        wPoint,
        wPixel,
        parentId,
        parentLineId: this.polyline.id
      }
    )
    if (type.includes('Line')) {
      settings.count = type.includes('DoubleLine') ? 2 : 3
      overlays = this.drawSpecialLine(newPoints)
    } else {
      settings.wTail = type.includes('AngularRect') ? wPoint : 0
      overlays = this.drawSpecialRect(newPoints)
    }
    specialOverlays[parentId] = overlays
    addOverlay(overlays, this.options)
    removeAnchorOverlays(this.options)

    if (callback) callback(overlays)
    return overlays
  }

  drawSpecialLine (points, wTail = 0) { // 双平行线、三平行线
    const { events, settings } = this.options
    const { count, wPoint, wPixel } = settings
    const { lineSL, lineSR } = calcSpecialPoints(points, wPoint, wTail)
    const overlays = []
    overlays.push(this.drawPolyline(lineSL, settings))
    overlays.push(this.drawPolyline(lineSR, settings))
    if (count === 3) {
      overlays.push(this.drawPolyline(points, { ...settings, strokeStyle: 'dashed' }))
    }

    overlays.push(this.drawPolyline(points, {
      ...settings,
      invented: true,
      strokeColor: 'rgba(0, 0, 0, 0)',
      strokeWeight: Math.ceil(wPixel) * 2
    }, events))
    return overlays
  }

  drawSpecialRect (points) {
    const { events, settings } = this.options
    const { wPoint, wPixel, wTail } = settings
    const { lineSL, lineSR, lineTail } = calcSpecialPoints(points, wPoint, wTail)
    const tailL1 = [lineTail[0], lineSL[0]]
    const tailL2 = [lineTail[1], lineSR[0]]
    const tailR1 = [lineTail[2], lineSL[lineSL.length - 1]]
    const tailR2 = [lineTail[3], lineSR[lineSR.length - 1]]
    const overlays = []

    Object.assign(settings, { fillOpacity: 0.00001 })

    lineSR.reverse()
    overlays.push(this.drawRectangle(lineSL.concat(lineSR), settings))

    if (wTail !== 0) {
      overlays.push(this.drawPolyline(tailL1, settings))
      overlays.push(this.drawPolyline(tailL2, settings))
      overlays.push(this.drawPolyline(tailR1, settings))
      overlays.push(this.drawPolyline(tailR2, settings))
    }
    overlays.push(this.drawPolyline(points, {
      ...settings,
      invented: true,
      strokeColor: 'rgba(0, 0, 0, 0)',
      strokeWeight: Math.ceil(wPixel) * 2
    }, events))
    return overlays
  }

  drawPolyline (points, settings, events) {
    const polyline = new BMap.Polyline(points, settings)
    if (events) {
      polyline.enableEditing = () => {
        this.enableEditing(polyline)
      }
      polyline.disableEditing = () => {
        this.disableEditing(polyline)
      }
      polyline.drag = () => {
        this.drag(polyline)
      }
      addEvents(events, polyline)
    }
    return polyline
  }

  drawRectangle (points, seetings) {
    const rectangle = new BMap.Polygon(points, seetings)
    return rectangle
  }

  enableEditing (overlay) {
    const {
      baiduMap,
      overlays,
      markerOverlays,
      markerPoints,
      markerPositions,
      settings
    } = this.options
    const { sizeWidth = 10, sizeHeight = 10 } = settings

    let points = null
    const markers = []
    const path = overlay.getPath()
    const moveIcon = new BMap.Icon('assets/images/bullet.jpg', new BMap.Size(sizeWidth, sizeHeight), {
      imageSize: new BMap.Size(sizeWidth, sizeHeight)
    })
    const shadow = new BMap.Icon('assets/images/shadow.png', new BMap.Size(sizeWidth * 2, sizeHeight * 2))

    const polyline = getSpecialAttachPolyline(overlay, overlays)
    if (!polyline) {
      notify('info', '未找到相交的路线。')
      return
    }
    points = [path[0], path[path.length - 1]]
    markerPoints.splice(0, markerPoints.length, ...points)
    for (let i = 0; i < points.length; i++) {
      const mPoint = points[i]
      const marker = new BMap.Marker(mPoint)
      marker.point = mPoint
      marker.parentId = overlay.id
      marker.enableDragging()
      marker.setIcon(moveIcon)
      marker.setShadow(shadow)
      markers.push(marker)
      baiduMap.addOverlay(marker)

      const idx = calcMarkerOnLinePosition(points[i], polyline)
      markerPositions.push(idx)
    }
    markerOverlays.push(...markers)
  }

  disableEditing () {
    removeAnchorOverlays(this.options)
  }

  drag (polyline) {
    dragOverlay(polyline, this.options, (value) => { // value -- polyline
      this.update('points', value, polyline)
    })
  }

  update (key, value, overlay) {
    const { selectedOverlays, selectedOverlays: specials, removeOverlays } = this.options
    const polyline = value || specials[specials.length - 1]

    const width = key === 'width' && value < 10 ? 10 : overlay.width
    this.options.settings.width = width

    this.drawSpecial(polyline, (olys) => {
      specials.sort((a, b) => a.invented * 1 - b.invented * 1)
      if (key !== 'projectMapLegendId') {
        for (let i = 0; i < olys.length; i++) {
          olys[i].id = specials[i].id
          if (key === 'width') {
            updateOverlay(key, width, this.options)
            continue
          }
          if (key === 'points') {
            updateOverlay(key, olys[i].getPath(), this.options)
          }
        }
      } else {
        const ids = specials.reduce((arr, item) => {
          if (item.id > 0) {
            arr.push(item.id)
          }
          return arr
        }, [])
        removeOverlays.push(...ids)
      }

      removeSelectedOverlays(this.options)
      selectedOverlays.push(...olys)
      this.options.activeOverlay = olys[0]
    })
  }

  remove () {
    return false
  }
}
export default CustomSpecial