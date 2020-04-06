import LoudnessMeter from './loudness-meter'
import LoudnessMeasurement from './loudness-measurement'
import Counter from './counter'
import { mean, cumulativeMovingAverage } from './utilities'
const ABSOLUTE_THRESHOLD = -70

export default class IntegratedLoudnessMeter extends LoudnessMeter {
  constructor (options) {
    super(options)
    this.measurements = []
    this.meanPowers = []
  }

  update () {
    while (this.fullBlocks.length) {
      const block = this.fullBlocks.shift()
      const measurement = new LoudnessMeasurement(block.dump())
      if (measurement.loudness() > ABSOLUTE_THRESHOLD) {
        this.addMeasurement(measurement)
      }
    }

    // Expensive!
    const relativeThreshold = this.relativeThreshold
    const measurements = this.measurements.filter(
      measurement => measurement.loudness() > relativeThreshold
    )
    const powers = measurementsToMeanPowers(measurements)
    const measurement = new LoudnessMeasurement()

    this.delegate.update(this.name, measurement.loudness(powers))
  }

  addMeasurement (measurement) {
    let i = this.measurements.push(measurement)
    measurement.powers.forEach((power, j) => {
      this.meanPowers[j] = cumulativeMovingAverage({
        value: power,
        index: i - 1,
        mean: this.meanPowers[j]
      })
    })
  }

  get relativeThreshold () {
    const measurement = new LoudnessMeasurement()
    return measurement.loudness(this.meanPowers) - 10
  }

  reset () {
    super.reset()
    this.measurements = []
    this.meanPowers = []
  }
}

function measurementsToMeanPowers (measurements) {
  const powers = []
  const measurementsLength = measurements.length
  for (var i = 0; i < measurementsLength; i++) {
    const measurement = measurements[i]
    const powersLength = measurement.powers.length
    for (var j = 0; j < powersLength; j++) {
      powers[j] = cumulativeMovingAverage({
        value: measurement.powers[j],
        index: i,
        mean: powers[j]
      })
    }
  }
  return powers
}
