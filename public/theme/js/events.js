/* global jQuery */
(function( window, document, $, undefined ) {
  'use strict';

  var $main = $( 'main' );

  // when a session gets toggle switch the eye icon out
  $main.on( 'click', '.session [data-tracked-session]', function() {
    $( this ).toggleClass( 'fa-eye fa-eye-slash' );
  });
})( window, document, jQuery );
