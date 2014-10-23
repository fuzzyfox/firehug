/* global nunjucksEnv, jQuery, routes:true, dataStore */

routes = (function( window, document, routes, nunjucksEnv, $, db, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    map: function( location ) {
      var context = {
        svg: '',
        location: {
          name: '',
          id: 0,
          // HACK HACK HACK - mozfest specific (to be removed for whitelabel)
          lookup: {
            'm': {
              name: 'Mezzanine Floor',
              id: 'm'
            },
            0: {
              name: 'Ground Floor',
              id: 0
            },
            1: {
              name: '1st Floor',
              id: 1
            },
            2: {
              name: '2nd Floor',
              id: 2
            },
            3: {
              name: '3rd Floor',
              id: 3
            },
            4: {
              name: '4th Floor',
              id: 4
            },
            5: {
              name: '5th Floor',
              id: 5
            },
            6: {
              name: '6th Floor',
              id: 6
            },
            7: {
              name: '7th Floor',
              id: 7
            },
            8: {
              name: '8th Floor',
              id: 8
            },
            9: {
              name: '9th Floor',
              id: 9
            }
          }
          // END HACK HACK HACK
        }
      };

      location = location || db.getItem( 'state' ).floor || '0';

      $main.attr( 'id', 'view-map' );

      if( /[m0-9]/i.test( location.charAt( 0 ) ) ) {
        context.location.id = location.charAt( 0 );

        // ensure m is lower case (if even an m)
        if( context.location.id.toLowerCase() === 'm' ) {
          context.location.id = 'm';
        }

        // set location name using lookup
        context.location.name = context.location.lookup[ context.location.id ].name;

        // load map
        var loadMap = $.ajax({
          url: '/theme/imgs/maps/floor_' + context.location.id + '.svg',
          dataType: 'html'
        });

        loadMap.done( function( svg ) {
          context.svg = svg;

          nunjucksEnv.render( 'map.html', context, function( err, res ) {
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
