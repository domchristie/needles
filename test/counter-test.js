import { testFactory } from './helpers'
import Counter from '../src/workers/counter.js'

let subject
const test = testFactory(
  function setup () {
    subject = new Counter(3)
  }
)

test('constructor sets the targetCount', (t) => {
  t.plan(1)
  t.equal(subject.targetCount, 3)
})

test('constructor sets the defaults', (t) => {
  t.plan(3)
  t.equal(typeof subject.callback, 'function')
  t.equal(subject.context, null)
  t.equal(subject.count, 0)
})

test('constructor sets the callback properties', (t) => {
  const context = { callback: function () {} }
  subject = new Counter(3, context.callback, context)
  t.plan(2)
  t.equal(subject.callback, context.callback)
  t.equal(subject.context, context)
})

test('increment increments the count by the given number', (t) => {
  t.plan(2)
  t.equal(subject.count, 0)
  subject.increment(2)
  t.equal(subject.count, 2)
})

test('increment calls the callback when the target is met', (t) => {
  t.plan(2)
  const context = {
    callback: function () {
      t.ok(true)
      this.f()
    },
    f: function () { t.ok(true) }
  }
  subject = new Counter(3, context.callback, context)
  subject.increment(3)
})

test('increment sets the count to the remainder when the target is exceeded', (t) => {
  t.plan(1)
  subject.increment(4)
  t.equal(subject.count, 1)
})

test('willMeetTarget returns false when the target won\'t be met', (t) => {
  t.plan(2)
  t.equal(subject.count, 0)
  t.notOk(subject.willMeetTarget(1))
})

test('willMeetTarget returns true when the target will be met', (t) => {
  t.plan(2)
  t.equal(subject.count, 0)
  t.ok(subject.willMeetTarget(3))
})

test('reset resets the count', (t) => {
  t.plan(1)
  subject.increment(1)
  subject.reset()
  t.equal(subject.count, 0)
})
