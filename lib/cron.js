// startNow を指定しなかったら true を指定するようにラップした CronJob
'use strict';

let CronJob = require('cron').CronJob;

module.exports = (cronTime, onTick, onComplete, startNow, timeZone, context) => {
  if ( startNow === undefined ) {
    startNow = true;
  }
  new CronJob(cronTime, onTick, onComplete, startNow, timeZone, context);
};
