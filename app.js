'use strict';

// for ITs monitoring tool
if ( process.env.NEW_RELIC_HOME ) {
  require( 'newrelic' );
}

var express = require('express');
var http = require('http');
var https = require('https');
var hbs = require('hbs');
var gravatar = require('gravatar');
var stylus = require('stylus');
var querystring = require('querystring');
var nib = require('nib');
var connectRedis = require('connect-redis');
var request = require('request');
var time = require('time');
var url = require('url');

var shared = require('./shared');
var nconf = shared.nconf;
var client = shared.redisClient;

// Job scheduler
require('./bin');

var app = express();

// var isLoggedIn = function(req, res, next) {
//   if (req.session.user) {
//     next();
//   } else {
//     return res.status(401).send({
//       status: 0
//     });
//   }
// };

// Setup express
if (!process.env.NODE_ENV) {
  app.use(express.logger());
}

var cookieParser = express.cookieParser(nconf.get('sessionSecret'));
app.use(cookieParser);

app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .use(nib());
  }
}));

// Static sources
var maxAge = process.env.NODE_ENV ? 86400000 : 0;
app.use(express.static(__dirname + '/public', {
  maxAge: maxAge
}));

var nap = require('nap');

nap({
  mode: process.env.NODE_ENV || 'development',
  assets: {
    js: {
      all: [
        '/public/js/vendor/indexeddb-shim.js',
        '/public/js/vendor/async-storage.js',
        '/public/js/vendor/jquery.js',
        '/public/js/vendor/angular.js',
        '/public/js/vendor/angular-route.js',
        // '/public/js/vendor/fastclick.js',
        // '/public/js/vendor/typeahead.js',
        '/public/js/vendor/moment.js',
        '/public/js/app.js'
      ]
    },
    css: {
      all: [
        '/public/css/vendor/bootstrap.css',
        '/public/css/vendor/font-awesome.css',
        '/public/css/app.styl'
      ]
    }
  }
});

nap.package(console.log);

// CSP
var headers = require('express-standard');

// headers.add_csp_self('default-src');
// headers.add_csp('frame-src', 'https://login.persona.org');
headers.add_csp_self('script-src');
// headers.add_csp('script-src', 'https://login.persona.org');
// headers.add_csp('script-src', 'https://ssl.google-analytics.com');
headers.add_csp_self('style-src');
headers.add_csp('style-src', "'unsafe-inline'");
headers.add_csp_self('img-src');
headers.add_csp('img-src', 'data:');
// headers.add_csp('img-src', 'https://mozillians.org');
// headers.add_csp('img-src', 'https://secure.gravatar.com');
// headers.add_csp('img-src', 'https://ssl.google-analytics.com');
headers.add_csp('img-src', url.parse(nconf.get('obrEndpoint')).protocol + '//' + url.parse(nconf.get('obrEndpoint')).host);

app.use(headers.handle);

app.use(express.bodyParser());

// Template engine
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
// hbs.registerPartials(__dirname + '/views/partials');
app.engine('html', hbs.__express);

// Define storage object and cookie name for later use
var RedisStore = connectRedis(express);
var sessionStore = new RedisStore({
  client: client
});
app.use(express.session({
  store: sessionStore,
  key: nconf.get('sessionName')
}));

var now = new time.Date();

// function getDay(user) {
//   switch (user.location) {
//     case 'br':
//       now.setTimezone('Europe/Brussels');
//       break;
//     case 'sc':
//       now.setTimezone('America/Los_Angeles');
//       break;
//     default:
//       now.setTimezone('America/New_York');
//       break;
//   };

//   return now.getDate();
// };

// function isActiveDay(user) {
//   var day = getDay(user);
//   return day >= 5 && day <= 6;
// }

// function getPayload(session) {
//   var nextQuestions = null;
//   if (session.submitted) {
//     var future = new Date(session.submitted + nconf.get('surveyIdle'));
//     if (future > Date.now()) {
//       nextQuestions = future.toUTCString();
//     }
//   }

//   return {
//     email: session.user.email,
//     location: session.user.location,
//     dialog: session.user.dialog,
//     day: getDay(session.user),
//     activeDay: isActiveDay(session.user),
//     nextQuestions: nextQuestions
//   };
// };

app.get('/', function(request, response) {
  var six = (request.query.hexagon == 6);
  var payload = {};
  if (request.session && request.session.user) {
    payload.user = getPayload(request.session);
    if (six && !payload.user.activeDay) {
      payload.user.day = 5;
      payload.user.activeDay = true;
    }
  }

  response.render('index', {
    jsonPayload: JSON.stringify(payload),
    js: nap.js('all'),
    css: nap.css('all')
  });
});

app.get('/privacy', function(request, response) {
  response.render('privacy');
});

