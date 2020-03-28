import { tools } from '../../constants'
import { isOverlayInFrame } from './calc/geo'

import Add from './add'
import Drag from './drag'
import DrawingManager from './drawingManager'
import Remove from './remove'
import SetEditing from './editing'
import { defaultStyle } from './setting'

class Select {
  constructor (
    map,
    events,
    overlays,
    selectedOverlays,
    specialOverlays,
    updateOverlays,
    removedOverlays,
    polylineCenters,
    polylinePointIds,
    active,
    marker
  ) {
    this._map = map
    this._events = events
    this._overlays = overlays
    this._selectedOverlays = selectedOverlays
    this._specialOverlays = specialOverlays
    this._updateOverlays = updateOverlays
    this._polylineCenters = polylineCenters
    this._polylinePointIds = polylinePointIds
    this._active = active
    this._marker = marker

    this._drawingManager = new DrawingManager(
      this._map,
      this._overlays
    )
    this._editing = new SetEditing(
      this._map,
      this._overlays,
      this._selectedOverlays,
      this._marker
    )
    this._remove = new Remove(this._map)

    this._add = new Add(
      this._map,
      this._overlays,
      this._specialOverlays,
      this._marker
    )

    this._drag = new Drag(
      this._map,
      this._events,
      this._overlays,
      this._selectedOverlays,
      this._specialOverlays,
      this._updateOverlays,
      this._removedOverlays,
      this._polylinePointIds,
      this._active,
      this._marker
    )
  }

  overlay (overlay, e) {
    const type = overlay.type

    if ((!overlay.isLocked && this._selectedOverlays.includes(overlay)) ||
      this._active.overlay === overlay) {
      return
    }

    if (this._activeToolType === 'special' && type === 'polyline' && e) {
      const options = {
        ...defaultStyle(),
        type: this._active.tool?.value || '',
        iconUrl: this._active.tool.imgUrl,
        projectMapLegendId: this._active.tool.id
      }
      this._add.marker(
        e.point,
        overlay,
        options,
        this._events,
        () => {
          this.unSelectTool()
          this._remove.markers(this._marker)
        }
      )
    } else {
      this.multipleOverlays(e, overlay)
    }
  }

  unSelectOverlays () {
    this._selectedOverlays.map(oly => {
      this._editing.enableEditing(oly, false)
    })
    this._selectedOverlays.splice(0)
    this._active.overlay = null
  }

  multipleOverlays (e, overlay) {
    this._remove.markers(this._marker)

    // const mac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
    const modKey = e?.ctrlKey || false
    const type = overlay.type

    const overlays = []
    if (type.includes('special')) {
      overlays.push(...this._specialOverlays[overlay.parentId])
    } else {
      overlays.push(overlay)
    }

    if (modKey) {
      this._active.overlay = this._active.overlay || overlays[0]
    } else {
      this.unSelectOverlays()
      this._selectedOverlays.splice(0)
      this._active.overlay = overlays[0]
    }
    this._editing.enableEditing(overlay, !overlay.disabled)
    this._selectedOverlays.push(...overlays)

    if (!overlay.disabled) {
      this._drag.init(overlay)
    }
  }

  frameOverlays () {
    const complete = (overlay) => {
      this._selectedOverlays.splice(0)

      for (const oly of this._overlays) {
        const parentIds = []
        const type = oly.type

        if (parentIds.includes(oly.parentId) || !oly.visible) continue
        const { result, parentId } = isOverlayInFrame(oly, overlay)
        if (result) {
          if (type.includes('special')) {
            const specials = this._overlays.reduce((arr, item) => {
              if (item.parentId === oly.parentId) {
                arr.push(item.id)
              }
              return arr
            }, [])
            this._selectedOverlays.push(...specials)
          } else {
            this._selectedOverlays.push(oly)
          }
          this._editing.enableEditing(oly, true)
          this._drag.init(oly)
        }
        if (parentId) parentIds.push(parentId)
      }

      this._map.removeOverlay(overlay)
      this._drawingManager.close()
      this._active.tool = null
    }

    const options = {
      ...defaultStyle(),
      type: 'rectangle',
      fillOpacity: 0.2,
      strokeStyle: 'dashed',
      strokeWeight: 1
    }
    this.unSelectOverlays()
    this._map.setDefaultCursor('crosshair')
    this._drawingManager.draw(options, null, complete)
  }

  tool () {
    let type = null
    const tool = this._active.tool
    const options = {
      ...defaultStyle(),
      iconUrl: tool.imgUrl,
      svgDoc: tool.svgDoc
    }

    this._remove.markers(this._marker)
    if (!tool.type && ['marker', 'polyline', 'polygon', 'special'].includes(tool.value)) {
      this._drawingManager.break()
      return
    }

    if (['polyline', 'special'].includes(tool.type)) {
      this._activeToolType = type = tool.type
      options.strokeStyle = type === 'polyline' ? tool.value : 'solid'
    } else {
      this._activeToolType = type = tool.value || tool.type
      options.strokeStyle = 'solid'
    }
    options.type = type

    if (type === 'select') {
      this._drawingManager.close()
      this.frameOverlays()
    } else if (type === 'special') {
      this._drawingManager.close()
      this.unSelectOverlays()
    } else {
      const complete = (overlay) => {
        this._add.overlay(
          overlay,
          this._overlays,
          this._polylineCenters
        )
        setTimeout(() => {
          this.unSelectTool()
        }, 10)
      }
      this._drawingManager.close()
      this._remove.markers(this._marker)

      this.unSelectOverlays()
      this._drawingManager.draw(options, this._events, complete)
    }
  }

  unSelectTool () {
    const activeType = this._active.tool?.type
    let tool = null

    if (activeType) {
      tool = tools.find(item => item.value === activeType)
    }
    this._active.tool = tool
    this._map.setDefaultCursor('pointer')
  }
}

export default Select
