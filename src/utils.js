const promisify = (fn) => {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...resolveArgs) => {
        if (err) {
          return reject(new Error(err))
        }

        return resolve(...resolveArgs)
      })
    })
  }
}

export { promisify }
