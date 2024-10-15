import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CryptoJS = require("crypto-js");
const fs = require('fs');
import brain from 'brain.js';

import { SERVER_SALT } from "../libs/contants";
import { checkTrendDirection, gameResult, sortValues } from "../libs/utils";

import { logDebug, logError, logFatal, logSuccess, logWarn } from "../libs/logging";
import { getExpectedEnginData2, } from "../libs/aiutils";
import { TOTAL_BETTING_HISTORY1, TOTAL_BETTING_HISTORY2, TOTAL_BETTING_HISTORY2X, TOTAL_BETTING_HISTORY3, TOTAL_BETTING_HISTORY4, addPredictRates, check1010Pattern, checkBettingType2, checkBettingType3, checkBettingType4, checkOppositPattern, checkSimulation, getBettingTypeTrend, getCurrentTrend2X, getCurrentTrend3X, getHighScoreBet2, getLoseStatus, getPredictResultFromJson, getPredictResultFromJson20, getStatisticBranchBettingType, predictRates, setLoseStatus, simulationPastData, updatePredictRates, verifyPredictRate } from "../engine";
import { trainPredictRate } from "../brain";

let lastHash = null;
let loseHistory = require('../LOSE_AMOUNTS.json') || [];

let isBetting = false;

let isRealBetting = false;

let initialBet2X = 0.1;
let initialBet4X = 0.2;
let initialBet8X = 1.6;
let initialPayout = 2.8;
let maxAmount = 4;

let currentInitialBet = initialBet2X;
let trenball2XBetting = false;
let onlyAfterRed = false;
let trenball1XBetting = false;

let amounts = [];

let currentBet2X = initialBet2X;
let currentBet3X = initialBet2X;

let currentBet4X = initialBet4X;
let currentBet8X = initialBet8X;

let currentBetMaxBet2X = initialBet2X * Math.pow(2, 9);
let currentBetMaxBet4X = initialBet2X * Math.pow(2, 6);
let currentBetMaxBet8X = initialBet2X * Math.pow(2, 5);

let total4XBetAmount = 0;
let total8XBetAmount = 0;


let treballAmounts = [];
let maxBets2X = [];
let maxBets3X = [];
let maxBets4X = [];
let maxBets8X = [];

let bettingData1 = {

}

let bettingData2 = {

}

let bettingData3 = {

}

let bettingData4 = {

}

let bettingData2X = {

}


let isFoundRightChangePoint = false;

let currentPayout = 3;

let isBettingEnable = false;

let isMartingale = false;

let totalAmount = 1000;


let currentBets = [];

let currentLoseCounts = [];
let maxLoseBets = [];
let loseCount = 0;

let maxBetLose = [];

let mainBranch = 1;

let martingaleCount = 2;

let profitType = 0;

let isAutoUp = false;

