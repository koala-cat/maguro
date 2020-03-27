class Legend {
  constructor (legends) {
    this._legends = legends
  }

  getLegend (overlay) {
    const legendId = overlay?.projectMapLegendId || null
    const legend = this._legends.find(item => item.id === legendId)
    this._legend = legend
    return legend || {}
  }

  getType () {
    this._type = this._legend.type === 'polyline'
      ? this._legend.type
      : this._legend.value || this._legend.type
    return this._type
  }

  getId () {
    return this._legend?.id || null
  }
}

export default Legend
