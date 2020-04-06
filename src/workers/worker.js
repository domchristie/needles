import Processor from './processor'

const processor = new Processor(this)
this.message = postMessage

onmessage = (event) => {
  processor.message(event)
}
