import BMap from 'BMap'
import { CustomSvg } from './custom-overlay'

import { calcSpecialPoints } from '../components/map/calc/point'
import { distanceToPointAndPixel } from '../components/map/calc/distance'
import { defaultStyle, getOverlaySettings, setOverlaySettings } from './setting'

// 绘制点（icon、symbol、svg）、线、面（圆、多边形）、文本、特殊类型

class Draw {
  constructor (map, marker) {
    this._map = map
    this._marker = marker
  }

  bindEvents (events, overlay) {
    if (events) {
      for (const key in events) {
        overlay.addEventListener(key, e => {
          try {
            e.domEvent.stopPropagation()
          } catch {
            try {
              e.stopPropagation()
            } catch (err) {}
          }
          events[key](e, overlay)
        })
      }
    }
  }

  icon (options) {
    const sizeHeight = options.width || 16
    const sizeWidth = options.width || 16
    const anchor = options.anchor || [options.width / 2, options.width / 2]
    const imageOffset = options.imageOffset || [0, 0]
    return new BMap.Icon(options.iconUrl,
      new BMap.Size(sizeWidth, sizeHeight), {
        anchor: new BMap.Size(anchor[0], anchor[1]),
        imageSize: new BMap.Size(sizeWidth, sizeHeight),
        imageOffset: new BMap.Size(imageOffset[0], imageOffset[1])
      }
    )
  }

  symbolIcon (options) {
    const rotation = options.rotation || 0
    const scale = options.scale || 4
    const symbol = options.symbol || BMap_Symbol_SHAPE_CIRCLE
    const anchorHeight = options.height || 0
    const anchorWidth = options.width || 0
    const fillColor = options.fillColor
    const fillOpacity = options.fillOpacity
    const strokeColor = options.strokeColor

    return new BMap.Symbol(symbol, {
      rotation: rotation,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      strokeColor: strokeColor,
      scale: scale,
      anchor: new BMap.Size(anchorHeight, anchorWidth),
      strokeWeight: 1
    })
  }

  svg (point, options = {}, events) {
    const svg = new CustomSvg(this._map, point, options)

    setOverlaySettings(svg, options)
    this.bindEvents(events, svg)
    this._map.addOverlay(svg)
    return svg
  }

  marker (point, isSymbol, options = {}, events, callback) {
    let marker = null
    const svg = options.svg

    if (svg) {
      marker = this.svg(point, options)
    } else {
      const icon = isSymbol ? this.symbolIcon(options) : this.icon(options)
      marker = new BMap.Marker(point, {
        icon: icon
      })
    }

    setOverlaySettings(marker, options)
    this.bindEvents(events, marker)
    if (callback) callback(marker)

    return marker
  }

  polyline (points, options = {}, events, callback) {
    const polyline = new BMap.Polyline(points, options)
    setOverlaySettings(polyline, options)

    this.bindEvents(events, polyline)
    if (callback) callback(polyline)

    return polyline
  }

  circle (center, radius, options = {}, events) {
    const circle = new BMap.Circle(center, radius, options)
    setOverlaySettings(circle, options)

    this.bindEvents(events, circle)

    return circle
  }

  polygon (points, options = {}, events) {
    const polygon = new BMap.Polygon(points, options)

    setOverlaySettings(polygon, options)
    this.bindEvents(events, polygon)

    return polygon
  }

  label (point, options = {}, events, callback) {
    options = {
      ...options,
      strokeColor: '#333',
      fillOpacity: 1,
      width: 12
    }

    const style = {
      color: options.strokeColor,
      fontSize: `${options.width}px`,
      lineHeight: '20px',
      textAlign: 'center',
      padding: '0 10px',
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'rgba(0, 0, 0, 0)'
    }
    const label = new BMap.Label(options.name, {
      position: point,
      offset: new BMap.Size(-30, -12)
    })
    label.setStyle(style)
    setOverlaySettings(label, options)
    this.bindEvents(events, label)
    if (callback) callback(label)
    return label
  }

