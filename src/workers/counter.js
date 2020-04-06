export default class Counter {
  constructor (targetCount, callback = function () {}, context = null) {
    this.targetCount = targetCount
    this.callback = callback
    this.context = context
    this.count = 0
  }

  increment (count) {
    this.count += count

    if (this.count >= this.targetCount) {
      this.callback.call(this.context)
      this.count = this.count % this.targetCount
    }
  }

  willMeetTarget (count) {
    return this.count + count >= this.targetCount
  }

  reset () {
    this.count = 0
  }
}
