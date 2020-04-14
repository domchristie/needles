import { LoudnessMeter } from './dist/needles.js'

;(function () {
  var AudioContext = window.AudioContext || window.webkitAudioContext
  var OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  var audioContext
  var offlineAudioContext
  var fileReader = new FileReader()
  var audio = new Audio()
  var offlineMeters
  var liveMeters
  var bufferSource
  var elementSource

  var state
  var range = 85
  var fileInput = document.querySelector('input[type="file"]')
  var playButton =document.getElementById('play')
  var pauseButton = document.getElementById('pause')
  var resetButton = document.getElementById('reset')
  var stateElement = document.getElementById('state')
  var momentaryNeedle = document.getElementById('momentary-needle')
  var momentaryValue = document.getElementById('momentary-value')
  var shortTermNeedle = document.getElementById('short-term-needle')
  var shortTermValue = document.getElementById('short-term-value')
  var integratedNeedle = document.getElementById('integrated-needle')
  var integratedValue = document.getElementById('integrated-value')

  fileInput.addEventListener('change', start)
  start()

  fileReader.onload = function (event) {
    setState('Loading')
    audioContext.decodeAudioData(event.target.result, audioDecoded)
  }

  function start () {
    audioContext = audioContext || new AudioContext()

    if (fileInput.files[0]) {
      fileReader.readAsArrayBuffer(fileInput.files[0])
      audio.src = window.URL.createObjectURL(fileInput.files[0])
      playButton.hidden = false

      if (!elementSource) {
        elementSource = audioContext.createMediaElementSource(audio)
        elementSource.connect(audioContext.destination)
        liveMeters = createMeters(elementSource)
      }
    }
  }

  function audioDecoded (buffer) {
    offlineAudioContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    bufferSource = offlineAudioContext.createBufferSource()
    bufferSource.buffer = buffer

    offlineMeters = createMeters(bufferSource, ['integrated'])
    setState('Measuring')
    offlineMeters.start()
  }

  playButton.addEventListener('click', function () {
    audioContext.resume()
    audio.play()
  })

  pauseButton.addEventListener('click', function () {
    audio.pause()
  })

  resetButton.addEventListener('click', function () {
    if (liveMeters) liveMeters.reset()
    if (offlineMeters) offlineMeters.reset()
  })

  audio.addEventListener('play', function () {
    setState('Live')
    liveMeters.state === 'paused' ? liveMeters.resume() : liveMeters.start()
    playButton.hidden = true
    pauseButton.hidden = false
  })

  audio.addEventListener('pause', function () {
    liveMeters.pause()
    pauseButton.hidden = true
    playButton.hidden = false
  })

  audio.addEventListener('canplay', function () {
    playButton.hidden = false
  }, { once: true })

  audio.addEventListener('ended', function () {
    liveMeters.reset()
  })

  function createMeters (source, modes) {
    var loudnessMeter = new LoudnessMeter({
      source: source,
      workerUri: 'dist/needles-worker.js',
      workletUri: 'dist/needles-worklet.js',
      modes: modes
    })

    loudnessMeter.on('dataavailable', function (event) {
      if (state === 'Measuring') setState('')

      var map = {
        'momentary': [momentaryNeedle, momentaryValue],
        'short-term': [shortTermNeedle, shortTermValue],
        'integrated': [integratedNeedle, integratedValue],
      }
      var translate = translateY(scale(event.data.value))
      var [needle, value] = map[event.data.mode]
      needle.style.transform = 'translateY(' + translate + '%)'
      value.textContent = formattedValue(event.data.value)
    })

    return loudnessMeter
  }

  function setState (newState) {
    state = newState
    stateElement.textContent = state
  }

  // Convert loudness to value between 0 and 1
  function scale (loudness) {
    return (range + loudness) / range
  }

  // Translate scaled loudness to a CSS transform: translateY value
  function translateY (scaled) {
    if (!Number.isFinite(scaled)) return 100
    return (1 - scaled) * 100
  }

  function formattedValue (value) {
    if (value < -range) value = -Infinity
    return Number.isFinite(value) ? value.toFixed(1).toString() : '-Inf'
  }
})()
