/* Moralis init code */
// const envConfig = require("dotenv").config();
const serverUrl = "https://9cvwoxmdycjc.usemoralis.com:2053/server";
const appId = "NBFkEdWvk1BVt9gn2FWVdcuRNnuG0UqO5csYEakT";
Moralis.start({ serverUrl, appId });
Moralis.enableWeb3();

// Then switch accordingly
// const chainId = "0x1"; //Ethereum Mainnet
// const chainIdHex = await Moralis.switchNetwork(chainId); 
document.getElementById("wager-message").innerHTML = "";
document.getElementById("wallet-address").innerHTML = "";

async function loginWalletConnect() {
  console.log("login");

  let user = Moralis.User.current();
  if (!user) {
    user = await Moralis.authenticate({
      signingMessage: "Signing connection to Galaxy Conquest",
      provider: "walletconnect"
    })
      .then(function (user) {
        console.log("logged in user:", user);
        console.log(user.get("ethAddress"));
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}
/* Authentication code */
async function login() {
  console.log("login");

  let user = Moralis.User.current();
  if (!user) {
    user = await Moralis.authenticate({
      signingMessage: "Signing connection to Galaxy Conquest",
      chainId: 338
    })
      .then(function (user) {
        console.log("logged in user:", user);
        console.log(user.get("ethAddress"));
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  document.getElementById("treasury-balance").innerHTML="Galaxy Treasury Balance: " + await getTreasuryBalance()

}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
}

async function getTreasuryBalance() {
    const balance = await Moralis.Web3API.account.getNativeBalance({
      address: "0x4548dc5396867304cDF3042639F8883ee0d7c503",
      chain: "0x152"
    });
    console.log("treasury balance:", Moralis.Units.FromWei(balance.balance));

    return Moralis.Units.FromWei(balance.balance);
}

async function getUserBalance() {
  const user = Moralis.User.current();
  if (user) {
    const ethAddress = user.get("ethAddress");
    console.log("ethAddress:", ethAddress);
    const balance = await Moralis.Web3API.account.getNativeBalance({
      address: ethAddress,
      chain: "0x152"
    });
    console.log("user balance:", balance);
    return balance;
  }
}

async function wager() {
  let user = Moralis.User.current();
  // check if connected to wallet
  console.log("user:", user);
  if (user == null) {
    document.getElementById("wager-message").innerHTML="Please login first...";
    login();
  } else 
  {
    const options = {
      type: "native",
      amount: Moralis.Units.ETH("2.5"),
      receiver: "0x4548dc5396867304cDF3042639F8883ee0d7c503"
    };
    document.getElementById("wager-message").innerHTML = "Requesting permission to transfer 2.5 CRO";
    const transaction = await Moralis.transfer(options);
    document.getElementById("wager-message").innerHTML = "Transferring 2.5 CRO as wager";
    // wait for at least one transaction confirmation
    const result = await transaction.wait();
    console.log("result:", result);
    if (result && result.status) {
      document.getElementById("wager-message").innerHTML = "Wager placed! Proceed with invasion!";
      document.getElementById("wallet-address").innerHTML = result.from;
    } else {
      document.getElementById("wager-message").innerHTML = "Error placing wager! Try again later.";
    }
  }
}

document.getElementById("btn-login").onclick = login;
document.getElementById("btn-login-walletconnect").onclick = loginWalletConnect;
document.getElementById("btn-logout").onclick = logOut;
document.getElementById("btn-wager").onclick =  wager;
