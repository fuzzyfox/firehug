/* global nunjucksEnv, jQuery, routes, moment, dataStore */

routes = (function( window, document, routes, nunjucksEnv, $, moment, db, undefined ) {
  'use strict';

  /*
    private + stateless utils
   */
  var $main = $( 'main' );
  var timezone = $( 'body' ).data( 'timezone' );

  // private state object
  var state = db.getItem( 'state' );

  // toggle setting/option
  $main.on( 'click', 'button[data-toggle]', function() {
    if( $main.attr( 'id' ) === 'view-settings' ) {
      // determine what item + property to toggle
      var item = $( this ).data( 'toggle' ).split( '.' );
      var property = item[ 1 ];
      item = item[ 0 ];

      // toggle item.property + store
      var storedItem = db.getItem( item );
      storedItem[ property ] = !storedItem[ property ];
      db.setItem( item, storedItem );

      window.location.reload();
    }
  });

  // reset storage
  $main.on( 'click', 'button[data-reset]', function() {
    if( $main.attr( 'id' ) === 'view-settings' && confirm( 'Are you sure you want to reset to default state?' ) ) {
      db.clear();
      window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
    }
  });

  // calculate when the next sync attempt is
  function nextSync( lastSync ) {
    var next = moment.tz( lastSync, timezone ).add( 2, 'minutes' );
    var now = moment.tz( timezone );

    while( next.isBefore( now ) ) {
      next.add( 2, 'minutes' );
    }

    return next;
  }

  return $.extend( routes, {
    settings: function() {
      // when ever view loaded update state obj
      state = db.getItem( 'state' );

      nunjucksEnv.render( 'settings.html', {
        localTime: moment(),
        eventTime: moment.tz( timezone ),
        offlineState: {
          appcache: {
            enabled: ( ( window.applicationCache.status !== 0 ) && $( 'html' ).attr( 'manifest' ) ),
            status: window.applicationCache.status,
            statusText: [
              'uncached',
              'idle',
              'checking',
              'downloading',
              'updateready',
              'obsolete'
            ]
          },
          persistantStorage: db.persistant,
          online: window.navigator.onLine
        },
        state: $.extend( state, {
          nextSync: nextSync( state.lastSync )
        })
      }, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the settings page loading.' );

          if( state.debug ) {
            $main.append( err );
          }

          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-settings' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, jQuery, moment, dataStore );
