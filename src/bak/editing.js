import BMap from 'BMap'
import { notify } from 'mussel'

import { calcRectAllPoints } from '../components/map/calc/point'
import { calcMarkerOnLinePosition } from '../components/map/calc/position'
import { getSpecialAttachPolyline } from '../components/map/calc/overlay'

class Editing {
  constructor (map, overlays, selectedOverlays, marker) {
    this._map = map
    this._overlays = overlays
    this._selectedOverlays = selectedOverlays
    this._marker = marker
  }

  enableEditing (overlay, editable) {
    const type = overlay.type
    if (!type) return

    if (type === 'marker') {
      overlay = this.marker(overlay, editable)
    } else if (type === 'label') {
      overlay = this.label(overlay, editable)
    } else if (type === 'rectangle') {
      overlay = this.rectangle(overlay, editable)
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

  rectangle (overlay, editable, options = {}) {
    if (!editable) {
      this.clearMarkers()
      return
    }

    const mPoints = overlay.getPath()
    const points = calcRectAllPoints(mPoints[0], mPoints[2], 6)

    if (editable) {
      const sizeWidth = options.width || 10
      const sizeHeight = options.height || 10
      const markers = []
      const moveIcon = new BMap.Icon('assets/bullet.jpg', new BMap.Size(sizeWidth, sizeHeight), {
        imageSize: new BMap.Size(sizeWidth, sizeHeight)
      })
      const shadow = new BMap.Icon('assets/shadow.png', new BMap.Size(sizeWidth * 2, sizeHeight * 2))

      for (let i = 0; i < points.length; i++) {
        const marker = new BMap.Marker(points[i])
        marker.point = points[i]
        marker.parentId = overlay.id
        marker.enableDragging()
        marker.setIcon(moveIcon)
        marker.setShadow(shadow)
        markers.push(marker)
        this._map.addOverlay(marker)
      }
      this._marker.overlays.push(...markers)
    }
    return overlay
  }

  label (overlay, editable) {
    const borderColor = editable ? '#5E87DB' : 'rgba(0, 0, 0, 0)'
    overlay.setStyle({ borderColor })
    return overlay
  }

  special (overlay, editable, options = {}) {
    if (!editable) {
      this.clearMarkers()
      return
    }
    const path = overlay.getPath()
    let points = null
    const sizeWidth = options.width || 10
    const sizeHeight = options.height || 10
    const markers = []
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
      marker.parentId = overlay.id
      marker.enableDragging()
      marker.setIcon(moveIcon)
      marker.setShadow(shadow)
      markers.push(marker)
      this._map.addOverlay(marker)

      const idx = calcMarkerOnLinePosition(points[i], polyline)
      this._marker.positions.push(idx)
    }
    this._marker.overlays.push(...markers)
    return polyline
  }

  clearMarkers () {
    this._marker.overlays.map(marker => {
      this._map.removeOverlay(marker)
    })
    this._marker.overlays.splice(0)
  }
}

export default Editing
