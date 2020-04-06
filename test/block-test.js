import { testFactory } from './helpers'
import { BinDouble } from './doubles'
import Block from '../src/workers/block.js'

let subject
const test = testFactory(
  function setup () {
    subject = new Block({ channelCount: 5, length: 1 })
  }
)

test('constructor sets the channelCount', (t) => {
  t.plan(1)
  t.equal(subject.channelCount, 5)
})

test('constructor sets the length', (t) => {
  t.plan(1)
  t.equal(subject.length, 1)
})

test('add calls `Bin#add`', (t) => {
  let count = 0
  let binAdd = BinDouble.prototype.add

  Object.defineProperty(subject, 'createBin', { value: () => new BinDouble })
  BinDouble.prototype.add = (samples) => {
    t.equal(samples[0], count)
    count++
  }

  t.plan(5)
  subject.add([[0], [1], [2], [3], [4]])

  BinDouble.prototype.add = binAdd
})

test('dump returns the bin arrays', (t) => {
  Object.defineProperty(subject, 'createBin', {
    value: () => {
      const bin = new BinDouble(1)
      Object.defineProperty(bin, 'array', { value: new Float32Array(1) })
      return bin
    }
  })

  t.plan(1)
  t.same(subject.dump(), Array(5).fill(new Float32Array(1)))
})
