'use strict'
const { test } = require('tap')
const Parser = require('../parser.js')
const parseString = require('../parse-string.js')

const CHAR_PLUS = 0x2B
const CHAR_MINUS = 0x2D
const CHAR_SP = 0x20
const CHAR_0 = 0x30
const CHAR_9 = 0x39

class RPN extends Parser {
  parseStart () {
    if (this.char === Parser.END) {
      return this.returnNow()
    } else {
      return this.callNow(this.parseValue, this.emitResult)
    }
  }
  emitResult (value) {
    this.result(value)
    return this.goto(this.parseNext)
  }
  parseNext () {
    if (this.char === Parser.END) {
      return this.returnNow()
    } else if (this.char === CHAR_SP) {
      return this.next(this.parseStart)
    } else {
      throw this.error(new Error('Expected space or end of expression'))
    }
  }

  parseValue () {
    if (this.char === CHAR_PLUS || this.char === CHAR_MINUS) {
      return this.goto(this.parseOp)
    } else if (this.char >= CHAR_0 || this.char <= CHAR_9) {
      return this.goto(this.parseNumber)
    } else {
      return this.returnNow()
    }
  }

  parseOp () {
    if (this.char === CHAR_PLUS) {
      return this.call(this.parsePair, this.parseComputeAdd)
    } else {
      throw this.error(new Error('Expected valid operator'))
    }
  }
  parseComputeAdd (values) {
    return this.returnNow(values.reduce((acc, _) => acc + _, 0))
  }

  parsePair () {
    if (this.char === CHAR_SP) {
      return this.call(this.parseValue, this.parsePairSep)
    } else {
      throw this.error(new Error('Expected valid separator'))
    }
  }
  parsePairSep (value) {
    if (this.char === CHAR_SP) {
      this.state.list.push(value)
      return this.call(this.parseValue, this.parsePairResult)
    } else {
      throw this.error(new Error('Expected space'))
    }
  }
  parsePairResult (value) {
    this.state.list.push(value)
    return this.returnNow(this.state.list)
  }

  parseNumber () {
    if (this.char >= CHAR_0 && this.char <= CHAR_9) {
      this.consume()
    } else {
      return this.returnNow(Number(this.buf()))
    }
  }
}

test('simple', async t => {
  t.isDeeply(parseString.all(RPN, '23'), [23], 'results via events')
  t.is(parseString(RPN, '42'), 42, 'results via return')
  t.is(parseString(RPN, '+ 42 7'), 49, 'addition')
  t.isDeeply(parseString.all(RPN, '+ 42 7 + 27 17'), [49, 44], 'many additions')
  t.is(parseString(RPN, '+ 42 7 + 27 17'), 44, 'last addition')
  t.is(parseString.debug(RPN, '+ 42 + 3 4'), 49, 'nested')
  t.is(parseString.debug(RPN, '+ + 42 3 4'), 49, 'nested first')
})

test('simple-debug', async t => {
  t.isDeeply(parseString.all.debug(RPN, '23'), [23], 'results via events')
  t.is(parseString.debug(RPN, '42'), 42, 'results via return')
  t.is(parseString.debug(RPN, '+ 42 7'), 49, 'addition')
  t.isDeeply(parseString.all.debug(RPN, '+ 42 7 + 27 17'), [49, 44], 'many additions')
  t.is(parseString.debug(RPN, '+ 42 7 + 27 17'), 44, 'last addition')
})

test('no-entry-point', async t => {
  const EmptyGrammar = class extends Parser {}
  t.throws(() => {
    parseString(EmptyGrammar, '1')
  }, Parser.GrammarError)
})

test('anon-state-debug', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      return this.goto(() => this.return(23))
    }
  }
  t.is(parseString.debug(Grammar, '\n'), 23)
})

test('call-no-return-debug', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      if (this.char === CHAR_0) return this.callNow(this.parseThing)
      return this.return()
    }
    parseThing () {
      this.consume()
      return this.return()
    }
  }
  t.is(parseString.debug(Grammar, '0'), '0')
})

test('null-parse', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      return this.goto(() => this.return(23))
    }
  }
  const gr = new Grammar()
  gr.parse(null)
  gr.parse('a')
  gr.parse('')
  t.is(gr.finish(), 23)
})

test('end-parse-no-return', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      return this.goto(() => { this.return() })
    }
  }
  t.isDeeply(parseString.all(Grammar, 'a'), [])
})

test('early-return', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      return this.returnNow()
    }
  }
  t.throws(() => parseString(Grammar, 'a'))
})

test('bad-state', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      return this.next()
    }
  }
  t.throws(() => parseString(Grammar, 'a'))
})

test('consume-too-much', async t => {
  const Grammar = class extends Parser {
    parseStart () {
      this.consume('A')
      return this.next(this.parseMore)
    }
    parseMore () {
      this.consume()
      return this.return()
    }
  }
  t.throws(() => parseString(Grammar, 'a'))
})
