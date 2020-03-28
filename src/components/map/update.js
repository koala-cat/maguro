import { getSpecialAttachPolyline, getPolylineIncludeSpecials } from './calc/overlay'

import Add from './add'
import Draw from './draw'
import SetEditing from './editing'
import Remove from './remove'
import { getOverlaySettings, settingsToStyle } from './setting'

class Update {
  constructor (
    map,
    events,
    overlays,
    selectedOverlays,
    specialOverlays,
    updateOverlays,
    removedOverlays,
    polylinePointIds,
    active,
    marker
  ) {
    this._map = map
    this._events = events
    this._overlays = overlays
    this._selectedOverlays = selectedOverlays
    this._specialOverlays = specialOverlays
    this._updateOverlays = updateOverlays
    this._removedOverlays = removedOverlays
    this._polylinePointIds = polylinePointIds
    this._active = active
    this._marker = marker

    this._lineupdate = null

    this._add = new Add(
      this._map,
      this._overlays,
      this._specialOverlays,
      this._marker
    )
    this._draw = new Draw(
      this._map,
      this._marker
    )
    this._editing = new SetEditing(
      this._map,
      this._overlays,
      this._selectedOverlays,
      this._marker
    )
    this._remove = new Remove(this._map)
  }

  setSetting (key, value, callback) {
    this._lineupdate = key

    for (const oly of this._selectedOverlays) {
      const type = oly.type

      oly[key] = value
      if (oly.invented) continue

      this.overlay(oly, { key, value })
      if (key === 'name' && type === 'label') {
        oly.setContent(value, { key, value })
        continue
      }
      if (['name', 'level', 'isLocked', 'isDisplay', 'isCommandDisplay', 'projectStructureId'].includes(key)) {
        this.swicthDisplay(oly, { key, value })
        continue
      }

      if (type === 'label') {
        const style = settingsToStyle({ [key]: value }, type)
        oly.setStyle(style)
      } else if (type === 'marker') {
        this.markerSetting(oly, { key, value }, callback)
      } else {
        if (key === 'projectMapLegendId' || key === 'width') {
          this.specialSetting(oly, null, key)
          return
        }
        oly[`set${key.replace(key[0], key[0].toUpperCase())}`](value)
      }
    }
    this._lineupdate = null
  }

  specialSetting (overlay, points, setting) {
    const specials = this._selectedOverlays
    const type = overlay.type

    specials.sort((a, b) => a.invented * 1 - b.invented * 1)
    points = points || specials[specials.length - 1].getPath()

    const width = !overlay.width || overlay.width < 10 ? 10 : overlay.width
    const options = {
      ...getOverlaySettings(specials[0]),
      width,
      type
    }

    this._add.special(points, options, this._events, (olys) => {
      if (setting !== 'projectMapLegendId') {
        for (let i = 0; i < olys.length; i++) {
          olys[i].id = specials[i].id
          if (setting === 'width') {
            this.overlay(olys[i], { key: setting, value: width })
            continue
          }
          if (setting === 'points') {
            this.overlay(olys[i], { key: setting, value: olys[i].getPath() })
            continue
          }
        }
      } else {
        const ids = specials.reduce((arr, item) => {
          if (item.id > 0) {
            arr.push(item.id)
          }
          return arr
        }, [])
        this._removedOverlays.push(...ids)
      }

      this._remove.selectedOverlays(this._overlays, this._selectedOverlays)
      this._selectedOverlays.push(...olys)
      this._active.overlay = olys[0]
    })
  }

  markerSetting (overlay, { key, value }, callback) {
    if (key !== 'projectMapLegendId' && overlay.svgDoc) {
      const style = settingsToStyle({ [key]: value })
      for (const s in style) {
        overlay.setStyle(s, style[s])
      }
      if (key === 'width') {
        overlay.setSize(value)
      }
      return
    }

    const point = overlay.getPosition()
    const idx = this._overlays.findIndex(item => item.id === overlay.id)
    const options = {
      ...getOverlaySettings(overlay),
      iconUrl: overlay.imgUrl || overlay.iconUrl,
      svg: overlay.svgDoc
    }

    if (overlay.toString().includes('Overlay')) {
      overlay.remove()
    }
    this._editing.marker(overlay, false)
    this._map.removeOverlay(overlay)
    const newOverlay = this._draw.marker(point, false, options, this._events)
    this._map.addOverlay(newOverlay)
    this._overlays.splice(idx, 1, newOverlay)
    this.overlay(newOverlay, { key, value })
    if (callback) callback(newOverlay)
  }

  lineupdate (editable, overlay) {
    const lineupdate = (e) => {
      if (!this._lineupdate) {
        let points = null
        try {
          points = [overlay.getCenter()]
          this.overlay(overlay, { key: 'width', value: overlay.getRadius() })
        } catch {
          points = overlay.getPath()
        }
        this.overlay(overlay, { key: 'points', value: points })
      }
    }
    if (editable) {
      overlay.addEventListener('lineupdate', lineupdate)
    } else {
      overlay.removeEventListener('lineupdate', lineupdate)
    }
  }

  overlay (oly, { key, value }) {
    if (oly.id < 0) return
    if (oly.invented && !['width', 'points', 'isDisplay', 'isCommandDisplay'].includes(key)) return

    const id = oly.id
    if (!this._updateOverlays[id]) this._updateOverlays[id] = {}

    if (key === 'points') {
      value = value.reduce((arr, item, index) => {
        const point = {
          longitude: item.lng,
          latitude: item.lat
        }
        if (this._polylinePointIds[id]) {
          point.id = this._polylinePointIds[id][index]
        }
        arr.push(point)
        return arr
      }, [])
    } else {
      oly[key] = value
    }

    this._updateOverlays[id] = {
      ...this._updateOverlays[id],
      id: oly.id,
      name: oly.name,
      projectGeoKey: oly.projectGeoKey,
      [key]: value
    }
  }

  swicthDisplay (overlay, { key, value }) {
    if (key !== 'isDisplay' && key !== 'isCommandDisplay') return

    let polylineVisible = true
    const type = overlay.type
    const data = []

    if (type.includes('special')) {
      this._overlays.map(oly => {
        if (oly.parentId === overlay.parentId) {
          data.push(oly)
        }
      })
      polylineVisible = getSpecialAttachPolyline(overlay).isVisible()
    } else {
      data.push(overlay)
    }

    if (type === 'polyline') {
      data.push(...getPolylineIncludeSpecials(overlay))
    }

    data.map(oly => {
      if (value && polylineVisible) {
        oly.show()
      } else {
        oly.hide()
        // if (this._activeOverlay === oly) {
        //   this._editing.disableEditing()
        // }
      }
      this.overlay(oly, { key, value })
    })
  }
}

export default Update
