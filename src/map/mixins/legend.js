import { startDrawing } from '../overlay/operate/drawing-overlay'

export default {
  methods: {
    addLegend () {
      this.$emit('addLegend')
    },
    removeLegend (legend) {
      this.$emit('removeLegend', legend)
    },
    selectLegend (legend) {
      if (this.overlayListVisible) {
        this.overlayListVisible = false
      }
      this.activeLegend = legend

      if (!this.mapEditPermission) return
      if (legend.value !== 'scale') {
        startDrawing(this.$data)
      }
    }
  }
}
