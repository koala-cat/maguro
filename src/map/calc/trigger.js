function lazyTrigger (delay) {
  let timer = null
  return function (callback) {
    if (timer) {
      return
    }
    timer = setTimeout(() => {
      callback()

      clearTimeout(timer)
      timer = null
    }, delay)
  }
}

export {
  lazyTrigger
}
