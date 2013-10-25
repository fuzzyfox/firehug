var currentTime = document.getElementById("time").getAttribute("data-currentTime");
var serverTime = new Date(currentTime);

function updateTime() {
  serverTime.setSeconds(serverTime.getSeconds() + 1);
  document.getElementById("time").innerHTML = "<p>" + serverTime + "</p>";
}

setInterval(updateTime, 1000);