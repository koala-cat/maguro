function addEvents (events, overlay) {
  if (events) {
    for (const key in events) {
      overlay.addEventListener(key, e => {
        try {
          e.domEvent.stopPropagation()
        } catch {
          try {
            e.stopPropagation()
          } catch (err) {}
        }
        events[key](e, overlay)
      })
    }
  }
}

function removeEvents (events, overlay) {
  if (events) {
    for (const key in events) {
      overlay.removeEventListener(key, events[key])
    }
  }
}

export {
  addEvents,
  removeEvents
}
