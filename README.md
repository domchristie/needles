# Needles
Audio loudness metering in the browser.

Features:
- Live momentary, short-term, and integrated K-weighted loudness (LUFS/LKFS) for a given web audio source.
- Offline integrated K-weighted loudness for file analysis.
- Offline momentary and short-term loudness values for higher resolution file analysis.
- No GUI, it just reports values. The choice of interface and visual style is up to you!
- Aims to be EBU Mode compliant, following EBU R 128 / ITU-R BS.1770-4.
- Supports recent versions of Chrome and Firefox.

Future features:
- True-peak, dBTP (ITU-R BS.1770-4)
- Loudness range, LRA (EBU R 128)
- RMS?
- Progress events for offline measurements
- Update `source` and `modes` dynamically
- Support for Safari (where some features of the Web Audio API are not supported)

## Installation

Install via npm:
```
npm install @domchristie/needles
```
Then make the included `dist/needles-worker.js` file accessible on your server.

## Usage

Import the library and create your source, for example via an `<audio>` element:

```js
import { LoudnessMeter } from '@domchristie/needles'

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext = new AudioContext()

var audioElement = document.querySelector('audio')
var source = audioContext.createMediaElementSource(audioElement)

// Listen to the output (optional)
source.connect(audioContext.destination)
```

Create your `loudnessMeter` passing in the source, and the worker path:

```js
var loudnessMeter = new LoudnessMeter({
  source: source,
  workerUri: 'public/path/to/needles-worker.js'
})
```

Listen for the `dataavailable` event which reports the loudness for each mode:

```js
loudnessMeter.on('dataavailable', function (event) {
  event.data.mode // momentary | short-term | integrated
  event.data.value // -14
})
```

Start metering:

```js
loudnessMeter.start()
```

### Offline Analysis

Import the library and create an `AudioContext`:

```js
import { LoudnessMeter } from '@domchristie/needles'

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext = new AudioContext()
```

Create your source: usually by decoding an array buffer from an XHR response, or from reading the file with the `FileReader` API. Once a file has been decoded, create an `OfflineAudioContext` using the buffer properties, followed by a buffer source. Finally, create your `loudnessMeter` passing in the `source`, then `start` the analysis. Offline integrated analyses report `dataavailable` just once, when the entire buffer has been processed.

```js
var fileReader = new FileReader()
fileReader.onload = function (event) {
  audioContext.decodeAudioData(event.target.result, audioDecoded)
}

var fileInput = document.querySelector('input[type="file"]')
fileInput.onchange = function (event) {
  if (fileInput.files[0]) {
    fileReader.readAsArrayBuffer(fileInput.files[0])
  }
}

var OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext

function audioDecoded (buffer) {
  var offlineAudioContext = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  )
  var source = offlineAudioContext.createBufferSource()
  source.buffer = buffer

  var loudnessMeter = new Needles({
    source: source,
    modes: ['integrated'],
    workerUri: 'public/path/to/needles-worker.js'
  })

  loudnessMeter.on('dataavailable', function (event) {
    console.log(event.data.value)
  })

  loudnessMeter.start()
}
```

## Options
`Needles` is initialized with an object, requiring `source` property (an audio source node), and a `workerUri` property, referencing the public path of the `needles-worker.js` file.

Operating modes can be chosen by passing in a `modes` array. Possible modes are:

- `momentary`
- `short-term`
- `integrated`

For example, to only meter short-term and integrated readings:

```js
var loudnessMeter = new LoudnessMeter({
  source: source,
  modes: ['short-term', 'integrated'],
  workerUri: 'public/path/to/needles-worker.js'
})
```

## Methods

### `start`
Starts processing samples from the `source`. For offline sources, the source and context rendering will also be started.

### `pause`
Pauses metering.

### `resume`
Resumes metering (following a pause).

### `reset`
Resets all meters, reporting any remaining valid measurements in a `dataavailable` event. Event handlers are still maintained.

### `stop`
Stops processing, resets all meters and reports any remaining valid measurements in a `dataavailable` event. Event handlers are still maintained.

### `on(type, handler)`
Listens for an event `type` then calls the `handler`.

### `off(type, handler)`
Removes the event handler for the given type. If no handler is specified, all handlers for the given event type are removed. If no arguments are supplied, all event handlers are removed.

## Events

### `dataavailable`
Reports measurements for a given mode. The event's `data` includes:
- **`mode`**: the operating mode, either `momentary`, `short-term`, or `integrated`
- **`value`**: the loudness in LUFS

### Other events
`start`, `pause`, `resume`, and `stop` are triggered after the corresponding methods are called.

## Notes on Implementation
**Needles** uses the `ScriptProcessorNode` interface to access raw sample data. This is a deprecated API which will be replaced by the Audio Worklet interface (currently only supported in Chrome). **Needles** aims to be prepared for broader Audio Worklet support by implementing adapters for both interfaces. Initial tests using Audio Worklets in Chrome results in glitchy performance, and so are currently disabled. On the plus side, [it doesn't look like `ScriptProcessorNode`s are going away](https://youtu.be/g1L4O1smMC0?t=928) (at least any time soon).

## License
Needles is copyright © 2020+ Dom Christie and released under the MIT license.
