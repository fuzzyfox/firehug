/* global nunjucks, jQuery, moment, marked, dataStore */
/* exported nunjucksEnv */

/**
 * @file Firehug specific nunjucks environment setup
 *
 * What it does:
 * * Adds a few filters of use for formatting dateStrings, and markdown
 * * Loads in a copy of /manifest.webapp to use for displaying instance
 *   specific details like event name, etc...
 * * Closes the splashscreen (if on) on setup complete
 *
 * @license MPL-2.0
 */

var nunjucksEnv = (function( window, document, nunjucks, $, moment, marked, db, undefined ) {
  'use strict';
  // get new nunjucks environment
  var nunjucksEnv = new nunjucks.Environment();

  /*
    prep ready function/trigger
   */

  // couple of vars to help w/ ready state
  var readyFlag = false;
  var readyFns = [];

  /**
   * Trigger functions that depend on data being ready for use
   */
  function ready() {
    if( readyFlag ) {
      return;
    }

    db.ready( function() {
      readyFlag = true;

      for( var i = 0, len = readyFns.length; i < len; i++ ) {
        readyFns[ i ].call();
      }
    });
  }

  /**
   * Triggers callback once data session found
   *
   * @param  {Function} fn Function to trigger when ready
   */
  nunjucksEnv.ready = function( fn ) {
    return ( readyFlag ) ? fn.call() : readyFns.push( fn );
  };

  /*
    utility variables
   */
  var $main = $( 'main' );
  var timezone = $( 'body' ).data( 'timezone' );

  /*
    nunjucks setup
   */

  /**
   * Convert dateString to relative time from now
   *
   * @param  {String}   str dateString to convert
   * @param  {Boolean}  tz  do this in event timezone? (Default: true)
   * @return {String}       relative time from now
   */
  nunjucksEnv.addFilter( 'fromNow', function( str, tz ) {
    if( typeof tz === 'undefined' ) {
      tz = true;
    }

    if( tz ) {
      return moment.tz( str, timezone ).fromNow();
    }

    return moment( str ).fromNow();
  });

  /**
   * Convert dateString to specified format
   *
   * @param  {String}   str    dateString to convert
   * @param  {String}   format output format accepted by moment.js
   * @param  {Boolean}  tz     do this in with event timezone taken into account? (Default: true)
   * @return {[type]}          time in specified format
   */
  nunjucksEnv.addFilter( 'timeFormat', function( str, format, tz ) {
    if( typeof tz === 'undefined' ) {
      tz = true;
    }

    if( tz ) {
      return moment.tz( str, timezone ).format( format );
    }

    return moment( str ).format( format );
  });

  /**
   * Check if input is Array
   *
   * @param  {Mixed} obj object to check if Array
   * @return {Boolean}   true if input is Array
   */
  nunjucksEnv.addFilter( 'isArray', function( obj ) {
    return $.isArray( obj );
  });

  /**
   * Parse input as markdown
   *
   * @param  {String} str markdown to parse
   * @return {String}     parsed markdown as HTML
   */
  nunjucksEnv.addFilter( 'marked', function( str ) {
    return marked( str );
  });


  /*
    attempt to get app details from /manifest.webapp

    fallback to localstorage copy if exists
   */
  var getAppManifest = $.ajax({
    url: '/manifest.webapp',
    dataType: 'json'
  });

  // successfully loaded manifest
  // set as global for nunjucks and trigger ready (once db ready too)
  getAppManifest.done( function( appManifest ) {
    nunjucksEnv.addGlobal( 'app', appManifest );
    ready();

    // store manifest as fallback for offline support
    db.setItem( 'app', appManifest );
  });

  // failed to load manifest
  // fallback or error if nothing found
  getAppManifest.fail( function() {
    if( !db.getItem( 'app' ) ) {
      console.error( arguments );

      $main.html( '<div class="panel panel-danger"><div class="panel-heading">Load Error</div><p class="panel-body">Oops, failed to load "/manifest.webapp" and no local copy found. Try again later.</p></div>' );
      $main.attr( 'id', 'view-doc-error' );

      return;
    }

    nunjucksEnv.addGlobal( 'app', db.getItem( 'app' ) );
    ready();
  });

  // always close the splashscreen once we've finished setup (or failed)
  getAppManifest.always( function() {
    $( 'body' ).removeClass( 'splash' );
  });

  /*
    export nunjucksEnv
   */
  return nunjucksEnv;
})( window, document, nunjucks, jQuery, moment, marked, dataStore );
