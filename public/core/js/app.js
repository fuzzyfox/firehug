/* global routie, nunjucksEnv, jQuery, routes, sync, notify, dataStore, analytics */

/**
 * @file App wide logic
 *
 * Here is all the app wide logic that has no other home
 * to go to. It includes:
 *
 * * route initialization
 *
 * @license MPL-2.0
 */

(function( window, document, routie, routes, nunjucksEnv, $, sync, notify, db, analytics, undefined ) {
  'use strict';

  // setup debug
  var debug = window.debug( 'app' );

  /*
    load + handle routes
   */
  nunjucksEnv.ready( function() {
    debug( 'initializing app routes' );
    // quick access to where we put rendered views
    var $main = $( 'main' );

    // now we can render routes
    routie( '', routes.home );
    routie( 'schedule/:theme?/:day?', routes.schedule );
    routie( 'session/:sessionId', routes.session );
    routie( 'doc/:name', routes.doc );
    routie( 'tag/:tag', routes.tag );
    routie( 'map/:location?', routes.map );
    routie( 'settings', routes.settings );
    // routes not user exposed
    routie( 'nowandnext/:theme?', routes.nowandnext );

    /*
      deal with posibility to install (open web app)
     */
    var installApp = function() {}; // stub till we know for sure if we can install
    if( window.navigator.mozApps ) {
      // can we install the app?
      var selfReq = window.navigator.mozApps.getSelf();

      selfReq.onsuccess = function() {
        if( !selfReq.result ) {
          debug( 'providing install option' );
          // yes we can install
          installApp = function() {
            debug( 'attempting install' );
            var manifest = window.location.origin + '/manifest.webapp';
            var req = window.navigator.mozApps.install( manifest );

            req.onsuccess = function() {
              debug( 'install successful' );
              req.result.launch();
            };

            req.onerror = function() {
              debug( 'ERROR: Failed to install' );
              debug( this.error );
              window.alert( 'Sorry, failed to install successfully.' );
            };
          };
        }
        else {
          $( '.install-app' ).remove();
        }
      };
      selfReq.onerror = function() {
        $( '.install-app' ).remove();
      };
    }
    else {
      $( '.install-app' ).remove();
    }
    routie( 'install', function() {
      installApp();
    });

    /*
      detect and handle online/offline events
     */
    var offlineNotification = {};
    $( window ).on( 'online offline', function( event ) {
      debug( '%s event detected', event.type );
      if( event.type === 'offline' ) {
        offlineNotification = notify( 'Unable to connect to the server...', '...your copy of the schedule may be a little out of sync with the world till a connection is made again.', 'refresh fa-spin', 5, false );
      }
      else if( event.type === 'online' ) {
        if( offlineNotification.close ) {
          offlineNotification.close();
          notify( 'Connection established', 'the latest updates to the schedule are now avaiable again.', 'check', 5, false );
        }
      }
    });

    /*
      trigger first run notification
     */
    if( typeof db.getItem( 'state' ).firstRun !== 'boolean' || !db.getItem( 'state' ).firstRun ) {
      debug( 'display first run notification' );
      db.extendItem( 'state', { firstRun: true } );
      notify( 'Welcome to the Mozilla Festival app.', 'This app aims to help you through youre festival experience and keep you up-to-date on schedule changes.</p><p>Tap this message to dismiss it, or, visit the <a href="#settings">settings</a> to disable notifications.' );
    }

    /*
      handle missing views/404s
     */
    routie( '*', function() {
      nunjucksEnv.render( 'error.html', {
        code: 404,
        type: 'warning',
        message: window.location.hash + ' was not found.'
      }, function( err, res ) {
        if( err ) {
          $main.html( window.location.hash + ' was not found.' );
          return debug( 'failed to load "error.html" partial' );
        }

        $main.html( res );
      });

      $main.attr( 'id', 'error' );
    });

    /*
      fire tracking events on hashchange
     */
    debug( 'setting up analytics capture based on hashchange events' );
    $( window ).on( 'hashchange', function() {
      if( window.location.hash.substr( 1 ) ) {
        return analytics.virtualPageview( window.location.hash.substr( 1 ) );
      }
      analytics.virtualPageview( 'home' );
    });
  });
})( window, document, routie, routes, nunjucksEnv, jQuery, sync, notify, dataStore, analytics );
