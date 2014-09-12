/* global nunjucksEnv, jQuery, routes */

routes = (function( window, document, routes, nunjucksEnv, $, undefined ) {
  'use strict';

  // private + stateless utils
  var $main = $( 'main' );

  return $.extend( routes, {
    doc: function( docSlug ) {
      var getDoc = $.ajax({
        url: '/api/doc/' + docSlug + '/md'
      });

      getDoc.done( function( doc ) {
        $main.html( doc ).attr( 'id', 'view-doc-' + docSlug );
      });

      getDoc.fail( function() {
        $main.html( arguments[ 2 ] ).attr( 'view-doc-' + docSlug );
      });
    }
  });
})( window, document, routes, nunjucksEnv, jQuery );
