// 创建和保存都放这里
import { notify } from 'mussel'
import { calcMarkerOnLinePosition } from './calc/position'

import Draw from './draw'
import Remove from './remove'

class Add {
  constructor (
    map,
    overlays,
    specialOverlays,
    marker
  ) {
    this._map = map
    this._overlays = overlays
    this._specialOverlays = specialOverlays
    this._marker = marker

    this._draw = new Draw(
      this._map,
      this._marker
    )
    this._remove = new Remove(this._map)

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
    if (this._marker.overlays.length > 0) {
      const overlay = this._marker.overlays[0]
      if (overlay.parentLineId !== polyline.id) {
        this._remove.markers(this._marker)
      }
    }

    const idx = calcMarkerOnLinePosition(point, polyline)
    if (idx > -1) {
      const overlay = this._draw.marker(point, true, { fillOpacity: 1 })
      overlay.parentLineId = polyline.id
      this._map.addOverlay(overlay)

      this._marker.overlays.push(overlay)
      this._marker.points.push(point)
      this._marker.positions.push(idx)
    } else {
      notify('info', '请放大地图，重新打点。')
    }

    if (this._marker.points.length < 2) return

    this._parentId--
    options = {
      ...options,
      parentLineId: polyline.id,
      parentId: this._parentId
    }
    this._draw.special(polyline, options, events, (overlays) => {
      this.special(overlays)
      if (callback) callback()
    })
  }

  special (overlays) {
    const parentId = overlays[0].parentId
    this._specialOverlays[parentId] = overlays
    this.overlay(overlays)
  }
}

export default Add
