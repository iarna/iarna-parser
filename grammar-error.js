'use strict'

class GrammarError extends Error {
  /* istanbul ignore next */
  constructor (msg, filename, linenumber) {
    super('[GrammarError] ' + msg, filename, linenumber)
    this.name = 'GrammarError'
    this.code = 'GrammarError'
    if (Error.captureStackTrace) Error.captureStackTrace(this, GrammarError)
  }
}

module.exports = GrammarError
