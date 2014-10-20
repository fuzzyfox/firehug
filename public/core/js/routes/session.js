/* global nunjucksEnv, dataStore, jQuery, moment, routes:true */

/**
 * @file /#schedule/:theme?/:day? logic + render
 *
 * Responsible for the display + filtering of session
 * information to the user. Filters include theme, day,
 * and autoHide.
 *
 * `theme` + `day` filters are set using the page hash, while
 * autoHide is stored in the stored `state` object (toggle in
 * app settings).
 *
 * @license MPL-2.0
 */

routes = (function( window, document, routes, nunjucksEnv, db, $, moment, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    session: function( sessionId ) {
      /*
        start to populate context for nunjucks
       */
      var context = {
        session: db.getItem( 'sessions' ),
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || []
      };

      // select correct session
      context.session = context.session.filter( function( session ) {
        return ( session.id === sessionId );
      });

      if( context.session.length === 1 ) {
        context.session = context.session[ 0 ];
      }
      else {
        nunjucksEnv.render( 'error.html', {
          code: 404,
          type: 'warning',
          message: 'Session was not found.'
        }, function( err, res ) {
          if( err ) {
            $main.html( 'Session was not found.' );
            return console.error( 'failed to load "error.html" partial' );
          }

          $main.html( res );
        });
        $main.attr( 'id', 'error' );
        return;
      }

      /*
        render view
       */
      nunjucksEnv.render( 'session-details.html', context, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the session loading.' );

          if( context.state.debug ) {
            $main.append( err );
          }

          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-schedule' );
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, jQuery, moment );