app.get('/help', function(request, response) {
  response.render('help');
});

// app.post('/verify', function(request, response) {
//   var assertion = request.body.assertion;
//   if (!assertion) {
//     response.status(400).send({
//       error: 'No assertion'
//     });
//   }
//   console.log('Verifying with %s', nconf.get('audience'));
//   Users.emailFromAssertion(assertion, nconf.get('audience'), function(err, result) {
//     if (err) {
//       console.log('Users.emailFromAssertion failed', err);
//       return response.status(400).send({
//         error: 'Invalid assertion'
//       });
//     }
//     console.log('Users.login', result.email);

//     Users.login(result.email, function(err, user) {
//       if (err || !user) {
//         console.log('Users.login failed', err);
//         return response.status(400).send({
//           error: 'User not found'
//         });
//       }

//       request.session.user = user;

//       console.log('Users.login success', user.username);
//       response.send({
//         status: 1,
//         user: getPayload(request.session)
//       });
//     });
//   });
// });

// app.post('/questions', isLoggedIn, function(request, response) {
//   var session = request.session;
//   var user = request.session.user;

//   if (session.submitted || !isActiveDay(user)) {
//     // 2 hours = nconf.get('surveyIdle') ms
//     var nextQuestions = (new Date(session.submitted + nconf.get('surveyIdle'))).getTime();
//     if (nextQuestions > Date.now()) {
//       return response.status(400).send({
//         status: 0,
//         error: 'idle'
//       });
//     }
//   }

//   Surveys.add({
//     user: user.username,
//     location: user.location,
//     mood: request.body.mood,
//     quote: request.body.quote,
//     influencers: request.body.influencers,
//   }, function(err) {
//     if (err) {
//       return response.status(400).send({
//         status: 0
//       });
//     }
//     // TODO: Store in redis
//     session.submitted = Date.now();
//     response.send({
//       status: 1,
//       error: 'storage'
//     });
//   });
// });
app.get('/badges', function(req, res, next) {
  client.get('badges', function(err, badges) {
    res.json(JSON.parse(badges));
  });
});

app.get('/faq', function(req, res, next) {
  client.get('faq', function(err, faq) {
    res.send(faq);
  });
});

app.get('/schedule', function(req, res, next) {
  client.smembers('schedules', function(err, schedules) {
    if (err) {
      return res.status(400).send();
    }

    var scheduleList = {};
    var sortedSchedule = {};
    var count = 0;
    var title;

    schedules.forEach(function(title, idx) {
      client.get('schedule:' + title, function(err, s) {
        count++;

        if (err) {
          return res.status(400).send({
            error: err
          });
        }

        try {
          scheduleList[title] = JSON.parse(s);
        } catch (e) {
          console.log('Could not parse schedule ', s);
        }

        if (count === schedules.length) {
          var keys = [];

          for (var key in scheduleList) {
            if (scheduleList.hasOwnProperty(key)) {
              keys.push(key);
            }
          }

          keys.sort();

          for (var i = 0; i < keys.length; i++) {
            sortedSchedule[keys[i]] = scheduleList[keys[i]];
          }

          // var shorten = function(link){
          //   shorturl(link, 'bit.ly', {login: nconf.get('bitlyLogin'), apiKey: nconf.get('bitlyKey')}, function(result){
          //     context.link = result;
          //   });
          // };

          for (var track in sortedSchedule){
            var evt = sortedSchedule[track];

            for (var entry in evt){
              if(evt[entry].name){
                var slug = evt[entry].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                  link = nconf.get('etherpadURL') + evt[entry].id + '_' + slug;

                evt[entry].slug = slug;
              }
              if(!evt[entry].link){
                evt[entry].link = link;
              }
            }
          }
          // response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          // response.setHeader("Pragma", "no-cache");
          // response.setHeader("Expires", "0");

          res.send({
            schedule: sortedSchedule
          });
        }
      });
    });
  });
});

app.post('/logout', function(request, response) {
  request.session.destroy();
  response.status(200).send();
});


app.get('/time', function(request, response) {
  response.render('time', {
    currentTime: Date().toString()
  });
});

app.get('/timeUpdater.js', function(req, res) {
  res.contentType('application/javascript');
  res.sendfile(__dirname + '/public/js/timeUpdater.js');
});


app.get('/manifest.webapp', function(req, res) {
  res.contentType('application/x-web-app-manifest+json');
  res.sendfile(__dirname + '/public/manifest.webapp');
});

// app.get('/typeahead', isLoggedIn, function(req, res) {
//   var location = req.session.user.location;
//   var currentUser = req.session.user.username;
//   var defaultGravatar = nconf.get('domain') + nconf.get('gravatarPath');

//   client.smembers('location:' + location, function(err, usernames) {
//     if (err) {
//       return res.status(400).send();
//     }

