/* global nunjucksEnv, dataStore, jQuery, routes:true */

routes = (function( window, document, routes, nunjucksEnv, db, $, undefined ) {
  'use strict';

  var debug = window.debug( 'route:home' );

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    home: function() {
      nunjucksEnv.render( 'home.html', {
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || []
      }, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the main menu loading.' );
          return debug( err );
        }

        $main.html( res ).attr( 'id', 'view-home' );
        debug( 'view rendered' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, jQuery );
