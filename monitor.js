const top = require('./')()

setInterval(() => console.log(top.toString()), 1000).unref()
