/* global nunjucksEnv, jQuery, dataStore */
/* exported notify */

/**
 * @file Notification handling
 *
 * Handle notifications for the user
 *
 * @license MPL-2.0
 */

var notify = (function( window, document, nunjucksEnv, $, db, undefined ) {
  'use strict';

  var $body = $( 'body' );

  /**
   * Create + display notification
   *
   * @param  {String}   title       notification title (short)
   * @param  {String}   message     message/main notification content
   * @param  {String}   icon        font-awesome icon name to display w/ notification
   * @param  {Integer}  ttl         number of *seconds* to show for (set as 0 for infinite)
   * @param  {Boolean}  cancelable  specify if the notification can be cancelled by the user (defaults to true)
   * @return {Object}               object containing a close function to remove the notification programatically
   */
  return function( title, message, icon, ttl, cancelable ) {
    // do not show notifications if disabled
    if( !db.getItem( 'state' ).notifications ) {
      return;
    }

    if( typeof cancelable !== 'boolean' ) {
      cancelable = true;
    }

    var context = {
      notification: {
        title: title || '',
        message: message || '',
        icon: icon || 'info-circle',
        cancelable: cancelable
      },
      state: db.getItem( 'state' )
    };

    var rtn = {
      _$element: {},
      /**
       * Close open notifcation
       *
       * @param  {Boolean} fade set to true to fade notification on close
       */
      close: function( fade ) {
        if( fade ) {
          return this._$element.fadeOut( function() {
            $( this ).remove();
          });
        }

        return this._$element.remove();
      }
    };

    nunjucksEnv.render( 'notification.html', context, function( err, res ) {
      if( err ) {
        return console.error( err );
      }

      $body.append( res );

      var $notification = $( '.notification-bar:last' );
      rtn._$element = $notification;

      if( cancelable ) {
        $notification.on( 'click', function() {
          rtn.close( true );
        });
      }

      // if a ttl is set fade notification out after time
      if( ttl ) {
        ttl = ttl * 1000;
        setTimeout( function(){
          rtn.close( true );
        }, ttl );
      }
    });

    return rtn;
  };
})( window, document, nunjucksEnv, jQuery, dataStore );
