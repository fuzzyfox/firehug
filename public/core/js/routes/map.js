/* global nunjucksEnv, jQuery, routes:true, dataStore */

routes = (function( window, document, routes, nunjucksEnv, $, db, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    map: function( location ) {
      location = location || db.getItem( 'state' ).floor || '0';

      $main.attr( 'id', 'view-map' );

      if( /[m0-9]/i.test( location.charAt( 0 ) ) ) {
        var locationId = location.charAt( 0 );

        // ensure m is lower case (if even an m)
        if( locationId.toLowerCase() === 'm' ) {
          locationId = 'm';
        }
        console.log( locationId );
        // load map
        var loadMap = $.ajax({
          url: '/theme/imgs/maps/floor_' + locationId + '.svg',
          dataType: 'html'
        });

        loadMap.done( function( svg ) {
          console.log( 'got map' );
          nunjucksEnv.render( 'map.html', {
            svg: svg,
            locationId: locationId
          }, function( err, res ) {

            // $( '#currentMap' ).html( svg );
            $main.html( res );
          });
        });

        loadMap.fail( function() {
          console.log( 'failed to load map' );
        });
      }
      // if not a valid start character to generate a map throw 404 error to use
      else {
        return nunjucksEnv.render( 'error.html', {
          code: 404,
          type: 'warning',
          message: window.location.hash + ' was not found.'
        }, function( err, res ) {
          if( err ) {
            $main.html( window.location.hash + ' was not found.' );
            return console.error( 'failed to load "error.html" partial' );
          }

          $main.html( res );
          $main.attr( 'id', 'error' );
        });
      }
    }
  });
})( window, document, routes, nunjucksEnv, jQuery, dataStore );
