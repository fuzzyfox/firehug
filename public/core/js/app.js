/* global routie, nunjucksEnv, jQuery, routes, sync */

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

(function( window, document, routie, routes, nunjucksEnv, $, sync, undefined ) {
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
      nunjucksEnv.render( 'error.html', {
        code: 404,
        type: 'warning',
        message: window.location.hash + ' was not found.'
      }, function( err, res ) {
        if( err ) {
          $main.html( window.location.hash + ' was not found.' );
          return console.error( 'failed to load "error.html" partial' );
        }

        $main.html( res );
      });

      $main.attr( 'id', 'error' );
    });
  });

  /*
    detect and handle online/offline events
   */
  $( window ).on( 'online offline', function( event ) {
    console.log( event.type );
  });

  $( sync ).on( 'change', function( event ) {
    console.log( event, arguments );
  });
})( window, document, routie, routes, nunjucksEnv, jQuery, sync );
