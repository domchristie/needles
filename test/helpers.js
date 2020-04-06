import tape from 'tape'

export function testFactory (before, after) {
  before = before || (() => {})
  after = after || (() => {})
  return function (name, fn) {
    tape(name, (t) => {
      before(t)
      fn(t)
      after(t)
    })
  }
}
