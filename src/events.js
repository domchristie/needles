export default {
  on: function (type, listener) {
    (this._listeners[type] = this._listeners[type] || []).push(listener)
  },

  off: function (type, listener) {
    if (!type) {
      this._listeners = {}
      return
    }

    if (listener) {
      this._listeners[type] = (this._listeners[type] || []).filter(l => l !== listener)
    } else {
      delete this._listeners[type]
    }
  },

  trigger: function (type, data) {
    (this._listeners[type] || []).forEach((listener) => {
      listener({ type: type, data: data })
    })
  }
}
