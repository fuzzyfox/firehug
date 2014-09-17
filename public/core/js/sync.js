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
  var exports = {};

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

  // detect and handle online/offline events
  $( window ).on( 'online offline', function( event ) {
    online = ( event.type === 'online' );
  });

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

  /**
   * Instant run, asynchronous interval to poll api for
   * data every 2mins
   */
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
      getRemote.done( function( newData ) {
        var oldData = db.getItem( key );

        // only do checks if old data exists
        if( oldData ) {
          // if sessions lets figure out what changes (if any) occured
          if( key !== 'sessions' && JSON.stringify( oldData ) !== JSON.stringify( newData ) ) {
            $( exports ).trigger( 'change.' + key, [ oldData, newData ] );
            console.log( '%s updated locally', key );
          }
          else if( key === 'sessions' ) {
            // compare function for sorting sessions by id
            var idCompare = function ( a, b ) {
              if( a.id > b.id ) {
                return 1;
              }

              if( a.id < b.id ) {
                return -1;
              }

              return 0;
            };

            oldData.sort( idCompare );
            var sortedNewData = newData.slice( 0 );
            sortedNewData.sort( idCompare );

            var c1 = 0; // position in old data
            var c2 = 0; // position in new data
            var oLen = oldData.length;
            var nLen = sortedNewData.length;

            var changeset = {
              added: [],
              changed: [],
              removed: []
            };

            while( c1 < oLen && c2 < nLen ) {
              // objects same session
              if( oldData[ c1 ].id === sortedNewData[ c2 ].id ) {
                // check for detail changes
                if( JSON.stringify( oldData[ c1 ] ) !== JSON.stringify( sortedNewData[ c2 ] ) ) {
                  changeset.changed.push( oldData[ c1 ].id );
                }
                c1++; c2++;
                continue;
              }

              // new session found
              if( oldData[ c1 ].id > sortedNewData[ c2 ] ) {
                changeset.added.push( sortedNewData[ c2 ].id );
                c2++;
                continue;
              }

              // session removed (old < new)
              changeset.removed.push( oldData[ c1 ].id );
              c1++;
            }

            // everything left in oldData has been removed
            while( c1 < oLen ) {
              changeset.removed.push( oldData[ c1 ].id );
              c1++;
            }

            // everything left in sortedNewData is new
            while( c2 < nLen ) {
              changeset.added.push( sortedNewData[ c2 ].id );
              c2++;
            }

            // trigger change event w/ changeset
            $( exports ).trigger( 'change.' + key, [ oldData, newData, changeset ] );

            if( changeset.added.length || changeset.changed.length || changeset.removed.length ) {
              console.log( '%s updated locally', key );
            }
          }
        }

        // store new data
        db.setItem( key, newData );

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

  exports.ready = function( fn ) {
    return ( readyFlag ) ? fn.call() : readyFns.push( fn );
  };
  exports.isOnline = function() {
    return online;
  };

  return exports;
})( window, document, dataStore, moment, jQuery );
