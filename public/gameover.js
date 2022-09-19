let winner = localStorage.getItem("winner");
let firstRunnerUp = localStorage.getItem("firstRunnerUp");
let secondRunnerUp = localStorage.getItem("secondRunnerUp");
let totalPlayers = localStorage.getItem("totalPlayers");

document.getElementById("winner-announcement").innerHTML =
  winner + " won the game!";

if (firstRunnerUp) {
  document.getElementById("first-runnerup").innerHTML =
    firstRunnerUp + " got the highest score";
}
if (secondRunnerUp) {
  document.getElementById("second-runnerup").innerHTML =
    secondRunnerUp + " got the next highest score";
}

// on click wait 10 seconds and redirect to home
document.getElementById("btn-home").onclick = setTimeout(function(){ document.location.href="/"; }, 10000);
