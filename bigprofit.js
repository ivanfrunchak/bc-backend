import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');
const CryptoJS = require("crypto-js");
let SCORES = require('./SCORE.json');
let PAYOUTS = require('./payouts.json');
const lastPayout = require('./lastPayout.json');

import { SERVER_SALT } from "./libs/contants.js";
import { checkPattern, gameResult, sortValues } from "./libs/utils.js";
import { logFatal, logSuccess } from "./libs/logging.js";


const checkTrendDirection = (payouts, start, count = 0) => {

    let endPoint = 0;
    let startPoint = 0;
    if (count >= 0) {
        startPoint = start;
        endPoint = start + count;
    } else {
        startPoint = start + count;
        endPoint = start;
    }

    // console.log(startPoint, endPoint);
    const lastPayouts = payouts.slice(startPoint, endPoint);
    let sum = 0;
    lastPayouts.map(p => {
        if (p >= 3) {
            sum = sum + 2
        } else {
            sum = sum - 1
        }
    })

    return sum;

}


const calcDeadCount = (subPayouts, maxCount) => {

    let deadCount = 0;
    let found3X = false;
    for (let i = 0; i < subPayouts.length; i++) {
        if (subPayouts[i] >= 3) {
            found3X = true;
            const subData = subPayouts.slice(i + 1, i + 1 + maxCount);



            if (subData.filter(d => d >= 3).length == 0) {
                deadCount++;
                i = i + maxCount;
                console.log("SUB DATA", subData);
            }

        }
    }

    return deadCount;

}
const main = () => {
    // let's get payouts
    const initialHash = '8525f3437b0ca510daeba6aae74820df40edb343fc1fc143498a49401cdbc00d';
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < 10000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }

    let moonCount = 0;
    for (let i = 41; i < 10000 - 60; i++) {

        const longDirection = checkTrendDirection(payouts, i, -40);
        console.log(longDirection);
        if (longDirection >= 5) {
            moonCount++;
            const subPayouts = payouts.slice(i, i + 24);
            //console.log(subPayouts);
            i = i + 24;

            const deadCount = calcDeadCount(subPayouts, 3);

            if (deadCount >= 1) {
                console.log(subPayouts);
            }
        }
    }

    console.log("MOON COUNT", moonCount);

}

const getConditions = (payouts, hashes, mCount, pCount) => {

    const conditions = [];
    for (let i = 60; i < payouts.length - 61; i++) {
        if (payouts[i] >= 3) {
            const moonDirection = checkTrendDirection(payouts, i, 30);
            const shortDirection = checkTrendDirection(payouts, i, -10);
            const longDirection = checkTrendDirection(payouts, i, -25);
            const longDirection2 = checkTrendDirection(payouts, i, -40);
            const longDirection3 = checkTrendDirection(payouts, i, -60);

            const subPayout = payouts.slice(i - 12, i);
            const nextPayout = payouts.slice(i + 1, i + pCount);
            const moonCount = nextPayout.filter(p => p >= 3).length;
            const subMoonCount = subPayout.filter(p => p >= 3).length;

            if (moonCount >= mCount && longDirection2 >= -4 && longDirection >= 2) {
                // console.log({subMoonCount, moonCount, shortDirection, longDirection, longDirection2, moonDirection});
                conditions.push({ subMoonCount, moonCount, shortDirection, longDirection, longDirection2, moonDirection, longDirection3, lastHash: hashes[i + 80] })
                i = Math.round(i + pCount);
            }
        }
    }

    return conditions;
}

