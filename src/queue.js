const logger = require('./logger')(module)
const EventEmitter = require('events').EventEmitter
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const Job = require('./job')
const dbReview = require('./db-review')
const queueDb = require('./queue-db')
const queueProcess = require('./queue-process')
const queueAddJob = require('./queue-add-job')
const queueGetJob = require('./queue-get-job')
const queueInterruption = require('./queue-interruption')
const queueCancelJob = require('./queue-cancel-job')
const queueRemoveJob = require('./queue-remove-job')
const queueReset = require('./queue-reset')
const queueSummary = require('./queue-summary')
const queueStop = require('./queue-stop')
const queueDrop = require('./queue-drop')
const jobOptions = require('./job-options')

class Queue extends EventEmitter {

  constructor (options) {
    super()
    logger('Queue Constructor', options)

    options = options || {}
    this._name = options.name || enums.options.name
    this._host = options.host || enums.options.host
    this._port = options.port || enums.options.port
    this._db = options.db || enums.options.db
    this._r = false
    this._master = options.master == null ? true
      : options.master
    this._masterInterval = options.masterInterval ||
      enums.options.masterInterval
    this._jobOptions = jobOptions()
    this._changeFeedCursor = false
    this._paused = false
    this._running = 0
    this._changeFeed = options.changeFeed == null
      ? true : options.changeFeed
    this._concurrency = options.concurrency > 1
      ? options.concurrency : enums.options.concurrency
    this._removeFinishedJobs = options.removeFinishedJobs == null
      ? enums.options.removeFinishedJobs : options.removeFinishedJobs
    this._handler = false
    this._id = [
      require('os').hostname(),
      this.db,
      this.name,
      process.pid
    ].join(':')
    queueDb.attach(this)
  }

  get name () { return this._name }
  get id () { return this._id }
  get host () { return this._host }
  get port () { return this._port }
  get db () { return this._db }
  get r () { return this._r }
  get connection () { return this.r }
  get changeFeed () { return this._changeFeed }
  get master () { return this._master }
  get masterInterval () { return this._masterInterval }
  get jobOptions () { return this._jobOptions }
  get removeFinishedJobs () { return this._removeFinishedJobs }
  get running () { return this._running }
  get concurrency () { return this._concurrency }
  get paused () { return this._paused }
  get idle () { return this._running < 1 }

  set jobOptions (options) {
    logger('set jobOptions', options)
    this._jobOptions = jobOptions(options)
  }

  set concurrency (value) {
    if (!is.integer(value) || value < 1) {
      this.emit(enums.status.error,
        new Error(enums.message.concurrencyInvalid),
        value)
      return
    }
    this._concurrency = value
  }

  createJob (data, options = this.jobOptions, quantity = 1) {
    logger('createJob', data, options, quantity)
    if (is.integer(options)) {
      quantity = options
      options = this.jobOptions
    }
    if (quantity > 1) {
      const jobs = []
      for (let i = 0; i < quantity; i++) {
        jobs.push(new Job(this, data, options))
      }
      return jobs
    }
    return new Job(this, data, options)
  }

  addJob (job) {
    logger('addJob', job)
    return this.ready.then(() => {
      return queueAddJob(this, job)
    })
  }

  getJob (jobId) {
    logger('getJob', jobId)
    return this.ready.then(() => {
      return queueGetJob(this, jobId)
    })
  }

  cancelJob (job, reason) {
    logger('cancelJob', job, reason)
    return this.ready.then(() => {
      return queueCancelJob(this, job, reason)
    })
  }

  removeJob (job) {
    logger('removeJob', job)
    return this.ready.then(() => {
      return queueRemoveJob(this, job)
    })
  }

  process (handler) {
    logger('process', handler)
    return this.ready.then(() => {
      return queueProcess.addHandler(this, handler)
    })
  }

  review () {
    logger('review')
    return this.ready.then(() => {
      return dbReview.runOnce(this)
    })
  }

  summary () {
    logger('summary')
    return this.ready.then(() => {
      return queueSummary(this)
    })
  }

  pause () {
    logger(`pause`)
    return this.ready.then(() => {
      return queueInterruption.pause(this)
    })
  }

  resume () {
    logger(`resume`)
    return this.ready.then(() => {
      return queueInterruption.resume(this)
    })
  }

  reset () {
    logger('reset')
    return this.ready.then(() => {
      return queueReset(this)
    })
  }

  stop () {
    logger('stop')
    return queueStop(this)
  }

  drop () {
    logger('drop')
    return queueDrop(this)
  }
}

module.exports = Queue
