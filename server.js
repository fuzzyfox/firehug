'use strict';

var express = require( 'express' );
var morgan = require( 'morgan' );
var helmet = require( 'helmet' );
var moment = require( 'moment' );
var marked = require( 'marked' );
var lodash = require( 'lodash' );
var sessions = require( './lib/sessions' );
var documents = require( './lib/documents' );
var shared = require( './shared' );
var env = shared.env;
// var debug = shared.debug;

// job scheduler
var jobs = require( './bin' );
var jobStartTime = moment();

// setup server
var app = express();

app.use( express.static( __dirname + '/public' ) );

app.use( helmet.xframe( 'sameorigin' ) );
app.use( helmet.hsts() );
app.use( helmet.nosniff() );
app.use( helmet.xssFilter() );

if( env.get( 'debug' ) || env.get( 'DEBUG' ) ) {
  app.use( morgan( 'dev' ) );
}

app.disable( 'x-powered-by' );

// pretty print json
app.set( 'json spaces', 2 );

/**
 * @todo proper CSP
 *
 * Should allow for x-ray goggles
 */
// Content Security Policy
// app.use( helmet.csp( {
//   defaultSrc: [ '\'self\'' ],
//   reportUri: '/report-violation',
//   reportOnly: true
// } ) );

// no cacheing api routes pl0x
app.all( [ '/healthcheck', '/api/*' ], function( req, res, next ) {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  return next();
});

// healthcheck
app.get( '/healthcheck', function( req, res ) {
  res.jsonp({
    version: require( './package' ).version,
    http: 'okay',
    jobs: jobs.getStatus()
  });
});

/* routes */
app.get( '/', function( req, res ) {
  console.log( '/' );
  res.send( 'load webapp' );
});

/**
 * Get a specific session by its id. This should
 * the "sid" column in the spreadsheet.
 */
app.get( '/api/session/:id', function( req, res, next ) {
  sessions.getSessions( function( err, sessions ) {
    if( err ) {
      console.error( err );
      return next();
    }

    // variable to hold the session info + return
    var session = {};

    // dumb find id in sessions
    for( var idx = 0, len = sessions.length; idx < len; idx++ ) {
      if( sessions[ idx ].id === req.params.id ) {
        session = sessions[ idx ];
        break;
      }
    }

    // check we have a result before response
    if( lodash.isEmpty( session ) ) {
      return next();
    }

    res.jsonp( session );
  });
});

/**
 * Get all sessions, in a given theme if provided.
 */
app.get( '/api/sessions/:theme?', function( req, res, next ) {
  if( req.params.theme ) {
    console.log( 'single session' );
    return sessions.getSessions( req.params.theme, function( err, sessions ) {
      if( err ) {
        console.error( err );
        return next();
      }

      res.jsonp( sessions );
    });
  }

  sessions.getSessions( function( err, sessions ) {
    if( err ) {
      console.error( err );
      return next();
    }

    res.jsonp( sessions );
  });
});

/**
 * Get a specific document, and parse assuming the format if provided.
 *
 * All documents are stored as plain text.
 *
 * Valid formats to parse as:
 * * html
 * * markdown
 */
app.get( '/api/doc/:name/:format?', function( req, res, next ) {
  // check doc exists
  if( documents.getDocNames().indexOf( req.params.name ) === -1 ) {
    return next();
  }

  documents.getDoc( req.params.name, function( err, doc ) {
    if( err ) {
      console.error( err );
      return next();
    }

    switch( req.params.format ) {
      case 'html':
        res.type( 'text/html' );
      break;
      case 'markdown':
      case 'md':
        res.type( 'text/html' );
        doc = marked( doc );
      break;
      default:
        res.type( 'text/plain' );
      break;
    }

    res.send( doc );
  });
});

/**
 * Get a listing of all documents available and the route to
 * access them (as plain text).
 */
app.get( '/api/docs', function( req, res ) {
  var docNames = documents.getDocNames();
  var docs = [];

  docNames.forEach( function( docName ) {
    docs.push({
      name: docName,
      link: '/api/doc/' + docName
    });
  });

  res.jsonp( docs );
});

/**
 * @todo render a page showing server time, time of next poll, and time remaining (tick)
 */
app.get( '/time', function( req, res ) {
  res.send( jobStartTime );
});

/**
 * @todo generate dynamically based on remote config/local env
 */
app.get( '/manifest.webapp', function( req, res ) {
  res.contentType( 'application/x-web-app-manifest+json' );
  res.sendfile( __dirname + '/public/manifest.webapp' );
});

/**
 * @todo generate dynamically using `fs`
 */
app.get( '/firehug.appcache', function( req, res ) {
  var caches = [];
  res.contentType( 'text/cache-manifest' );

  if( env.get( 'NODE_ENV' ) === 'production' ) {
    caches = [];
  }

  res.send( 'CACHE MANIFEST\n# Created ' + moment().format() + '\n' + caches.join( '\n' ) + '\n\nNETWORK:\n*' );
});

var server = app.listen( env.get( 'PORT' ) || 5000, function() {
  console.log( 'Now listening on port %d', server.address().port );
});
