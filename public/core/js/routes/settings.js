/* global nunjucksEnv, jQuery, routes:true, moment, dataStore, sync */

/**
 * @file /#settings route logic + render
 *
 * /#settings is responsible for showing + toggling
 * app settings/state. It doubles as a debug view
 * showing infromation about clocks, sync, appcache etc...
 * when `state.debug` is truthful. Useful for at a
 * glance details about the state of the app + for debug
 * toubleshooting on mobile devices.
 *
 * @license MPL-2.0
 */

routes = (function( window, document, routes, nunjucksEnv, $, moment, db, sync, undefined ) {
  'use strict';

  var debug = window.debug( 'route:settings' );

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

      if( db.getItem( 'state' ).debug ) {
        window.debug.enable( '*' );
      }
      else {
        window.debug.disable( '*' );
      }

      window.location.reload();
    }
  });

  // reset storage
  $main.on( 'click', 'button[data-reset]', function() {
    if( $main.attr( 'id' ) === 'view-settings' && window.confirm( 'Are you sure you want to reset to default state?' ) ) {
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
          online: sync.isOnline()
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

          return debug( err );
        }

        $main.html( res ).attr( 'id', 'view-settings' );
        debug( 'view rendered' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, jQuery, moment, dataStore, sync );
