let winner = localStorage.getItem("winner");
let walletAddress = localStorage.getItem("walletAddress");
let firstRunnerUp = localStorage.getItem("firstRunnerUp");
let secondRunnerUp = localStorage.getItem("secondRunnerUp");
let totalPlayers = localStorage.getItem("totalPlayers");

document.getElementById("winner-announcement").innerHTML =
  winner + " won the game!";

document.getElementById("wallet-address").innerHTML =
walletAddress;

if (firstRunnerUp) {
  document.getElementById("first-runnerup").innerHTML =
    firstRunnerUp + " is the first runner up";
}
if (secondRunnerUp) {
  document.getElementById("second-runnerup").innerHTML =
    secondRunnerUp + " is the second runner up";
}

// on click wait 10 seconds and redirect to home
document.getElementById("btn-home").onclick = setTimeout(function(){ document.location.href="/"; }, 10000);

