function fixedNumber (num, fixed) {
  if (num === 0) {
    return 0
  } else if (typeof num !== 'number' || typeof fixed !== 'number') {
    return num
  }
  if (!num) {
    return null
  }
  return Math.round(num * Math.pow(10, fixed)) / Math.pow(10, fixed)
}

export {
  fixedNumber
}
