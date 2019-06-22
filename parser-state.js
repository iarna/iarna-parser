'use strict'

class State {
  constructor (parser) {
    this.parser = parser
    this.buf = ''
    this.list = []
    this.obj = {}
    this.returned = null
  }
}

module.exports = State
