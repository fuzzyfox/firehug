/* global later */
'use strict';

/**
 * @file Server time vs server poll time
 *
 * Used to make the times (clocks) at /time tick once per second.
 *
 * /time is used to get current server time to help (with human input)
 * avoid the race condition between Google Spreadsheet updates to the
 * event schedule + the server polling for schedule data.
 *
 * /time exposes the server time at page load and time of the next poll
 * to Google servers. The poll frequency is exposed as well allowing
 * for the page to recalculate the next poll more precisely.
 *
 * For additional visual ease this script also changes the background colour
 * for the page from green to red, depending on how much time is left till
 * the next poll.
 *
 * @license MPL-2.0
 */

// get server time
var serverTimeElement = document.getElementById( 'time' );
var serverTime = new Date( serverTimeElement.innerHTML );

// get next poll time
var laterElement = document.getElementById( 'later' );
var laterSchedule = later.parse.cron( laterElement.getAttribute( 'data-cron' ) );
var laterTime = new Date( laterElement.innerHTML );

// calculate HSL colour incrememts
var pollInterval = later.schedule( laterSchedule ).next( 2 ); // get 2 poll times to compare
pollInterval = (new Date( pollInterval[ 1 ] )).valueOf() - (new Date( pollInterval[ 0 ] )).valueOf(); // calc diff
pollInterval = pollInterval / 1000; // convert ms to s
var hslIncrement = 120 / pollInterval; // 120 = green, 0 = red (hue value,  h)

// calc starting hue value
var hslHue = 0 + ( hslIncrement * ( ( laterTime.valueOf() - serverTime.valueOf() ) / 1000 ) );

// quick access to progress indicator
var progressElement = document.getElementById( 'progress' );

/**
 * Update the times displayed once per second
 */
function updateTime() {
  serverTime.setSeconds( serverTime.getSeconds() + 1 );
  serverTimeElement.innerHTML = serverTime;
  hslHue = hslHue - hslIncrement;

  if( serverTime.valueOf() >= laterTime.valueOf() ) {
    // update next poll interval if we've passed the last
    laterTime = later.schedule( laterSchedule ).next( 1 );
    laterElement.innerHTML = laterTime;
    laterTime = new Date( laterTime );

    // reset background to green
    hslHue = 120;
  }

  progressElement.style.backgroundColor = 'hsl( ' + hslHue + ', 80%, 50%)';
  progressElement.style.width = ( ( laterTime.valueOf() - (new Date()).valueOf() ) / ( pollInterval * 1000 ) * 100 ) + '%';
}

// start a 1 second interval
setInterval( updateTime, 1000 );
