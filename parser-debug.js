'use strict'
const util = require('util')

const isControl = _ => _ === 0x7F || _ <= 0x1F
const dump = _ => util.inspect(_, {colors: true, depth: 10, breakLength: Infinity, compact: true})
module.exports = function debug (Grammar) {
  class Debug extends Grammar {
    stateName (state) {
      return (state.parser && state.parser.name) || state.name || ('anonymous')
    }
    runOne () {
      const callStack = this.stack.concat(this.state).map(_ => this.stateName(_)).join(' <- ')
      let charName = this.char === Grammar.END ? 'END' : isControl(this.char) ? this.char : '"' + String.fromCodePoint(this.char) + '"'
      console.log('RUN', callStack, dump({line: this.line, col: this.col, char: charName, ret: this.state.returned}))
      return super.runOne()
    }
    finish () {
      const obj = super.finish()
      // istanbul ignore if
      if (this.stack.length !== 0) {
        throw new Grammar.GrammarError('All states did not return by end of stream')
      }
      return obj
    }
    callStack () {
      const callStack = this.stack.map(_ => this.stateName(_)).join('    ').replace(/\S/g, ' ')
      return callStack ? callStack + '    ' : ''
    }
    next (fn) {
      console.log('  ', this.callStack(), 'NEXT', this.stateName(fn))
      return super.next(fn)
    }
    goto (fn) {
      console.log('  ', this.callStack(), 'GOTO', this.stateName(fn))
      super.next(fn)
      return false
    }
    call (fn, returnWith) {
      console.log('  ', this.callStack(), 'CALL', fn.name, returnWith ? '-> ' + returnWith.name : '')
      if (returnWith) super.next(returnWith)
      this.stack.push(this.state)
      this.ctxStack.push(this.ctx)
      this.ctx = null
      this.state = new Grammar.State(fn)
    }
    callNow (fn, returnWith) {
      console.log('  ', this.callStack(), 'CALLNOW', fn.name, returnWith ? '-> ' + returnWith.name : '')
      if (returnWith) super.next(returnWith)
      this.stack.push(this.state)
      this.ctxStack.push(this.ctx)
      this.ctx = null
      this.state = new Grammar.State(fn)
      return false
    }
    return (value) {
      console.log('  ', this.callStack(), 'RETURN')
      return super.return(value)
    }
    returnNow (value) {
      console.log('  ', this.callStack(), 'RETURNNOW')
      super.return(value)
      return false
    }
  }
  /* istanbul ignore next */
  for (let key of Object.keys(Grammar)) {
    Debug[key] = Grammar[key]
  }
  return Debug
}
