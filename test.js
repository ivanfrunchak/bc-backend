import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { logFatal, logSuccess } from "./libs/logging.js";

let SCORES = require('./SCORE.json');
let BETTINGS = require('./BETTINGS.json');
const fs = require('fs');
let totalBet = 0;
let winBet = 0;

let deepCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
let betting1Count = 0;
let betting1WinCount = 0;
SCORES.map((b, index) => {

    const cnd = b.totalLoseOf3Deep < -40000
    // && b.totalLoseOf3Deep > -30000
    && b.x3Count >= 1
    // && b.x3OfPatternWithLose >= 100
    // && b.scoreOfPatternWithLose >= 50
    // && b.loseAmount < -4000;

    // const cnd = b.totalLoseOf3Deep > 30000
    // && b.x3Count >= 2

    // const cnd = b.totalLoseOf3Deep > 26000
    // && b.x3Count >= 0
    // && b.loseOf2Deep <= 60000

    // const cnd = b.score < 1.06
    // && b.x3Count >= 2
    // && b.loseOf2Deep <= -1000
    // && b.loseOf2Deep >= -6000

    // const cnd = b.payouts.startsWith('2,2,1')
    // && b.score < 2
    // && b.x3Count >= 2
    // && b.loseOf2Deep <= -1000
    // && b.loseOf2Deep >= -6000
    if (cnd) {
        betting1Count++;

        if (b.nextScore >= 3) {
            betting1WinCount++;
            // logSuccess('B=', JSON.stringify(b, null, 4))
        } else {
            // logFatal('B=', JSON.stringify(b, null, 4))
            // if (SCORES[index +1]) {
            //     //totalBet ++ //= 2;
            //     if (SCORES[index +1].nextScore >= 2) {
            //         betting1WinCount ++ //= 2 * 3;
            //     }
            // } 
            // else {
            //     if (SCORES[index +2]) {
            //         //totalBet ++ //= 4;
            //         if (SCORES[index +2].nextScore >= 2 ) {
            //             betting1WinCount ++ //= 4 * 3;
            //         }       
            //     } else {
            //         if (SCORES[index +3]) {
            //             //totalBet ++ //= 4;
            //             if (SCORES[index +3].nextScore >= 2 ) {
            //                 betting1WinCount ++ //= 4 * 3;
            //             }       
            //         }
            //     }
            // }
        }
    }
})

console.log({
    betting1Count, betting1WinCount
})

BETTINGS.map((b, index) => {
    if (b.nextScore < 2) {

        for (let i = 1; i < 7; i++) {
            
            if (BETTINGS[index+i] && BETTINGS[index+i].nextScore < 2) {
                // console.log(index, i, BETTINGS[index+i].nextScore);
                deepCounts[i] ++;
                // console.log('deepCounts=', deepCounts);
            } else {
                break;
            }
            
        }
        
    }
});



const a = SCORES.filter((d, index) => {

    if (d.score < 2.4
        && d.x3Count >= 1
        && d.loseScore == 4 
        // && d.scoreOfPatternWithLimit >= 100 
        // && d.scoreOfPatternNoLimit >= 100
        && d.scoreOfPatternWithLose >= 70
     /*&& d.scoreOfPatternWithLimit >= 70*/) {
        totalBet++;
        if (d.nextScore >= 3) {
            winBet ++ //= 3;
        } else {
            if (SCORES[index +1]) {
                totalBet ++ //= 2;
                if (SCORES[index +1].nextScore >= 3) {
                    winBet ++ //= 2 * 3;
                }
            } 
            else {
                if (SCORES[index +2]) {
                    totalBet ++ //= 4;
                    if (SCORES[index +2].nextScore >= 3 ) {
                        winBet ++ //= 4 * 3;
                    }       
                }
            }

            
        }
        
    }

    if (d.nextScore >= 3) return true;
});

console.log(totalBet, winBet, totalBet - winBet)
fs.writeFileSync('./2.5.json', JSON.stringify(a, null, 4));

