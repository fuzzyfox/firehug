/* global routie, nunjucks, dataStore, moment, marked, jQuery */

(function( window, document, routie, nunjucks, db, moment, marked, $, undefined ) {
  'use strict';

  // quick access to where we put rendered views
  var $main = $( 'main' );

  // setup nunjucks env first
  var nunjucksEnv = new nunjucks.Environment();

  nunjucksEnv.addFilter( 'fromNow', function( str ) {
    return moment( str ).fromNow();
  });

  nunjucksEnv.addFilter( 'timeFormat', function( str, format ) {
    return moment( str ).format( format );
  });

  nunjucksEnv.addFilter( 'isArray', function( str ) {
    return $.isArray( str );
  });

  nunjucksEnv.addFilter( 'marked', function( str ) {
    return marked( str );
  });

  // get webapp manifest for app details
  var getAppManifest = $.ajax({
    url: '/manifest.webapp',
    dataType: 'json'
  });

  // success = load routes + global nunjucks vars
  getAppManifest.done( function( appManifest ) {
    nunjucksEnv.addGlobal( 'app', appManifest );

    // now we can render routes
    routie( '', function() {
      nunjucksEnv.render( 'home.html', function( err, res ) {
        if( err ) {
          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-home' );
      });
    });

    routie( 'schedule/:theme?/:day?', function( theme, day ) {
      // get sessions + themes
      var sessions = db.getItem( 'sessions' );
      var themes = db.getItem( 'themes' );

      // normalize theme + day variables for comparisons
      theme = ( theme ) ? theme.toLowerCase() : theme;
      day = ( day ) ? day.toLowerCase().replace( /^[a-z]/, function( letter ) {
        return letter.toUpperCase();
      }) : day;

      // generate array of just theme slugs
      var themeSlugs = [];
      themes.forEach( function( theme ) {
        themeSlugs.push( theme.slug );
      });

      // if theme provided filter by it
      if( theme && themeSlugs.indexOf( theme ) > -1 ) {
        // override sessions to filter by theme
        sessions = sessions.filter( function( session ) {
          return (session.themeSlug === theme);
        });
      }

      // if day provided filter by it
      if( day && moment.weekdays().indexOf( day ) > -1 ) {
        // override sessions to filter by day
        sessions = sessions.filter( function( session ) {
          return ( moment( session.start ).format( 'dddd' ) === day );
        });
      }

      nunjucksEnv.render( 'schedule.html', {
        sessions: sessions,
        themes: themes,
        state: db.getItem( 'state' )
      }, function( err, res ) {
        if( err ) {
          return console.error( err );
        }

        $main.html( res ).attr( 'id', 'view-schedule' );
      });
    });

    routie( 'doc/:name', function( docName ) {
      var getDoc = $.ajax({
        url: '/api/doc/' + docName + '/md',
      });

      getDoc.done( function( doc ) {
        $main.html( doc ).attr( 'id', 'view-doc-' + docName );
      });

      getDoc.fail( function() {
        $main.html( arguments[ 2 ] ).attr( 'id', 'doc-' + docName );
      });
    });

    routie( '*', function() {
      $main.html( 'route not found' ).attr( 'id', '' );
    });
  });

  // fail = report error
  getAppManifest.fail( function() {
    console.error( arguments );

    $main.html( 'Opps, failed to load. Try again later.' );
  });

  // always close the splash screen if its open
  getAppManifest.always( function() {
    if( $( 'body' ).hasClass( 'splash' ) ) {
      $( 'body' ).removeClass( 'splash' );
    }
  });
})( window, document, routie, nunjucks, dataStore, moment, marked, jQuery );
