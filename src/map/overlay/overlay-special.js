import BMap from 'BMap'
import { notify } from 'mussel'

import { distanceToPointAndPixel } from '../calc/distance'
import { calcSpecialPoints } from '../calc/point'
import { calcMarkerOnLinePosition } from '../calc/position'
import { getSpecialAttachPolyline } from '../calc/overlay'

import { addAndSelectOverlay } from './operate/add-overlay'
import { deselectLegend } from './operate/deselect-overlay'
import { drawSymbol } from './operate/draw-overlay'
import { dragOverlay } from './operate/drag-overlay'
import { updateSpecial } from './operate/update-overlay'
import { deleteOverlays, deleteSelectedOverlays, deleteAnchorOverlays } from './operate/delete-overlay'

import { addEvents } from './event'
import { getLegend } from './legend'
import { defaultSettings, getOverlaySettings, setOverlaySettings } from './setting'

class CustomSpecial {
  constructor (point, polyline, options) {
    this.point = point
    this.polyline = polyline
    this.options = options
    console.log(this.options.settings)
  }

  draw () {
    const {
      map,
      activeLegend: legend,
      markerOverlays,
      markerPoints,
      markerPositions,
      settings
    } = this.options
    Object.assign(
      ...defaultSettings(legend.type),
      settings,
      {
        type: legend?.value || '',
        iconUrl: legend.iconUrl,
        projectMapLegendId: legend.id
      }
    )

    if (markerOverlays.length > 0) {
      const marker = markerOverlays[0]
      if (marker.parentLineId !== this.polyline.id) {
        deleteAnchorOverlays(this.options)
      }
    }

    const idx = calcMarkerOnLinePosition(this.point, this.polyline)

    if (idx > -1) {
      const icon = drawSymbol({ ...settings, fillOpacity: 1 })
      const marker = new BMap.Marker(this.point, {
        icon: icon
      })
      map.addOverlay(marker)
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
      map,
      legends,
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

    const { projectMapLegendId, width } = settings
    const type = getLegend(legends, projectMapLegendId)?.value || ''
    const { wPoint, wPixel } = distanceToPointAndPixel(map, width)
    let overlays = []

    Object.assign(
      settings,
      {
        wPoint,
        wPixel,
        parentId: settings.parentId > 0 ? settings.parentId : parentId,
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
    deleteAnchorOverlays(this.options)
    deleteSelectedOverlays(this.options)
    deselectLegend(this.options)
    addAndSelectOverlay(overlays, this.options)

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
    setOverlaySettings(polyline, settings)
    this.extend(events, polyline)
    return polyline
  }

  drawRectangle (points, settings, events) {
    const rectangle = new BMap.Polygon(points, settings)
    setOverlaySettings(rectangle, settings)
    this.extend(events, rectangle)
    return rectangle
  }

  extend (events, overlay) {
    overlay.options = this.options
    if (events) {
      addEvents(events, overlay)
      overlay.enableEditing = () => {
        this.enableEditing(overlay)
      }
      overlay.disableEditing = () => {
        this.disableEditing(overlay)
      }
      overlay.drag = () => {
        this.drag(overlay)
      }
    }
    overlay.delete = () => {
      this.delete(overlay)
    }
    overlay.update = (key, value) => {
      updateSpecial(key, value, this.options, overlay)
    }
  }

  enableEditing (overlay) {
    const {
      map,
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
      map.addOverlay(marker)

      const idx = calcMarkerOnLinePosition(points[i], polyline)
      markerPositions.push(idx)
    }
    markerOverlays.push(...markers)
  }

  disableEditing () {
    deleteAnchorOverlays(this.options)
  }

  drag (polyline) {
    dragOverlay(polyline, this.options, (value) => { // value -- polyline
      this.update('points', value, polyline)
    })
  }

  update (key, value, overlay) {
    const { selectedOverlays, selectedOverlays: specials, removeOverlays, settings } = this.options
    const polyline = value || specials[specials.length - 1]

    const width = key === 'width' && value < 10 ? 10 : overlay.width
    Object.assign(
      settings,
      {
        ...getOverlaySettings(specials[0]),
        width
      }
    )

    this.drawSpecial(polyline, (olys) => {
      specials.sort((a, b) => a.invented * 1 - b.invented * 1)
      if (key !== 'projectMapLegendId') {
        for (let i = 0; i < olys.length; i++) {
          olys[i].id = specials[i].id
          if (key === 'width') {
            updateSpecial(key, width, this.options)
            continue
          }
          if (key === 'points') {
            updateSpecial(key, olys[i].getPath(), overlay, this.options)
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

      selectedOverlays.push(...olys)
      this.options.activeOverlay = olys[0]
    })
  }

  delete (overlay) {
    deleteOverlays(overlay)
  }
}
export default CustomSpecial
