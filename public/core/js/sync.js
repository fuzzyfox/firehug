/* global dataStore, moment, jQuery */
/* exported sync */

/**
 * @file Simple localStorage wrapper & data sync.
 *
 * What it does:
 * * Fetches session data from the server and keeps
 *   an up-to-date copy in localStorage.
 * * Provides a ready check which is triggered when there
 *   is a copy of the session data in localStorage
 *
 * @todo fire events indicating online status using `syncInterval`
 * @todo separate into `sync` and `dataStore` exports/files
 *
 * @license MPL-2.0
 */

var sync = (function( window, document, db, moment, $, undefined ) {
  'use strict';

  // couple of variables to help w/ ready state
  var readyFlag = false;
  var readyFns = [];

  /**
   * Trigger functions that depend on data being ready for use
   */
  function ready() {
    if( readyFlag ) {
      return;
    }

    readyFlag = true;

    for( var i = 0, len = readyFns.length; i < len; i++ ) {
      readyFns[ i ].call();
    }
  }

  // flag to indicate online status
  // defaults to browser's indicator
  var online = window.navigator.onLine;

  // set default config for sync
  var config = {
    sync: {
      sessions: '/api/sessions',
      themes: '/api/themes',
      'doc-faq': '/api/doc/faq/md'
    },
    autoHide: true,
    notifications: true
  };

  // if no local config stored use default
  if( ! db.getItem( 'state' ) ) {
    db.setItem( 'state', config );
  }

  // async loop w/ instant run
  (function syncInterval() {
    // do not run syncInterval if not stored
    if( !db.getItem( 'state' ).sync ) {
      return;
    }

    /*
      Sync Session Data
     */
    console.log( 'attempting to sync remote > local data' );

    // if we've not run yet check for local data
    if( !readyFlag ) {
      var state = db.getItem( 'state' );
      if( state && state.lastSync ) {
        ready();
      }
    }

    // sync all requested things
    var syncsInProgress = 0;
    Object.keys( config.sync ).forEach( function( key ) {
      // indicate sync started
      syncsInProgress += 1;

      // create call to api
      var getRemote = $.ajax({
        url: config.sync[ key ],
        cache: false
      });

      // always attempt again in 2mins
      getRemote.always( function() {
        // indicate sync ended
        syncsInProgress -= 1;

        // if no more in progress start timer for loop
        if( !syncsInProgress ) {
          setTimeout( syncInterval, 120000 );
        }
      });

      // if sucessful store locally
      getRemote.done( function( sessions ) {
        db.setItem( key, sessions );

        // @todo replace w/ function to check for changes in schedule
        console.log( '%s updated locally', key );

        // update sync time
        var state = db.getItem( 'state' );
        state.lastSync = moment.tz( $( 'body' ).data( 'timezone' ) ).toISOString();
        db.setItem( 'state', state );

        // trigger ready if no syncs left
        if( !syncsInProgress ) {
          ready();
        }

        // if we're offline we now know we're online
        if( !online ) {
          $( window ).trigger( 'online' );
        }
      });

      // if error fail w/ console output
      getRemote.fail( function( jqXHR, textStatus, errorThrown ) {
        console.error( arguments );

        // if we're online we now know we're not
        if( online ) {
          $( window ).trigger( 'offline' );
        }
      });
    });
  }());

  /*
    detect and handle online/offline events
   */
  $( window ).on( 'online offline', function( event ) {
    online = ( event.type === 'online' );
  });

  return {
    ready: function( fn ) {
      return ( readyFlag ) ? fn.call() : readyFns.push( fn );
    },
    isOnline: function() {
      return online;
    }
  };
})( window, document, dataStore, moment, jQuery );
