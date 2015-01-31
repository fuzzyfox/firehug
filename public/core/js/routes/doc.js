/* global nunjucksEnv, jQuery, routes:true, dataStore, sync */

routes = (function( window, document, routes, nunjucksEnv, db, sync, $, undefined ) {
  'use strict';

  var debug = window.debug( 'route:docs' );

  // private + stateless utils
  var $main = $( 'main' );

  /**
   * Gets all the locally stored docs into one object
   *
   * @return {Object} key:value store for docs where key = docSlug
   */
  function localDocs() {
    var docs = {};

    db.keys().forEach( function( key ) {
      // docs are stored as doc-{docSlug}
      if( /^doc-/i.test( key ) ) {
        var docSlug = key.substring( 4 ); // found a doc, shorten key to docSlug
        docs[ docSlug ] = db.getItem( key );
      }
    });

    return docs;
  }

  return $.extend( routes, {
    doc: function( docSlug ) {
      debug( 'Fetching doc %s from api', docSlug );
      var getDoc = $.ajax({
        url: '/api/doc/' + docSlug + '/md'
      });

      getDoc.done( function( doc ) {
        debug( 'Got doc %s', docSlug );
        $main.html( doc ).attr( 'id', 'view-doc-' + docSlug );

        // if we make a connection while offline, we must be online
        if( !sync.isOnline() ) {
          $( window ).trigger( 'online' );
        }
      });

      getDoc.fail( function() {
        debug( 'Failed to get doc %s', docSlug );
        // if a live load fails attempt a local load
        if( localDocs()[ docSlug ] ) {
          debug( 'Loading doc %s from localstorage', docSlug );
          $main.html( localDocs()[ docSlug ] ).attr( 'id', 'view-doc-' + docSlug );
          return debug( 'doc rendered' );
        }

        $main.html( arguments[ 2 ] ).attr( 'view-doc-' + docSlug );
        debug( arguments );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, sync, jQuery );
