import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CryptoJS = require("crypto-js");
const fs = require('fs');
import brain from 'brain.js';

import { SERVER_SALT } from "../libs/contants";
import { checkTrendDirection, gameResult, sortValues } from "../libs/utils";

import { logFatal, logSuccess, logWarn } from "../libs/logging";
import { checkBettingScore, getExpected3XPayoutData, getExpectedPayout, getExpectedPayoutData, getNormalized3XPayoutData, getNormalizedData, getNormalizedData1, getNormalizedPayoutData } from "../libs/aiutils";


import { checkBettingType2, checkResult, getCurrentTrend2X, getCurrentTrend3X, getEnginePredictResult, getPredictResult } from "../engine";
const TOTAL_BETTING_HISTORY1 = require('../TOTAL_BETTING_HISTORY_TEST1.json');

let lastHash = null;
let loseHistory = require('../LOSE_AMOUNTS.json') || [];
let SCORES = require('../SCORE.json');
let isBetting = false;

let initialBet = 0.1;
let initialPayout = 2.8;
let maxAmount = 4;

let currentInitialBet = initialBet;
let trenball2XBetting = false;
let onlyAfterRed = false;
let trenball1XBetting = false;

let amounts = [];

let treballAmounts = [];

let bettingType = -1;

let currentPayout = 3;

let isBettingEnable = false;

let totalAmount = 80;


let currentBets = [];

let currentLoseCounts = [];
let maxLoseBets = [];
let loseCount = 0;

let maxBetLose = [];

for (let i = 0; i < 20; i++) {
	currentBets.push({
		real: initialBet,
		show: initialBet
	});
	currentLoseCounts.push({
		real: 0,
		show: 0
	});
	maxLoseBets.push({
		real: 0,
		show: 0
	});
}




export const handleExportLoseAmount = () => {
	fs.writeFileSync('./LOSE_AMOUNTS.json', JSON.stringify(loseHistory, null, 4));
}


export const handleInProgressBetting = (classic, trenball) => {
	return;
}

export const getBettings = (start, count) => {

	try {
		if (lastHash == null) return [];
		const initialHash = lastHash;
		let prevHash = null;
		let payouts = [];
		for (let i = 0; i < start; i++) {
			let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
			let bust = gameResult(hash, SERVER_SALT);
			prevHash = hash;
			payouts.unshift({
				nextScore: bust
			});
		}

		return payouts.slice(0, count);
		const tmpScores = SCORES.slice(start * -1);
		return tmpScores.slice(0, count);
		// // // return payouts.slice(count * -1);;
		return SCORES.slice(count * -1);
	} catch (err) {
		return [];
	}

}


export const getSimilarPatterns = () => {

	if (lastHash == null) return [];
	const initialHash = lastHash;
	let prevHash = null;
	let payouts = [];
	for (let i = 0; i < 2000; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}

	let listOfPayout = payouts.map(p => {
		if (p < 2) return 1;
		if (p < 3) return 2;
		return 3;
	}).join(',');

	let currentPattern = payouts.slice(-10).map(p => {
		if (p < 2) return 1;
		if (p < 3) return 2;
		return 3;
	}).join(',');

	let position = 0;
	let matchedPatterns = [];
	while (1) {
		let startPoint = listOfPayout.indexOf(currentPattern.join(','), position);
		if (startPoint > payouts.length - 10) break;
		console.log(startPoint);

		position = startPoint + 1;
	}

	return payouts;
	// return payouts.slice(count * -1);;
	//return SCORES.slice(count * -1);
}

export const setBettingEnable = (enable) => {
	isBettingEnable = enable;
}

let isFirstPayout = true;

let previousTrainJsons = null;
let prevPredictValue = null;

let bettingHistory = [];

let totalIndex = 0;


