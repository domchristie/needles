import Needles from './dist/needles.js'

;(function () {
  var AudioContext = window.AudioContext || window.webkitAudioContext
  var OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  var audioContext
  var offlineAudioContext
  var fileReader = new FileReader()
  var audio = new Audio()
  var offlineNeedles
  var liveNeedles
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
        liveNeedles = createNeedles(
          elementSource,
          ['ebu-mode:momentary','ebu-mode:short-term', 'ebu-mode:integrated']
        )
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

    offlineNeedles = createNeedles(bufferSource, ['ebu-mode:integrated'])
    setState('Measuring')
    offlineNeedles.start()
  }

  playButton.addEventListener('click', function () {
    audio.play()
  })

  pauseButton.addEventListener('click', function () {
    audio.pause()
  })

  resetButton.addEventListener('click', function () {
    if (liveNeedles) liveNeedles.reset()
    if (offlineNeedles) offlineNeedles.reset()
  })

  audio.addEventListener('play', function () {
    setState('Live')
    liveNeedles.state === 'paused' ? liveNeedles.resume() : liveNeedles.start()
    playButton.hidden = true
    pauseButton.hidden = false
  })

  audio.addEventListener('pause', function () {
    liveNeedles.pause()
    pauseButton.hidden = true
    playButton.hidden = false
  })

  audio.addEventListener('canplay', function () {
    playButton.hidden = false
  }, { once: true })

  audio.addEventListener('ended', function () {
    liveNeedles.reset()
  })

  function createNeedles (source, modes) {
    var needles = new Needles({
      source: source,
      workerUri: 'dist/needles-worker.js',
      workletUri: 'dist/needles-worklet.js',
      modes: modes
    })

    needles.on('dataavailable', function (event) {
      if (state === 'Measuring') setState('')

      var map = {
        'ebu-mode:momentary': [momentaryNeedle, momentaryValue],
        'ebu-mode:short-term': [shortTermNeedle, shortTermValue],
        'ebu-mode:integrated': [integratedNeedle, integratedValue],
      }
      var translate = translateY(scale(event.data.value))
      var [needle, value] = map[event.data.mode]
      needle.style.transform = 'translateY(' + translate + '%)'
      value.textContent = formattedValue(event.data.value)
    })

    return needles
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
