/* global routie, nunjucksEnv, jQuery, routes, sync, notify, dataStore */

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

(function( window, document, routie, routes, nunjucksEnv, $, sync, notify, db, undefined ) {
  'use strict';

  /*
    load + handle routes
   */
  nunjucksEnv.ready( function() {
    // quick access to where we put rendered views
    var $main = $( 'main' );

    // now we can render routes
    routie( '', routes.home );
    routie( 'schedule/:theme?/:day?', routes.schedule );
    routie( 'session/:sessionId', routes.session );
    routie( 'doc/:name', routes.doc );
    routie( 'tag/:tag', routes.tag );
    routie( 'settings', routes.settings );

    routie( '*', function() {
      nunjucksEnv.render( 'error.html', {
        code: 404,
        type: 'warning',
        message: window.location.hash + ' was not found.'
      }, function( err, res ) {
        if( err ) {
          $main.html( window.location.hash + ' was not found.' );
          return console.error( 'failed to load "error.html" partial' );
        }

        $main.html( res );
      });

      $main.attr( 'id', 'error' );
    });

    /*
      deal with posibility to install (open web app)
     */
    if( window.navigator.mozApps ) {
      // can we install the app?
      var selfReq = window.navigator.mozApps.getSelf();

      selfReq.onsuccess = function() {
        if( !selfReq.result ) {
          // yes we can install
          routie( 'install', function() {
            var manifest = window.location.origin + '/manifest.webapp';
            var req = window.navigator.mozApps.install( manifest );

            req.onsuccess = function() {
              req.result.launch();
            };

            req.onerror = function() {
              window.alert( 'Error: ' + this.error.name );
            };
          });
        }
        else {
          $( '.install-app' ).remove();
        }
      };
    }
    else {
      $( '.install-app' ).remove();
    }

    /*
      detect and handle online/offline events
     */
    var offlineNotification = {};
    $( window ).on( 'online offline', function( event ) {
      console.log( event.type );
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
    if( typeof db.getItem( 'state' ).firstRun !== 'boolean' || db.getItem( 'state' ).firstRun ) {
      notify( 'Welcome to the Mozilla Festival app.', 'This app aims to help you through you\'re festival experience and keep you up-to-date on schedule changes.</p><p>Tap this message to dismiss it, or, visit the <a href="#settings">settings</a> to disable notifications.' );
    }
  });
})( window, document, routie, routes, nunjucksEnv, jQuery, sync, notify, dataStore );
