function getLegend (legends, overlay) {
  const legendId = overlay?.projectMapLegendId || null
  const legend = legends.find(item => item.id === legendId)
  return legend || {}
}

function getLegendType (legend) {
  const type = legend.type === 'polyline'
    ? legend.type
    : legend.value || legend.type
  return type
}

function getLegendId (legend) {
  return legend?.id || null
}

export {
  getLegend,
  getLegendType,
  getLegendId
}