export const handleClosedBetting = (classic, trenball) => {


	fs.writeFileSync('./lastPayout.json', JSON.stringify({ hash: classic.hash, score: classic.score }));

	if (isFirstPayout) {
		isFirstPayout = false;
		checkResult(classic.hash, 105);
	}


	console.log('RECEIVED! HASH', classic.hash);
	const initialHash = classic.hash;
	lastHash = classic.hash;
	let amount = classic.amount;
	let prevHash = null;
	let payouts = [];

	let minusArray = [];

	for (let i = 0; i < 120; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}


	const subPayouts = payouts.slice(-100);
	const lastPayout = subPayouts[subPayouts.length - 1];
	const result = classic.score;

	const currentTrend2X = getCurrentTrend2X(subPayouts);
	const currentTrend3X = getCurrentTrend3X(subPayouts);
	// const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);


	let train_names = ['good', 'bad', 'mid'];

	let predict2Xs = [];
	let predict3Xs = [];
	for (let i = 0; i < 3; i++) {
		[5,10,15,20,25,30].map((c, j) => {
			const net = new brain.NeuralNetwork();
			const train_str = fs.readFileSync(`./brain_train_2x_${train_names[i]}_${j}.json`);
			net.fromJSON(JSON.parse(train_str));
			const p = net.run(getNormalizedPayoutData(payouts.slice(c * -1)));
			predict2Xs.push(p['0']);
		})
	}

	// for (let i = 0; i < 3; i++) {
	// 	[5,10,15,20,25,30].map((c, j) => {
	// 		const net = new brain.NeuralNetwork();
	// 		const train_str = fs.readFileSync(`./brain_train_3x_${train_names[i]}_${j}.json`);
	// 		net.fromJSON(JSON.parse(train_str));
	// 		const p = net.run(getNormalized3XPayoutData(payouts.slice(c * -1)));
	// 		predict3Xs.push(p['0']);
	// 	})
	// }



	const predictResult = predict2Xs.map(p => getExpectedPayoutData(p));

	logFatal("#######################################################################################################")
	logWarn("STATUS: ", currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
	logWarn("PREDICT 2X_GOOD", predictResult[0], predictResult[1], predictResult[2], predict2Xs[0], predict2Xs[1], predict2Xs[2]);
	logWarn("PREDICT 2X_BAD", predictResult[3], predictResult[4], predictResult[5], predict2Xs[3], predict2Xs[4], predict2Xs[5]);
	logWarn("PREDICT 2X_MID", predictResult[6], predictResult[7], predictResult[8], predict2Xs[6], predict2Xs[7], predict2Xs[8]);

	if (prevPredictValue == null) {
		prevPredictValue = predictResult;
		return {
			isBetting: false,
		}
	}

	const prevPayoutResult = sortValues(subPayouts, (v) => {
		return v >= 2 ? 1 : 0 // 1 is green, 0 is red
	}, 2);

	const pLength = prevPayoutResult.values.map(p => p.length).slice(0, 3);

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

	let maxDeep = Math.max(...vs);
	let currentDeep = prevPayoutResult.values[0].length;

	let isRight = false;

	if (classic.score >= 2 && bettingType == 2) {
		isRight = true;
	} else if (classic.score < 2 && bettingType == 1) {
		isRight = true;
	} else {
		isRight = false;
	}

	bettingHistory.push(isRight ? 1 : 0);

	const bettingTypeResult = checkBettingType2(isRight, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
		, prevPredictValue, predictResult);


	prevPredictValue = predictResult;
	logFatal("#######################################################################################################")
	logWarn("STATUS: ", currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
	logWarn("PREDICT 2X_GOOD", predictResult[0], predictResult[1], predictResult[2]);
	logWarn("PREDICT 2X_BAD", predictResult[3], predictResult[4], predictResult[5]);
	logWarn("PREDICT 2X_MID", predictResult[6], predictResult[7], predictResult[8]);

	if (bettingType != 0) {

		if (bettingType == -1) {

			bettingType = bettingTypeResult.bettingType;
			return {
				isBetting: false
			}
		}

		TOTAL_BETTING_HISTORY1.push([isRight ? 1 : 0, 1, 0, [], classic.score, bettingType, 0]);
		fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
		if (isBettingEnable) {
			totalAmount = totalAmount - currentBets[loseCount].real;
			if (isRight) {
				totalAmount += currentBets[loseCount].real * 2;
				currentBets[loseCount].real = initialBet;
				currentBets[loseCount].show = initialBet;

				if (loseCount == 0) {
					currentBets[loseCount].show = initialBet;
					currentBets[loseCount].real = initialBet;
				}
				loseCount = 0
			} else {
				currentLoseCounts[loseCount].real = currentLoseCounts[loseCount].real + 1;
				currentLoseCounts[loseCount].show = currentLoseCounts[loseCount].show + 1;
				if (currentBets[loseCount].show > maxLoseBets[loseCount].show) {
					maxLoseBets[loseCount].real = currentBets[loseCount].real;
					maxLoseBets[loseCount].show = currentBets[loseCount].show;
				}
				if (loseCount > 1) {
					currentBets[loseCount].real = currentBets[loseCount].real * 2;
					currentBets[loseCount].show = currentBets[loseCount].show * 2;
				} else {
					if (loseCount == 0) {
						currentBets[0].show = currentBets[0].show * 2;
						currentBets[0].real = currentBets[0].real * 2;
					} else {
						currentBets[loseCount].show = currentBets[loseCount].show * 2;
					}
				}
				loseCount++;
			}

			const totalInvest = currentBets.map(b => {
				if (b.real == 1) return 0;
				return b.real - initialBet;
			}).reduce((a, b) => a + b, 0)

			maxBetLose.push(totalInvest);

			if (isRight) {
				logSuccess(totalIndex++, "SCORE:", result, "TOTAL:", totalAmount, "BET AMOUNTS: ", totalInvest, "MAX BET: ", Math.max(...maxBetLose))
			} else {
				logFatal(totalIndex++, "SCORE:", result, "TOTAL:", totalAmount, "BET AMOUNTS: ", totalInvest, "MAX BET: ", Math.max(...maxBetLose))
			}


			if ((totalAmount - totalInvest - 20) < 0) {
				logFatal("LOSED ALL", i - 100);
				isBettingEnable = false;
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


			console.log(Math.max(...maxWinCounts), Math.max(...maxLoseCounts), loseMap, totalC)
			logWarn('---------------------------------------------------------------------------------------------------------------------\n')
		}

		logFatal('---------------------------------------------------------------------------------')
		let timeout = -1;
		let is2XUp = false;
		let isReset = false;
		let is2XDown = false;


		// logFatal("#######################################################################################################")
		// logWarn("STATUS: ", currentTrend3X == 0 ? "GOOD" : currentTrend3X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
		// logWarn("PREDICT 3X_GOOD", getExpected3XPayoutData(predict3Xs[0]), getExpected3XPayoutData(predict3Xs[1]), getExpected3XPayoutData(predict3Xs[2]), predict3Xs[0], predict3Xs[1], predict3Xs[2]);
		// logWarn("PREDICT 3X_BAD", getExpected3XPayoutData(predict3Xs[3]), getExpected3XPayoutData(predict3Xs[4]), getExpected3XPayoutData(predict3Xs[5]), predict3Xs[3], predict3Xs[4], predict3Xs[5]);
		// logWarn("PREDICT 3X_MID", getExpected3XPayoutData(predict3Xs[6]), getExpected3XPayoutData(predict3Xs[7]), getExpected3XPayoutData(predict3Xs[8]), predict3Xs[6], predict3Xs[7], predict3Xs[8]);


		amounts.push(amount);
		treballAmounts.push(trenball.amount);
		let currentMaxAmount = Math.max(...amounts);
		let currentTrenballMaxAmount = Math.max(...treballAmounts);
		console.log({
			currentMaxAmount, currentTrenballMaxAmount
		})
		console.log({
			isBetting, amount, trenballAmount: trenball.amount, maxAmount, currentTrend2X, currentTrend3X
		})

		bettingType = bettingTypeResult.bettingType;

		return {
			isBetting: isBettingEnable && loseCount != 1,
			bettingType: bettingTypeResult.bettingType,
			trenball2XBetting,
			trenball1XBetting,
			timeout,
			payout: currentPayout,
			is2XUp: false,
			is2XDown: false,
			isReset: true,
			x2Result: predictResult,
			initialBet: currentBets[loseCount].real
		}
	}

	bettingType = bettingTypeResult.bettingType
}


export const checkBetting = () => {


	// let's get payouts
	const initialHash = lastHash;
	let prevHash = null;
	let payouts = [];
	for (let i = 0; i < 10; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}

	return payouts.slice(-4).filter(p => p >= 3).length >= 1;

}


export const getCurrentMoonPayouts = () => {

	let start = 1500;
	let count = 1500;

	try {
		if (lastHash == null) return [];
		const initialHash = lastHash;
		let prevHash = null;
		let payouts = [];
		for (let i = 0; i < start; i++) {
			let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
			let bust = gameResult(hash, SERVER_SALT);
			prevHash = hash;
			payouts.unshift(bust);
		}

		return payouts.slice(0, count);
		const tmpScores = SCORES.slice(start * -1);
		return tmpScores.slice(0, count);
		// // // return payouts.slice(count * -1);;
		return SCORES.slice(count * -1);
	} catch (err) {
		return [];
	}
}

export const getMoonCheckResult = () => {

	try {
		const initialHash = lastHash;
		let prevHash = null;
		let payouts = [];
		for (let i = 0; i < 3000; i++) {
			let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
			let bust = gameResult(hash, SERVER_SALT);
			prevHash = hash;
			payouts.unshift({
				nextScore: bust
			});
		}

		const MOON_STR = fs.readFileSync('./MOON.json');

		const MOON_CONDITIONS = JSON.parse(MOON_STR);

		const succeedPayouts = [];
		const failedPayouts = [];
		for (let i = 60; i < payouts.length - 61; i++) {
			if (payouts[i] >= 3) {

				const moonDirection = checkTrendDirection(payouts, i, 30);
				const shortDirection = checkTrendDirection(payouts, i, -10);
				const longDirection = checkTrendDirection(payouts, i, -25);
				const longDirection2 = checkTrendDirection(payouts, i, -40);
				const longDirection3 = checkTrendDirection(payouts, i, -60);

				const subPayout = payouts.slice(i - 12, i);
				const nextPayout = payouts.slice(i + 1, i + 30);
				const moonCount = nextPayout.filter(p => p >= 3).length;
				const subMoonCount = subPayout.filter(p => p >= 3).length;
				if (moonCount >= 10) {
					// console.log({subMoonCount, moonCount, shortDirection, longDirection, longDirection2, moonDirection});
					condition2.push({ subMoonCount, moonCount, shortDirection, longDirection, longDirection2, moonDirection, longDirection3 })
					// i = i+ 30;
				}

				let found = false;

				let conditionMatchedCount = 0;
				for (let j = 0; j < MOON_CONDITIONS.length; j++) {
					const condition = MOON_CONDITIONS[j];
					// let's find the points

					if (subMoonCount <= condition.subMoonCount
						&& longDirection2 >= -4
						&& longDirection2 == longDirection
						&& (shortDirection >= condition.shortDirection - 2 && shortDirection <= condition.shortDirection + 2)
						&& (longDirection >= condition.longDirection - 2 && longDirection <= condition.longDirection + 2)
						&& (longDirection2 >= condition.longDirection2 - 2 && longDirection2 <= condition.longDirection2 + 2)
						&& (longDirection3 >= condition.longDirection3 - 2 && longDirection3 <= condition.longDirection3 + 2)
					) {
						conditionMatchedCount++;
					}
				}

				if (conditionMatchedCount >= 1) {
					found = true;
					if (moonCount >= 10) {
						succeedPayouts.push({
							...condition,
							payouts: payouts.slice(i - 100, i + 60)
						})

					}
					else {
						failedPayouts.push({
							...condition,
							payouts: payouts.slice(i - 100, i + 60)
						})
					}
				}

				if (found) {
					i = i + 30;
				}
			}

		}

		return {
			succeedPayouts,
			failedPayouts
		}

	} catch (err) {
		return [];
	}


}



export const setInitialBet = (v) => {
	initialBet = v;
}

export const setInitialPayout = (v) => {
	initialPayout = v;
}

export const setTrenball2XBetting = (v) => {
	trenball2XBetting = v
}


export const setTrenball1XBetting = (v) => {
	trenball1XBetting = v
}



export const setMaxAmount = (v) => {
	maxAmount = v
}

export const setOnlyAfterRed = (v) => {
	onlyAfterRed = v
}

export const getLastScore = () => {
	return SCORES[SCORES.length - 1];
}


