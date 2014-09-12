/* global routie, nunjucksEnv, dataStore, moment, jQuery, routes */

(function( window, document, routie, routes, nunjucksEnv, db, moment, $, undefined ) {
  'use strict';

  /*
    load + handle routes
   */
  nunjucksEnv.ready( function() {
    // quick access to where we put rendered views
    var $main = $( 'main' );

    // get the timezone
    var timezone = $( 'body' ).data( 'timezone' );

    // now we can render routes
    routie( '', routes.home );
    routie( 'schedule/:theme?/:day?', routes.schedule );
    routie( 'doc/:name', routes.doc );
    routie( 'settings', routes.settings );

    routie( '*', function() {
      $main.html( 'route not found' ).attr( 'id', '' );
    });
  });
})( window, document, routie, routes, nunjucksEnv, dataStore, moment, jQuery );
