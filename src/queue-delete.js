const logger = require('./logger')(module)
const enums = require('./enums')
const queueDb = require('./queue-db')
const queueStop = require('./queue-stop')

module.exports = function queueDelete (q, deleteTimeout) {
  logger('deleteQueue')
  return queueStop(q, deleteTimeout, false).then(() => {
    q.ready = false
    return q.r.db(q.db).tableDrop(q.name).run()
  }).then(() => {
    return queueDb.detach(q, true)
  }).then(() => {
    q.emit(enums.status.deleted)
    return true
  })
}
