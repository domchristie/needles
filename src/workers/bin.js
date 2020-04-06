export default class Bin {
  constructor (length) {
    this.length = length
    this.array = new Float32Array(length)
    this.count = 0
  }

  add (items) {
    const remainingCount = this.length - this.count
    const itemsToAdd = items.slice(0, remainingCount)
    this.array.set(itemsToAdd, this.count)
    this.count += itemsToAdd.length
  }

  get full () {
    return this.length === this.count
  }
}