  special (data, options, events, callback) {
    options = {
      ...defaultStyle(),
      ...options
    }
    let newPoints = []

    if (data instanceof BMap.Polyline) {
      const points = data.getPath()
      if (this._marker.positions[0] > this._marker.positions[1]) {
        this._marker.points.reverse()
        this._marker.positions.reverse()
      }
      const start = this._marker.positions[0] + 1
      const end = this._marker.positions[1] + 1
      newPoints = points.slice(start, end)
      newPoints.unshift(this._marker.points[0])
      newPoints.push(this._marker.points[1])
    } else {
      newPoints = data
    }

    const { type, width } = options
    const { wPoint, wPixel } = distanceToPointAndPixel(this._map, width)
    let overlays = []
    options.wPoint = wPoint
    options.wPixel = wPixel
    if (type.includes('Line')) {
      options.count = type.includes('DoubleLine') ? 2 : 3
      overlays = this.specialLine(newPoints, options, events)
    } else {
      options.wTail = type.includes('AngularRect') ? wPoint : 0
      overlays = this.specialRect(newPoints, options, events)
    }
    if (callback) callback(overlays)
    return overlays
  }

  specialLine (points, opts, events, wTail = 0) { // 双平行线、三平行线
    const { count, wPoint, wPixel } = opts
    const { lineSL, lineSR } = calcSpecialPoints(points, wPoint, wTail)
    const overlays = []
    overlays.push(this.polyline(lineSL, opts))
    overlays.push(this.polyline(lineSR, opts))
    if (count === 3) overlays.push(this.polyline(points, { ...opts, strokeStyle: 'dashed' }))

    overlays.push(this.polyline(points, {
      ...opts,
      invented: true,
      strokeColor: 'rgba(0, 0, 0, 0)',
      strokeWeight: Math.ceil(wPixel) * 2
    }, events))
    return overlays
  }

  specialRect (points, opts, events) {
    const { wPoint, wPixel, wTail } = opts
    const {
      lineSL,
      lineSR,
      lineTail
    } = calcSpecialPoints(points, wPoint, wTail)
    const tailL1 = [lineTail[0], lineSL[0]]
    const tailL2 = [lineTail[1], lineSR[0]]
    const tailR1 = [lineTail[2], lineSL[lineSL.length - 1]]
    const tailR2 = [lineTail[3], lineSR[lineSR.length - 1]]
    const options = { ...opts, fillOpacity: 0.00001 }
    const overlays = []

    lineSR.reverse()
    overlays.push(this.polygon(lineSL.concat(lineSR), options))

    if (wTail !== 0) {
      overlays.push(this.polyline(tailL1, options))
      overlays.push(this.polyline(tailL2, options))
      overlays.push(this.polyline(tailR1, options))
      overlays.push(this.polyline(tailR2, options))
    }
    overlays.push(this.polyline(points, {
      ...opts,
      invented: true,
      strokeColor: 'rgba(0, 0, 0, 0)',
      strokeWeight: Math.ceil(wPixel) * 2
    }, events))
    return overlays
  }

  uploadPolyline (data, events) {
    const centers = []

    const options = {
      name: data.name,
      projectMapLegendId: data.legendId,
      projectGeoKey: -1
    }
    const complete = (oly) => {
      oly.centers = centers
      // creatOverlays(oly)
      // clickOverlay(oly)
    }
    // const click = (e, overlay) => {
    //   clickOverlay(overlay, e)
    // }
    // const events = { click }
    const mPoints = []
    data.points.map(item => {
      centers.push(item.center)
      mPoints.push(new BMap.Point(item.lng, item.lat))
    })
    this.polyline(mPoints, options, events, complete)
  }

  overlay (oly, mPoints, events) {
    let newOly = null
    const type = oly.type
    const options = getOverlaySettings(oly)

    if (type === 'marker') {
      const mPoint = [mPoints[0].lng, mPoints[0].lat]
      newOly = this.marker(mPoint, false, options, events)
    } else if (type === 'polyline') {
      newOly = this.polyline(mPoints, options, events)
    } else if (type === 'circle') {
      newOly = this.circle(mPoints[0], oly.width, options, events)
    } else if (type === 'label') {
      newOly = this.label(mPoints[0], options, events)
    } else {
      newOly = this.polygon(mPoints, options, events)
    }
    return newOly
  }
}

export default Draw
