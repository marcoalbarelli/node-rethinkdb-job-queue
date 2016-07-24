const logger = require('./logger')(module)
const enums = require('./enums')
const queueProcess = require('./queue-process')

module.exports.pause = function interruptionPause (q) {
  logger(`pause`)
  return new Promise((resolve, reject) => {
    q._paused = true
    if (q.running < 1) { return resolve() }
    let intId = setInterval(function pausing () {
      logger(`Pausing, waiting on running jobs: [${q.running}]`)
      if (q.running < 1) {
        clearInterval(intId)
        resolve()
      }
    }, 400)
  }).then(() => {
    logger(`Event: paused [${q.id}]`)
    q.emit(enums.status.paused, q.id)
    return true
  })
}

module.exports.resume = function interruptionResume (q) {
  logger(`resume`)
  return q.ready.then(() => {
    q._paused = false
    queueProcess.restart(q)
    logger(`Event: resumed [${q.id}]`)
    q.emit(enums.status.resumed, q.id)
    return true
  })
}
