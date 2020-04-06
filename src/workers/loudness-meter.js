import Counter from './counter'
import Block from './block'
import LoudnessMeasurement from './loudness-measurement'

export default class LoudnessMeter {
  constructor (options) {
    this.name = options.name
    this.delegate = options.delegate
    this.sampleRate = options.sampleRate
    this.blockDuration = options.blockDuration
    this.blockMargin = options.blockMargin
    this.updateDuration = options.updateDuration
    this.blocks = []
    this.fullBlocks = []
  }

  get blockLengthInSamples () {
    return Math.round((this.blockDuration / 1000) * this.sampleRate)
  }

  get blockMarginLengthInSamples () {
    return Math.round((this.blockMargin / 1000) * this.sampleRate)
  }

  get updateLengthInSamples () {
    return Math.round((this.updateDuration / 1000) * this.sampleRate)
  }

  get blockMarginCounter () {
    return (
      this._blockMarginCounter = this._blockMarginCounter || new Counter(
        this.blockMarginLengthInSamples
      )
    )
  }

  get updateCounter () {
    return (
      this._updateCounter = this._updateCounter || new Counter(
        this.updateLengthInSamples,
        this.update,
        this
      )
    )
  }

  input (input) {
    this.channelCount = input.length
    const sampleCount = input[0].length

    if (!this.blocks.length || this.blockMarginCounter.willMeetTarget(sampleCount)) {
      this.blocks.push(this.createBlock())
    }

    this.blocks = this.blocks.filter((block) => {
      block.add(input)
      if (block.full) {
        this.fullBlocks.push(block)
        return false
      }
      return true
    })

    this.updateCounter.increment(sampleCount)
    this.blockMarginCounter.increment(sampleCount)
  }

  createBlock () {
    return new Block({
      channelCount: this.channelCount,
      length: this.blockLengthInSamples
    })
  }

  update () {
    const block = this.fullBlocks[0] ? this.fullBlocks.shift() : this.blocks[0]
    this.delegate.update(
      this.name,
      new LoudnessMeasurement(block.dump()).loudness()
    )
  }

  reset () {
    this.blocks = []
    this.fullBlocks = []
    this.blockMarginCounter.reset()
    this.updateCounter.reset()

    this.delegate.update(
      this.name,
      new LoudnessMeasurement(this.createBlock().dump()).loudness()
    )
  }
}
