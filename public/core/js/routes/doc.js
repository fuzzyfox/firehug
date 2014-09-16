/* global nunjucksEnv, jQuery, routes:true, dataStore, sync */

routes = (function( window, document, routes, nunjucksEnv, db, sync, $, undefined ) {
  'use strict';

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
      var getDoc = $.ajax({
        url: '/api/doc/' + docSlug + '/md'
      });

      getDoc.done( function( doc ) {
        $main.html( doc ).attr( 'id', 'view-doc-' + docSlug );

        // if we make a connection while offline, we must be online
        if( !sync.isOnline() ) {
          $( window ).trigger( 'online' );
        }
      });

      getDoc.fail( function() {
        // if a live load fails attempt a local load
        if( localDocs()[ docSlug ] ) {
          $main.html( localDocs()[ docSlug ] ).attr( 'id', 'view-doc-' + docSlug );
          return;
        }


        $main.html( arguments[ 2 ] ).attr( 'view-doc-' + docSlug );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, sync, jQuery );
