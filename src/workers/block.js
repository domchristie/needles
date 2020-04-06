import Bin from './bin'

export default class Block {
  constructor (options) {
    this.channelCount = options.channelCount
    this.length = options.length
    this.count = 0
    this.full = false
  }

  get bins () {
    if (this._bins) return this._bins

    this._bins = Array(this.channelCount).fill(null).map(() => this.createBin())
    return this._bins
  }

  add (channels) {
    this.bins.forEach((bin, i) => bin.add(channels[i]))
    this.full = (this.count += channels[0].length) > this.length
  }

  dump () {
    return this.bins.map(bin => bin.array)
  }

  createBin () {
    return new Bin(this.length)
  }
}