for (let i = 0; i < 20; i++) {
	currentBets.push({
		real: initialBet2X,
		show: initialBet2X
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
}

export const setBettingEnable = (enable) => {
	isBettingEnable = enable;
}

export const setMartingale = (enable) => {
	isMartingale = enable;
}
let isFirstPayout = true;

let previousTrainJsons = null;
let prevPredictValue = null;

let bettingHistory = [];

let totalIndex = 0;



const isRightBettingType = (bettingType, payout) => {

	if ((bettingType == 1 && payout < 2) || (bettingType == 2 && payout >= 2)) {
		return true;
	}

	return false;
}
export const handleClosedBetting = (classic, trenball) => {


	

	if (isFirstPayout) {
		isFirstPayout = false;
		simulationPastData(classic.hash, 160);
		// checkResult(classic.hash, 105);
	}


	
	const initialHash = classic.hash;
	lastHash = classic.hash;
	let amount = classic.amount;
	let prevHash = null;
	let payouts = [];

	for (let i = 0; i < 120; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}

	logFatal('RECEIVED! HASH~~~~', classic.hash, payouts.slice(-1)[0]);

	const subPayouts = payouts.slice(-100);
	const lastPayout = subPayouts[subPayouts.length - 1];
	const result = payouts.slice(-1)[0];
	fs.writeFileSync('./lastPayout.json', JSON.stringify({ hash: classic.hash, score: result }));

	const currentTrend2X = getCurrentTrend2X(subPayouts);
	const currentTrend3X = getCurrentTrend3X(subPayouts);
	// const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);

	const predictResult = getPredictResultFromJson20(subPayouts);

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

	logFatal("#######################################################################################################")
	// logWarn("STATUS: ", currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
	// logWarn("PREDICT 2X_GOOD", predictResult[0], predictResult[1], predictResult[2]);
	// logWarn("PREDICT 2X_BAD", predictResult[3], predictResult[4], predictResult[5]);
	// logWarn("PREDICT 2X_MID", predictResult[6], predictResult[7], predictResult[8]);


	const isRight1 = isRightBettingType(bettingData1.bettingType, result);
	const isRight2 = isRightBettingType(bettingData2.bettingType, result);
	const isRight3 = isRightBettingType(bettingData3.bettingType, result);
	const isRight4 = isRightBettingType(bettingData4.bettingType, result);
	const isRight2X = isRightBettingType(bettingData2X.bettingType, result);


	// LOW
	bettingData1 = Object.assign(bettingData1, {
		isRight: isRight1 ? 1 : 0,
		betOrNot: 1,
		payout: result,
	});
	// HIGH
	bettingData2 = Object.assign(bettingData2, {
		isRight: isRight2 ? 1 : 0,
		betOrNot: 1,
		payout: result
	});
	// MID
	bettingData3 = Object.assign(bettingData3, {
		isRight: isRight3 ? 1 : 0,
		betOrNot: 1,
		payout: result
	})
	// BC
	bettingData4 = Object.assign(bettingData4, {
		isRight: isRight4 ? 1 : 0,
		betOrNot: 1,
		payout: result
	})

	bettingData2X = Object.assign(bettingData2X, {
		isRight: isRight2X ? 1 : 0,
		// betOrNot: 1,
		payout: result
	});


	console.log('BETTING DATA1: ', bettingData1)
	if (bettingData1.bettingType != undefined) {
		TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] = { ...bettingData1 };
		TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1] = { ...bettingData2 };
		TOTAL_BETTING_HISTORY3[TOTAL_BETTING_HISTORY3.length - 1] = { ...bettingData3 };
		TOTAL_BETTING_HISTORY4[TOTAL_BETTING_HISTORY4.length - 1] = { ...bettingData4 };
		TOTAL_BETTING_HISTORY2X[TOTAL_BETTING_HISTORY2X.length - 1] = { ...bettingData2X };

		console.log('TOTAL_BETTING_HISTORY2X: LENGTH: ', TOTAL_BETTING_HISTORY2X.length)
		
		// TOTAL_BETTING_HISTORY1.push({ ...bettingData1 });
		// TOTAL_BETTING_HISTORY2.push({ ...bettingData2 });
		// TOTAL_BETTING_HISTORY3.push({ ...bettingData3 });
		// TOTAL_BETTING_HISTORY4.push({ ...bettingData4 });
		// TOTAL_BETTING_HISTORY2X.push({ ...bettingData2X });
		updatePredictRates(result, prevPredictValue);
	}

	const bettingType1Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-50), 3);
	const bettingType2Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY2.slice(-50), 3);
	const bettingType3Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY3.slice(-50), 3);
	const bettingType4Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY4.slice(-50), 3);
	const bettingTypeResult1 = checkBettingType4(subPayouts, maxDeep, currentDeep, prevPredictValue, result, predictResult);

	prevPredictValue = predictResult;

	console.log({
		isBetting, profitType, currentBet2X, currentBet4X, currentBet8X
	})

	profitType = 0;
	if (isRealBetting) {

		if (isRight2X) {

			let currentBet = currentBet2X;

			switch (profitType) {
				case 0: {
					currentBet = currentBet2X;
					if (isMartingale && currentBet2X < initialBet2X * Math.pow(2, martingaleCount)) {
						currentBet2X = currentBet2X * 2;
					} else {
						if (isAutoUp) {
							currentBet2X = initialBet2X;
						}
						
					}

					break;
				}
				case 1: {
					currentBet = currentBet4X;
					currentBet4X = initialBet4X;
					total4XBetAmount -= currentBet4X * 2;
					if (total4XBetAmount < 0) {
						total4XBetAmount = 0;
					}
					break;
				}
				case 2: {
					currentBet = currentBet8X;

					total8XBetAmount -= currentBet8X * 2;
					if (total8XBetAmount < 0) {
						total8XBetAmount = 0;
					}

					if (currentBet8X < currentBetMaxBet8X) {
						currentBet8X = currentBet8X * 2;
					} else {
						currentBet8X = initialBet8X;
					}
					break;
				}
			}


			if (result < 2) {
				totalAmount += currentBet * 1.96;
			} else {
				totalAmount += currentBet * 2;
			}
		} else {

			switch (profitType) {
				case 0: {
					if (currentBet2X >= initialBet2X * Math.pow(2, 2)) {
						setLoseStatus(true);
					} else {
						setLoseStatus(false);
					}
					if (isAutoUp) {
						currentBet2X = currentBet2X * 2;
					}
					break;
				}
				case 1: {
					currentBet4X = currentBet4X * 2;
					break;
				}
				case 2: {
					currentBet8X = currentBet8X * 2;
					break;
				}
			}
		}

		maxBets2X.push(currentBet2X);
		maxBets3X.push(currentBet3X);
		maxBets4X.push(currentBet4X);
		maxBets8X.push(currentBet8X);
		totalIndex++
		if (isRight2X) {
			logSuccess(totalIndex, "2X BET:", currentBet2X, ", 3X BET:", currentBet3X, ", 4X BET: ", currentBet4X, ", 8X BET: ", currentBet8X);
			logSuccess(totalIndex, 'MAX 2X:', Math.max(...maxBets2X), ', MAX 3X:', Math.max(...maxBets3X), ', MAX 4X:', Math.max(...maxBets4X), ', MAX 8X:', Math.max(...maxBets8X));
			logSuccess(totalIndex, "SCORE:", result, ", TOTAL:", totalAmount, ", TOTAL 4X:", total4XBetAmount, ", TOTAL 8X:", total8XBetAmount);
		} else {
			logFatal(totalIndex, "2X BET:", currentBet2X, ", 3X BET:", currentBet3X, ", 4X BET: ", currentBet4X, ", 8X BET: ", currentBet8X);
			logFatal(totalIndex, 'MAX 2X:', Math.max(...maxBets2X), ', MAX 3X:', Math.max(...maxBets3X), ', MAX 4X:', Math.max(...maxBets4X), ', MAX 8X:', Math.max(...maxBets8X));
			logFatal(totalIndex, "SCORE:", result, "TOTAL:", totalAmount, "TOTAL 4X:", total4XBetAmount);
		}
		logFatal('---------------------------------------------------------------------------------')
		let logTxt = `${totalIndex}, SCORE: ${result}, 2X BET: ${currentBet2X}, 4X BET: ${currentBet4X}, 8X BET: ${currentBet8X}, MAX 2X: ${Math.max(...maxBets2X)}, MAX 4X: ${Math.max(...maxBets4X)}, MAX 8X: ${Math.max(...maxBets8X)}, TOTAL: ${totalAmount}, TOTAL 4X: ${total4XBetAmount}, TOTAL 8X: ${total8XBetAmount}\n`

		fs.appendFileSync('log1.txt', logTxt, function (err) {

		});

	}

	if (bettingTypeResult1.bettingTypes.length != 0) {

		bettingData1 = Object.assign(bettingData1, {
			isRight: true,
			bettingType: bettingTypeResult1.bettingTypes[0],
			payout: bettingTypeResult1.bettingTypes[0],
			engineTrend: bettingType1Trend ? bettingType1Trend.engineTrend : 1,
			entireTrend: bettingType1Trend ? bettingType1Trend.entireTrend2 : 1,
			entireTrend4: bettingType1Trend ? bettingType1Trend.entireTrend4 : 1,
			currentIndex: bettingTypeResult1.bettingTypeIndexes[0],
		});

		bettingData2 = Object.assign(bettingData2, {
			isRight: true,
			bettingType: bettingTypeResult1.bettingTypes[1],
			payout: bettingTypeResult1.bettingTypes[1],
			engineTrend: bettingType2Trend ? bettingType2Trend.engineTrend : 1,
			entireTrend: bettingType2Trend ? bettingType2Trend.entireTrend2 : 1,
			entireTrend4: bettingType2Trend ? bettingType2Trend.entireTrend4 : 1,
			currentIndex: bettingTypeResult1.bettingTypeIndexes[1],
		});

		bettingData3 = Object.assign(bettingData3, {
			isRight: true,
			bettingType: bettingTypeResult1.bettingTypes[2],
			payout: bettingTypeResult1.bettingTypes[2],
			engineTrend: bettingType3Trend ? bettingType3Trend.engineTrend : 1,
			entireTrend: bettingType3Trend ? bettingType3Trend.entireTrend2 : 1,
			entireTrend4: bettingType3Trend ? bettingType3Trend.entireTrend4 : 1,
			currentIndex: bettingTypeResult1.bettingTypeIndexes[2],
		});

		bettingData4 = Object.assign(bettingData4, {
			isRight: true,
			bettingType: bettingTypeResult1.bettingTypeBC,
			payout: bettingTypeResult1.bettingTypeBC,
			engineTrend: bettingType4Trend ? bettingType4Trend.engineTrend : 1,
			entireTrend: bettingType4Trend ? bettingType4Trend.entireTrend2 : 1,
			entireTrend4: bettingType4Trend ? bettingType4Trend.entireTrend4 : 1,
			currentIndex: 0
		});

		let percentCount = -6

		let rightCount = 0;
		TOTAL_BETTING_HISTORY1.slice(percentCount).map(p => {
			if (p.isRight == 1) {
				rightCount++;
			}
		});

		const graph1 = rightCount * 100 / TOTAL_BETTING_HISTORY1.slice(percentCount).length;



		rightCount = 0;
		TOTAL_BETTING_HISTORY2.slice(percentCount).map(p => {
			if (p.isRight == 1) {
				rightCount++;
			}
		});

		const graph2 = rightCount * 100 / TOTAL_BETTING_HISTORY2.slice(percentCount).length;

		rightCount = 0;
		TOTAL_BETTING_HISTORY3.slice(percentCount).map(p => {
			if (p.isRight == 1) {
				rightCount++;
			}
		});

		const graph3 = rightCount * 100 / TOTAL_BETTING_HISTORY3.slice(percentCount).length;


		rightCount = 0;
		TOTAL_BETTING_HISTORY4.slice(percentCount).map(p => {
			if (p.isRight == 1) {
				rightCount++;
			}
		});

		const graph4 = rightCount * 100 / TOTAL_BETTING_HISTORY4.slice(percentCount).length;


		// console.log('GRAPH 3', rightCount, TOTAL_BETTING_HISTORY3.slice(percentCount).length, graph3)
		const branches = JSON.parse(fs.readFileSync(`./branch.json`));

		let graphArray = [
			{
				value: graph4, branchIndex: 4, maxDeep: bettingType4Trend ? bettingType4Trend.maxDeep : 0,
				diff10: bettingType4Trend ? bettingType4Trend.diff10 : 0,
				sma2: bettingType4Trend ? bettingType4Trend.values1[0] : 0,
				sma3: bettingType4Trend ? bettingType4Trend.values1[1] : 0,
				bettingType: bettingTypeResult1.bettingTypeBC,
			},
			{
				value: graph2, branchIndex: 2, maxDeep: bettingType2Trend ? bettingType2Trend.maxDeep : 0,
				diff10: bettingType2Trend ? bettingType2Trend.diff10 : 0,
				sma2: bettingType2Trend ? bettingType2Trend.values1[0] : 0,
				sma3: bettingType2Trend ? bettingType2Trend.values1[1] : 0,
				bettingType: bettingTypeResult1.bettingTypes[1],
			},
			{
				value: graph1, branchIndex: 1, maxDeep: bettingType1Trend ? bettingType1Trend.maxDeep : 0,
				diff10: bettingType1Trend ? bettingType1Trend.diff10 : 0,
				sma2: bettingType1Trend ? bettingType1Trend.values1[0] : 0,
				sma3: bettingType1Trend ? bettingType1Trend.values1[1] : 0,
				bettingType: bettingTypeResult1.bettingTypes[0],
			}
			,
			{
				value: graph3, branchIndex: 3, maxDeep: bettingType3Trend ? bettingType3Trend.maxDeep : 0,
				diff10: bettingType3Trend ? bettingType3Trend.diff10 : 0,
				sma2: bettingType3Trend ? bettingType3Trend.values1[0] : 0,
				sma3: bettingType3Trend ? bettingType3Trend.values1[1] : 0,
				bettingType: bettingTypeResult1.bettingTypes[2],
			},

		].filter(p => branches.includes(p.branchIndex));



		let specialBranch = branches.filter(p => p >= 100);
		let specialBranchIndex = -1;
		if (specialBranch.length == 0) {
			specialBranchIndex = -1;
		} else {
			specialBranchIndex = specialBranch[0] - 100;
			rightCount = 0;
			// console.log("specialBranchIndex-", specialBranchIndex, predictRates, predictResult);
			predictRates[specialBranchIndex].slice(percentCount).map(p => {
				if (p.isRight == 1) {
					rightCount++;
				}
			});

			let bettingType = 0;
			if (specialBranchIndex == predictResult.values.length) {
				// all branch
				bettingType = getStatisticBranchBettingType(predictResult);
			} else if ((specialBranchIndex + 1) == predictResult.values.length) {
				// betting bc branch
				bettingType = bettingTypeResult1.bettingTypeBC;
			} else {
				bettingType = predictResult.values[specialBranchIndex];
			}


			const graph5 = rightCount * 100 / predictRates[specialBranchIndex].slice(percentCount).length;

			const bettingTypeTrend5 = getBettingTypeTrend(predictRates[specialBranchIndex].slice(-50), 3);

			graphArray.push({
				value: graph5, branchIndex: 5, maxDeep: bettingTypeTrend5 ? bettingTypeTrend5.maxDeep : 0,
				diff10: bettingTypeTrend5 ? bettingTypeTrend5.diff10 : 0,
				sma2: bettingTypeTrend5 ? bettingTypeTrend5.values1[0] : 0,
				sma3: bettingTypeTrend5 ? bettingTypeTrend5.values1[1] : 0,
				bettingType: bettingType,
				currentIndex: specialBranchIndex,
			});
			// console.log("GRAPH ARRAY", graphArray);
		}

		const sortedGraph = [...graphArray].filter(p => p.value >= (currentBet2X > currentBetMaxBet2X ? 0 : 0)).sort((a, b) => {

			// if (selectedGraph && b.branchIndex == selectedGraph.branchIndex) {
			// 	return -1000000000000;
			// }
			// if (mainBranch == a.branchIndex) {
			// 	return -1;
			// }

			if (b.value == a.value) {
				return b.sma2 - a.sma2
				if (a.maxDeep == b.maxDeep) {
					return a.sma2 - b.sma2
				}
				return a.maxDeep - b.maxDeep
			} else {
				return b.sma2 - a.sma2
			}

		});

		let selectedGraph = sortedGraph[0];
		bettingData2X = Object.assign(bettingData2X, {
			isRight: 1,
			betOrNot: 0, //&& (isBetting3 || isSameUp),
			engineTrend: 0,
			entireTrend: 0,
			entireTrend4: 0,
			currentIndex: selectedGraph.branchIndex
		});

		if (selectedGraph) {
			bettingData2X.currentIndex = selectedGraph.branchIndex;
			bettingData2X.bettingType = selectedGraph.bettingType;
			bettingData2X.payout = selectedGraph.bettingType;
			bettingData2X.betOrNot = 1;
			// if (bettingTypeResult1.bettingTypeSpecial == 0) {
			// 	bettingData2X.betOrNot = 0;
			// } else {
			// 	bettingData2X.bettingType = bettingTypeResult1.bettingTypeSpecial;
			// 	bettingData2X.payout = bettingTypeResult1.bettingTypeSpecial;
			// }
		} else {
			bettingData2X.betOrNot = 0;
		}
		console.log("FINAL BETTING", {
			final: bettingData2X.bettingType,
			special: bettingTypeResult1.bettingTypeSpecial,
			betOrNot: bettingData2X.betOrNot});

		if (bettingData2X.bettingType == 2) {
			logSuccess("2X BETTING, ", "BETTING TYPE1: ", bettingData1.bettingType, "X, ", "BETTING TYPE2: ", bettingData2.bettingType, "X, ")
		} else {
			logFatal("1X BETTING, ", "BETTING TYPE1: ", bettingData1.bettingType, "X, ", "BETTING TYPE2: ", bettingData2.bettingType, "X, ")
		}

		TOTAL_BETTING_HISTORY1.push(bettingData1);
		TOTAL_BETTING_HISTORY2.push(bettingData2);
		TOTAL_BETTING_HISTORY3.push(bettingData3);
		TOTAL_BETTING_HISTORY4.push(bettingData4);
		TOTAL_BETTING_HISTORY2X.push(bettingData2X);



		let bettingOrNot = bettingData2X.betOrNot == 1;
		profitType = 0;

		const loseArray = [{
			amount: currentBet2X,
			type: 0
		}, {
			amount: currentBet4X,
			type: 1
		}, {
			amount: currentBet8X,
			type: 2
		}];

		loseArray.sort((a, b) => {
			return b.amount - a.amount
		})

		isBetting = bettingData2X.betOrNot == 1;
		let currentBet = 0;
		if (isBetting) {
			switch (profitType) {
				case 0: {
					totalAmount = totalAmount - currentBet2X;
					currentBet = currentBet2X;
					break;
				}
				case 1: {
					totalAmount = totalAmount - currentBet4X;
					total4XBetAmount += currentBet4X;
					currentBet = currentBet4X;
					break;
				}
				case 2: {
					totalAmount = totalAmount - currentBet8X;
					total8XBetAmount += currentBet8X;
					currentBet = currentBet8X;
					break;
				}
			}
		}

		logWarn("CURRENT BET: ", currentBet, 'BETTING TYPE: ', bettingData2X.bettingType, 'PROFIT TYPE: ', profitType);
		logWarn('---------------------------------------------------------------------------------------------------------------------\n')
		if ((totalAmount - currentBet) < 0) {
			logFatal("LOSED ALL", totalIndex);
			isBettingEnable = false;
			isBetting = false;
		}


		let timeout = -1;



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

		addPredictRates(predictResult, bettingTypeResult1.bettingTypeBC);

		isRealBetting = isBettingEnable && isBetting && currentBet < maxAmount;

		console.log('CURRENT BET', currentBet2X, currentBet);
		return {
			isBetting: isRealBetting,
			bettingType: bettingData2X.bettingType,
			trenball2XBetting,
			trenball1XBetting,
			timeout,
			payout: currentPayout,
			is2XUp: false,
			is2XDown: false,
			isReset: true,
			x2Result: predictResult,
			initialBet: currentBet
		}
	}


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
		// const tmpScores = SCORES.slice(start * -1);
		// return tmpScores.slice(0, count);
		// // // return payouts.slice(count * -1);;
		// return SCORES.slice(count * -1);
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
	initialBet2X = v;
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


export const setMainBranch = (branch) => {
	mainBranch = branch;
}

export const setMartingaleCount = (count) => {
	martingaleCount = count;
}

export const setCurrent2XBet = (betAmount) => {

	if (betAmount > 0) {
		currentBet2X = betAmount;
	}
}

export const setDeposit = (betAmount) => {

	if (betAmount > 0) {
		totalAmount = betAmount;
	}
}

export const getDeposit = () => {

	return totalAmount;
}

export const getCurrent2XBet = () => {
	return currentBet2X;
}

export const setIsAutoUp = (v) => {
	isAutoUp = v;
}