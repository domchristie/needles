import Processor from './processor'

class Worklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.processor = new Processor(this)
    this.port.onmessage = (event) => this.processor.message(event)
  }

  process (inputs) {
    this.processor.process(inputs[0])
    return true
  }

  message (data) {
    this.port.postMessage(data)
  }
}

registerProcessor('needles-worklet', Worklet)