const moon = () => {
    // let's get payouts
    let initialHash = '3e414b221e19d440daeb7a832c7219c982fbe719ceac7abd6e771f2bcd65e619';
    let prevHash = null;
    let payouts = [];
    let hashes = [];
    for (let i = 0; i < 30000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    let fitCount = 0;
    let failedCount = 0;
    let winCount = 0;

    const conditions30 = getConditions(payouts, hashes, 12, 30);


    // const conditions10 = getConditions(payouts, 6, 12);
    // const conditions7 = getConditions(payouts, 4, 7);

    // //initialHash = '12cb1cb3a853bc02309b36fd4ab4fd78ea1ba8472f19c5dc6ef15109e6676fe5';
    // initialHash = '8525f3437b0ca510daeba6aae74820df40edb343fc1fc143498a49401cdbc00d';
    // prevHash = null;
    // payouts = [];
    // for (let i = 0; i < 3000; i++) {
    //     let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
    //     let bust = gameResult(hash, SERVER_SALT);
    //     prevHash = hash;
    //     payouts.unshift(bust);
    // }

    // let matchedCount = 0;


    // for (let i = 60; i < payouts.length - 61; i++) {
    //     if (payouts[i] >= 3) {
    //         const moonDirection = checkTrendDirection(payouts, i, 30);
    //         const shortDirection = checkTrendDirection(payouts, i, -10);
    //         const longDirection = checkTrendDirection(payouts, i, -25);
    //         const longDirection2 = checkTrendDirection(payouts, i, -40);
    //         const longDirection3 = checkTrendDirection(payouts, i, -60);
    //         const subPayout = payouts.slice(i - 12, i);
    //         let nextPayout = payouts.slice(i + 1, i + 30);
    //         let moonCount = nextPayout.filter(p => p >= 3).length;
    //         const subMoonCount = subPayout.filter(p => p >= 3).length;
    //         let found = false;
    //         let conditionMatchedCount = 0;
    //         let matched30 = false, matched10 = false, matched7 = false;
    //         for (let j = 0; j < conditions30.length; j++) {
    //             const condition = conditions30[j];
    //             nextPayout = payouts.slice(i + 1, i + 30);
    //             moonCount = nextPayout.filter(p => p >= 3).length;
    //             // let's find the points
    //             if (subMoonCount <= condition.subMoonCount
    //                 && (shortDirection >= condition.shortDirection - 2 && shortDirection <= condition.shortDirection + 2)
    //                 && (longDirection >= condition.longDirection - 2 && longDirection <= condition.longDirection + 2)
    //                 && (longDirection2 >= condition.longDirection2 - 2 && longDirection2 <= condition.longDirection2 + 2)
    //                 && (longDirection3 >= condition.longDirection3 - 2 && longDirection3 <= condition.longDirection3 + 2)
    //             ) {
    //                 conditionMatchedCount++;
    //                 matched30 = true;
    //             }
    //         }

    //         // for (let j = 0; j < conditions10.length; j++) {
    //         //     const condition = conditions10[j];
    //         //     nextPayout = payouts.slice(i + 1, i + 10);
    //         //     moonCount = nextPayout.filter(p => p >= 3).length;
    //         //     // let's find the points
    //         //     if (subMoonCount <= condition.subMoonCount
    //         //         && (shortDirection >= condition.shortDirection - 2 && shortDirection <= condition.shortDirection + 2)
    //         //         && (longDirection >= condition.longDirection - 2 && longDirection <= condition.longDirection + 2)
    //         //         && (longDirection2 >= condition.longDirection2 - 2 && longDirection2 <= condition.longDirection2 + 2)
    //         //         && (longDirection3 >= condition.longDirection3 - 2 && longDirection3 <= condition.longDirection3 + 2)
    //         //     ) {
    //         //         conditionMatchedCount++;
    //         //         matched10 = true;
    //         //     }
    //         // }

    //         // for (let j = 0; j < conditions7.length; j++) {
    //         //     const condition = conditions7[j];
    //         //     nextPayout = payouts.slice(i + 1, i + 7);
    //         //     moonCount = nextPayout.filter(p => p >= 3).length;
    //         //     matched7 = true;
    //         //     // let's find the points
    //         //     if (subMoonCount <= condition.subMoonCount
    //         //         && (shortDirection >= condition.shortDirection - 2 && shortDirection <= condition.shortDirection + 2)
    //         //         && (longDirection >= condition.longDirection - 2 && longDirection <= condition.longDirection + 2)
    //         //         && (longDirection2 >= condition.longDirection2 - 2 && longDirection2 <= condition.longDirection2 + 2)
    //         //         && (longDirection3 >= condition.longDirection3 - 2 && longDirection3 <= condition.longDirection3 + 2)
    //         //     ) {
    //         //         conditionMatchedCount++;
    //         //     }
    //         // }

    //         if (matched30) {
    //             matchedCount++;
    //             nextPayout = payouts.slice(i + 1, i + 30);
    //             moonCount = nextPayout.filter(p => p >= 3).length;
    //             found = true;
    //             if (moonCount >= 10) {
    //                 // console.log('SUCCEED', { conditionMatchedCount, subMoonCount, moonCount, shortDirection, longDirection, longDirection2, longDirection3, moonDirection });
    //             }
    //             else {
    //                 // console.log(moonCount, {
    //                 //     subPayout, nextPayout
    //                 // });

    //                 failedCount++;
    //                 console.log('FAILED', { conditionMatchedCount, subMoonCount, moonCount, shortDirection, longDirection, longDirection2, longDirection3, moonDirection });
    //             }
    //         }

    //         if (found) {
    //             i = i + 30;
    //         }
    //     }

    // }
    // console.log(matchedCount, failedCount)

    console.log(conditions30.length);

    fs.writeFileSync('./MOON.json', JSON.stringify(conditions30, null, 4));


}


const check5_3 = () => {
    // let's get payouts
    let initialHash = '3e414b221e19d440daeb7a832c7219c982fbe719ceac7abd6e771f2bcd65e619';
    let prevHash = null;
    let payouts = [];
    let hashes = [];
    for (let i = 0; i < 30000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    let fitCount = 0;
    let winCount = 0;
    for (let i = 60; i < payouts.length - 61; i++) {
        if (payouts[i] >= 3) {

            const shortDirection = checkTrendDirection(payouts, i, -10);
            const longDirection = checkTrendDirection(payouts, i, -25);
            const longDirection2 = checkTrendDirection(payouts, i, -40);
            const longDirection3 = checkTrendDirection(payouts, i, -60);
            const subPayout = payouts.slice(i - 4, i + 1);
            let nextPayout = payouts.slice(i + 1, i + 4);
            let moonCount = nextPayout.filter(p => p >= 3).length;
            const subMoonCount = subPayout.filter(p => p >= 3).length;

            if (
                // shortDirection >= -1 && shortDirection <= 5
                // && longDirection >= -1 && longDirection <= 5 
                longDirection2 >= 8 && longDirection2 <= 11
                && subMoonCount <= 1) {
                fitCount++;
                if (moonCount >= 1) {
                    winCount++;
                    logSuccess(JSON.stringify({
                        score: payouts[i], shortDirection, longDirection, longDirection2, longDirection3, subPayout, nextPayout
                    }))
                } else {
                    logFatal(JSON.stringify({
                        score: payouts[i], shortDirection, longDirection, longDirection2, longDirection3, subPayout, nextPayout
                    }))
                }
                i = i + 3;
            }


        }
    }

    console.log(fitCount, winCount);

}

let failPatterns = [];
let winPatterns = [];
let multiWinPatterns = {};


let bettingPoints = [];
const checkSible = () => {
    // let's get payouts
    let initialHash = SCORES[SCORES.length - 1].hash;
    let prevHash = null;
    let payouts = [];
    let hashes = [];
    for (let i = 0; i < 100000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    let sum = 0;
    let plusArray = [];
    let minusArray = [];
    let sumArray = [];

    let prevBust = -1;

    let fitCount0 = 0;
    let winCount2x = 0;
    let winCount3x = 0;

    for (let i = 60; i < payouts.length - 10; i++) {
        let bust = payouts[i];

        if (bust < 3) {
            sum += -1;
            if (prevBust == -1) {
                minusArray.push(sum);
            } else if (prevBust < 3) {
                if (minusArray.length > 0) {
                    minusArray[minusArray.length - 1] = sum;
                }
            } else {
                minusArray.push(sum);
            }
        } else {
            sum += 2;
            // if (prevBust != -1 && prevBust < 3) {
            // 	minusArray.push(sum);
            // }
            if (prevBust == -1) {
                plusArray.push(sum);
            } else if (prevBust >= 3) {
                if (plusArray.length > 0) {
                    plusArray[plusArray.length - 1] = sum;
                }
            } else {
                plusArray.push(sum);
            }
        }
        sumArray.push(sum);
        let lastMinus = minusArray[minusArray.length - 1];
        let lastMinus2 = minusArray[minusArray.length - 2];
        let lastMinus3 = minusArray[minusArray.length - 3];

        let lastPlus = minusArray[plusArray.length - 1];
        let lastPlus2 = minusArray[plusArray.length - 2];



        let maxMinValue = Math.min(...(minusArray.slice(0, minusArray.length - 2)));
        const shortDirection = checkTrendDirection(payouts, i, -10);
        const longDirection = checkTrendDirection(payouts, i, -25);
        const longDirection2 = checkTrendDirection(payouts, i, -40);
        const longDirection3 = checkTrendDirection(payouts, i, -60);

        const subPayouts = payouts.slice(i - 40, i + 1);
        const x3Count = subPayouts.filter(p => p >= 3).length;

        // if (maxMinValue < lastMinus && bust < 3) {

        //     let isWin = false;
        //     // if (bust >= 2 && bust <= 2.1) continue;
        //     if ((lastMinus - lastMinus2) == 0 && lastPlus == lastPlus2 ) {

        //         bettingPoints.push(payouts[i + 1]);

        //         const payoutResult = sortValues(subPayouts, (v) => {
        //             return v >= 2 ? 1 : 0 // 1 is green, 0 is red
        //         });

        //         let currentPattern = payoutResult.values.map(p => p.length).slice(0, 5);

        //         let patternStr = currentPattern.map(v => v >= 4 ? '4+' : v).join(',')


        //         fitCount0++;
        //         if (payouts[i + 1] > 2) {
        //             winCount2x++;
        //         }
        //         else if (payouts[i + 2] > 2) {
        //             winCount2x++;
        //         }
        //         else if (payouts[i+3] > 2) {
        //             winCount2x++;
        //         } else if (payouts[i+4] > 2) {
        //             winCount2x++;
        //         } else if (payouts[i+5] > 2) {
        //             winCount2x++;
        //         } 

        //         if (payouts[i + 1] > 3) {
        //             winCount3x++;
        //             isWin = true;
        //         }
        //         else if (payouts[i + 2] > 3) {
        //             winCount3x++;
        //         }
        //         else if (payouts[i+3] > 3) {
        //             winCount3x++;
        //         } else if (payouts[i+4] > 3) {
        //             winCount3x++;
        //         } else if (payouts[i+5] > 3) {
        //             winCount3x++;
        //         }


        //         if (isWin == false) {
        //             // console.log(bust, currentPattern, ...subPayouts, payouts[i + 1], payouts[i + 2], payouts[i + 3])
        //             if (!failPatterns.includes(patternStr)) {
        //                 failPatterns.push(patternStr);
        //             }
        //         } else {
        //             if (!winPatterns.includes(patternStr)) {
        //                 winPatterns.push(patternStr);
        //             } else {

        //                 if (multiWinPatterns[patternStr] == undefined) {
        //                     multiWinPatterns[patternStr] = 1;
        //                 } else {
        //                     multiWinPatterns[patternStr] = multiWinPatterns[patternStr] + 1;
        //                 }
        //             }

        //         }


        //     }

        //     // if (prevBust < 3 && prevBust >= 2 && bust < 2) {
        //     //     fitCount0++;
        //     //     if (payouts[i + 1] > 2) {
        //     //         winCount2x++;
        //     //     }
        //     //     // else if (payouts[i + 2] > 2) {
        //     //     //     winCount2x++;
        //     //     // }
        //     //     // else if (payouts[i+3] > 2) {
        //     //     //     winCount2x++;
        //     //     // }

        //     //     if (payouts[i + 1] > 3) {
        //     //         winCount3x++;
        //     //     } 
        //     //     // else if (payouts[i + 2] > 3) {
        //     //     //     winCount3x++;
        //     //     // }
        //     //     // else if (payouts[i+3] > 3) {
        //     //     //     winCount3x++;
        //     //     // }

        //     //     console.log(bust, payouts[i + 1], payouts[i + 2], payouts[i + 3])
        //     // }

        // }



        prevBust = bust;

    }

    console.log(fitCount0, winCount2x, winCount3x, winCount2x * 100 / fitCount0, winCount3x * 100 / fitCount0, winCount3x * 100 / winCount2x);

    const X100Patterns = winPatterns.filter(p => failPatterns.includes(p) == false);

    const a = X100Patterns.map(p => {
        if (multiWinPatterns[p] != undefined) {
            return {
                pattern: p,
                count: multiWinPatterns[p]
            }
        }
    }).filter(p => p != undefined);

    console.log(X100Patterns, X100Patterns.length, a/*, multiWinPatterns, multiWinPatterns.length*/);

    let x2Count = 0;
    let x1Count = 0;
    let x3Count = 0;

    let failes = [];

    bettingPoints.map((p, index) => {
        if (p < 2) {
            x1Count++;
        } else if (p < 3) {
            x2Count++;
        } else {
            x3Count++;
        }


    })
    console.log(x1Count, x2Count, x3Count);
}



const checkAIScores = () => {

    let fit = 0;
    let winCount = 0;
    SCORES.map((s, index) => {
        if (s.aiPayoutScore.p1 >= 0.7) {
            fit++;
            ///console.log(s.nextScore, s.score, s.aiPayoutScore);

            if (s.nextScore >= 2) {
                winCount++;
            } else if (SCORES[index + 1].nextScore >= 2) {
                winCount++;
            } else {
                console.log(s.nextScore, s.score, s.shortDirection, s.longDirection);
            }
        }
    })

    console.log(fit, winCount);
}


const checkHash = () => {
    // let's get payouts
    let initialHash = '754caaea536ff1f63bf3f26d4789c640354604a9addb491992a7ab66d6b64abe';
    let prevHash = null;
    let payouts = [];
    let hashes = [];
    for (let i = 0; i < 100000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    // const matchedHashes = {

    // }

    // hashes.map(h => {
    //     if (hashes.includes(h)) {
    //         matchedHashes[h] = (matchedHashes[h] || 0 ) + 1;

    //         if (matchedHashes[h] >= 2) {
    //             console.log(h);
    //         }
    //     }
    // })

    fs.writeFileSync('./payouts.json', JSON.stringify(hashes, null, 4));



}

const checLimbo = () => {
    // let's get payouts
    let initialHash = 'b5P0dBbdemiWa54PNPzfMW0xfzkCd';
    let prevHash = null;
    let payouts = [];
    let hashes = [];
    for (let i = 0; i < 1000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, '355b747072de2199fe905dbd5a62defaada143315a997687b325e54b1e499e12');
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    // const matchedHashes = {

    // }

    // hashes.map(h => {
    //     if (hashes.includes(h)) {
    //         matchedHashes[h] = (matchedHashes[h] || 0 ) + 1;

    //         if (matchedHashes[h] >= 2) {
    //             console.log(h);
    //         }
    //     }
    // })

    fs.writeFileSync('./payouts.json', JSON.stringify(payouts, null, 4));


}

const makeid = (length) => {
    let result = '';
    const characters = '0123456789abcdef';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
// check5_3();

// checkSible();
// checkAIScores();

const generateId = () => {
    for (let i = 0; i < 100000; i++) {
        const seed = makeid(64);


        console.log(i, seed);
        let initialHash = seed;
        let prevHash = null;
        let payouts = [];
        let hashes = [];
        for (let j = 0; j < 100000; j++) {
            let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);

            // console.log(j, hash)

            prevHash = hash;

            if (PAYOUTS.includes(hash)) {
                console.log('FOUND', seed, hash);
                return;
            }
        }
    }
}

const checkSMA = () => {
    // let's get payouts
    let initialHash = '754caaea536ff1f63bf3f26d4789c640354604a9addb491992a7ab66d6b64abe';
    let prevHash = null;
    let payouts = [];
    let hashes = [];


    const a = [1,2,3,4,5,6,7];
    let sumArray = [];
    for (let i = 0; i < 100000; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        hashes.unshift(hash);
        payouts.unshift(bust);
    }

    let maxInvestCounts = [];

    let currentBettingCount = 0;

    let sum = 0;

    let yData = payouts.map((row, index) => {


        const deadRedPatterns = ['20-,3+', '20-,10-,3+'];
        const deadGreenPatterns = ['1,1,1'];
        let isMatchedDeadHole = false;
        const subPayouts = payouts.slice(index - 30 >= 0 ? index - 30 : 0, index + 1);
        
        const payoutResult = sortValues(subPayouts, (v) => {
            return v >= 2 ? 1 : 0 // 1 is green, 0 is red
        }, 2);

        // console.log(payoutResult);

        if (row >= 2) {
            for (let i = 0; i < deadGreenPatterns.length; i++) {
                isMatchedDeadHole = checkPattern(payoutResult.values, {
                    deeps: deadGreenPatterns[i].split(',')
                }, 3);
                if (isMatchedDeadHole) break;
            }

            if (isMatchedDeadHole) {
                // logFatal('GREEN DEADHOLE DETECTED');
            }
        } else {
            for (let i = 0; i < deadRedPatterns.length; i++) {
                isMatchedDeadHole = checkPattern(payoutResult.values, {
                    deeps: deadRedPatterns[i].split(',')
                }, 3);
                if (isMatchedDeadHole) break;
            }

            if (isMatchedDeadHole) {
                // logFatal('RED PATTERN DEADHOLE DETECTED');
            }
        }



        if (row < 3) {
            sum += -1;
        } else {
            sum += 2;
        }

        sumArray.push(sum);

        let yData5SMA = [];
        let yData10SMA = [];
        let yData20SMA = [];


        const yData = sumArray.slice(-60);
        for (let i = 0; i < yData.length; i++) {
            let count = 3;
            if (i < count - 1) {
                yData5SMA.push(0);
            } else {
                const v = yData.slice(i - count, i).reduce((a, b) => a + b, 0) / count;
                yData5SMA.push(v);
            }

            count = 5;
            if (i < count) {
                yData10SMA.push(0);
            } else {
                const v = yData.slice(i - count, i).reduce((a, b) => a + b, 0) / count;
                yData10SMA.push(v);
            }

            count = 8;
            if (i < count) {
                yData20SMA.push(0);
            } else {
                const v = yData.slice(i - count, i).reduce((a, b) => a + b, 0) / count;
                yData20SMA.push(v);
            }
        }

        if (yData5SMA[yData5SMA.length - 1] >= yData10SMA[yData10SMA.length - 1] && !isMatchedDeadHole) {
            // let's bet
            currentBettingCount++;

            maxInvestCounts.push(currentBettingCount);
            if (payouts[index + 1] >= 3) {
                currentBettingCount = 0;
            } else if (payouts[index + 1] >= 2) {
                currentBettingCount--;
            }


            if (currentBettingCount >= 8) {
                console.log("TOO BAD", maxInvestCounts.slice(-30), payouts.slice(index-20, index + 1));
            }

        }

        return sum;
    });


    // for (let i = 0; i < maxInvestCounts.length; i++) {
    //     if (maxInvestCounts[i] >= 8) {
    //         console.log(maxInvestCounts.slice(i - 30, i + 1));
    //     }
    // }
    console.log('MAX BETTING COUNTS', Math.max(...maxInvestCounts));
}

checkSMA();

// generateId();
//checkHash();
// main();
// moon();