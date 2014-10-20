'use strict';

/*
  Get Libs
 */
var express = require( 'express' );
var morgan = require( 'morgan' );
var helmet = require( 'helmet' );
var moment = require( 'moment' );
var marked = require( 'marked' );
var lodash = require( 'lodash' );
var later = require( 'later' );
var fs = require( 'fs' );
var nunjucks = require( 'nunjucks' );
var sessions = require( './lib/sessions' );
var documents = require( './lib/documents' );
var shared = require( './shared' );
var env = shared.env;
// var debug = shared.debug;
var serverStartTime = moment();

/*
  Start Recurring Jobs
 */
var jobs = require( './bin' );
// var jobStartTime = moment();

/*
  Server Setup
 */
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

// No caching api routes pl0x
app.all( [ '/healthcheck', '/api/*' ], function( req, res, next ) {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  return next();
});

// add env to res.locals
app.use( function( req, res, next ) {
  res.locals.env = env.get();
  next();
});

/*
  Generates a webapp manifest

  Uses the defaults in /manifest.webapp and extends them with any
  environment set details.
 */
var webappManifest = fs.readFileSync( 'manifest.webapp', 'utf8' );
webappManifest = JSON.parse( webappManifest );

var webappManifestOverrides = env.get( 'WEBAPP_MANIFEST' ) || '{}';
webappManifestOverrides = JSON.parse( webappManifestOverrides );

webappManifest = lodash.extend( webappManifest, webappManifestOverrides );

// add to res.locals
app.use( function( req, res, next ) {
  res.locals.app = JSON.parse( JSON.stringify( webappManifest ) ); // use as default values
  res.locals.app.webappManifest = webappManifest; // unchanging
  next();
});

// add build time to res.locals
app.use( function( req, res, next ) {
  res.locals.app.serverStartTime = serverStartTime.valueOf();
  next();
});

/*
  Setup Nunjucks
 */
var nunjucksEnv = nunjucks.configure( 'views', {
  autoescape: true
});

// add markdown parser to nunjucks
nunjucksEnv.addFilter( 'marked', marked );

// add nunjucks to res.render
nunjucksEnv.express( app );

/*
  Healthcheck
 */
app.get( '/healthcheck', function( req, res ) {
  res.jsonp({
    version: require( './package' ).version,
    http: 'okay',
    jobs: jobs.getStatus()
  });
});

/*
  Routes
 */
app.get( '/', function( req, res ) {
  res.render( 'index.html', {
    timezone: env.get( 'EVENT_TIMEZONE' )
  });
});

/**
 * @todo render a page showing server time, time of next poll, and time remaining (tick)
 */
app.get( '/time', function( req, res ) {
  var schedule = later.parse.cron( env.get( 'JOB_SCHEDULE' ) );

  res.render( 'time.html', {
    serverTime: moment().toISOString(),
    laterTime: later.schedule( schedule ).next( 1 ),
    laterCron: env.get( 'JOB_SCHEDULE' )
  });
});

/**
 * Serves the webapp manifest file
 */
app.get( '/manifest.webapp', function( req, res ) {
  res.type( 'application/x-web-app-manifest+json' );
  res.send( JSON.stringify( webappManifest ) );
});

/**
 * @todo generate dynamically using `fs`
 * @todo concat core vendor packages into a vendor.js file for easy caching
 */
app.get( '/firehug.appcache', function( req, res ) {
  var caches = [];
  res.contentType( 'text/cache-manifest' );

  // stylesheets
  caches = caches.concat([
    '/core/css/core.min.css',
    '/theme/css/main.min.css'
  ]);

  // fonts (font-awesome)
  fs.readdirSync( __dirname + '/public/vendor/font-awesome/fonts' ).filter( function( file ) {
    // return true IF not a dotfile AND not this file
    return ( file.indexOf( '.' ) !== 0 );
  }).forEach( function( file ) {
    caches.push( '/vendor/font-awesome/fonts/' + file );
  });

  // javascript
  caches = caches.concat([
    '/vendor/jquery/dist/jquery.min.js',
    '/vendor/moment/min/moment.min.js',
    '/vendor/moment-timezone/builds/moment-timezone-with-data.min.js',
    '/vendor/marked/lib/marked.js',
    '/vendor/routie/dist/routie.min.js',
    '/vendor/nunjucks/browser/nunjucks-slim.min.js',
    '/theme/partials.js',
    '/core/js/core.min.js',
    '/theme/js/app.min.js',
    '/vendor/bootstrap/js/dropdown.js'
  ]);

  // imgs
  // -- to come

  // send back manifest
  res.send( 'CACHE MANIFEST\n# Created ' + serverStartTime.format() + '\n\n' + caches.join( '\n' ) + '\n\nNETWORK:\n*' );
});

/*
  API Routes
 */

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
 *  Get all themes + descriptions
 */
app.get( '/api/themes', function( req, res ) {
  res.jsonp( sessions.getThemes() );
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

/*
  Some nice redirects for app
 */
// tag shortlink
app.get( '/t/:tag', function( req, res ) {
  res.redirect( '/#tag/' + req.params.tag );
});
// session short link
app.get( '/s/:sessionId', function( req, res ) {
  res.redirect( '/#session/' + req.params.sessionId );
});
// map short link
app.get( '/m/:locationId', function( req, res ) {
  res.redirect( '/#map/' + req.params.locationId );
});

var server = app.listen( env.get( 'PORT' ) || 5000, function() {
  console.log( 'Now listening on port %d', server.address().port );
});
