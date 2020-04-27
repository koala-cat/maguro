import { tools } from '../../../constants'

function deselectOverlays (options) {
  const { selectedOverlays } = options
  selectedOverlays.map(oly => {
    if (oly.disableEditing) oly.disableEditing()
  })
  selectedOverlays.splice(0)
  options.activeOverlay = null
}

function deselectLegend (options) {
  setTimeout(() => {
    let legend = null
    const activeType = options.activeLegend?.type || null
    if (activeType) {
      legend = tools.find(item => item.value === activeType)
    }
    options.activeLegend = legend
  }, 10)
}

export {
  deselectOverlays,
  deselectLegend
}
