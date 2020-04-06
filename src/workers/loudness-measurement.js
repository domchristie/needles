import { sum, meanSquare } from './utilities'
const GAINS = [1, 1, 1, 1.41, 1.41]

export default class LoudnessMeasurement {
  constructor (channels = []) {
    this.powers = channels.map(samples => meanSquare(samples))
  }

  weightedPowers (powers) {
    return (powers || this.powers).map((power, index) => power * GAINS[index])
  }

  loudness (powers) {
    return -0.691 + 10 * Math.log10(sum(this.weightedPowers(powers)))
  }
}
