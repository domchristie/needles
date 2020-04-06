import AudioWorkletAdapter from './audio-worklet-adapter'
import ScriptProcessorAdapter from './script-processor-adapter'
import OfflineAdapter from './offline-adapter'

// Disable AudioWorklet because it currently results in glitchy audio playback
const audioWorkletEnabled = false

/**
 * Factory which returns either an OfflineAdapter, AudioWorkletAdapter, or
 * ScriptProcessorAdapter, depending on browser support / mode.
 */

export default function ({context, source, controller}) {
  const adapter = _adapter(controller)

  adapter.node.then((node) => {
    node.connect(context.destination)
    source.connect(node)
  })

  return adapter
}

function _adapter (controller) {
  if (controller.offline) {
    return new OfflineAdapter(controller, controller.workerUri)
  }

  if ('AudioWorkletNode' in window && audioWorkletEnabled) {
    return new AudioWorkletAdapter(controller, 'needles-worklet', controller.workletUri)
  } else {
    return new ScriptProcessorAdapter(controller, controller.workerUri)
  }
}
