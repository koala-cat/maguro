import BMap from 'BMap'
import { notify } from 'mussel'
import cloneDeep from 'lodash.clonedeep'

import { distanceToPointAndPixel } from '../../calc/distance'
import { calcSpecialPoints } from '../../calc/point'
import { calcMarkerOnLinePosition } from '../../calc/position'
import { getSpecialAttachPolyline } from '../../calc/overlay'

import { addOverlay } from '../operate/add-overlay'
import { deselectLegend } from '../operate/deselect-overlay'
import { drawSymbol } from '../operate/draw-overlay'
import { dragOverlay } from '../operate/drag-overlay'
import { updatePolyline, updateSpecial } from '../operate/update-overlay'
import { deleteOverlays, deleteSelectedOverlays, deleteAnchorOverlays } from '../operate/delete-overlay'

import { addEvents } from '../event'
import { getLegend } from '../legend'
import { getOverlaySettings, setOverlaySettings } from '../setting'

class CustomSpecial {
  constructor (point, polyline, settings, options) {
    this.point = point
    this.polyline = polyline
    this.settings = settings
    this.options = options
  }

  draw (callback) {
    const {
      map,
      activeLegend: legend,
      markerOverlays,
      markerPoints,
      markerPositions
    } = this.options
    Object.assign(
      this.settings,
      {
        type: legend.value,
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
      const icon = drawSymbol({ ...this.settings, fillOpacity: 1 })
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

    this.settings.width = 32
    this.options.parentId--
    return this.drawSpecial(this.polyline, callback)
  }

  drawSpecial (data, callback) {
    // data -- points or polylineOverlay
    let {
      map,
      legends,
      markerPoints,
      markerPositions,
      parentId
    } = this.options
    let newPoints = []
    parentId = this.settings.parentId !== -1 ? this.settings.parentId : parentId

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
    const { projectMapLegendId, width } = this.settings
    const legend = getLegend(legends, projectMapLegendId)
    const type = legend?.value || ''
    const { wPoint, wPixel } = distanceToPointAndPixel(map, width)
    let overlays = []
    Object.assign(
      this.settings,
      {
        wPoint,
        wPixel,
        parentId,
        parentLineId: this.polyline.id,
        iconUrl: legend?.iconUrl || ''
      }
    )
    if (type.includes('Line')) {
      this.settings.count = type.includes('DoubleLine') ? 2 : 3
      overlays = this.drawSpecialLine(newPoints)
    } else {
      this.settings.wTail = type.includes('AngularRect') ? wPoint : 0
      overlays = this.drawSpecialRect(newPoints)
    }
    deleteAnchorOverlays(this.options)
    // deleteSelectedOverlays(this.options)
    deselectLegend(this.options)
    addOverlay(overlays, this.options)

    if (callback) callback(overlays)
    return overlays
  }

  drawSpecialLine (points, wTail = 0) { // 双平行线、三平行线
    const { overlayEvents: events } = this.options
    const { count, wPoint, wPixel } = this.settings
    const { lineSL, lineSR } = calcSpecialPoints(points, wPoint, wTail)
    const overlays = []
    overlays.push(this.drawPolyline(lineSL, this.settings))
    overlays.push(this.drawPolyline(lineSR, this.settings))
    if (count === 3) {
      overlays.push(this.drawPolyline(points, { ...this.settings, strokeStyle: 'dashed' }))
    }
    overlays.push(this.drawPolyline(points, {
      ...this.settings,
      invented: true,
      strokeColor: 'rgba(0, 0, 0, 0)',
      strokeWeight: Math.ceil(wPixel) * 2
    }, events))
    return overlays
  }

  drawSpecialRect (points) {
    const { overlayEvents: events } = this.options
    const { wPoint, wPixel, wTail } = this.settings
    const { lineSL, lineSR, lineTail } = calcSpecialPoints(points, wPoint, wTail)
    const tailL1 = [lineTail[0], lineSL[0]]
    const tailL2 = [lineTail[1], lineSR[0]]
    const tailR1 = [lineTail[2], lineSL[lineSL.length - 1]]
    const tailR2 = [lineTail[3], lineSR[lineSR.length - 1]]
    const overlays = []

    Object.assign(this.settings, { fillOpacity: 0.00001 })

    lineSR.reverse()
    overlays.push(this.drawRectangle(lineSL.concat(lineSR), this.settings))

    if (wTail !== 0) {
      overlays.push(this.drawPolyline(tailL1, this.settings))
      overlays.push(this.drawPolyline(tailL2, this.settings))
      overlays.push(this.drawPolyline(tailR1, this.settings))
      overlays.push(this.drawPolyline(tailR2, this.settings))
    }
    overlays.push(this.drawPolyline(points, {
      ...this.settings,
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
    overlay.settings = this.settings
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
      overlay.update = (key, value, oly = overlay) => {
        this.update(key, value, oly)
      }
      this.overlay = overlay
    } else {
      overlay.update = (key, value) => {
        updatePolyline(key, value, overlay, this.options)
      }
    }
    overlay.delete = (isRemove) => {
      const { map, overlays } = this.options
      if (isRemove === false) {
        const idx = overlays.findIndex(item => item.id === overlay.id)
        if (idx > -1) {
          overlays.splice(idx, 1)
          overlay.disableEditing()
          map.removeOverlay(overlay)
          deleteAnchorOverlays(overlay.options)
        }
        return
      }
      this.delete(overlay)
    }
  }

  enableEditing (overlay) {
    if (this.disabled) return

    const {
      map,
      overlays,
      markerOverlays,
      markerPoints,
      markerPositions
    } = this.options
    const { sizeWidth = 10, sizeHeight = 10 } = this.settings

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
    if (key === 'points' && !overlay) {
      updatePolyline(key, value, this.overlay)
      return
    }
    // overlay
    const { selectedOverlays, specialOverlays, removeOverlays } = this.options
    const specials = cloneDeep(selectedOverlays)
    const polyline = key === 'points' ? value : selectedOverlays[selectedOverlays.length - 1].getPath()
    const width = key === 'width' ? parseFloat(value) < 10 ? 10 : parseFloat(value) : overlay.width
    Object.assign(
      this.settings,
      {
        ...getOverlaySettings(selectedOverlays[0]),
        [key]: value,
        width
      }
    )

    if (!['projectMapLegendId', 'points', 'width'].includes(key)) {
      selectedOverlays.map(oly => {
        updatePolyline(key, value, oly, this.options)
      })
      return
    }

    this.drawSpecial(polyline, (olys) => {
      const parentOverlay = olys[olys.length - 1]
      if (key !== 'projectMapLegendId') {
        specials.sort((a, b) => a.invented * 1 - b.invented * 1)
        for (let i = 0; i < olys.length; i++) {
          const oly = olys[i]
          oly.id = specials[i].id
          if (key === 'width') {
            updateSpecial(key, width, oly)
            continue
          }
          if (key === 'points') {
            updateSpecial(key, oly.getPath(), oly)
          }
        }
        deleteSelectedOverlays(this.options, false)
      } else {
        olys.sort((a, b) => b.invented * 1 - a.invented * 1)
        olys.map(o => {
          this.options.id--
          o.id = this.options.id
          o.parentId = parentOverlay.id
        })
        selectedOverlays.map(item => {
          const id = item.id
          if (item.id > 0 && !removeOverlays.includes(id)) {
            removeOverlays.push(id)
          }
        })
        deleteSelectedOverlays(this.options)
      }
      parentOverlay.enableEditing()
      parentOverlay.drag()

      olys.sort((a, b) => a.invented * 1 - b.invented * 1)
      specialOverlays[parentOverlay.parentId] = olys
      selectedOverlays.splice(0, selectedOverlays.length, ...olys)
      this.options.activeOverlay = olys[0]
    })
  }

  delete (overlay) {
    deleteOverlays(overlay)
  }
}
export default CustomSpecial
