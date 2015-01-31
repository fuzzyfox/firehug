/* global nunjucksEnv, jQuery, routes:true, dataStore, sync, moment */

routes = (function( window, document, routes, nunjucksEnv, db, sync, moment, $, undefined ) {
  'use strict';

  var debug = window.debug( 'route:tag' );

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    tag: function( tag ) {
      debug( 'displaying tag %s', tag );
      var context = {
        sessions: db.getItem( 'sessions' ),
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || [],
        theme: '-',
        day: '-',
        tag: tag
      };

      context.sessions = context.sessions.filter( function( session ) {
        session.tags.forEach( function( t, i ) {
          session.tags[ i ] = t.toLowerCase();
        });

        return ( session.tags && session.tags.indexOf( tag.toLowerCase() ) > -1 );
      });

      nunjucksEnv.render( 'tag.html', context, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the schedule loading.' );

          if( context.state.debug ) {
            $main.append( err );
          }

          return debug( err );
        }

        $main.html( res ).attr( 'id', 'view-schedule' );
        debug( 'view rendered' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, sync, moment, jQuery );
