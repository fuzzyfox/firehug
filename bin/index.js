'use strict';

var schedule = require('node-schedule');
var fork = require('child_process').fork;

var rule0min = new schedule.RecurrenceRule();
rule0min.minute = 0;

var rule15min = new schedule.RecurrenceRule();
rule15min.minute = 15;

var rule30min = new schedule.RecurrenceRule();
rule30min.minute = 30;

var rule45min = new schedule.RecurrenceRule();
rule45min.minute = 45;

// var getUsers;
// function getUsersFork() {
//   if (getUsers) {
//     getUsers.kill();
//     return;
//   }
//   console.log('getUsers forked.');
//   getUsers = fork(__dirname + '/getUsers');
//   getUsers.on('exit', function (code, signal) {
//     console.log('getUsers exited. code: %d - signal: %d', code, signal);
//     getUsers = null;
//   });
// }

var getSchedule;
function getScheduleFork() {
  if (getSchedule) {
    getSchedule.kill();
    return;
  }
  console.log('getSchedule forked.');
  getSchedule = fork(__dirname + '/getSchedule');
  getSchedule.on('exit', function (code, signal) {
    console.log('getSchedule exited. code: %d - signal: %d', code, signal);
    getSchedule = null;
  });
}

var getBadges;
function getBadgesFork() {
  if (getBadges) {
    getBadges.kill();
    return;
  }
  console.log('getBadges forked.');
  getBadges = fork(__dirname + '/getBadges');
  getBadges.on('exit', function (code, signal) {
    console.log('getBadges exited. code: %d - signal: %d', code, signal);
    getBadges = null;
  });
}

var getFAQ;
function getFAQFork() {
  if (getFAQ) {
    getFAQ.kill();
    return;
  }
  console.log('getFAQ forked.');
  getFAQ = fork(__dirname + '/getFAQ');
  getFAQ.on('exit', function (code, signal) {
    console.log('getFAQ exited. code: %d - signal: %d', code, signal);
    getFAQ = null;
  });
}

// schedule.scheduleJob(rule15min, function() {
//   getUsersFork();
// });
// getUsersFork();
schedule.scheduleJob(rule0min, function() {
  getScheduleFork();
  getBadgesFork();
  getFAQFork();
});
schedule.scheduleJob(rule15min, function() {
  getScheduleFork();
  getBadgesFork();
  getFAQFork();
});
schedule.scheduleJob(rule30min, function() {
  getScheduleFork();
  getBadgesFork();
  getFAQFork();
});
schedule.scheduleJob(rule45min, function() {
  getScheduleFork();
  getBadgesFork();
  getFAQFork();
});
getScheduleFork();
getBadgesFork();
getFAQFork();
