/* global jQuery */

/**
 * Simple localStorage wrapper & data sync.
 *
 * What it does:
 * * Fetches session data from the server and keeps
 *   an up-to-date copy in localStorage.
 * * Wraps localStorage allowing adding ability to store
 *   numbers and objects as well as strings.
 * * Provides a ready check which is triggered when there
 *   is a copy of the session data in localStorage
 *
 * @license MPL-2.0
 */
var dataStore = (function( window, document, $, undefined ) {
  'use strict';

  // couple of variables to help w/ ready state
  var readyFlag = false;
  var readyFns = [];

  /**
   * Trigger functions that depend on data being ready for use
   *
   * @return {[type]} [description]
   */
  function ready() {
    if( readyFlag ) {
      return;
    }

    readyFlag = true;

    for( var i = 0, len = readyFns.length; i < len; i++ ) {
      readyFns[ i ].call();
    }
  }

  var db = {
    /**
     * Triggers callback once data session found
     *
     * @param  {Function} fn Function to trigger when ready
     */
    ready: function( fn ) {
      return ( readyFlag ) ? fn.call() : readyFns.push( fn );
    },
    /**
     * Get an item from storage
     *
     * @param  {String} key Key for item to fetch
     * @return {Mixed}      The stored item
     */
    getItem: function( key ) {
      return JSON.parse( localStorage.getItem( key ) );
    },
    /**
     * Get multiple items from storage
     * @param  {[Array]} keys Array of keys for items to fetch. (Defaults to all items).
     * @return {Object}     A key:value object of requested items
     */
    getItems: function( keys ) {
      if( keys && !$.isArray( keys ) ) {
        return console.error( 'expected array found %s', typeof keys );
      }

      if( !keys ) {
        keys = this.keys();
      }

      var items = {};
      var self = this;
      keys.forEach( function( key ) {
        items[ key ] = self.getItem( key );
      });

      return items;
    },
    /**
     * Set item
     *
     * @param {String} key  Key to store item under
     * @param {Mixed} item  Any item that can be parsed to JSON
     */
    setItem: function( key, item ) {
      this.index += 1;
      localStorage.setItem( key, JSON.stringify( item ) );
    },
    /**
     * Extends stored object using jQuery.extend()
     * @param  {String}  key  Key for item to extend
     * @param  {Object}  obj  Object to extend item with
     * @param  {Boolean} deep Deep extend flag. Defaults to true
     * @return {Object}       Updated item
     */
    extendItem: function( key, obj, deep ) {
      if( !$.isPlainObject( obj ) ) {
        return console.error( 'updateItem only works with Objects' );
      }

      // set default for deep to true
      if( typeof deep === 'undefined' ) {
        deep = true;
      }

      obj = $.extend( deep, this.getItem( key ), obj );
      this.setItem( key, obj );

      return obj;
    },
    /**
     * Remove item from store
     *
     * @param  {String} key Key for the item to remove
     */
    removeItem: function( key ) {
      this.index -= 1;
      return localStorage.removeItem( key );
    },

    /**
     * Remove multiple items
     *
     * @param  {Array} keys Items to remove
     */
    removeItems: function( keys ) {
      if( !$.isArray( keys ) ) {
        return;
      }

      var self = this;

      keys.forEach( function( key ) {
        self.removeItem( key );
      });
    },
    /**
     * Get key based on index
     *
     * @param  {Integer} index Index for key
     * @return {String}        Key for item at given index
     */
    key: function( index ) {
      return localStorage.key( index );
    },
    /**
     * Get all keys from storage
     *
     * @return {Array} An array of keys (Strings)
     */
    keys: function() {
      var keys = [];

      for( var idx = 0, len = this.length; idx < len; idx++ ) {
        keys.push( this.key( idx ) );
      }

      return keys;
    },
    /**
     * Number stored items
     *
     * @type {Integer}
     */
    length: localStorage.length,
    /**
     * Empty storage
     */
    clear: function() {
      this.length = 0;
      return localStorage.clear();
    }
  };

  // set default config for sync
  var config = {
    sync: {
      sessions: '/api/sessions',
      themes: '/api/themes'
    }
  };
  db.setItem( 'state', db.getItem( 'state' ) || config );

  // async loop w/ instant run
  (function sync() {
    if( !config.sync ) {
      return;
    }
    console.log( 'attempting to sync remote > local data' );
    /*
      Sync Session Data
     */

    // if we've not run yet check for local data
    if( !readyFlag ) {
      var state = db.getItem( 'state' );
      if( state && state.lastSync ) {
        ready();
      }
    }

    // sync all requested things
    var syncsInProgress = 0;
    Object.keys( config.sync ).forEach( function( key ) {
      // indicate sync started
      syncsInProgress += 1;

      // create call to api
      var getRemote = $.ajax({
        url: config.sync[ key ],
        // dataType: 'json',
        cache: false
      });

      // always attempt again in 2mins
      getRemote.always( function() {
        // indicate sync ended
        syncsInProgress -= 1;

        // if no more in progress start timer for loop
        if( !syncsInProgress ) {
          setTimeout( sync, 120000 );
        }
      });

      // if sucessful store locally
      getRemote.done( function( sessions ) {
        db.setItem( key, sessions );

        // @todo replace w/ function to check for changes in schedule
        console.log( '%s updated locally', key );

        // update sync time
        var state = db.getItem( 'state' );
        state.lastSync = ( new Date() ).toISOString();
        db.setItem( 'state', state );

        if( !syncsInProgress ) {
          ready();
        }
      });

      // if error fail w/ console output
      getRemote.fail( function( jqXHR, textStatus, errorThrown ) {
        console.error( arguments );
      });
    });
  }());

  return db;
})( window, document, jQuery );
