// Calculations from https://doxy.audacityteam.org/_e_b_u_r128_8cpp_source.html

function preFilterCoefficients (fs) {
  const db = 3.999843853973347;
  const f0 = 1681.974450955533;
  const Q = 0.7071752369554196;
  const K = Math.tan(Math.PI * f0 / fs);

  const Vh = Math.pow(10, db / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);

  const denominator0 = 1 + K / Q + K * K;
  const denominator1 = 2 * (K * K - 1) / denominator0;
  const denominator2 = (1 - K / Q + K * K) / denominator0;
  const numerator0 = (Vh + Vb * K / Q + K * K) / denominator0;
  const numerator1 = 2 * (K * K - Vh) / denominator0;
  const numerator2 = (Vh - Vb * K / Q + K * K) / denominator0;

  return {
    numerators: [numerator0, numerator1, numerator2],
    denominators: [1, denominator1, denominator2]
  }
}

function weightingFilterCoefficients (fs) {
  const f0 = 38.13547087602444;
  const Q = 0.5003270373238773;
  const K = Math.tan(Math.PI * f0 / fs);

  const denominator1 = 2 * (K * K - 1) / (1 + K / Q + K * K);
  const denominator2 = (1 - K / Q + K * K) / (1 + K / Q + K * K);
  const numerator0 = 1;
  const numerator1 = -2;
  const numerator2 = 1;

  return {
    numerators: [numerator0, numerator1, numerator2],
    denominators: [1, denominator1, denominator2]
  }
}


// Use biquad filters with matched frequency responses when IIR filters are unsupported

function preFilter (audioContext) {
  if ('createIIRFilter' in audioContext) {
    const coefficients = preFilterCoefficients(audioContext.sampleRate);
    return audioContext.createIIRFilter(
      coefficients.numerators,
      coefficients.denominators
    )
  } else {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highshelf';
    filter.frequency.value = 1500;
    filter.gain.value = 4;
    return filter
  }
}

function weightingFilter(audioContext) {
  if ('createIIRFilter' in audioContext) {
    const coefficients = weightingFilterCoefficients(audioContext.sampleRate);
    return audioContext.createIIRFilter(
      coefficients.numerators,
      coefficients.denominators
    )
  } else {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 38;
    filter.Q.value = -6;
    return filter
  }

}

var events = {
  on: function (type, listener) {
    (this._listeners[type] = this._listeners[type] || []).push(listener);
  },

  off: function (type, listener) {
    if (!type) {
      this._listeners = {};
      return
    }

    if (listener) {
      this._listeners[type] = (this._listeners[type] || []).filter(l => l !== listener);
    } else {
      delete this._listeners[type];
    }
  },

  trigger: function (type, data) {
    (this._listeners[type] || []).forEach((listener) => {
      listener({ type: type, data: data });
    });
  }
};

/**
 * Wrapper around the AudioWorkletNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

class AudioWorkletAdapter {
  constructor (controller, name, uri) {
    this.source = controller.source;
    this.context = this.source.context;
    this.name = name;
    this.uri = uri;

    this.node.then((node) => {
      node.port.onmessage = function (event) {
        controller.trigger(event.data.type, event.data);
      };
    });
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      return this.context.audioWorklet.addModule(this.uri).then(() => {
        return resolve(new AudioWorkletNode(this.context, this.name))
      }).catch(reject)
    });

    return this._node
  }

  message (data) {
    this.node.then((node) => node.port.postMessage(data));
  }
}

/**
 * Wrapper around the ScriptProcessorNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

class ScriptProcessorAdapter {
  constructor (controller, path) {
    this.source = controller.source;
    this.context = this.source.context;
    this.worker = new Worker(path);

    this.node.then((node) => {
      node.onaudioprocess = (event) => {
        const channels = [];
        for (var i = 0; i < this.source.channelCount; i++) {
          channels[i] = event.inputBuffer.getChannelData(i);
        }
        this.worker.postMessage({ type: 'process', input: channels });
      };
    });

    this.worker.onmessage = (event) => {
      controller.trigger(event.data.type, event.data);
    };
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      resolve(this._createNode(1024, this.source.channelCount, this.source.channelCount));
    });

    return this._node
  }

  message (data) {
    this.worker.postMessage(data);
  }

  _createNode () {
    return (
      this.context.createScriptProcessor || this.context.createJavaScriptNode
    ).apply(this.context, arguments)
  }
}

/**
 * Adapter for offline analysis.
 * No need to set up scriptProcessorNode or audioWorkletNode. Audio data is
 * already decoded and can just be passed to the worker. `node` is just a
 * placeholder gain node for adapter API parity.
 */
