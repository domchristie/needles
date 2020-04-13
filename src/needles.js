import { preFilter, weightingFilter } from './filters'
import Controller from './controller'

export function LoudnessMeter (options) {
  options.modes = options.modes || [
    'ebu-mode:momentary',
    'ebu-mode:short-term',
    'ebu-mode:integrated'
  ]
  const context = options.source.context
  const filter1 = preFilter(context)
  const filter2 = weightingFilter(context)
  options.source.connect(filter1)
  filter1.connect(filter2)

  return new Controller({ ...options, weightedSource: filter2 })
}
