module.exports = {
  modes: {
    normal: BMAP_NORMAL_MAP,
    earth: BMAP_HYBRID_MAP
  },
  mapTypes: [
    {
      label: '平面',
      value: 'normal',
      backgroundPosition: '0 0'
    },
    {
      label: '卫星',
      value: 'earth',
      backgroundPosition: '0 -181px'
    }
  ],
  tools: [
    {
      value: 'marker',
      isOverlay: true,
      label: '点'
    },
    {
      value: 'polyline',
      isOverlay: true,
      label: '线'
    },
    {
      value: 'polygon',
      isOverlay: true,
      label: '面'
    },
    {
      value: 'special',
      isOverlay: true,
      label: '特殊'
    },
    {
      value: 'label',
      isOverlay: true,
      label: '文本'
    },
    {
      value: 'select',
      label: '框选'
    },
    {
      value: 'scale',
      label: '比例尺'
    }
  ],
  legendSpecs: [16, 32, 48, 64, 128],
  fontSpecs: [12, 14, 16, 18],
  strokeSpecs: [
    {
      label: '直线',
      value: 'solid'
    },
    {
      label: '虚线',
      value: 'dashed'
    }
  ],
  scaleSpecs: ['20m', '50m', '100m', '200m', '500m', '1km', '2km', '5km', '10km', '20km', '25km', '50km', '100km', '200km'],
  defaultScaleMap: {
    uploadPolyline: '2km',
    marker: '2km',
    polyline: '2km',
    polygon: '2km',
    special: '2km',
    label: '2km'
  },
  zoomSpecs: [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6]
}
