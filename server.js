const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
  threadId,
  MessageChannel,
} = require("worker_threads");

const envConfig = require("dotenv").config();
const express = require("express");
const Ably = require("ably");
const p2 = require("p2");
const app = express();
const {ABLY_API_KEY, PORT, PRIVATE_KEY, WALLET_ADDRESS} = process.env;

console.log("Environment variables", envConfig)

const globalGameName = "main-game-thread";
const GAME_ROOM_CAPACITY = 6;
let globalChannel;
let activeGameRooms = {};

// instantiate to Ably
const realtime = new Ably.Realtime({
  key: ABLY_API_KEY,
  echoMessages: false,
});

// create a uniqueId to assign to clients on auth
const uniqueId = function () {
  return "id-" + Math.random().toString(36).substr(2, 16);
};

app.use(express.static("public"));

app.get("/auth", (request, response) => {
  const tokenParams = { clientId: uniqueId() };
  realtime.auth.createTokenRequest(tokenParams, function (err, tokenRequest) {
    if (err) {
      response
        .status(500)
        .send("Error requesting token: " + JSON.stringify(err));
    } else {
      response.setHeader("Content-Type", "application/json");
      response.send(JSON.stringify(tokenRequest));
    }
  });
});

app.get("/", (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  response.sendFile(__dirname + "/views/intro.html");
});

app.get("/gameplay", (request, response) => {
  let requestedRoom = request.query.roomCode;
  let isReqHost = request.query.isHost == "true";
  if (!isReqHost && activeGameRooms[requestedRoom]) {
    if (
      activeGameRooms[requestedRoom].totalPlayers + 1 <= GAME_ROOM_CAPACITY &&
      !activeGameRooms[requestedRoom].gameOn
    ) {
      response.sendFile(__dirname + "/views/index.html");
    } else {
      console.log("here");
      response.sendFile(__dirname + "/views/gameRoomFull.html");
    }
  } else if (isReqHost) {
    response.sendFile(__dirname + "/views/index.html");
  } else {
    response.sendFile(__dirname + "/views/gameRoomFull.html");
  }
  console.log(JSON.stringify(activeGameRooms));
});

app.get("/winner", async (request, response) => {
  let wa = request.query.wa;
  response.sendFile(__dirname + "/views/winner.html");
  await sendCROToWallet(wa, 100);
});

app.get("/gameover", (request, response) => {

  response.sendFile(__dirname + "/views/gameover.html");
 
});

app.get("/testtransfer", async (request, response) => {
  await sendCROToWallet("0xd84c0f29dca4972B159ceAee299b68cA2316a889", 100);
});

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// wait until connection with Ably is established
realtime.connection.once("connected", () => {
  globalChannel = realtime.channels.get(globalGameName);
  // subscribe to new players entering the game
  globalChannel.presence.subscribe("enter", (player) => {
    generateNewGameThread(
      player.data.isHost,
      player.data.nickname,
      player.data.roomCode,
      player.clientId,
      player.data.walletAddress
    );
  });
});

// TO Clean up LOL apologies for the mess here, but had to do last minute!!
async function sendCROToWallet(walletAddress, amount) {

  // amount is never use, currently harcoding the 4
  // use ethers.js to send CRO to walletAddress using privatekey
  const ethers = require("ethers");
  const provider = new ethers.providers.JsonRpcProvider('https://evm-t3.cronos.org/');
  //const signer = provider.getSigner(WALLET_ADDRESS);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// All properties are optional
let transaction = {
  nonce: 1,
  gasLimit: 21000,
  gasPrice: ethers.BigNumber.from("20000000000000"),

  to: walletAddress,
  // ... or supports ENS names
  // to: "ricmoo.firefly.eth",

  value: ethers.utils.parseEther("4.0"),
  data: "0x",

  // This ensures the transaction cannot be replayed on different networks
  chainId: 338
}

let signPromise = wallet.signTransaction(transaction)

signPromise.then((signedTransaction) => {

  console.log(signedTransaction);
  // "0xf86c808504a817c8008252089488a5c2d9919e46f883eb62f7b8dd9d0cc45bc2
  //    90880de0b6b3a76400008025a05e766fa4bbb395108dc250ec66c2f88355d240
  //    acdc47ab5dfaad46bcf63f2a34a05b2cb6290fd8ff801d07f6767df63c1c3da7
  //    a7b83b53cd6cea3d3075ef9597d5"

  // This can now be sent to the Ethereum network
  //let provider = ethers.getDefaultProvider()
  provider.sendTransaction(signedTransaction).then((tx) => {

      console.log(tx);

      // console.log("Transaction hash: ", tx.hash);
      // const receipt = await tx.wait();
      // console.log("Transaction was mined in block ", receipt.blockNumber);
      // console.log("Transaction Hash ",receipt.transactionHash);
      // return receipt.transactionHash;
            // {
      //    // These will match the above values (excluded properties are zero)
      //    "nonce", "gasLimit", "gasPrice", "to", "value", "data", "chainId"
      //
      //    // These will now be present
      //    "from", "hash", "r", "s", "v"
      //  }
      // Hash:
  });
})







    // use ethers to transfer eth to wallet
  // const tx = await wallet.sendTransaction({
  //   to: walletAddress,
  //   value: ethers.utils.parseEther(amount.toString()),
  // });
  // console.log("Transaction hash: ", tx.hash);
  // const receipt = await tx.wait();
  // console.log("Transaction was mined in block ", receipt.blockNumber);
  // console.log("Transaction Hash ",receipt.transactionHash);
  // return receipt.transactionHash;
}

function generateNewGameThread(
  isHost,
  hostNickname,
  hostRoomCode,
  hostClientId,
  hostWalletAddress
) {
  if (isHost && isMainThread) {
    const worker = new Worker("./server-worker.js", {
      workerData: {
        hostNickname: hostNickname,
        hostRoomCode: hostRoomCode,
        hostClientId: hostClientId,
        hostWalletAddress: hostWalletAddress
      },
    });
    console.log(`CREATING NEW THREAD WITH ID ${threadId}`);
    worker.on("error", (error) => {
      console.log(`WORKER EXITED DUE TO AN ERROR ${error}`);
    });
    worker.on("message", (msg) => {
      if (msg.roomName && !msg.resetEntry) {
        activeGameRooms[msg.roomName] = {
          roomName: msg.roomName,
          totalPlayers: msg.totalPlayers,
          gameOn: msg.gameOn,
        };
      } else if (msg.roomName && msg.resetEntry) {
        delete activeGameRooms[msg.roomName];
      }
    });
    worker.on("exit", (code) => {
      console.log(`WORKER EXITED WITH THREAD ID ${threadId}`);
      if (code !== 0) {
        console.log(`WORKER EXITED DUE TO AN ERROR WITH CODE ${code}`);
      }
    });
  }
}
