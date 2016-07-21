const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('XXXXXXXX', (t) => {
      t.plan(2)

      const q = testQueue()
      const job = q.createJob(testData)

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function completedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job completed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.completed, completedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.completed, completedEventHandler)
      }

      q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        addEventHandlers()

        // ---------- First Test ----------

        removeEventHandlers()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
