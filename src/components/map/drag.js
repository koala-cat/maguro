import BMap from 'BMap'
import { getPolylineIncludeSpecials } from './calc/overlay'

import SetEditing from './editing'
import Update from './update'

let me = null

class Drag {
  constructor (
    map,
    overlays,
    selectedOverlays,
    updateOverlays,
    polylinePointIds,
    active,
    marker
  ) {
    me = this
    this._map = map
    this._overlays = overlays
    this._selectedOverlays = selectedOverlays
    this._polylinePointIds = polylinePointIds
    this._updateOverlays = updateOverlays

    this._editing = new SetEditing(
      map,
      overlays,
      selectedOverlays,
      marker
    )
    this._update = new Update(
      map,
      overlays,
      selectedOverlays,
      active,
      marker
    )
  }

  init (overlay) {
    const type = overlay.type

    if (type.includes('special')) return

    this._startPoint = null
    this._startPixel = null
    overlay.addEventListener('mousedown', this.start)
  }

  start (e) {
    try {
      e.domEvent.stopPropagation()
    } catch {
      e.stopPropagation()
    }
    me._startPixel = { x: e.clientX, y: e.clientY }
    me._startPoint = me._map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
    window.addEventListener('mousemove', me.move)
    window.addEventListener('mouseup', me.end)
  }

  move (e) {
    e.stopPropagation()
    const movePixel = { x: e.clientX, y: e.clientY }
    const movePoint = me._map.pixelToPoint(new BMap.Pixel(e.clientX, e.clientY))
    const dx = movePixel.x - me._startPixel.x
    const dy = movePixel.y - me._startPixel.y
    const dlng = movePoint.lng - me._startPoint.lng
    const dlat = movePoint.lat - me._startPoint.lat
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    for (let i = 0; i < me._selectedOverlays.length; i++) {
      const oly = me._selectedOverlays[i]
      const type = oly.type

      if (type.includes('special') || oly.disabled || oly.isLocked) {
        continue
      }

      if (['marker', 'label'].includes(type)) {
        const point = oly.getPosition()
        const mPoint = me.getPoint(point, dlng, dlat)

        oly.setPosition(mPoint)
      } else if (['circle'].includes(type)) {
        const point = oly.getCenter()
        const mPoint = me.getPoint(point, dlng, dlat)

        oly.setCenter(new BMap.Point(mPoint.lng, mPoint.lat))
      } else {
        me.setPath(oly, dlng, dlat)
        const specialOlys = getPolylineIncludeSpecials(oly, me._overlays)
        specialOlys.map(item => me.setPath(item, dlng, dlat))
      }
      me._editing.enableEditing(oly, false)
    }
    me._startPixel = movePixel
    me._startPoint = movePoint
  }

  end (e) {
    e.stopPropagation()

    me._selectedOverlays.map(oly => {
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

      if (!type.includes('special')) {
        me._editing.enableEditing(oly, true)
      }

      me._update.overlay(
        oly,
        { key: 'points', value: points },
        me._polylinePointIds,
        me._updateOverlays
      )
      const specialOlys = getPolylineIncludeSpecials(oly, me._overlays)
      specialOlys.map(item => {
        me._update.overlay(
          item,
          { key: 'points', value: item.getPath() },
          me._polylinePointIds,
          me._updateOverlays
        )
      })
    })

    window.removeEventListener('mousemove', me.move)
    window.removeEventListener('mouseup', me.end)
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
