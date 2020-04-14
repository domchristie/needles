import LoudnessMeter from './loudness-meter'
import IntegratedLoudnessMeter from './integrated-loudness-meter'

export default class {
  constructor (worker) {
    this.worker = worker
    this.recording = false
  }

  message (event) {
    switch (event.data.type) {
    case 'initialize':
      for (var key in event.data.attributes) {
        this[key] = event.data.attributes[key]
      }
      break
    case 'set':
      this[event.data.key] = event.data.value
    case 'record':
      this.recording = true
      this.worker.message({ type: 'start' })
      break
    case 'pause':
      this.recording = false
      this.worker.message({ type: 'pause' })
      break
    case 'resume':
      this.recording = true
      this.worker.message({ type: 'resume' })
      break
    case 'stop':
      this.reset()
      this.recording = false
      this.worker.message({ type: 'stop' })
      break
    case 'reset':
      this.reset()
      break
    case 'process':
      this.process(event.data.input)
      break
    }
  }

  process (input) {
    if (!this.recording) return
    this.meters.forEach(meter => meter.input(input))
    return true
  }

  get meters () {
    if (this._meters) return this._meters

    const map = {
      'momentary': this._createMomentaryMeter,
      'short-term': this._createShortTermMeter,
      'integrated': this._createIntegratedMeter,
    }
    this._meters = this.modes.map(mode => map[mode].call(this))
    return this._meters
  }

  update (mode, value) {
    this.worker.message({
      type: 'dataavailable',
      mode: mode,
      value: value
    })
  }

  reset () {
    this.meters.forEach(meter => meter.reset())
  }

  _createMomentaryMeter () {
    return new LoudnessMeter({
      name: 'momentary',
      delegate: this,
      sampleRate: this.sampleRate,
      blockDuration: 400,
      blockMargin: 100,
      updateDuration: 100
    })
  }

  _createShortTermMeter () {
    return new LoudnessMeter({
      name: 'short-term',
      delegate: this,
      sampleRate: this.sampleRate,
      blockDuration: 3000,
      blockMargin: 100,
      updateDuration: 100
    })
  }

  _createIntegratedMeter () {
    return new IntegratedLoudnessMeter({
      name: 'integrated',
      delegate: this,
      sampleRate: this.sampleRate,
      blockDuration: 400,
      blockMargin: 100,
      updateDuration: this.duration || 1000
    })
  }
}
