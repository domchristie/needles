/**
 * Adapter for offline analysis.
 * No need to set up scriptProcessorNode or audioWorkletNode. Audio data is
 * already decoded and can just be passed to the worker. `node` is just a
 * placeholder gain node for adapter API parity.
 */
export default class {
  constructor (controller, path) {
    this.source = controller.source
    this.context = this.source.context
    this.worker = new Worker(path)

    this.worker.onmessage = (event) => {
      controller.trigger(event.data.type, event.data)
    }
  }

  message (data) {
    this.worker.postMessage(data)
  }

  get node () {
    if (this._node) return this._node
    this._node = new Promise((resolve, reject) => {
      resolve(this.context.createGain())
    })
    return this._node
  }
}
