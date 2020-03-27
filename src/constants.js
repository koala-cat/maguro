module.exports = {
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
      label: '点'
    },
    {
      value: 'polyline',
      label: '线'
    },
    {
      value: 'polygon',
      label: '面'
    },
    {
      value: 'special',
      label: '特殊'
    },
    {
      value: 'label',
      label: '文本'
    },
    {
      value: 'select',
      label: '框选'
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
  ]
}
