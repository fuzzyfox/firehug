'use strict';

var redis = require('redis');
var nconf = require('nconf');

nconf.argv().env().file({
  file: 'local.json'
});

function getRedisClient() {
  if (process.env.VCAP_SERVICES) {
    var redisconf = JSON.parse(process.env.VCAP_SERVICES).redis[0].credentials;
    var db = redis.createClient(redisconf.port, redisconf.host);
    db.auth(redisconf.password);
    return db;
  }
  if(process.env.REDISTOGO_URL){
    var rtg = require('url').parse(process.env.REDISTOGO_URL);
    var db = redis.createClient(rtg.port, rtg.hostname);
    db.auth(rtg.auth.split(':')[1]);
    return db;
  }
  return redis.createClient();
}

module.exports = {
  nconf: nconf,
  redisClient: getRedisClient()
}