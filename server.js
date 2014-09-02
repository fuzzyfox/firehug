'use strict';

var express = require( 'express' );
var morgan = require( 'morgan' );
var helmet = require( 'helmet' );
var moment = require( 'moment' );
var sessions = require( './lib/sessions' );
var shared = require( './shared' );
var env = shared.env;
// var debug = shared.debug;

// job scheduler
var jobs = require( './bin' );

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

/**
 * @todo proper CSP
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
 * render a page w/ help info for the app
 */
app.get( '/help', function( req, res ) {
  res.send( 'help for app' );
});

/**
 * @todo turn into full api for schedule
 */
app.get( '/api/sessions/:theme?', function( req, res, next ) {
  if( req.params.theme ) {
    return sessions.getSessions( req.params.theme, function(err, sessions) {
      if( err ) {
        return next();
      }

      res.jsonp( sessions );
    });
  }

  sessions.getSessions( function(err, sessions){
    res.jsonp( sessions );
  });
});

/**
 * @todo render a page showing server time, time of next poll, and time remaining (tick)
 */
app.get( '/time', function( req, res ) {
  res.send( 'server time' );
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
