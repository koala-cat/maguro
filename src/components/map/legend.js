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

export {
  getLegend,
  getLegendType
}
