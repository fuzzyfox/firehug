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
   * A simple switch between localStorage and a faked api
   * as fallback, using an in memory object.
   */
  var storage = (function(){
    // method of testing based on Modernizer
    try {
      localStorage.setItem( 'test', 'test' );
      localStorage.removeItem( 'test' );
      return localStorage;
    }
    catch( e ) {
      console.warn( 'localStorage is not supported, faking the api and using in-memory storage instead' );

      // This api's responses approximate that of localStorage.
      // see for more: https://developer.mozilla.org/en/docs/Web/Guide/API/DOM/Storage
      return {
        _keys: [], // store keys w/ an index value
        _data: {}, // store key:value pairs
        length: 0, // store number of keys
        fake: true,
        // get item from store
        getItem: function( key ) {
          return this._data[ key ] || null;
        },
        // add item to store
        setItem: function( key, value ) {
          this._data[ key ] = value;

          if( this._keys.indexOf( key ) === -1 ) {
            this._keys.push( key );
            this.length += 1;
          }
        },
        // remove item from store
        removeItem: function( key ) {
          var index = this._keys.indexOf( key );
          if( index > -1 ) {
            delete this._data[ key ];
            this._keys.splice( index, 1 );
            this.length -= 1;
          }
        },
        // get a key value by index
        key: function( index ) {
          return this._keys[ index ] || null;
        },
        // reset store to start state
        clear: function() {
          this.length = 0;
          this._keys = [];
          this._data = {};
        }
      };
    }
  })();

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

  /**
   * Main interface people will have with the dataStore.
   *
   * @type {Object}
   */
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
      return JSON.parse( storage.getItem( key ) );
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
      storage.setItem( key, JSON.stringify( item ) );
      this.length = storage.length;
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
      storage.removeItem( key );
      this.length = storage.length;
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
      return storage.key( index );
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
     * Empty storage
     */
    clear: function() {
      this.length = 0;
      return storage.clear();
    },
    /**
     * Number stored items.
     *
     * Initially set to match the same as persistant storage.
     *
     * @type {Integer}
     */
    length: storage.length,
    /**
     * Flag if we're using fake, non-persistant
     * storage in place of localstorage.
     *
     * @type {Boolean}
     */
    persistant: storage.fake || false
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
