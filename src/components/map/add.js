// 创建和保存都放这里
import { notify } from 'mussel'
import { calcMarkerOnLinePosition } from './calc/position'

import Draw from './draw'
import { removeMarkers } from './remove'

class Add {
  constructor (
    map,
    overlays,
    options
  ) {
    this._map = map
    this._overlays = overlays
    this._options = options

    this._draw = new Draw(
      map,
      options.marker
    )

    this._id = -1
    this._parentId = -1
  }

  overlay (data, polylineCenters) {
    let overlay = null
    if (!Array.isArray(data)) {
      overlay = data
      data = [data]
    }
    for (const oly of data) {
      const type = oly.type
      if (!oly.id) {
        this._id--
        oly.id = this._id
      }
      if (oly.centers && polylineCenters) {
        polylineCenters[oly.id] = []
        polylineCenters[oly.id].push(...oly.centers)
      }
      if (type === 'polyline') oly.parentLineId = oly.id
      if (oly.invented) overlay = oly
      this._map.addOverlay(oly)
      this._overlays.push(oly)
    }
    return overlay
  }

  marker (point, polyline, options, events, callback) {
    if (this._options.marker.overlays.length > 0) {
      const overlay = this._options.marker.overlays[0]
      if (overlay.parentLineId !== polyline.id) {
        removeMarkers(this._map, this._options)
      }
    }

    const idx = calcMarkerOnLinePosition(point, polyline)
    if (idx > -1) {
      const overlay = this._draw.marker(point, true, options)
      overlay.parentLineId = polyline.id
      this._map.addOverlay(overlay)

      this._options.marker.overlays.push(overlay)
      this._options.marker.points.push(point)
      this._options.marker.positions.push(idx)
    } else {
      notify('info', '请放大地图，重新打点。')
    }

    if (this._options.marker.points.length < 2) return

    this._parentId--
    options = {
      ...options,
      width: 32,
      parentLineId: polyline.id,
      parentId: this._parentId
    }
    this.special(polyline, options, events, callback)
  }

  special (polyline, options, events, callback) {
    this._draw.special(polyline, options, events, (overlays) => {
      const parentId = overlays[0].parentId
      this.__options.specialOverlays[parentId] = overlays
      this.overlay(overlays)
      if (callback) callback(overlays)
    })
  }
}

export default Add
