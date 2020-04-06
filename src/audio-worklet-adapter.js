/**
 * Wrapper around the AudioWorkletNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

export default class {
  constructor (controller, name, uri) {
    this.source = controller.source
    this.context = this.source.context
    this.name = name
    this.uri = uri

    this.node.then((node) => {
      node.port.onmessage = function (event) {
        controller.trigger(event.data.type, event.data)
      }
    })
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      return this.context.audioWorklet.addModule(this.uri).then(() => {
        return resolve(new AudioWorkletNode(this.context, this.name))
      }).catch(reject)
    })

    return this._node
  }

  message (data) {
    this.node.then((node) => node.port.postMessage(data))
  }
}
