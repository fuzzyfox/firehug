/**
 * remoteConfig.js
 *
 * Gets config items from the Redis database, that have been stored
 * there from the Google Spreadsheet sessions are pulled from.
 *
 * *Taken from ThunderHug {@link https://github.com/mozilla/thunderhug/blob/2fdd08f23cb/lib/remoteConfig.js}
 */

'use strict';

var shared = require( '../shared' );
var redisClient = shared.redisClient;
var env = shared.env;
var debug = shared.debug;

// remote config sheet (from redis db)
var redisPrefix = env.get( 'REDIS_PREFIX' ) || 'firehug';
redisPrefix = redisPrefix + ':sheets';

var redisKey = redisPrefix + ':meta';

// local copy (restructured for easier lookup)
var localStore = {};

/**
 * Determine of object is empty
 *
 * hat tip {@link http://stackoverflow.com/questions/4994201/is-object-empty}
 * @param  {Object}  obj Object to check
 * @return {Boolean}     True if empty
 */
function isEmpty( obj ) {
  // null and undefined are "empty"
  if( obj === null || typeof obj === 'undefined' ) {
    return true;
  }

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if( obj.length && obj.length > 0 ) {
    return false;
  }
  if( obj.length === 0 ) {
    return true;
  }

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and toValue enumeration bugs in IE < 9
  for( var key in obj ) {
    if ( hasOwnProperty.call( obj, key ) ) {
      return false;
    }
  }

  return true;
}

/**
 * Fetch remote config on regular interval (defaults to 5mins)
 *
 * @param  {Integer} noConfigCalls Number of successive calls w/o config returned
 */
(function fetchRemoteConfig( noConfigCalls ) {
  if( noConfigCalls && noConfigCalls > 9 ) {
    throw new Error( 'Unable to load remote config' );
  }

  redisClient.get( redisKey, function( err, config ) {
    if( err ) {
      return console.error( err );
    }

    if( config !== null ) {
      config = JSON.parse( config );

      config.data.forEach( function( configItem ) {
        if( localStore[ configItem.key ] === undefined ) {
          localStore[ configItem.key ] = {};
        }
        localStore[ configItem.key ][ configItem.type ] = configItem.value;
      });

      return;
    }

    // if we have no config try again in half a second
    // up to 10 times before failing + thowing error
    setTimeout( function(){
      if( noConfigCalls !== undefined ) {
        return fetchRemoteConfig( noConfigCalls + 1 );
      }

      fetchRemoteConfig( 0 );
    }, 100 );
  });

  // run this on the same schedule as
  setTimeout( fetchRemoteConfig, env.get( 'POLL_INTERVAL' ) || 300000 );
}());

/**
 * Get a composite-key's value
 *
 * @param  {String} key The composite-key to search for in format `"key:type"`
 * @return {String}     Value of the key or undefined
 */
function get( compositeKey ) {
  var keyFragments = compositeKey.split( ':' );
  var key = keyFragments[ 0 ];
  var type = keyFragments[ 1 ];

  // check key exists first
  if( !localStore[ key ] ) {
    return debug( 'key "%s" not found in remote config', compositeKey );
  }

  return localStore[ key ][ type ];
}

/**
 * Gets all items associated w/ a key
 *
 * @param  {String} key The key to get
 * @return {Object}     The object assocaited w/ that key
 */
function getKey( key ) {
  if( localStore[ key ] !== undefined ) {
    return JSON.parse( JSON.stringify( localStore[ key ] ) );
  }

  return debug( 'key "%s" not found in remote config', key );
}

/**
 * Return all keys by type and their values
 *
 * @param  {String} type The type to get key:value by
 * @return {Object}      Object of key:value's else undefined
 */
function getType( type ) {
  var rtn = {};

  for( var keyName in localStore ) {
    var key = localStore[ keyName ];

    if( key[ type ] ) {
      rtn[ keyName ] = key[ type ];
    }
  }

  if( isEmpty( rtn ) ) {
    return debug( 'type "%s" not found in remote config', type );
  }

  return rtn;
}

/**
 * Perform a reverse lookup for a values key.
 *
 * Note: returns the first match only.
 *
 * @param  {String} value The value to look for
 * @return {Object}       An object containing the key + type. Empty objecy on fail.
 */
function reverseLookup( value ) {
  // loop through all keys
  for( var keyName in localStore ) {
    var key = localStore[ keyName ];

    // loop through all types
    for( var type in key ) {

      // check if we found it
      if( key[ type ] === value ) {
        // create object for successful find
        return {
          key: keyName,
          type: type
        };
      }
    }
  }
  debug( 'value "%s" not found in remote config', value );
  return {};
}

module.exports = {
  get: get,
  getKey: getKey,
  getType: getType,
  reverseLookup: reverseLookup
};
