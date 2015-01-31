/* global dataStore, jQuery, sync, moment, dataStore, notify */

(function( window, document, db, $, sync, moment, notify, undefined ) {
  'use strict';

  var debug = window.debug( 'sessions:tracking' );

  var $main = $( 'main' );
  var timezone = $( 'body' ).data( 'timezone' );

  /*
    toggle session tracking
   */
  $main.on( 'click', '.session [data-tracked-session]', function() {
    var trackedSessions = db.getItem( 'tracked-sessions' ) || [];
    var sessionId = $( this ).parent( '.session' ).data( 'session-id' );

    // if tracked (using json parse to turn value into boolean flag)
    if( JSON.parse( $( this ).attr( 'data-tracked-session' ) ) ) {
      // toggle tracked state
      $( this ).attr( 'data-tracked-session', false );

      // remove session from tracked array
      if( trackedSessions.indexOf( sessionId ) > -1 ) {
        debug( 'no longer tracking session %s', sessionId );
        trackedSessions.splice( trackedSessions.indexOf( sessionId ), 1 );

        db.setItem( 'tracked-sessions', trackedSessions );
      }

      return;
    }

    // toggle tracked state
    $( this ).attr( 'data-tracked-session', true );

    // add session to tracked array
    if( trackedSessions.indexOf( sessionId ) === -1 ) {
      debug( 'now tracking session %s', sessionId );
      trackedSessions.push( sessionId );

      db.setItem( 'tracked-sessions', trackedSessions );
    }
  });


  /*
    detect changes to the sessions
   */
  $( sync ).on( 'change.sessions', function( event, oldData, newData, changeset ) {
    var trackedSessions = db.getItem( 'tracked-sessions' ) || [];

    debug( changeset );

    // notify of new sessions
    if( changeset.added.length ) {

      var newSessions = newData.filter( function( session ) {
        return ( changeset.added.indexOf( session.id ) > -1 );
      });

      if( newSessions.length <= 5 ) {
        newSessions.forEach( function( session, idx ) {
          notify( session.title + ' was added to the schedule.', undefined, 'plus', ( 3 + ( 3 * idx ) ) );
        });
      }
      else {
        notify( newSessions.length + ' sessions were added to the schedule.', undefined, 'plus', 3 );
      }
    }

    // notify of changed (tracked) sessions
    if( changeset.changed.length ) {
      // get list of changed tracked sessions
      var changedSessions = changeset.changed.filter( function( sessionId ) {
        return ( trackedSessions.indexOf( sessionId ) > -1 );
      });

      // notify for each (w/ details)
      changedSessions.forEach( function( sessionId ) {
        // get old session details
        var oldSession = oldData.filter( function( session ) {
          return ( session.id === sessionId );
        })[ 0 ];
        // get update details
        var newSession = newData.filter( function( session ) {
          return ( session.id === sessionId );
        })[ 0 ];

        // work out if it was location OR time (don't care about anything else).
        // both time + location changed
        if( ( oldSession.start !== newSession.start ) &&
            ( oldSession.location !== newSession.location ) ) {
          notify( 'Update to "' + oldSession.title + '"', '"' + oldSession.title + '" now starts at ' + moment.tz( newSession.start, timezone ).format( 'HH:mm' ) + ' in ' + newSession.location, 'clock-o' );
        }
        // time changed
        else if( ( oldSession.start !== newSession.start ) &&
            ( oldSession.location === newSession.location ) ) {
          notify( 'Update to "' + oldSession.title + '"', '"' + oldSession.title + '" now starts at ' + moment.tz( newSession.start, timezone ).format( 'HH:mm' ), 'clock-o' );
        }
        // location changed
        else if( ( oldSession.start === newSession.start ) &&
            ( oldSession.location !== newSession.location ) ) {
          notify( 'Update to "' + oldSession.title + '"', '"' + oldSession.title + '" is now in ' + newSession.loaction, 'map-marker' );
        }
      });
    }
  });
})( window, document, dataStore, jQuery, sync, moment, notify );
