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
  var timezone = $( 'body' ).data( 'timezone' );

  return $.extend( routes, {
    schedule: function( theme, day ) {
      /*
        start to populate context for nunjucks
       */
      var context = {
        sessions: db.getItem( 'sessions' ),
        themes: db.getItem( 'themes' ),
        state: db.getItem( 'state' ),
        trackedSessions: db.getItem( 'tracked-sessions' ) || [],
        eventDays: []
      };

      // populate context.eventDays
      context.sessions.forEach( function( session ) {
        var sessionDay = moment.tz( session.start, timezone ).format( 'dddd' );
        if( context.eventDays.indexOf( sessionDay ) === -1 ) {
          context.eventDays.push( sessionDay );
        }
      });

      /*
        convenience vars/methods
       */

      // generate an array of themes slugs
      var themeSlugs = [];
      context.themes.forEach( function( theme ) {
        themeSlugs.push( theme.slug );
      });

      // generate a moment obj for now
      var now = moment.tz( timezone );

      // get start + end of event
      var eventStart = moment.tz( context.sessions[ 0 ].start, timezone );
      var eventEnd = moment.tz( context.sessions[ context.sessions.length - 1 ].end, timezone );

      /*
        figure out what day to fallback on if on requested

        * default is the first day of the event
        * if the event is in progress then its the current day of the event
       */
      var fallbackDay = context.eventDays[ 0 ];

      if( now.isAfter( eventStart.startOf( 'day' ) ) && now.isBefore( eventEnd.endOf( 'day' ) ) ) {
        fallbackDay = now.format( 'dddd' );
      }

      /*
        set defaults for theme + day if needed

        "-" is used to prevent filtering on property
       */
      day = day || fallbackDay;
      theme = theme || context.state.theme || '-';

      // normalize theme for filtering (all lowercase)
      theme = theme.toLowerCase();

      // normalize day for filtering (first letter uppercase, rest lowercase)
      day = day.toLowerCase().replace( /^[a-z]/, function( letter ) {
        return letter.toUpperCase();
      });

      /*
        filter sessions by theme
       */
      if( theme !== '-' ) {
        context.sessions = context.sessions.filter( function( session ) {
          // deal with track sessions special case
          if( theme === 'tracked' && context.trackedSessions.indexOf( session.id ) > -1 ) {
            return true;
          }

          // standard filter
          return ( session.themeSlug === theme );
        });
      }

      /*
        filter sessions by day
       */
      if( day !== '-' ) {
        context.sessions = context.sessions.filter( function( session ) {
          return ( moment.tz( session.start, timezone ).format( 'dddd' ) === day );
        });
      }

      /*
        filter out finished sessions

        * `state.autoHide` must be true (user set)
        * `now` must be after the start of the first session
        * `now` must be before the end of the last session
       */
      if( context.sessions.length ) {
        var sessionsStart = moment.tz( context.sessions[ 0 ].start, timezone );
        var sessionsEnd = moment.tz( context.sessions[ context.sessions.length - 1 ].end, timezone );
        if( context.sessions[ 0 ] &&
            context.state.autoHide &&
            now.isAfter( sessionsStart ) &&
            now.isBefore( sessionsEnd ) ) {

          context.sessions = context.sessions.filter( function( session ) {
            // give sessions 5 minutes grace before filtering out to allow for overrun
            return moment.tz( session.end, timezone ).add( 5, 'minutes' ).isAfter( now );
          });
        }
      }

      /*
        get full theme details for view
       */
      context.theme = context.themes.filter( function( themeObj ) {
        return ( themeObj.slug === theme );
      })[ 0 ] || {};

      // deal with special case for tracked sessions
      if( theme === 'tracked' ) {
        context.theme = {
          name: 'Tracked Sessions',
          slug: 'tracked'
        };
      }
      if( theme === 'tracked' && day === '-' ) {
        context.theme = {
          name: 'All Tracked Sessions',
          slug: 'tracked'
        };
      }

      // deal with all track view and all days view
      if( theme === '-' ) {
        context.theme = {
          name: 'All Tracks',
          slug: '-'
        };
      }
      if( theme === '-' && day === '-' ) {
        context.theme = {
          name: 'All Tracks, All Days',
          slug: '-/-'
        };
      }

      context.day = day;

      /*
        render view
       */
      nunjucksEnv.render( 'schedule.html', context, function( err, res ) {
        if( err ) {
          $main.html( 'Oops, an error is preventing the schedule loading.' );

          if( context.state.debug ) {
            $main.append( err );
          }

          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-schedule' );

        // now we have the view loaded store day + theme
        if( theme !== 'tracked' ) {
          db.extendItem( 'state', {
            day: day,
            theme: theme
          });
        }

        /*
          timed events to run on this view's DOM
         */
        // attempt to clear any running scoped timeouts
        clearTimeout( window.scopedTimeout );

        // start new scoped timeout
        (function scheduleTimeout() {
          // only run for this view
          if( $main.attr( 'id' ) === 'view-schedule' ) {
            // time now
            var now = moment.tz( timezone );

            // update lastSync display
            var $lastSync = $( 'time[rel=lastSync]' );
            $lastSync.attr( 'data', moment( db.getItem( 'state' ).lastSync ).format( 'HH:mm:ss' ) );
            $lastSync.html( moment( db.getItem( 'state' ).lastSync ).format( 'HH:mm:ss' ) );

            // hide finished sessions
            if( context.state.autoHide &&
                now.isAfter( sessionsStart ) &&
                now.isBefore( sessionsEnd ) ) {

              $( '.session' ).each( function() {
                if( moment.tz( $( this ).data( 'session-end' ), timezone ).add( 5, 'minutes' ).isBefore( now ) ) {
                  $( this ).slideUp( function() {
                    $( this ).remove();
                  });
                }
              });
            }

            // loop back in 1min
            window.scopedTimeout = setTimeout( scheduleTimeout, 30000 );
          }
        }());
      });
    }
  });
})( window, document, routes, nunjucksEnv, dataStore, jQuery, moment );
