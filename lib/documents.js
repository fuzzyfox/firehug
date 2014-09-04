'use strict';

var shared = require( '../shared' );
var redisClient = shared.redisClient;
var env = shared.env;

var redisPrefix = env.get( 'REDIS_PREFIX' ) || 'firehug';
redisPrefix = redisPrefix + ':docs';

/**
 * Get the names + slugs for documents
 *
 * @return {Array} An array of document names (Strings)
 */
function getDocNames() {
  var docNames = [];

  var gDocEnvKeys = Object.keys( env.get() ).filter( function( key ) {
    return ( /^google_doc_/i.test( key ) );
  });

  gDocEnvKeys.forEach( function( key ) {
    var name = key.match( /^google_doc_(.+)$/i )[ 1 ];
    docNames.push( name.toLowerCase() );
  });

  return docNames;
}

/**
 * Gets a document from the redis db based on its slug
 *
 * @param  {String}   slug The slug for the document
 * @param  {Function} done Callback provided w/ `err` (or null) and `document` (or null)
 */
function getDoc( slug, done ) {
  redisClient.get( redisPrefix + ':' + slug, done );
}

module.exports = {
  getDocNames: getDocNames,
  getDoc: getDoc
};
