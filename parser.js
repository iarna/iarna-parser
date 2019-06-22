'use strict'
const EventEmitter = require('events')
const ParserEND = require('./parser-end.js')
const GrammarError = require('./grammar-error.js')
const State = require('./parser-state.js')

class Parser extends EventEmitter {
  constructor () {
    super()
    this.pos = 0
    this.col = 0
    this.line = 0
    this.obj = {}
    this.ctx = null
    this.stack = []
    this.ctxStack = []
    this._buf = ''
    this.char = null
    this.ii = 0
    this.state = new State(this.endParse)
    this.lastResult = null
    this.call(this.parseStart)
  }

  buf () {
    const result = this.state.buf
    this.state.buf = ''
    return result
  }

  parse (str) {
    if (str == null || str.length === 0) return

    this._buf = String(str)
    this.ii = -1
    this.char = -1
    let getNext
    while (getNext === false || this.nextChar()) {
      getNext = this.runOne()
    }
    this._buf = null
    return this
  }

  nextChar () {
    if (this.char === 0x0A) {
      ++this.line
      this.col = -1
    }
    ++this.ii
    this.char = this._buf.codePointAt(this.ii)
    ++this.pos
    ++this.col
    return this.haveBuffer()
  }

  haveBuffer () {
    return this.ii < this._buf.length
  }

  runOne () {
    return this.state.parser.call(this, this.state.returned)
  }

  endParse (value) {
    if (value != null) this.lastResult = value
    if (this.char !== Parser.END) {
      throw this.error(new Error('Invalid end of input'))
    }
  }

  result (value) {
    this.lastResult = value
    this.emit('result', value)
  }

  finish () {
    this.char = ParserEND
    let last
    do {
      last = this.state.parser
      this.runOne()
    } while (this.state.parser !== last)

    this.ctx = null
    this.state = null
    this._buf = null

    return this.lastResult == null ? this.obj : this.lastResult
  }
  next (fn) {
    if (typeof fn !== 'function') throw new GrammarError('Tried to set state to non-existent state: ' + JSON.stringify(fn))
    this.state.parser = fn
  }
  goto (fn) {
    this.next(fn)
    return this.runOne()
  }
  call (fn, returnWith) {
    if (returnWith) this.next(returnWith)
    this.stack.push(this.state)
    this.ctxStack.push(this.ctx)
    this.ctx = null
    this.state = new State(fn)
  }
  callNow (fn, returnWith) {
    this.call.apply(this, arguments)
    return this.runOne()
  }
  return (value) {
    // stack underflows are impossible as the top level adds to the stack
    // now.
    if (value == null) value = this.ctx
    if (value == null && this.state.buf !== '') value = this.state.buf
    if (value === null) value = this.state.returned
    this.state = this.stack.pop()
    this.ctx = this.ctxStack.pop()
    this.state.returned = value
  }
  returnNow (value) {
    this.return(value)
    return this.runOne()
  }
  consume (char) {
    if (arguments.length === 1) {
      this.state.buf += char
    } else {
      if (this.char === ParserEND) throw this.error(new GrammarError('Unexpected end-of-buffer'))
      this.state.buf += this._buf[this.ii]
    }
  }
  error (err) {
    err.line = this.line
    err.col = this.col
    err.pos = this.pos
    return err
  }
  parseStart () {
    throw new GrammarError('Must declare a parseStart method')
  }
  debug () {
    const debug = require('./parser-debug.js')
    return new (debug(this.constructor))()
  }
}
Parser.GrammarError = GrammarError
Parser.State = State
Parser.END = ParserEND
module.exports = Parser
