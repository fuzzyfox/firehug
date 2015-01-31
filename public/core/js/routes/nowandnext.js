/* global nunjucksEnv, jQuery, routes:true, dataStore, moment */

routes = (function( window, document, routes, nunjucksEnv, $, db, moment, undefined ) {
  'use strict';

  var debug = window.debug( 'route:now-next' );

  // private + stateless utils
  var $main = $( 'main' );
  // var timezone = $( 'body' ).data( 'timezone' );

  return $.extend( routes, {
    nowandnext: function( themeSlug ) {
      debug( 'displaying for %s', themeSlug );
      var self = this;

      var context = {
        theme: db.getItem( 'themes' ),
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || []
      };

      var sessions = db.getItem( 'sessions' );

      if( themeSlug && themeSlug !== '-' ) {
        // select correct theme for nj
        context.theme = context.theme.filter( function( theme ) {
          return ( theme.slug === themeSlug );
        })[ 0 ];

        // filter sessions by theme
        sessions = sessions.filter( function( session ) {
          return ( session.themeSlug === themeSlug );
        });
      }
      else {
        context.theme = {
          name: 'All Tracks',
          slug: '-'
        };
      }

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

          return debug( err );
        }

        // attempt to clear any running scoped timeouts
        clearTimeout( window.scopedTimeout );

        $main.html( res ).attr( 'id', 'view-nowandnext' );
        debug( 'view rendered' );

        debug( 'updating view in 60 seconds' );
        window.scopedTimeout = setTimeout( function() {
          if( $main.attr( 'id' ) === 'view-nowandnext' ) {
            self.nowandnext( themeSlug );
          }
        }, 60000 );
      });
    }
  });
})( window, document, routes, nunjucksEnv, jQuery, dataStore, moment );
