import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { checkPattern, gameResult, sortValues } from "./libs/utils.js";

// let PAYOUTS = require('./payouts.json');
const CryptoJS = require("crypto-js");
const fs = require('fs');
import brain from 'brain.js';
import { getExpectedEngineData, getExpectedPayoutData, getNormalized3XPayoutData, getNormalizedEngineData, getNormalizedPayoutData } from "./libs/aiutils.js";
import { logFatal, logSuccess, logWarn } from "./libs/logging.js";
import { train1 } from "./brain.js";
import { exit } from "process";
import { checkBettingType2, getBettingTypeTrend, getCurrentTrend2X, getCurrentTrend3X, getPredictResult, getPredictResultFromJson, predictRates, verifyPredict } from "./engine.js";

const TOTAL_BETTING_HISTORY1 = require('./TOTAL_BETTING_HISTORY_TEST1.json');
const TOTAL_BETTING_HISTORY2 = require('./TOTAL_BETTING_HISTORY_TEST2.json');


const delay = time => new Promise(res=>setTimeout(res,time));
const checkBettingOrNot = (loseCount, engineTrend, entireTrend) => {

	if (loseCount == 0) {
		return engineTrend == 0 && entireTrend == 0
	} else if (loseCount == 1) {
		return engineTrend == 0 || engineTrend == 2
	} else if (loseCount == 2) {
		// return engineTrend == 2 || engineTrend == 1
		return true;
	}

	return true;
}



