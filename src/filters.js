// Calculations from https://doxy.audacityteam.org/_e_b_u_r128_8cpp_source.html

function preFilterCoefficients (fs) {
  const db = 3.999843853973347
  const f0 = 1681.974450955533
  const Q = 0.7071752369554196
  const K = Math.tan(Math.PI * f0 / fs)

  const Vh = Math.pow(10, db / 20)
  const Vb = Math.pow(Vh, 0.4996667741545416)

  const denominator0 = 1 + K / Q + K * K
  const denominator1 = 2 * (K * K - 1) / denominator0
  const denominator2 = (1 - K / Q + K * K) / denominator0
  const numerator0 = (Vh + Vb * K / Q + K * K) / denominator0
  const numerator1 = 2 * (K * K - Vh) / denominator0
  const numerator2 = (Vh - Vb * K / Q + K * K) / denominator0

  return {
    numerators: [numerator0, numerator1, numerator2],
    denominators: [1, denominator1, denominator2]
  }
}

function weightingFilterCoefficients (fs) {
  const f0 = 38.13547087602444
  const Q = 0.5003270373238773
  const K = Math.tan(Math.PI * f0 / fs)

  const denominator1 = 2 * (K * K - 1) / (1 + K / Q + K * K)
  const denominator2 = (1 - K / Q + K * K) / (1 + K / Q + K * K)
  const numerator0 = 1
  const numerator1 = -2
  const numerator2 = 1

  return {
    numerators: [numerator0, numerator1, numerator2],
    denominators: [1, denominator1, denominator2]
  }
}


// Use biquad filters with matched frequency responses when IIR filters are unsupported

export function preFilter (audioContext) {
  if ('createIIRFilter' in audioContext) {
    const coefficients = preFilterCoefficients(audioContext.sampleRate)
    return audioContext.createIIRFilter(
      coefficients.numerators,
      coefficients.denominators
    )
  } else {
    const filter = audioContext.createBiquadFilter()
    filter.type = 'highshelf'
    filter.frequency.value = 1500
    filter.gain.value = 4
    return filter
  }
}

export function weightingFilter(audioContext) {
  if ('createIIRFilter' in audioContext) {
    const coefficients = weightingFilterCoefficients(audioContext.sampleRate)
    return audioContext.createIIRFilter(
      coefficients.numerators,
      coefficients.denominators
    )
  } else {
    const filter = audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 38
    filter.Q.value = -6
    return filter
  }

}
