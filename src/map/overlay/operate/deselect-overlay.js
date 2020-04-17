function deselectOverlays (options) {
  const { selectedOverlays } = options
  selectedOverlays.map(oly => oly.disableEditing())
  selectedOverlays.splice(0)
}

export {
  deselectOverlays
}
