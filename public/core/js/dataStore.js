/* global jQuery */
/* exported dataStore */

/**
 * @file Simple localStorage wrapper & data sync.
 *
 * What it does:
 * * Wraps localStorage allowing adding ability to store
 *   numbers and objects as well as strings.
 * * Allows stored Objects to be extended.
 * * Allows easy `get` and `remove` of multiple key:values.
 *
 * @license MPL-2.0
 */

var dataStore = (function( window, document, $, undefined ) {
  'use strict';

  var debug = window.debug( 'dataStore' );

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
      debug( 'localStorage is not supported, faking the api and using volatile storage instead' );

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
   * Main interface people will have with the dataStore.
   *
   * @type {Object}
   */
  return {
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
        return debug( 'expected array found %s', typeof keys );
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
     *
     * @param  {String}  key  Key for item to extend
     * @param  {Object}  obj  Object to extend item with
     * @param  {Boolean} deep Deep extend flag. Defaults to true
     * @return {Object}       Updated item
     */
    extendItem: function( key, obj, deep ) {
      if( !$.isPlainObject( obj ) ) {
        return debug( 'extendItem only works with Objects' );
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
    persistant: !storage.fake
  };
})( window, document, jQuery );
