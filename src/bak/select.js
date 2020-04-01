import { tools } from '../constants'
import { isOverlayInFrame } from '../components/map/calc/geo'
import { getPolylineIncludeSpecials } from '../components/map/calc/overlay'

import Add from './add'
import Drag from './drag'
import DrawingManager from './drawingManager'
import Editing from './editing'
import { removeMarkers } from './remove'
import { defaultStyle } from './setting'

class Select {
  constructor (
    map,
    events,
    overlays,
    options
  ) {
    this._map = map
    this._events = events
    this._overlays = overlays
    this._options = options

    this._add = new Add(
      map,
      overlays,
      options
    )
    this._drag = new Drag(
      map,
      events,
      overlays,
      options
    )
    this._drawingManager = new DrawingManager(
      map,
      overlays
    )
    this._editing = new Editing(
      map,
      overlays,
      options.selectedOverlays,
      options.marker
    )
  }

  overlay (overlay, e) {
    const type = overlay.type

    if ((!overlay.isLocked && this._options.selectedOverlays.includes(overlay)) ||
      this._options.active.overlay === overlay) {
      return
    }

    if (this._options.active.tool?.type === 'special' && type === 'polyline' && e) {
      const options = {
        ...defaultStyle(),
        type: this._options.active.tool?.value || '',
        iconUrl: this._options.active.tool.iconUrl,
        projectMapLegendId: this._options.active.tool.id
      }
      this._add.marker(
        e.point,
        overlay,
        options,
        this._events,
        () => {
          this.unSelectTool()
          removeMarkers(this._map, this._options)
        }
      )
    } else {
      this.multipleOverlays(e, overlay)
    }
  }

  unSelectOverlays () {
    this._options.selectedOverlays.map(oly => {
      this._editing.enableEditing(oly, false)
    })
    this._options.selectedOverlays.splice(0)
    this._options.active.overlay = null
  }

  multipleOverlays (e, overlay) {
    removeMarkers(this._map, this._options)

    // const mac = /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
    const modKey = e?.ctrlKey || false
    const type = overlay.type

    const overlays = []
    if (type.includes('special')) {
      overlays.push(...this._options.specialOverlays[overlay.parentId])
    } else {
      overlays.push(overlay)
    }

    if (modKey) {
      this._options.active.overlay = this._options.active.overlay || overlays[0]
    } else {
      this.unSelectOverlays()
      this._options.selectedOverlays.splice(0)
      this._options.active.overlay = overlays[0]
    }

    if (getPolylineIncludeSpecials(overlay, this._overlays).length === 0) {
      this._editing.enableEditing(overlay, !overlay.disabled)
    }
    this._options.selectedOverlays.push(...overlays)

    if (!overlay.disabled) {
      this._drag.init(overlay, this._editing)
    }
  }

  frameOverlays () {
    const complete = (overlay) => {
      this._options.selectedOverlays.splice(0)

      for (const oly of this._overlays) {
        const parentIds = []
        const type = oly.type
        if (parentIds.includes(oly.parentId) || !oly.visible) continue
        const { result, parentId } = isOverlayInFrame(oly, overlay)
        if (result) {
          if (type.includes('special')) {
            const specials = this._overlays.reduce((arr, item) => {
              if (item.parentId === oly.parentId) {
                arr.push(item)
              }
              return arr
            }, [])
            this._options.selectedOverlays.push(...specials)
          } else {
            this._options.selectedOverlays.push(oly)
            if (getPolylineIncludeSpecials(oly, this._overlays).length === 0) {
              this._editing.enableEditing(oly, true)
            }
          }
          this._drag.init(oly, this._editing)
        }
        if (parentId) parentIds.push(parentId)
      }

      this._map.removeOverlay(overlay)
      this._drawingManager.close()
      this._options.active.tool = null
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
    const tool = this._options.active.tool
    const options = {
      ...defaultStyle(),
      iconUrl: tool.iconUrl,
      svg: tool.svg
    }

    removeMarkers(this._map, this._options)
    if (!tool.type && ['marker', 'polyline', 'polygon', 'special'].includes(tool.value)) {
      this._drawingManager.break()
      return
    }

    if (['polyline', 'special'].includes(tool.type)) {
      type = tool.type
      options.strokeStyle = type === 'polyline' ? tool.value : 'solid'
    } else {
      type = tool.value || tool.type
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
          this._options.polylineCenters
        )
        setTimeout(() => {
          this.unSelectTool()
        }, 10)
      }
      this._drawingManager.close()
      removeMarkers(this._map, this._options)

      this.unSelectOverlays()
      this._drawingManager.draw(options, this._events, complete)
    }
  }

  unSelectTool () {
    const activeType = this._options.active.tool?.type
    let tool = null

    if (activeType) {
      tool = tools.find(item => item.value === activeType)
    }
    this._options.active.tool = tool
    this._map.setDefaultCursor('pointer')
  }
}

export default Select
