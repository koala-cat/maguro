import BMap from 'BMap'
import cloneDeep from 'lodash.clonedeep'
import { notify } from 'mussel'

import { calcRectAllPoints } from './calc/point'
import { calcMarkerOnLinePosition } from './calc/position'
import { getSpecialAttachPolyline } from './calc/overlay'

class SetEditing {
  constructor (map, overlays, selectedOverlays, marker) {
    this._map = map
    this._overlays = overlays
    this._selectedOverlays = selectedOverlays
    this._marker = marker
  }

  enableEditing (overlay, editable, style = {}) {
    const type = overlay.type
    if (!type) return
    if (type === 'marker') {
      overlay = this.marker(overlay, editable)
    } else if (type === 'label') {
      overlay = this.label(overlay, editable, style)
    } else if (type === 'rectangle') {
      overlay = this.rectangle(overlay, editable, style)
    } else if (type.includes('special')) {
      overlay = this.special(overlay, editable)
    } else {
      if (editable) overlay.enableEditing()
      else overlay.disableEditing()
    }
    // lineupdate(editable, overlay)
    return overlay
  }

  marker (overlay, editable) {
    const custom = overlay.toString().includes('Overlay')
    if (editable) {
      const space = 4
      if (custom) {
        overlay.setBorder('#5E87DB')
      } else {
        const markerIcon = overlay.getIcon()
        const anchor = markerIcon.anchor
        const imageOffset = markerIcon.imageOffset
        const size = markerIcon.size
        const iconSize = new BMap.Size(size.width + space, size.height + space)
        const shadow = new BMap.Icon('assets/bullet.png', iconSize, {
          imageOffset: new BMap.Size(imageOffset.width, imageOffset.height),
          anchor: new BMap.Size(anchor.width + space / 2, anchor.height + space / 2),
          imageSize: iconSize
        })
        overlay.setShadow(shadow)
      }
    } else {
      if (custom) {
        overlay.setBorder('transparent')
      } else {
        const icon = overlay.getIcon()
        overlay.setShadow(icon)
      }
    }
  }

  rectangle (overlay, editable, style, options = {}) {
    const mPoints = overlay.getPath()
    const points = calcRectAllPoints(mPoints[0], mPoints[2], 6)

    if (editable) {
      const markers = this.getMarkers(points, options, 6, (path) => {
        overlay.setPath(path)
      })
      overlay.markers = markers
    } else {
      overlay.markers.map(marker => {
        this._map.removeOverlay(marker)
      })
      delete overlay.markers
    }
    return overlay
  }

  label (overlay, editable, style) {
    const borderColor = editable ? '#5E87DB' : 'rgba(0, 0, 0, 0)'
    overlay.setStyle({ borderColor })
    return overlay
  }

  special (overlay, editable, options = {}, callback) {
    if (!editable) {
      this.clearMarkers()
      return
    }
    const path = overlay.getPath()
    let points = null
    const sizeWidth = options.width || 10
    const sizeHeight = options.height || 10
    const markers = []
    let endPoint = null
    let movePointIdx = null
    const moveIcon = new BMap.Icon('assets/bullet.jpg', new BMap.Size(sizeWidth, sizeHeight), {
      imageSize: new BMap.Size(sizeWidth, sizeHeight)
    })
    const shadow = new BMap.Icon('assets/shadow.png', new BMap.Size(sizeWidth * 2, sizeHeight * 2))

    const polyline = getSpecialAttachPolyline(overlay, this._overlays)
    if (!polyline) {
      notify('未找到相交的路线。')
      return
    }
    points = [path[0], path[path.length - 1]]
    this._marker.points.splice(0, this._marker.points.length, ...points)
    for (let i = 0; i < points.length; i++) {
      const mPoint = points[i]
      const marker = new BMap.Marker(mPoint)
      marker.point = mPoint
      marker.enableDragging()
      marker.setIcon(moveIcon)
      marker.setShadow(shadow)
      markers.push(marker)
      this._map.addOverlay(marker)

      const idx = calcMarkerOnLinePosition(points[i], polyline)
      this._marker.positions.push(idx)
      marker.addEventListener('mousedown', (e) => {
        endPoint = e.point
        const distanceA = this._map.getDistance(endPoint, this._marker.points[0])
        const distanceB = this._map.getDistance(endPoint, this._marker.points[1])
        movePointIdx = distanceA < distanceB ? 0 : 1
      })
      marker.addEventListener('dragend', (e) => {
        const dragIdx = calcMarkerOnLinePosition(e.point, polyline, true)
        if (dragIdx > -1) {
          this._marker.points.splice(movePointIdx, 1, e.point)
          this._marker.positions.splice(movePointIdx, 1, dragIdx)
          // setSpecialSettings(overlay, polyline.getPath(), 'points', false)
          if (callback) callback(overlay, polyline, 'points')
        } else {
          marker.setPosition(this._marker.points[movePointIdx])
          notify('info', '拖动后点的不在线上，请放大地图重新拖动。')
        }
      })
    }
    this._marker.overlays.push(...markers)
  }

  getMarkers (points, options, count, callback) {
    const sizeWidth = options.width || 10
    const sizeHeight = options.height || 10
    const markers = []
    let endPoint = null
    let pointsTmp = cloneDeep(points)
    const moveIcon = new BMap.Icon('assets/bullet.jpg', new BMap.Size(sizeWidth, sizeHeight), {
      imageSize: new BMap.Size(sizeWidth, sizeHeight)
    })
    const shadow = new BMap.Icon('assets/shadow.png', new BMap.Size(sizeWidth * 2, sizeHeight * 2))

    for (let i = 0; i < points.length; i++) {
      const marker = new BMap.Marker(points[i])
      marker.point = points[i]
      marker.enableDragging()
      marker.setIcon(moveIcon)
      marker.setShadow(shadow)
      markers.push(marker)
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
        if (callback) callback(rectPoints)
      })
      marker.addEventListener('dragend', (e) => {
        pointsTmp = cloneDeep(points)
      })
    }
    this._marker.overlays.push(...markers)
  }

  clearMarkers () {
    this._marker.overlays.map(marker => {
      this._map.removeOverlay(marker)
    })
    this._marker.overlays.splice(0)
  }
}

export default SetEditing
