const logger = require('./logger')(module)

module.exports = function summary (q) {
  logger('summary')
  return q.r.db(q.db).table(q.name)
  .group((job) => {
    return job.pluck('status')
  }).count().then((reduction) => {
    const summary = {
      added: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      timeout: 0,
      failed: 0,
      terminated: 0
    }
    for (let stat of reduction) {
      summary[stat.group.status] = stat.reduction
    }
    logger('summary', summary)
    return summary
  })
}
