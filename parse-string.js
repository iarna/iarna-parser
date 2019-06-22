'use strict'

function parseOne (Grammar, str) {
  const gr = new Grammar()
  return gr.parse(str).finish()
}

function parseMany (Grammar, str) {
  const gr = new Grammar()
  const results = []
  gr.on('result', _ => results.push(_))
  gr.parse(str).finish()
  return results
}

function parseOneDebug (Grammar, str) {
  const gr = new Grammar().debug()
  return gr.parse(str).finish()
}

function parseManyDebug (Grammar, str) {
  const gr = new Grammar().debug()
  const results = []
  gr.on('result', _ => results.push(_))
  gr.parse(str).finish()
  return results
}

module.exports = parseOne
module.exports.all = parseMany
module.exports.debug = parseOneDebug
module.exports.all.debug = parseManyDebug
