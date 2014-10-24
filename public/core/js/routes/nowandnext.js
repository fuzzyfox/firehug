/* global nunjucksEnv, jQuery, routes:true, dataStore, moment */

routes = (function( window, document, routes, nunjucksEnv, $, db, moment, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );
  // var timezone = $( 'body' ).data( 'timezone' );

  return $.extend( routes, {
    nowandnext: function( themeSlug ) {
      var context = {
        theme: db.getItem( 'themes' ),
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || []
      };

      var sessions = db.getItem( 'sessions' );

      // select correct theme for nj
      context.theme = context.theme.filter( function( theme ) {
        return ( theme.slug === themeSlug );
      })[ 0 ];

      // filter sessions by theme
      sessions = sessions.filter( function( session ) {
        return ( session.themeSlug === themeSlug );
      });

      // filter for sessions happening now
      context.now = sessions.filter( function( session ) {
        return ( moment( session.start ).isBefore( moment() ) && moment( session.end ).isAfter( moment() ) );
      });

      // filter for next 5 sessions
      var nextCount = 0;
      context.next = sessions.filter( function( session ) {
        nextCount++;
        return ( moment( session.start ).isAfter( moment() ) &&
                 moment( session.start ).isBefore( moment().endOf( 'day' ) ) &&
                 ( nextCount <= 5 ) );
      });

      nunjucksEnv.render( 'nowandnext.html', context, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the schedule loading.' );

          if( context.state.debug ) {
            $main.append( err );
          }

          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-nowandnext' );

        // todo - update in a similar manner to autohide
      });
    }
  });
})( window, document, routes, nunjucksEnv, jQuery, dataStore, moment );
