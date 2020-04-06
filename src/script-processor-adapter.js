/**
 * Wrapper around the ScriptProcessorNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

export default class {
  constructor (controller, path) {
    this.source = controller.source
    this.context = this.source.context
    this.worker = new Worker(path)

    this.node.then((node) => {
      node.onaudioprocess = (event) => {
        const channels = []
        for (var i = 0; i < this.source.channelCount; i++) {
          channels[i] = event.inputBuffer.getChannelData(i)
        }
        this.worker.postMessage({ type: 'process', input: channels })
      }
    })

    this.worker.onmessage = (event) => {
      controller.trigger(event.data.type, event.data)
    }
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      resolve(this._createNode(1024, this.source.channelCount, this.source.channelCount))
    })

    return this._node
  }

  message (data) {
    this.worker.postMessage(data)
  }

  _createNode () {
    return (
      this.context.createScriptProcessor || this.context.createJavaScriptNode
    ).apply(this.context, arguments)
  }
}
