/* global routie, nunjucksEnv, jQuery, routes */

/**
 * @file App wide logic
 *
 * Here is all the app wide logic that has no other home
 * to go to. It includes:
 *
 * * route initialization
 *
 * @license MPL-2.0
 */

(function( window, document, routie, routes, nunjucksEnv, $, undefined ) {
  'use strict';

  /*
    load + handle routes
   */
  nunjucksEnv.ready( function() {
    // quick access to where we put rendered views
    var $main = $( 'main' );

    // now we can render routes
    routie( '', routes.home );
    routie( 'schedule/:theme?/:day?', routes.schedule );
    routie( 'doc/:name', routes.doc );
    routie( 'settings', routes.settings );

    routie( '*', function() {
      $main.html( 'route not found' ).attr( 'id', '' );
    });
  });
})( window, document, routie, routes, nunjucksEnv, jQuery );
