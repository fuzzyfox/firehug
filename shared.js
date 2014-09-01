'use strict';

// all the environments
var env = require( 'nconf' ).argv()
                            .env()
                            .file( { file: 'local.json' } );

// custom debug function (console.log only when debug flag set)
function debug() {
  if( env.get( 'debug' ) || env.get( 'DEBUG' ) ) {
    return console.log.apply( null, arguments );
  }

  return;
}

// get redis client
var redis = require( 'redis' );

function  getRedisClient() {
  var redisConf = {};
  var db = {};

  if( env.get( 'VCAP_SERVICES' ) ) {
    redisConf = JSON.parse( env.get( 'VCAP_SERVICES' ).redis[ 0 ].credentials );
    db = redis.createClient( redisConf.port, redisConf.host );
    return db;
  }

  if( env.get( 'REDISTOGO_URL' ) ) {
    redisConf = require( 'url' ).parse( env.get( 'REDISTOGO_URL' ) );
    db = redis.createClient( redisConf.port, redisConf.hostname );
    db.auth( redisConf.auth.split( ':' )[ 1 ] );
    return db;
  }

  return redis.createClient();
}

module.exports = {
  env: env,
  nconf: env, // legacy support to be removed.
  debug: debug,
  redisClient: getRedisClient()
};
