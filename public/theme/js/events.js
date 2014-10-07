/* global jQuery */
(function( window, document, $, undefined ) {
  'use strict';

  var $main = $( 'main' );

  // when a session gets toggle switch the eye icon out
  $main.on( 'click', '.session [data-tracked-session]', function() {
    $( this ).toggleClass( 'fa-eye fa-eye-slash' );

    // if in tracked session view toggle opacity a bit
    if( /^schedule\/tracked/i.test( window.location.hash.substring( 1 ) ) ) {
      // class fa-eye indicates tracked = true
      if( $( this ).hasClass( 'fa-eye' ) ) {
        $( this ).parent( '.session').animate( {
          opacity: 1
        }, 400 );
      }
      else {
        $( this ).parent( '.session').animate( {
          opacity: 0.5
        }, 400 );
      }
    }
  });
})( window, document, jQuery );
