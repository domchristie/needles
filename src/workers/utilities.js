export function sum (numbers) {
  var sum = 0
  for (var i = numbers.length - 1; i >= 0; i--) {
    sum += numbers[i]
  }
  return sum
}

export function mean (numbers) {
  return sum(numbers) / numbers.length
}

export function meanSquare (samples) {
  var sum = 0
  for (var i = samples.length - 1; i >= 0; i--) {
    sum += Math.pow(samples[i], 2)
  }
  return sum / samples.length
}

export function cumulativeMovingAverage ({ value, index, mean }) {
  return (value + (index * (mean || 0))) / (index + 1)
}
