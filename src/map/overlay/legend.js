import { defaultStyle } from './setting'

import { breakDrawing, closeDrawing, drawingOverlay } from './operate/drawing-overlay'

function getLegend (legends, data) {
  const legendId = data ? data?.projectMapLegendId || data : null
  const legend = legends.find(item => item.id === legendId)
  return legend || {}
}

function getLegendType (legend) {
  const type = legend.type === 'polyline'
    ? legend.type
    : legend.value || legend.type
  return type
}

function selectLegend (options) {
  let type = null
  const { activeLegend: legend } = options
  const settings = {
    ...defaultStyle(),
    iconUrl: legend.iconUrl,
    svg: legend.svg
  }

  if (!legend.type && ['marker', 'polyline', 'polygon', 'special'].includes(legend.value)) {
    breakDrawing(options)
    return
  }

  if (['polyline', 'special'].includes(legend.type)) {
    type = legend.type
    settings.strokeStyle = type === 'polyline' ? legend.value : 'solid'
  } else {
    type = legend.value || legend.type
    settings.strokeStyle = 'solid'
  }
  settings.type = type

  if (type === 'select') {
    closeDrawing(options)
    this.frameOverlays()
  } else if (type === 'special') {
    closeDrawing(options)
    // this.unSelectOverlays()
  } else {
    const complete = (overlay) => {
      setTimeout(() => {
        // this.unSelectTool()
      }, 10)
    }
    closeDrawing(options)
    // removeMarkers(this._map, this._options)

    // this.unSelectOverlays()
    drawingOverlay(settings, complete, options)
  }
}

export {
  getLegend,
  getLegendType,
  selectLegend
}
