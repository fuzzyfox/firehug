/* global dataStore, jQuery, sync */

(function( window, document, db, $, sync, undefined ) {
  'use strict';

  var $main = $( 'main' );

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
        console.log( 'no longer tracking session %s', sessionId );
        trackedSessions.splice( trackedSessions.indexOf( sessionId ), 1 );

        console.log( trackedSessions, sessionId );
        db.setItem( 'tracked-sessions', trackedSessions );
      }

      return;
    }

    // toggle tracked state
    $( this ).attr( 'data-tracked-session', true );

    // add session to tracked array
    if( trackedSessions.indexOf( sessionId ) === -1 ) {
      console.log( 'now tracking session %s', sessionId );
      trackedSessions.push( sessionId );
      console.log( trackedSessions, sessionId );
      db.setItem( 'tracked-sessions', trackedSessions );
    }
  });

})( window, document, dataStore, jQuery, sync );