//     var multi = client.multi();
//     for (var username in usernames) {
//       if (currentUser != usernames[username]) {
//         multi.hgetall('user:' + usernames[username]);
//       }
//     }
//     multi.exec(function(err, users) {
//       if (err || !users) {
//         return res.status(400).send();
//       }

//       var cleanUsers = users.map(function(user) {
//         var entry = {
//           fullName: user.fullName,
//           username: user.username
//         };
//         entry.avatar = user.avatar || gravatar.url(user.email, {
//           s: 50,
//           d: defaultGravatar
//         }, true);
//         return entry;
//       });

//       res.send(cleanUsers);
//     });
//   });
// });

// generate appcache manifest ONLY if production
// - less than optimal, refactor

app.get('/firehug.appcache', function(req, res) {
  if(process.env.NODE_ENV == 'production'){
    var fs = require('fs');
    // deal w/ css/js
    var assets = fs.readdirSync('./public/assets/'),
        partials = fs.readdirSync('./public/partials/'),
        images = fs.readdirSync('./public/img/'),
        fonts = fs.readdirSync('./public/fonts/');

    assets.forEach(function(e, i, a){
      a[i] = './assets/' + e;
    });

    partials.forEach(function(e, i, a){
      a[i] = './partials/' + e;
    });

    images.forEach(function(e, i, a){
      a[i] = './img/' + e;
    });

    fonts.forEach(function(e, i, a){
      a[i] = './fonts/' + e;
    });

    var caches = assets.concat(partials);

    res.contentType('text/cache-manifest');
    res.send('CACHE MANIFEST\n# Created ' + now + '\n' + caches.join('\n') + '\n\nNETWORK:\n*');
  }
  else {
    res.contentType('text/cache-manifest');
    res.send('CACHE MANIFEST\n# Created ' + now + '\n\nNETWORK:\n*');
  }
});

// Start express server
var server = http.createServer(app);
server.listen(process.env.PORT || 5000, function() {
  var address = server.address();
  console.log('Listening on http://%s:%d', address.address, address.port);
});


// var Users = {

//   emailFromAssertion: function(assertion, audience, next) {
//     var vreq = https.request({
//       host: 'login.persona.org',
//       path: '/verify',
//       method: 'POST'
//     }, function(vres) {
//       var body = '';
//       vres.on('data', function(chunk) {
//         body += chunk;
//       }).on('end', function() {
//         try {
//           var verifierResp = JSON.parse(body);
//           var valid = verifierResp && verifierResp.status === 'okay';
//           if (!valid) {
//             next(new Error('failed to verify assertion: ' + verifierResp.reason));
//             return;
//           }
//           next(null, {
//             email: verifierResp.email
//           });
//         } catch (e) {
//           next(new Error('non-JSON response from verifier: ' + e));
//         }
//       });
//     });
//     vreq.setHeader('Content-Type', 'application/x-www-form-urlencoded');

//     var data = querystring.stringify({
//       assertion: assertion,
//       audience: audience
//     });
//     vreq.setHeader('Content-Length', data.length);
//     vreq.write(data);
//     vreq.end();
//   },

//   login: function(email, next) {
//     client.get('email:' + email.toLowerCase(), function(err, username) {
//       if (err || !username) {
//         return next(new Error('Email not found ', err));
//       }
//       console.log('login with username: %s', username);
//       client.hgetall('user:' + username, function(err, user) {
//         console.log()
//         if (err || !user) {
//           return next(new Error('Username not found ', err));
//         }
//         next(null, user);
//       });
//     });
//   }

// };

// var Surveys = {

//   add: function(record, next) {

//     var Spreadsheet = require('edit-google-spreadsheet');

//     Spreadsheet.create({
//       debug: true,
//       username: nconf.get('surveyGoogleEmail'),
//       password: nconf.get('surveyGooglePass'),
//       spreadsheetId: nconf.get('surveyGoogleSpreadsheet'),
//       worksheetId: nconf.get('surveyGoogleWorksheet'),
//       callback: function sheetReady(err, spreadsheet) {
//         if (err) {
//           return next(err);
//         }

//         spreadsheet.receive(function(err, rows, info) {
//           if (err) {
//             return next(err);
//           }
//           var nextRow = info.nextRow;

//           var values = {};
//           values[nextRow] = [
//             [
//               (new Date()).toUTCString(),
//               record.user,
//               record.location,
//               record.mood || '-',
//               record.quote || '-', (record.influencers || []).join(', ')
//             ]
//           ];
//           spreadsheet.add(values);

//           spreadsheet.send({
//             autoSize: true
//           }, function(err) {
//             if (err) {
//               return next(err);
//             }
//             console.log('Added row %d', nextRow);
//             next(null);
//           });

//         });
//       }
//     });
//   }

// };
