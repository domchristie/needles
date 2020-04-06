import { preFilter, weightingFilter } from './filters'
import events from './events'
import WorkerAdapter from './worker-adapter'
import { InvalidStateError } from './errors'
const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

export default class Needles {
  constructor (options) {
    this.state = 'inactive'
    this._listeners = {}
    Object.assign(this, events)

    this.workerUri = options.workerUri
    this.workletUri = options.workletUri
    this.source = options.source
    this.context = this.source.context
    this.offline = this.context instanceof OfflineAudioContext

    const filter1 = preFilter(this.context)
    const filter2 = weightingFilter(this.context)
    this.source.connect(filter1)
    filter1.connect(filter2)
    this.kWeightedSource = filter2

    this.workerAdapter.message({
      type: 'initialize',
      attributes: {
        sampleRate: this.context.sampleRate,
        modes: options.modes || [
          'ebu-mode:momentary',
          'ebu-mode:short-term',
          'ebu-mode:integrated'
        ]
      },
    })
  }

  get workerAdapter () {
    return this._workerAdapter = this._workerAdapter || new WorkerAdapter({
      controller: this,
      context: this.context,
      source: this.kWeightedSource
    })
  }

  input (audioBuffer) {
    const chunkLength = 16384
    const audioBufferLength = audioBuffer.length
    const channelLength = audioBuffer.numberOfChannels

    if (this.offline) {
      this.workerAdapter.message({
        type: 'set',
        key: 'integratedUpdateDuration',
        value: audioBuffer.duration * 1000
      })
    }

    // Refactor to support Safari (where copyFromChannel is unsupported)
    for (var i = 0; i < audioBufferLength; i += chunkLength) {
      const block = []
      for (var channel = 0; channel < channelLength; channel++) {
        block[channel] = new Float32Array(chunkLength)
        audioBuffer.copyFromChannel(block[channel], channel, i)
      }
      this.workerAdapter.message({ type: 'process', input: block })
    }
  }

  start () {
    if (this.state !== 'inactive') this._throwInvalidStateErrorFor('start')
    this.state = 'recording'
    this.workerAdapter.message({ type: 'record' })

    if (this.offline) {
      this.source.start()
      this._startRendering().then(renderedBuffer => this.input(renderedBuffer))
    }
  }

  pause () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('pause')
    this.state = 'paused'
    this.workerAdapter.message({ type: 'pause' })
  }

  resume () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('resume')
    this.state = 'recording'
    this.workerAdapter.message({ type: 'resume' })
  }

  stop () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('stop')
    this.state = 'inactive'
    this.workerAdapter.message({ type: 'stop' })
  }

  reset () {
    this.workerAdapter.message({ type: 'reset' })
  }

  _startRendering () {
    return new Promise((resolve, reject) => {
      this.context.startRendering()
      this.context.addEventListener('complete', (event) => {
        resolve(event.renderedBuffer)
      })
    })
  }

  _throwInvalidStateErrorFor (action) {
    throw new InvalidStateError(`Failed to execute '${action}' on 'Needles': The Needles's state is '${this.state}'.`)
  }
}
