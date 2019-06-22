# @iarna/parser

A recursive descent parser framework, as seen in @iarna/toml, etc

## EXAMPLE

Once you create a grammar, you can use it with a provided helper function:

```js
const { parseString } = require('@iarna/parser')

console.log(parseString(Grammar, '+ 1 2')) // 3

console.log(parseString(Grammar, '+ 1 2 + 4 5')) // 9, the most recent result

console.log(parseString.all(Grammar, '+ 1 2 + 4 5')) // [3, 9], all results
```

Or directly:

```js
console.log(new Grammar().parse('+ 1 2').finish()) // 3
console.log(new Grammar().parse('+ 1 2 + 4 5').finish()) // 9

const gr = new Grammar()
const results = []
gr.on('result', _ => results.push(_))
gr.parse('+ 1 2 + 4 5').finish()
console.log(results) // [3, 9]
```

Grammars are defined as subclasses of Parsers and always start with a
`parseStart` method.

```js
const Parser = require('@iarna/parser')

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
```

## METHODS

### debug()
### parse(buf|str)
### finish()

### result(value)
### next(state)
### goto(state)
### call(state[, returnState])
### callNow(state[, returnState])
### return(value)
### returnNow(value)
### consume([char])
### error([err])

### buf()
### nextChar()
### haveBuffer()
### runOne()

## RESERVED STATES

### parseStart

Overrideme!

### endParse(value)

Stores `value` for returning by `finish()`. Throws if it ever is entered outside of the end.

## TODO

* Obvously, finish docs. On the plus side, tests are 100%, which is keen.
* Maybe create a grammar construction language, to make them more concise, easier to compose.