class OfflineAdapter {
  constructor (controller, path) {
    this.source = controller.source;
    this.context = this.source.context;
    this.worker = new Worker(path);

    this.worker.onmessage = (event) => {
      controller.trigger(event.data.type, event.data);
    };
  }

  message (data) {
    this.worker.postMessage(data);
  }

  get node () {
    if (this._node) return this._node
    this._node = new Promise((resolve, reject) => {
      resolve(this.context.createGain());
    });
    return this._node
  }
}

// Disable AudioWorklet because it currently results in glitchy audio playback
const audioWorkletEnabled = false;

/**
 * Factory which returns either an OfflineAdapter, AudioWorkletAdapter, or
 * ScriptProcessorAdapter, depending on browser support / mode.
 */

function WorkerAdapter ({context, source, controller}) {
  const adapter = _adapter(controller);

  adapter.node.then((node) => {
    node.connect(context.destination);
    source.connect(node);
  });

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

class InvalidStateError extends Error {
  constructor (message) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

const OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;

class Controller {
  constructor (options) {
    this.state = 'inactive';
    this._listeners = {};
    Object.assign(this, events);

    this.workerUri = options.workerUri;
    this.workletUri = options.workletUri;
    this.source = options.source;
    this.weightedSource = options.weightedSource;
    this.context = this.source.context;
    this.offline = this.context instanceof OfflineAudioContext;

    this.workerAdapter.message({
      type: 'initialize',
      attributes: {
        sampleRate: this.context.sampleRate,
        modes: options.modes
      },
    });
  }

  get workerAdapter () {
    return this._workerAdapter = this._workerAdapter || new WorkerAdapter({
      controller: this,
      context: this.context,
      source: this.weightedSource || this.source
    })
  }

  input (audioBuffer) {
    const chunkLength = 16384;
    const audioBufferLength = audioBuffer.length;
    const channelLength = audioBuffer.numberOfChannels;

    if (this.offline) {
      this.workerAdapter.message({
        type: 'set',
        key: 'duration',
        value: audioBuffer.duration * 1000
      });
    }

    // Refactor to support Safari (where copyFromChannel is unsupported)
    for (var i = 0; i < audioBufferLength; i += chunkLength) {
      const block = [];
      for (var channel = 0; channel < channelLength; channel++) {
        block[channel] = new Float32Array(chunkLength);
        audioBuffer.copyFromChannel(block[channel], channel, i);
      }
      this.workerAdapter.message({ type: 'process', input: block });
    }
  }

  start () {
    if (this.state !== 'inactive') this._throwInvalidStateErrorFor('start');
    this.state = 'recording';
    this.workerAdapter.message({ type: 'record' });

    if (this.offline) {
      this.source.start();
      this._startRendering().then(renderedBuffer => this.input(renderedBuffer));
    }
  }

  pause () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('pause');
    this.state = 'paused';
    this.workerAdapter.message({ type: 'pause' });
  }

  resume () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('resume');
    this.state = 'recording';
    this.workerAdapter.message({ type: 'resume' });
  }

  stop () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('stop');
    this.state = 'inactive';
    this.workerAdapter.message({ type: 'stop' });
  }

  reset () {
    this.workerAdapter.message({ type: 'reset' });
  }

  _startRendering () {
    return new Promise((resolve, reject) => {
      this.context.startRendering();
      this.context.addEventListener('complete', (event) => {
        resolve(event.renderedBuffer);
      });
    })
  }

  _throwInvalidStateErrorFor (action) {
    throw new InvalidStateError(`Failed to execute '${action}' on 'Needles': The Needles's state is '${this.state}'.`)
  }
}

function LoudnessMeter (options) {
  options.modes = options.modes || [
    'momentary',
    'short-term',
    'integrated'
  ];
  const context = options.source.context;
  const filter1 = preFilter(context);
  const filter2 = weightingFilter(context);
  options.source.connect(filter1);
  filter1.connect(filter2);

  return new Controller({ ...options, weightedSource: filter2 })
}

export { LoudnessMeter };