export const checkResult = async (initialHash, counts) => {

	let depositAmount = 100000000;

	let initialBet = 1;
	let initialBet3X = 0;


	let initialBetLose = 3 * Math.pow(2, 3);

	let currentAmount = depositAmount;
	let totalAmount = depositAmount;
	let currentBet2X = initialBet;
	let currentBetLose = initialBetLose;

	let isNormalBet = true;

	let realBet2X = initialBet;
	let currentBet3X = initialBet3X;
	let x3Payout = 2.6;

	let totalLoseAmount = 0;

	const bettingHistory = [];
	const patternHistory = [];

	let prevPredictValue = null;
	let prevPredictEnginValue = null;
	let prevTrendStatus = null;

	let currentBet2Xs = [];
	let currentBet3Xs = [];
	let maxBets2X = [];

	let maxBets3X = [];

	let maxBetLose = [];


	let currentSkipCount = 0;

	let isStop = false;

	let prevHash = null;
	let payouts = [];
	let hashes = [];


	let isBetting = false;



	for (let i = 0; i < counts; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		hashes.unshift(hash);
		payouts.unshift(bust);
	}


	let initialBets = [];
	let currentBets = [];
	let profits = [];

	let currentLoseCounts = [];
	let maxLoseBets = [];
	let loseCount = 0;

	for (let i = 0; i < 9; i++) {
		const betAmount = initialBet; //i < 3 ? initialBet / 5 : initialBet * 2
		initialBets.push(betAmount);
		currentBets.push({
			real: betAmount,
			show: betAmount
		});
		currentLoseCounts.push({
			real: 0,
			show: 0
		});
		maxLoseBets.push({
			real: 0,
			show: 0
		});

		profits.push(0);
	}

	// initialBets[1] = 0;
	// initialBets[2] = 0;
	// initialBets[3] = 4;
	// initialBets[5] = 0;
	// initialBets[6] = 5;
	// initialBets[7] = 0;
	// initialBets[8] = 0;


	let previousTrainJsons = null;


	for (let i = 100; i < payouts.length - 1; i++) {

		// await delay(1000);
		// if (i == 100) {

		// 	console.log('LAST HASH', hashes[i - 1])
		// 	train1({hash: hashes[i-1]}, 20000);
		// }
		// if ((i - 100) % 2 == 0) {
		// const currentTrainJsons = train1({ hash: hashes[i - 2] }, 60, false);

		// predictRates = [[], [], [], [], [], [], [], [], []]
		// predictScores = [[], [], [], [], [], [], [], [], []]
		// PAYOUTS = [];
		currentBet2Xs = [];
		// }

		const subPayouts = payouts.slice(i - 100, i);
		const subPayoutsAll = payouts.slice(i - 100, i + 1);
		const lastPayout = subPayouts[subPayouts.length - 1];
		const result = payouts[i];

		const currentTrend2X = getCurrentTrend2X(subPayouts);
		const currentTrend3X = getCurrentTrend3X(subPayouts);
		// const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);
		const predictResult = getPredictResultFromJson(subPayouts);

		


		// if (previousTrainJsons == null) {
		// 	previousTrainJsons = currentTrainJsons;
		// 	continue;
		// }

		if (prevPredictValue == null) {
			prevPredictValue = predictResult;
			continue;
		}

		const payoutResult = sortValues(subPayoutsAll, (v) => {
			return v >= 2 ? 1 : 0 // 1 is green, 0 is red
		}, 2);

		const prevPayoutResult = sortValues(subPayouts, (v) => {
			return v >= 2 ? 1 : 0 // 1 is green, 0 is red
		}, 2);

		const pLength = payoutResult.values.map(p => p.length).slice(0, 3);

		const vs = pLength.filter((ps, index) => {
			if (lastPayout < 2) {
				if (index % 2 == 0) {
					return true;
				}
			} else {
				if (index % 2 == 1) {
					return true;
				}
			}
		});

		// console.log(vs);
		let maxDeep = Math.max(...vs);

		let currentDeep = prevPayoutResult.values[0].length
		let isEngineRight = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] && TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 1;

		let { engineTrend, values, entireTrend } = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-20));
		// const verifiedResult = verifyPredict(TOTAL_BETTING_HISTORY1.slice(-20));

		// const isRightVerified = getExpectedEngineData(verifiedResult);


		let { bettingType, trendStatus, bestScore, allScore, skipCount, currentIndex, bettingAvailable } = checkBettingType2(isEngineRight, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
			, prevPredictValue, predictResult);

		if (bettingType != 0) {
			if (entireTrend == undefined) {
				bettingAvailable = false;
			}
			loseCount = entireTrend * 3 + engineTrend;


			// if (isRightVerified == 1) {
			// 	logSuccess("RIGHT PREDICT", bettingType, result);
			// } else {
			// 	logFatal("WRONG PREDICT", bettingType, result);
			// 	bettingType = bettingType == 2 ? 1 : 2;
			// }
			
			
			// if (loseCount == 1) {
			// 	bettingType == 2 ? 1 : 2;
			// }
			
			// let's check origin engin
			let isRight = false;
			if (result >= 2 && bettingType == 2) {
				isRight = true;

			} else if (result < 2 && bettingType == 1) {
				isRight = true;
			} else {
				isRight = false;
			}

			bettingHistory.push(isRight ? 1 : 0);
			TOTAL_BETTING_HISTORY1.push({
				isRight: isRight ? 1 : 0,
				betOrNot: bettingAvailable ? 1 : 0,
				engineTrend,
				entireTrend,
				currentIndex,
				payout: payouts[i]
			});


			if (bettingAvailable == false) continue;
			// fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
			// fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
			

			if (isBetting) {
				totalAmount = totalAmount - currentBets[loseCount].real;
			}

			if (isRight) {
				if (isBetting) {
					totalAmount += currentBets[loseCount].real * 2;
					currentBets[loseCount].real = initialBets[loseCount];
					currentBets[loseCount].show = initialBets[loseCount];
					profits[loseCount] = profits[loseCount] + initialBets[loseCount];

					// if (loseCount == 3 || loseCount == 6) {


					// 	let maxBet = 0, maxIndex = 0;;
					// 	currentBets.map((c, index) => {
					// 		if (c.real > maxBet) {
					// 			maxBet = c.real;
					// 			maxIndex = index;
					// 		}
					// 	})
					// 	if (maxBet != 0) {
					// 		currentBets[loseCount].real = currentBets[maxIndex].real;
					// 		currentBets[loseCount].show = currentBets[maxIndex].real;

					// 		currentBets[maxIndex].real = initialBets[maxIndex];
					// 		currentBets[maxIndex].show = initialBets[maxIndex];
					// 	}
						
					// }
					// if (loseCount == 0) {
					// 	currentBets[loseCount].show = initialBets[loseCount];
					// 	currentBets[loseCount].real = initialBets[loseCount];
					// }
				}

				// loseCount = 0
			} else {

				if (isBetting) {
					currentLoseCounts[loseCount].real = currentLoseCounts[loseCount].real + 1;
					currentLoseCounts[loseCount].show = currentLoseCounts[loseCount].show + 1;
					if (currentBets[loseCount].show > maxLoseBets[loseCount].show) {
						maxLoseBets[loseCount].real = currentBets[loseCount].real;
						maxLoseBets[loseCount].show = currentBets[loseCount].show;
					}
				}

				isBetting = true; //checkBettingOrNot(loseCount, engineTrend, entireTrend);

				if (isBetting) {

					console.log(currentBets, loseCount);
					currentBets[loseCount].real = currentBets[loseCount].real * 2;
					currentBets[loseCount].show = currentBets[loseCount].show * 2;
				}

			}

			const totalInvest = currentBets.map(b => {
				if (b.real == 1) return 0;
				return b.real - initialBet;
			}).reduce((a, b) => a + b, 0)

			maxBetLose.push(totalInvest);

			if (isRight) {
				logSuccess(i - 100, "SCORE:", result, "TOTAL:", totalAmount, "BET AMOUNTS: ", totalInvest, "MAX BET: ", Math.max(...maxBetLose))
			} else {
				logFatal(i - 100, "SCORE:", result, "TOTAL:", totalAmount, "BET AMOUNTS: ", totalInvest, "MAX BET: ", Math.max(...maxBetLose))
			}


			if ((totalAmount - totalInvest - 20) < 0) {
				logFatal("LOSED ALL", i - 100);
				break;
			}

			let maxLoseCounts = [];
			let maxWinCounts = [];

			let currentLoseCount = 0;
			let currentWinCount = 0;

			for (let i = 0; i < bettingHistory.length; i++) {
				if (bettingHistory[i] == 1) {
					currentWinCount++;
					maxLoseCounts.push(currentLoseCount);
					currentLoseCount = 0;
				} else {
					maxWinCounts.push(currentWinCount);
					currentLoseCount++;
					currentWinCount = 0;
				}
			}


			let loseMap = {};
			maxLoseCounts.map(a => {
				if (loseMap[a] == undefined) {
					loseMap[a] = 0;
				}
				loseMap[a] = loseMap[a] + 1;
			});

			const keys = Object.keys(loseMap);

			let totalC = 0;
			for (let i = 0; i < keys.length; i++) {
				let c = parseInt(keys[i]) + 1;
				totalC += c * loseMap[keys[i]];
			}
			console.log(Math.max(...maxWinCounts), Math.max(...maxLoseCounts), JSON.stringify(loseMap), totalC)
			console.log("CURRENT LOSE COUNT: ", loseCount, "CURRENT BETS: ", JSON.stringify(currentBets.map(p => p.real)));
			console.log("MAX LOSE BETS", JSON.stringify(maxLoseBets.map(p => p.show)));
			console.log("PROFITS", JSON.stringify(profits));
			
			logWarn('---------------------------------------------------------------------------------------------------------------------\n')

		}

		prevPredictValue = predictResult;
		prevTrendStatus = trendStatus;

		// console.log(currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", predictResult, result);
	}

	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
	// console.log('currentAmount===', currentAmount);
	let maxLoseCounts = [];
	let maxWinCounts = [];

	let currentLoseCount = 0;
	let currentWinCount = 0;

	let checkLoseCount = 4;

	let checkLosePatterns = [];
	for (let i = 0; i < bettingHistory.length; i++) {
		if (bettingHistory[i] == 1) {
			currentWinCount++;
			maxLoseCounts.push(currentLoseCount);
			currentLoseCount = 0;
		} else {
			maxWinCounts.push(currentWinCount);
			currentLoseCount++;

			// if (currentLoseCount == 5) {
			// 	maxLoseCounts.push(currentLoseCount);
			// 	currentLoseCount = 0;
			// }

			if (currentLoseCount >= checkLoseCount) {
				// console.log(patternHistory[i], currentLoseCount);

				checkLosePatterns.push(patternHistory[i]);
			}
			currentWinCount = 0;
		}



	}
	//console.log(bettingHistory);

	let loseMap = {};
	maxLoseCounts.map(a => {
		if (loseMap[a] == undefined) {
			loseMap[a] = 0;
		}
		loseMap[a] = loseMap[a] + 1;
	});

	const keys = Object.keys(loseMap);

	let totalC = 0;
	for (let i = 0; i < keys.length; i++) {
		let c = parseInt(keys[i]) + 1;
		totalC += c * loseMap[keys[i]];
	}
	console.log(Math.max(...maxWinCounts), Math.max(...maxLoseCounts), loseMap, totalC)

	fs.writeFileSync('./LOSE_PATTERNS.json', JSON.stringify(checkLosePatterns, null, 4));
	return;
}

checkResult('9825f70d35f32030abdd69fa636164cbc55a7f5cafe6ecc7e80db40348e3d6dd', 30000);
// checkResult('3b7509467664b364adc31e048b532067d567bb87c6895739809fe9decaea1b65', 30000);
