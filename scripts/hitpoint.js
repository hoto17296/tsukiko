var hpMax = 100;
var hpMin = 0;
var cron = require('../lib/cron');

module.exports = function(robot) {
  cron('0 0 9 * * 7', function() {
    var list = robot.brain.data;
    for(var key in list._private){
      robot.brain.set(key, hpMax);
    }
  });

  robot.respond(/attack (\w+)/i, function(msg) {
    var user = msg.match[1];
    var hp = robot.brain.get(user) || hpMax;
    hp = (hp !== null) ? hp : hpMax;
    hp = Math.max(hp - 10, hpMin);
    robot.brain.set(user, hp);
    msg.reply(user + 'は攻撃された' + 'HP' + robot.brain.get(user) + '/' + hpMax);
  });

  robot.respond(/care (\w+)/i, function(msg) {
    var user = msg.match[1];
    var hp = robot.brain.get(user);
    hp = (hp !== null) ? hp : hpMax;
    hp = Math.min(hp + 10, hpMax);
    robot.brain.set(user, hp);
    msg.reply(user + 'は回復した' + 'HP' + robot.brain.get(user) + '/' + hpMax);
  });

  robot.respond(/status/, function(msg) {
    var list = robot.brain.data;
    var status = new Array();
    for(var key in list._private){
      status.push(key + ' HP:' + list._private[key] + '/' + hpMax);
    }
    msg.reply(status.join("\n"));
  });
};


