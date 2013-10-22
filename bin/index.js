'use strict';

var schedule = require('node-schedule');
var fork = require('child_process').fork;

var rule0min = new schedule.RecurrenceRule();
rule0min.minute = 0;
var rule5min = new schedule.RecurrenceRule();
rule5min.minute = 5;
var rule10min = new schedule.RecurrenceRule();
rule10min.minute = 10;
var rule15min = new schedule.RecurrenceRule();
rule15min.minute = 15;
var rule20min = new schedule.RecurrenceRule();
rule20min.minute = 20;
var rule25min = new schedule.RecurrenceRule();
rule25min.minute = 25;
var rule30min = new schedule.RecurrenceRule();
rule30min.minute = 30;
var rule35min = new schedule.RecurrenceRule();
rule35min.minute = 35;
var rule40min = new schedule.RecurrenceRule();
rule40min.minute = 40;
var rule45min = new schedule.RecurrenceRule();
rule45min.minute = 45;
var rule50min = new schedule.RecurrenceRule();
rule50min.minute = 50;
var rule55min = new schedule.RecurrenceRule();
rule55min.minute = 55;

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
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule5min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule10min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule15min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule20min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule25min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule30min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule35min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule40min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule45min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule50min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});
schedule.scheduleJob(rule55min, function() {
  getScheduleFork(); getBadgesFork(); getFAQFork();
});


getScheduleFork();
getBadgesFork();
getFAQFork();
