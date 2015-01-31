// all the environments
var env = require( 'nconf' ).argv()
                            .env()
                            .file( { file: 'local.json' } )
                            .defaults({
                              'JOB_SCHEDULE': '*/5 * * * *',
                              'REDIS_PREFIX': 'firehug',
                              'EVENT_TIMEZONE': 'Europe/London',
                              'SPLASH': true,
                              'PORT': 5000
                            });

// setup debugging
var debug = require( 'debug' );
process.env.DEBUG_COLORS = true;
debug.enable( env.get( 'DEBUG' ) );
debug.useColors();

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
