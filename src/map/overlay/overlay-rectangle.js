import BMap from 'BMap'

import { calcRectAllPoints } from '../calc/point'

import { updateOverlay } from './operate/update-overlay'
import { deleteOverlays, deleteAnchorOverlays } from './operate/delete-overlay'
import { dragOverlay } from './operate/drag-overlay'

class Rectangle extends BMap.Polygon {
  constructor (points, options) {
    super(points, options.settings)
    this.options = options
  }

  enableEditing () {
    const { map, markerOverlays, settings } = this.options
    const mPoints = this.getPath()
    const points = calcRectAllPoints(mPoints[0], mPoints[2], 6)

    const { sizeWidth = 10, sizeHeight = 10 } = settings
    const markers = []
    const moveIcon = new BMap.Icon(
      'assets/images/bullet.jpg',
      new BMap.Size(sizeWidth, sizeHeight), {
        imageSize: new BMap.Size(sizeWidth, sizeHeight)
      }
    )
    const shadow = new BMap.Icon(
      'assets/images/shadow.png',
      new BMap.Size(sizeWidth * 2, sizeHeight * 2)
    )

    for (let i = 0; i < points.length; i++) {
      const marker = new BMap.Marker(points[i])
      marker.point = points[i]
      marker.parentId = this.id
      marker.enableDragging()
      marker.setIcon(moveIcon)
      marker.setShadow(shadow)
      markers.push(marker)
      map.addOverlay(marker)
    }
    markerOverlays.push(...markers)
  }

  disableEditing () {
    deleteAnchorOverlays(this.options)
  }

  drag () {
    dragOverlay(this, this.options)
  }

  update (key, value) {
    updateOverlay(key, value, this.options)
  }

  delete () {
    deleteOverlays(this)
  }
}

export default Rectangle
