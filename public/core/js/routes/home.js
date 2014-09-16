/* global nunjucksEnv, dataStore, jQuery, routes:true */

routes = (function( window, document, routes, nunjucksEnv, db, $, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    home: function() {
      nunjucksEnv.render( 'home.html', {
        state: db.getItem( 'state' )
      }, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the main menu loading.' );
          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-home' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, jQuery );
