/* global later */
'use strict';

var serverTimeElement = document.getElementById( 'time' );
var serverTime = new Date( serverTimeElement.innerHTML );

var laterElement = document.getElementById( 'later' );
var laterSchedule = later.parse.cron( laterElement.getAttribute( 'data-cron' ) );
var laterTime = new Date( laterElement.innerHTML );

function updateTime() {
  serverTime.setSeconds( serverTime.getSeconds() + 1 );
  serverTimeElement.innerHTML = serverTime;

  if( serverTime.valueOf() >= laterTime.valueOf() ) {
    laterTime = later.schedule( laterSchedule ).next( 1 );
    laterElement.innerHTML = laterTime;
    laterTime = new Date( laterTime );
  }
}

setInterval( updateTime, 1000 );
