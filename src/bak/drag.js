import BMap from 'BMap'
import cloneDeep from 'lodash.clonedeep'
import { notify } from 'mussel'

import { calcRectAllPoints } from '../components/map/calc/point'
import { calcMarkerOnLinePosition } from '../components/map/calc/position'
import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from '../components/map/calc/overlay'

import Update from './update'

class Drag {
  constructor (
    map,
    events,
    overlays,
    options
  ) {
    this._map = map
    this._overlays = overlays
    this._options = options

    this._update = new Update(
      map,
      events,
      overlays,
      options
    )
  }

  init (overlay, _editing) {
    this._editing = _editing

    this._startPoint = null
    this._startPixel = null

    if (overlay.type.includes('special')) {
      this._options.marker.overlays.map(marker => {
        if (marker.parentId === overlay.id) {
          const polyline = getSpecialAttachPolyline(overlay, this._overlays)
          this.specialMarker(marker, overlay, polyline)
        }
      })
    } else {
      if (overlay.type.includes('rectangle')) {
        this.rectMarker(overlay, 6)
      }
      if (overlay.bindEvent) return
      overlay.bindEvent = true
      overlay.addEventListener('mousedown', this.start.bind(this))
    }
  }

  start (e) {
    try {
      e.domEvent.stopPropagation()
    } catch {
      e.stopPropagation()
    }
    this._startPixel = { x: e.clientX, y: e.clientY }
    this._startPoint = this._map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
    this.moveHandler = this.move.bind(this)
    this.endHandler = this.end.bind(this)
    window.addEventListener('mousemove', this.moveHandler)
    window.addEventListener('mouseup', this.endHandler)
  }

  move (e) {
    e.stopPropagation()
    const movePixel = { x: e.clientX, y: e.clientY }
    const movePoint = this._map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
    const dx = movePixel.x - this._startPixel.x
    const dy = movePixel.y - this._startPixel.y
    const dlng = movePoint.lng - this._startPoint.lng
    const dlat = movePoint.lat - this._startPoint.lat

    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    for (let i = 0; i < this._options.selectedOverlays.length; i++) {
      const oly = this._options.selectedOverlays[i]
      const type = oly.type

      if (type.includes('special') || oly.disabled || oly.isLocked) {
        continue
      }

      if (['marker', 'label'].includes(type)) {
        const point = oly.getPosition()
        const mPoint = this.getPoint(point, dlng, dlat)

        oly.setPosition(mPoint)
      } else if (['circle'].includes(type)) {
        const point = oly.getCenter()
        const mPoint = this.getPoint(point, dlng, dlat)

        oly.setCenter(new BMap.Point(mPoint.lng, mPoint.lat))
      } else {
        this.setPath(oly, dlng, dlat)
        const specialOlys = getPolylineIncludeSpecials(oly, this._overlays)
        specialOlys.map(item => this.setPath(item, dlng, dlat))
      }

      if (this._editing) this._editing.enableEditing(oly, false)
    }
    this._startPixel = movePixel
    this._startPoint = movePoint
  }

  end (e) {
    e.stopPropagation()

    this._options.selectedOverlays.map(oly => {
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

      if (this._editing && !type.includes('special') &&
        getPolylineIncludeSpecials(oly, this._overlays).length === 0) {
        this._editing.enableEditing(oly, true)
        if (type === 'rectangle') {
          this.rectMarker(oly)
        }
      }

      const overlays = getPolylineIncludeSpecials(oly, this._overlays)
      overlays.push(oly)
      overlays.map(item => {
        this._update.overlay(item, { key: 'points', value: points })
      })
    })

    window.removeEventListener('mousemove', this.moveHandler)
    window.removeEventListener('mouseup', this.endHandler)
  }

  specialMarker (marker, overlay, polyline) {
    let endPoint = null
    let movePointIdx = null

    marker.addEventListener('mousedown', (e) => {
      endPoint = e.point
      const distanceA = this._map.getDistance(endPoint, this._options.marker.points[0])
      const distanceB = this._map.getDistance(endPoint, this._options.marker.points[1])
      movePointIdx = distanceA < distanceB ? 0 : 1
    })
    marker.addEventListener('dragend', (e) => {
      const dragIdx = calcMarkerOnLinePosition(e.point, polyline, true)
      if (dragIdx > -1) {
        this._options.marker.points.splice(movePointIdx, 1, e.point)
        this._options.marker.positions.splice(movePointIdx, 1, dragIdx)
        this._update.specialSetting(overlay, polyline, 'points')
      } else {
        marker.setPosition(this._options.marker.points[movePointIdx])
        notify('info', '拖动后点的不在线上，请放大地图重新拖动。')
      }
    })
  }

  rectMarker (overlay, count = 6) {
    const markers = this._options.marker.overlays.filter(item => item.parentId === overlay.id)
    let endPoint = null
    const mPoints = overlay.getPath()
    let points = calcRectAllPoints(mPoints[0], mPoints[2], count)
    let pointsTmp = cloneDeep(points)
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

  getPoint (point, dlng, dlat) {
    const mPoint = new BMap.Point(point.lng + dlng, point.lat + dlat)
    return mPoint
  }

  setPath (oly, dlng, dlat) {
    const points = oly.getPath()
    const newPoints = []
    points.map(point => {
      const mPoint = this.getPoint(point, dlng, dlat)
      newPoints.push(new BMap.Point(mPoint.lng, mPoint.lat))
    })
    oly.setPath(newPoints)
  }
}

export default Drag
