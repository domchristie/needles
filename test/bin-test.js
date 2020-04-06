import { testFactory } from './helpers'
import Bin from '../src/workers/bin.js'

let subject
const test = testFactory(
  function setup () {
    subject = new Bin(2)
  }
)

test('constructor sets the length', (t) => {
  t.plan(1)
  t.equal(subject.length, 2)
})

test('constructor sets up an array of the given length', (t) => {
  t.plan(2)
  t.ok(subject.array instanceof Float32Array)
  t.equal(subject.array.length, 2)
})

test('constructor sets the count', (t) => {
  t.plan(1)
  t.equal(subject.count, 0)
})

test('add adds to the array', (t) => {
  t.plan(1)
  subject.add([0])
  t.equal(subject.array[0], 0)
})

test('add appends to the array', (t) => {
  t.plan(1)
  subject.add([0])
  subject.add([1])
  t.same(subject.array, [0, 1])
})

test('add increments count', (t) => {
  t.plan(1)
  subject.add([0])
  t.equal(subject.count, 1)
})

test('add fills the array', (t) => {
  t.plan(1)
  subject.add([0, 1])
  t.same(subject.array, [0, 1])
})

test('full is false when empty', (t) => {
  t.plan(1)
  t.equal(subject.full, false)
})

test('full is false when not full', (t) => {
  t.plan(1)
  subject.add([0])
  t.equal(subject.full, false)
})

test('full is true when full', (t) => {
  t.plan(1)
  subject.add([0, 1])
  t.equal(subject.full, true)
})
