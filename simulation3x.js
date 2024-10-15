import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { gameResult, sortValues } from "./libs/utils.js";

// let PAYOUTS = require('./payouts.json');
const CryptoJS = require("crypto-js");
const fs = require('fs');
import { logDebug, logError, logFatal, logSuccess, logWarn } from "./libs/logging.js";
import { exit } from "process";
import { getBettingTypeTrend, checkBettingType2, getCurrentTrend2X, getCurrentTrend3X, getEnginePredictResult, predictRates, setLoseStatus, getLoseStatus, getPredictResult, getPredictResultFromJson, verifyPredict, verifyPredict3, verifyPredictFromJson, getHighScoreBet2, check1010Pattern, verifyPredictRate, checkSimulation, checkOppositPattern, TOTAL_BETTING_HISTORY1, TOTAL_BETTING_HISTORY2, TOTAL_BETTING_HISTORY3, TOTAL_BETTING_HISTORY, checkSimulationWithEngine, verifyEngine, checkSimulationWithPredict, checkPatternWithString, initializeData, TOTAL_BETTING_HISTORY4, getPredictResultFromJson20, checkBettingType3, initializeData3, verifyPredictRateWith3, TOTAL_BETTING_HISTORY3X, get3XPercent, get1XPercent, TOTAL_BETTING_HISTORY2X } from "./engine.js";
import { train1, trainEngine2, trainPredictRate } from "./brain.js";
import { getExpectedEnginData2, getExpectedEngineData } from "./libs/aiutils.js";




const delay = time => new Promise(res => setTimeout(res, time));

const verifiedCodes = [];


let lastBranch = 1;

let deadPoints = [348, 1775, 2677, 2724, 5333, 5910, 6844, 12163, 13093, 13946, 15876, 16785, 18181, 25340, 25452, 28027, 28642];

let currentDeadPoint = 1000000000;


let detectedDeadPoints = [];

export const checkResult = async (initialHash, counts) => {

	let depositAmount = 1000;

	let initialBet = 0;
	let initialBet3X = 1;

	let currentInitialBet3X = 0.0125;

	let initialBet4X = 1 * Math.pow(2, 1);

	let initialBet8X = 1 * Math.pow(2, 1);

	let currentAmount = depositAmount;
	let totalAmount = depositAmount;
	let currentBet2X = initialBet;
	let currentBet4X = initialBet4X;
	let currentBet8X = initialBet8X;

	let selectedGraph = null;


	let currentBetMaxBet2X = initialBet * Math.pow(2, 2);
	let currentBetMaxBet4X = initialBet * Math.pow(2, 5);
	let currentBetMaxBet8X = initialBet * Math.pow(2, 4);

	let isNormalBet = true;


	let profitType = 0; // 0 : normal from start 1, 1: fast grow from start 4, 2: dip model : from start 8

	let realBet2X = initialBet;
	let currentBet3X = currentInitialBet3X;
	let x3Payout = 3;
	let currentX3Payout = 3;

	let total4XBetAmount = 0;
	let total8XBetAmount = 0;


	let isDistBet = false;
	let distBets = [];

	let totalDistAmount = 0;

	let maxDistBets = [];
	let loseCount = 0;

	for (let i = 0; i < 20; i++) {
		distBets.push(0);
		maxDistBets.push(0);
	}


	const bettingHistory = [];
	const patternHistory = [];

	let prevPredictValue = null;
	let prevTrendStatus = null;

	let currentBet2Xs = [];
	let currentBet3Xs = [];
	let maxBets2X = [];
	let maxBets3X = [];
	let maxBets4X = [];
	let maxBets8X = [];


	let currentSkipCount = 0;

	let bettingType1010 = [1, 2];
	let bettingType2211 = [2, 2, 1, 1];



	let isStop = false;

	let previousTrainJsons = null;


	let isFoundRightChangePoint = false;


	let prevHash = null;
	let payouts = [];
	let hashes = [];


	let globalSkipCount = 0;
	for (let i = 0; i < counts; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		hashes.unshift(hash);
		payouts.unshift(bust);
	}

	initializeData3();


	console.log(payouts.length, hashes[0]);


	let isGoodMatchedEngine = false;

	let errorCount = 0;

	let breakCount = 3;

	let mainBranch = 1;

	let lostCount = 0;

	let tIndex = 0;

	let isChangeFlag = false;

	let isStartPointOfLosing = false;

	let pickCount = 0;

	for (let i = 100; i < payouts.length - 1; i++) {

		logFatal('%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%')
		// if (i - 100 > 65) {
		// 	await delay(1000);
		// }

		// await delay(100);
		// if (i == 100) {

		// 	console.log('LAST HASH', hashes[i - 1])
		// 	train1({hash: hashes[i-1]}, 20000);
		// }
		// if ((i - 100) % 2 == 0) {
		// const currentTrainJsons = train1({ hash: hashes[i - 2] }, i < 150 ? 60 : 60);
		// predictRates = [[], [], [], [], [], [], [], [], []]
		// predictScores = [[], [], [], [], [], [], [], [], []]
		// PAYOUTS = [];
		currentBet2Xs = [];
		// }

		const subPayouts = payouts.slice(i - 100, i);
		const subPayoutsAll = payouts.slice(i - 100, i + 1);
		const lastPayout = subPayouts[subPayouts.length - 1];
		const nextPayout = payouts[i];


		console.log("PAYOUTS~~~~~~~~~~~~~", lastPayout, nextPayout)


		const currentTrend2X = getCurrentTrend2X(subPayouts.slice(-10));
		const currentTrend3X = getCurrentTrend3X(subPayouts.slice(-10));
		//const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);
		const predictResult = getPredictResultFromJson20(subPayouts);




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

		// console.log(vs);
		let maxDeep = Math.max(...vs);

		let currentDeep = prevPayoutResult.values[0].length

		// if (currentDeep >= 8) {
		// 	console.log(prevPayoutResult.values, lastPayout)
		// }

		let currentPattern = prevPayoutResult.values.map(p => p.length).slice(0, 17);

		let isWinBet = false;

		if (currentBet2X == initialBet) {
			isWinBet = true;
		}

		let isRightEngine1 = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] ? TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 1 : false;
		let isRightEngine2 = TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1] ? TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 1 : false;
		let isRightEngine3 = TOTAL_BETTING_HISTORY3[TOTAL_BETTING_HISTORY3.length - 1] ? TOTAL_BETTING_HISTORY3[TOTAL_BETTING_HISTORY3.length - 1].isRight == 1 : false;
		let isRightEngine4 = TOTAL_BETTING_HISTORY4[TOTAL_BETTING_HISTORY4.length - 1] ? TOTAL_BETTING_HISTORY4[TOTAL_BETTING_HISTORY4.length - 1].isRight == 1 : false;
		let isRightEngine = TOTAL_BETTING_HISTORY[TOTAL_BETTING_HISTORY.length - 1] ? TOTAL_BETTING_HISTORY[TOTAL_BETTING_HISTORY.length - 1].isRight == 1 : false;

		// console.log(maxDeep);
		// console.log('TREND 1')
		const bettingType1Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-50), 4);
		// console.log('TREND 2')
		const bettingType2Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY2.slice(-50), 3);
		// console.log('TREND 3')
		const bettingType3Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY3.slice(-50), 3);
		// console.log('TREND 4')
		const bettingType4Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY4.slice(-50), 3);
		// console.log('TREND')
		const bettingTypeTrend = getBettingTypeTrend(TOTAL_BETTING_HISTORY.slice(-50), 3);

		let { bettingType1, bettingType2, bettingType3, bettingTypeBC, bettingType3X, is3XPoint, trendStatus, skipCount, currentIndexLow, currentIndexHigh, currentIndexMid, bettingAvailable }
			= checkBettingType3(subPayouts, maxDeep, currentDeep, prevPredictValue, lastPayout, predictResult);
		console.log({ bettingType1, bettingType2, bettingType3, bettingTypeBC, trendStatus, skipCount, currentIndexLow, currentIndexHigh, currentIndexMid, bettingAvailable })
		let isRightVerified = 1;

		if (isRightEngine1) {
			bettingType1 = bettingType1010.shift();
			bettingType1010.push(bettingType1);
		} else {
			bettingType1 = bettingType1010[0];
		}

		if (isRightEngine2) {
			bettingType2 = bettingType2211.shift();
			bettingType2211.push(bettingType2);
		} else {
			bettingType2 = bettingType2211[0];
		}

		bettingType3 = 2;
		// const patternStr = currentPattern.slice(0, 2);

		// if (patternStr == '1,1') {
		// 	//bettingType1 = lastPayout >= 2 ? 1 : 2;
		// 	bettingTypeBC = lastPayout >= 2 ? 1 : 2;;
		// }

		// if (patternStr == '2,2') {
		// 	// bettingType2 = lastPayout >= 2 ? 1 : 2;
		// 	bettingTypeBC = lastPayout >= 2 ? 1 : 2;;
		// }


		// console.log(prevPayoutResult.values);

		// logDebug("CURRENT PATTERN ~~~~~~~~~~~", currentPattern.join(','), "$$$$$$", patternStr, "$$$$$$$$", lastPayout, bettingTypeBC);

		let bestBranch = -1;
		try {
			bestBranch = -1;
			// const predictRatesClone = predictRates[currentIndex].slice(-80);
			// const trainJsons = trainPredictRate(predictRatesClone, 50, [5, 10, 15]);
			// const bestIndexes = checkSimulation(predictRatesClone, trainJsons, [5, 10, 15]);
			// const verifiyDatas = [];
			// [5, 10, 15].map((count, index) => {
			// 	let verifyData = verifyPredictRate(trainJsons[index], predictRatesClone.slice(count * -1))
			// 	console.log('verifyData===', verifyData)
			// 	verifiyDatas.push(getExpectedEnginData2(verifyData));
			// })
			// let rightCount = 0, failCount = 0;
			// for (let i = 0; i < bestIndexes.length; i++) {
			// 	if (verifiyDatas[bestIndexes[i]] == 1) {
			// 		rightCount++;
			// 	} else {
			// 		failCount++;
			// 	}
			// }
			// isRightVerified = rightCount > failCount ? 1 : 0;

			// if (bettingType2Trend.entireTrend2 == 1) {
			// 	logError("CHANGED FORCED BETTING TYPE2 TREND ~~~~~~~~~~");
			// 	isRightVerified == isRightVerified == 1 ? 0 : 1;
			// }

			// const trainJsons = [];

			// [5, 10, 15].map(count => {
			// 	const train_str = fs.readFileSync(`./predict_train_${currentIndex}_${count}.json`);
			// 	const json = JSON.parse(train_str);

			// 	trainJsons.push(json);
			// })

			// const predictRatesClone = predictRates[currentIndex].slice(-80);
			// const bestIndexes = checkSimulationWithPredict(predictRatesClone, trainJsons, [5, 10, 15]);
			// const verifiyDatas = [];
			// [5, 10, 15].map((count, index) => {
			// 	let verifyData = verifyPredictRate(trainJsons[index], predictRatesClone.slice(count * -1))
			// 	console.log('verifyData===', verifyData, bestIndexes)
			// 	verifiyDatas.push(getExpectedEnginData2(verifyData));
			// })
			// let rightCount = 0, failCount = 0;
			// for (let i = 0; i < bestIndexes.length; i++) {
			// 	if (verifiyDatas[bestIndexes[i]] == 1) {
			// 		rightCount++;
			// 	} else {
			// 		failCount++;
			// 	}
			// }
			// isRightVerified = rightCount > failCount ? 1 : 0;


			// const trainJsons = [];

			// const verifyScores = [];
			// predictRates.map((p, currentIndex) => {
			// 	[5].map(count => {
			// 		const train_str = fs.readFileSync(`./predict_train_3_${currentIndex}_${count}.json`);
			// 		const json = JSON.parse(train_str);

			// 		trainJsons.push(json);
			// 	})

			// 	const predictRatesClone = predictRates[currentIndex].slice(-80);
			// 	// const bestIndexes = checkSimulationWithPredict(predictRatesClone, trainJsons, [5, 10, 15]);
			// 	const verifiyDatas = [];
			// 	[5].map((count, index) => {
			// 		let verifyData = verifyPredictRateWith3(trainJsons[index], predictRatesClone.slice(count * -1));
			// 		let verifyDataScore = 0;
			// 		for (let i = 0; i < verifyData.length; i++) {
			// 			if (verifyData[i] < 0.5) {
			// 				verifyDataScore = 0;
			// 				break;
			// 			} else {
			// 				verifyDataScore += verifyData[i];
			// 			}
			// 		}
			// 		// console.log('verifyData===', verifyData, verifyDataScore);

			// 		if (verifyDataScore != 0) {
			// 			verifyScores.push({
			// 				score: verifyDataScore,
			// 				index: currentIndex
			// 			})
			// 		}

			// 		// verifiyDatas.push(getExpectedEnginData2(verifyData));
			// 	});

			// 	// let rightCount = 0, failCount = 0;
			// 	// for (let i = 0; i < bestIndexes.length; i++) {
			// 	// 	if (verifiyDatas[bestIndexes[i]] == 1) {
			// 	// 		rightCount++;
			// 	// 	} else {
			// 	// 		failCount++;
			// 	// 	}
			// 	// }
			// 	// isRightVerified = rightCount > failCount ? 1 : 0;
			// })

			// verifyScores.sort((a, b) => {
			// 	return b.score - a.score
			// });

			// logDebug("BEST BRANCH~~~~~~~~~~~~~~~", verifyScores, verifyScores[0].index + 5);
			// bestBranch = verifyScores[0].index;
			// if (bettingType2Trend.entireTrend2 == 1) {
			// 	logError("CHANGED FORCED BETTING TYPE2 TREND ~~~~~~~~~~");
			// isRightVerified == isRightVerified == 1 ? 0 : 1;
			// }


			// ##############################################
			// const engineHistoryClone = TOTAL_BETTING_HISTORY1.slice(-80);

			// const trainJsons = [];

			// [5, 10, 15].map(count => {
			// 	const train_str = fs.readFileSync(`./engine_train_${count}.json`);
			// 	const json = JSON.parse(train_str);

			// 	trainJsons.push(json);
			// })
			// const bestIndexes = checkSimulationWithEngine(engineHistoryClone, trainJsons, [5, 10, 15]);
			// const verifiyDatas = [];
			// [5, 10, 15].map((count, index) => {
			// 	let verifyData = verifyEngine(trainJsons[index], engineHistoryClone.slice(count * -1))
			// 	console.log('verifyData===', verifyData)
			// 	verifiyDatas.push(getExpectedEnginData2(verifyData));
			// })
			// let rightCount = 0, failCount = 0;
			// for (let i = 0; i < bestIndexes.length; i++) {
			// 	if (verifiyDatas[bestIndexes[i]] == 1) {
			// 		rightCount++;
			// 	} else {
			// 		failCount++;
			// 	}
			// }
			// isRightVerified = rightCount > failCount ? 1 : 0;

		} catch (err) {
			console.log('SOMETHING ERROR', err);
		}


		if (isWinBet) {
			setLoseStatus(false);
		}
		if (currentSkipCount == 0) {
			currentSkipCount = globalSkipCount;
		} else {
			currentSkipCount--;
		}

		if (bettingType1 != 0) {
			let bettingOrNot = false;
			bettingOrNot = bettingAvailable && predictRates[0].length >= 40;

			let isRight1 = false;

			if (nextPayout >= 2 && bettingType1 == 2) {
				isRight1 = true;
			} else if (nextPayout < 2 && bettingType1 == 1) {
				isRight1 = true;
			}

			const bettingData1 = {
				isRight: isRight1 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend: bettingType1Trend ? bettingType1Trend.engineTrend : 1,
				entireTrend: bettingType1Trend ? bettingType1Trend.entireTrend2 : 1,
				currentIndex: currentIndexLow,
				bettingType: bettingType1,
				payout: payouts[i]
			};

			let isRight2 = false;

			if (nextPayout >= 2 && bettingType2 == 2) {
				isRight2 = true;
			} else if (nextPayout < 2 && bettingType2 == 1) {
				isRight2 = true;
			} else {
				isRight2 = false;
			}

			const bettingData2 = {
				isRight: isRight2 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend: bettingType2Trend ? bettingType2Trend.engineTrend : 1,
				entireTrend: bettingType2Trend ? bettingType2Trend.entireTrend2 : 1,
				currentIndex: currentIndexHigh,
				bettingType: bettingType2,
				payout: payouts[i]
			};

			let isRight3 = false;
			if (nextPayout >= 2 && bettingType3 == 2) {
				isRight3 = true;
			} else if (nextPayout < 2 && bettingType3 == 1) {
				isRight3 = true;
			} else {
				isRight3 = false;
			}

			const bettingData3 = {
				isRight: isRight3 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType3Trend ? bettingType3Trend.engineTrend : 1,
				entireTrend: bettingType3Trend ? bettingType3Trend.entireTrend2 : 1,
				currentIndex: currentIndexMid,
				bettingType: bettingType3,
				payout: payouts[i],

			};

			let isRight4 = false;
			if (nextPayout >= 2 && bettingTypeBC == 2) {
				isRight4 = true;
			} else if (nextPayout < 2 && bettingTypeBC == 1) {
				isRight4 = true;
			} else {
				isRight4 = false;
			}

			const bettingData4 = {
				isRight: isRight4 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType4Trend ? bettingType4Trend.engineTrend : 1,
				entireTrend: bettingType4Trend ? bettingType4Trend.entireTrend2 : 1,
				currentIndex: 0,
				bettingType: bettingTypeBC,
				payout: payouts[i],

			};

			const x3P = get3XPercent(subPayouts, 10);
			const x1P = get1XPercent(subPayouts, 10);

			if(lastPayout >= 3) {
				bettingType3X = 2;	
			}
			// if (x3P >= 0.3) {
			// 	bettingType3X == 2;
			// }
			let isRight3X = false;
			if (nextPayout >= currentX3Payout && bettingType3X == 2) {
				isRight3X = true;

			} else if (nextPayout < 2 && bettingType3X == 1) {
				isRight3X = true;
			} else {
				isRight3X = false;
			}
			const bettingData3X = {
				isRight: isRight3X ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType4Trend ? bettingType4Trend.engineTrend : 1,
				entireTrend: bettingType4Trend ? bettingType4Trend.entireTrend2 : 1,
				currentIndex: 0,
				bettingType: bettingType3X,
				payout: payouts[i],
			};

			let is1010Pattern1 = check1010Pattern(TOTAL_BETTING_HISTORY1.slice(-3).map(p => p.isRight), 1) && bettingType1Trend && bettingType1Trend.entireTrend2 != 1;
			let is1010Pattern2 = check1010Pattern(TOTAL_BETTING_HISTORY2.slice(-3).map(p => p.isRight), 1) && bettingType2Trend && bettingType2Trend.entireTrend2 != 1;
			let is1010Pattern3 = check1010Pattern(TOTAL_BETTING_HISTORY3.slice(-3).map(p => p.isRight), 1);
			let is1010Pattern4 = check1010Pattern(TOTAL_BETTING_HISTORY4.slice(-3).map(p => p.isRight), 1);

			let isOppositPattern = checkOppositPattern(TOTAL_BETTING_HISTORY1.slice(-3).map(p => p.isRight), TOTAL_BETTING_HISTORY2.slice(-3).map(p => p.isRight))
			logDebug("1010 PATTERN", JSON.stringify({ is1010Pattern1, is1010Pattern2, is1010Pattern3 }), "OPPOSIT? ", isOppositPattern)

			let current1010Pattern = null;

			let isChangedBranch = false;


			let currentBettingTypeTrend = bettingType1Trend;
			// mainBranch = 1;

			let percentCount = -5

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

			let graphArray = [
				{
					value: graph4, branchIndex: 4, maxDeep: bettingType4Trend ? bettingType4Trend.maxDeep : 0,
					diff10: bettingType4Trend ? bettingType4Trend.diff10 : 0,
					sma2: bettingType4Trend ? bettingType4Trend.values1[0] : 0,
					sma3: bettingType4Trend ? bettingType4Trend.values1[1] : 0,
					bettingType: bettingTypeBC,
				},
				{
					value: graph2, branchIndex: 2, maxDeep: bettingType2Trend ? bettingType2Trend.maxDeep : 0,
					diff10: bettingType2Trend ? bettingType2Trend.diff10 : 0,
					sma2: bettingType2Trend ? bettingType2Trend.values1[0] : 0,
					sma3: bettingType2Trend ? bettingType2Trend.values1[1] : 0,
					bettingType: bettingType2,
				},
				{
					value: graph1, branchIndex: 1, maxDeep: bettingType1Trend ? bettingType1Trend.maxDeep : 0,
					diff10: bettingType1Trend ? bettingType1Trend.diff10 : 0,
					sma2: bettingType1Trend ? bettingType1Trend.values1[0] : 0,
					sma3: bettingType1Trend ? bettingType1Trend.values1[1] : 0,
					bettingType: bettingType1,
				}
				,
				{
					value: graph3, branchIndex: 3, maxDeep: bettingType3Trend ? bettingType3Trend.maxDeep : 0,
					diff10: bettingType3Trend ? bettingType3Trend.diff10 : 0,
					sma2: bettingType3Trend ? bettingType3Trend.values1[0] : 0,
					sma3: bettingType3Trend ? bettingType3Trend.values1[1] : 0,
					bettingType: bettingType3,
				},

			]

			// graphArray.sort((a, b) => {
			// 	return a.diff10 - b.diff10
			// });

			// graphArray = [
			// 	graphArray[0],
			// 	graphArray[1],
			// ]


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

			const bettingData2X = {
				isRight: 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingTypeTrend ? bettingTypeTrend.engineTrend : 1,
				entireTrend: bettingTypeTrend ? bettingTypeTrend.entireTrend2 : 1,
				currentIndex: 0,
				payout: payouts[i],

			};

			selectedGraph = sortedGraph[0];
			if (selectedGraph) {

				if (is3XPoint || lastPayout >= 3) {
					selectedGraph.bettingType = 2;
				}
				let isRight = false;
				if (nextPayout >= 2 && selectedGraph.bettingType == 2) {
					isRight = true;
				} else if (nextPayout < 2 && selectedGraph.bettingType == 1) {
					isRight = true;
				} else {
					isRight = false;
				}
				// console.log("CHOOSED GRAPH", selectedGraph, isRight);
				bettingData2X.isRight = isRight ? 1 : 0
				bettingData2X.currentIndex = selectedGraph.branchIndex;
				bettingData2X.bettingType = selectedGraph.bettingType;
			}

			

			const bettingData = {
				isRight: 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingTypeTrend ? bettingTypeTrend.engineTrend : 1,
				entireTrend: bettingTypeTrend ? bettingTypeTrend.entireTrend2 : 1,
				currentIndex: 0,
				payout: payouts[i],

			};

			



			if (currentBet3X >= 10) {
				// if (bettingData3X.bettingType == 2) {
				// 	currentX3Payout = x3Payout;
				// 	bettingData.bettingType = 2;
				// 	bettingData.betOrNot = 1;
				// 	bettingOrNot = true;
				// } else {
					// if (lastPayout < 2) {
					// 	bettingData2X.bettingType = 1;
					// }
					currentX3Payout = 2;
					bettingData.bettingType = bettingData2X.bettingType;
					bettingData.betOrNot = 1;
					bettingOrNot = true;
				// }
			} else {
				if (bettingData3X.bettingType == 2) {
					bettingData.bettingType = 2;
					bettingData.betOrNot = 1;
					bettingOrNot = true;
				}
	
				else if (bettingData4.bettingType == 1
					&& currentTrend2X.entireTrend6 == 1 && currentTrend2X.currentTrend == 1
					&& currentBet3X >= 25.6
				) {
					bettingData.bettingType = 1;
					bettingData.betOrNot = 1;
					bettingOrNot = true;
				} 
				else {
					bettingData.betOrNot = 0;
					bettingData.bettingType = bettingData3X.bettingType;
					bettingOrNot = false;
				}
			}

			
			console.log("2X Trend", currentTrend2X)
			console.log("3X BET~~~~~~~~~~~", payouts[i], bettingData.bettingType, bettingData3X.bettingType, bettingOrNot, bettingData.betOrNot)

			if (bettingData.betOrNot == 1) {
				let isRight = false;
				if (nextPayout >= currentX3Payout && bettingData.bettingType == 2) {
					isRight = true;
				} else if (nextPayout < 2 && bettingData.bettingType == 1) {
					isRight = true;
				} else {
					isRight = false;
				}
				// console.log("CHOOSED GRAPH", selectedGraph, isRight);
				bettingData.isRight = isRight ? 1 : 0
				bettingData.currentIndex = 0;
			}

			// console.log({ selectedGraph, bettingData });

			logError("MAIN BRANCH", JSON.stringify({
				branch: selectedGraph ? selectedGraph.branchIndex : 0, nextPayout
				, currentIndexLow, currentIndexHigh, currentIndexMid
			}));
			logSuccess("BETTING TYPES", JSON.stringify({ bettingType1, bettingType2, bettingType3, bettingTypeBC }));

			let isSameFailed = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] && TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 0 && TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 0
			let lastBettingInfo = TOTAL_BETTING_HISTORY3[TOTAL_BETTING_HISTORY3.length - 1];
			// let's check origin engin


			let isChangedPoint = lastBettingInfo && lastBettingInfo.isRight && lastBettingInfo.betOrNot == false;

			if (isFoundRightChangePoint == false) {
				if (isChangedPoint) {
					isFoundRightChangePoint = true;
				}
			} else {
				isFoundRightChangePoint = false;
				isChangedPoint = false;
			}


			// let isSameUp = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] 
			// 	&& TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1]
			// 	&& TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 1 && TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 1

			let anotherChangePoint = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1]
				&& TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1]
				&& TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight != TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight
				&& lastBettingInfo && lastBettingInfo.isRight == 0
			let normalCondition = !isSameFailed && isChangedPoint == false;
			// let isBetting3 = true; //!isSameFailed;// (normalCondition || anotherChangePoint);



			let currentBetAmount = 0;

			// profitType = 0;

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


			if (bettingType4Trend) {
				console.log("Trend 10:", bettingType4Trend.entireTrend10, bettingType4Trend.entireTrend2, bettingType4Trend.engineTrend, ", TREND 2: "
					/*, currentBettingTypeTrend.entireTrend10, currentBettingTypeTrend.entireTrend2, currentBettingTypeTrend.engineTrend*/)
				// let's check current graph status
				if (
					(bettingType4Trend && bettingType4Trend.entireTrend2 != 1 && bettingType4Trend.entireTrend4 != 1 && bettingType4Trend.entireTrend6 == 0)
					//|| (currentBettingTypeTrend && currentBettingTypeTrend.entireTrend10 != 1 && (currentBettingTypeTrend.entireTrend2 == 0 || current1010Pattern))
					// (bettingType3Trend && /*bettingType3Trend.entireTrend10 != 1 && */bettingType3Trend.entireTrend2 != 1 && bettingType3Trend.engineTrend != 1)
					// || (currentBettingTypeTrend && /*currentBettingTypeTrend.entireTrend10 != 1  && */currentBettingTypeTrend.entireTrend2 != 1 && currentBettingTypeTrend.engineTrend != 1)
				) {
					// really good status
					profitType = 2; //loseArray[0].type;
				} else if (bettingType4Trend && (bettingType4Trend.entireTrend2 != 1 && bettingType4Trend.entireTrend4 != 1/* && is1010Pattern4*/)) {
					profitType = 1;
					// if (currentBet4X > currentBet2X) {
					// 	if (currentBet4X >= currentBetMaxBet4X) {
					// 		if (bettingType4Trend.entireTrend10 != 1 && bettingType4Trend.entireTrend2 != 1) {
					// 			profitType = 1;
					// 		} else {
					// 			profitType = 0;
					// 		}
					// 	} else {
					// 		profitType = 1;
					// 	}
					// }
				} else {
					profitType = 0;
				}
			}


			// isNormalBet = true;
			if (!bettingOrNot || currentSkipCount > 0) {
				TOTAL_BETTING_HISTORY1.push(bettingData1);
				TOTAL_BETTING_HISTORY2.push(bettingData2);
				TOTAL_BETTING_HISTORY3.push(bettingData3);
				TOTAL_BETTING_HISTORY4.push(bettingData4);
				TOTAL_BETTING_HISTORY2X.push(bettingData2X);
				
				TOTAL_BETTING_HISTORY3X.push(bettingData3X);
				bettingData.betOrNot = 0;
				TOTAL_BETTING_HISTORY.push(bettingData);
				continue;
			}

			TOTAL_BETTING_HISTORY1.push(bettingData1);
			TOTAL_BETTING_HISTORY2.push(bettingData2);
			TOTAL_BETTING_HISTORY3.push(bettingData3);
			TOTAL_BETTING_HISTORY4.push(bettingData4);
			TOTAL_BETTING_HISTORY2X.push(bettingData2X);
			TOTAL_BETTING_HISTORY3X.push(bettingData3X);
			TOTAL_BETTING_HISTORY.push(bettingData);


			if (false || (i - 100) <= (currentDeadPoint + 10) && (i - 100) >= currentDeadPoint /*100000000*/ /*(deadPoints[currentDeadPoint] - 20)*/) {

				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
				fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3X.json', JSON.stringify(TOTAL_BETTING_HISTORY3X, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
				fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i + 1), null, 4));
				await delay(30);
			}

			// if ((i - 100) == deadPoints[currentDeadPoint]) {
			// 	currentDeadPoint++;
			// }




			profitType = 0;




			switch (profitType) {
				case 0: {
					currentBetAmount = currentBet2X;
					currentAmount = currentAmount - currentBet2X;
					totalAmount = totalAmount - currentBet2X;
					break;
				}
				case 1: {
					currentBetAmount = currentBet4X;
					currentAmount = currentAmount - currentBet4X;
					totalAmount = totalAmount - currentBet4X;
					total4XBetAmount += currentBet4X;
					break;
				}
				case 2: {
					currentBetAmount = currentBet8X;
					currentAmount = currentAmount - currentBet8X;
					totalAmount = totalAmount - currentBet8X;
					total8XBetAmount += currentBet8X;
					break;
				}
			}
			currentBetAmount = currentBet3X;
			bettingData1.betAmount = currentBetAmount;
			bettingData2.betAmount = currentBetAmount;
			bettingData3.betAmount = currentBetAmount;
			bettingData.betAmount = currentBetAmount;
			bettingData2X.betAmount = currentBetAmount;


			// let has3XPayout = subPayouts.slice(-4).filter(p => p >= 3);
			// if (bettingType3 == 2 && has3XPayout) {
			// 	currentAmount = currentAmount - currentBet3X;
			// 	totalAmount = totalAmount - currentBet3X;
			// }




			if (bettingData.isRight == 1) {
				logSuccess('RESULT ###################: ', nextPayout, "REAL BET TYPE", bettingData.bettingType, 'X')
			} else {
				logFatal('RESULT ###################: ', nextPayout, "REAL BET TYPE", bettingData.bettingType, 'X')
			}

			currentAmount = currentAmount - currentBet3X;
			totalAmount = totalAmount - currentBet3X;

			if (bettingData.isRight == 1) {
				let currentBet = 0; //currentBet2X;

				switch (profitType) {
					case 0: {
						currentBet = currentBet2X;
						currentBet2X = initialBet;
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

				if (nextPayout < 2) {
					currentAmount += currentBet * 1.96
					totalAmount += currentBet * 1.96;
				} else {
					currentAmount += currentBet * 2;
					totalAmount += currentBet * 2;
				}


				if (bettingData.bettingType == 2) {
					currentAmount += currentBet3X * currentX3Payout;
					totalAmount += currentBet3X * currentX3Payout;
					currentBet3X = currentInitialBet3X;
				} else {
					currentAmount += currentBet3X * 1.96;
					totalAmount += currentBet3X * 1.96;
				}


				if (currentTrend3X.entireTrend6 == 1) {
					currentInitialBet3X = 0.0125;
				} else {
					currentInitialBet3X = initialBet3X;
				}
				lostCount = 0;
				currentBet3X = currentInitialBet3X;
				currentX3Payout = x3Payout;

			} else {
				lostCount++;
				let currentBet = 0;
				switch (profitType) {
					case 0: {
						currentBet2X = currentBet2X * 2;
						currentBet = currentBet2X;
						break;
					}
					case 1: {
						currentBet4X = currentBet4X * 2;
						currentBet = currentBet4X;
						break;
					}
					case 2: {
						currentBet8X = currentBet8X * 2;
						currentBet = currentBet8X;
						break;
					}
				}

				currentBet3X = currentBet3X * 2;
				currentBet = currentBet3X; 

				if ((currentAmount - currentBet) < 0) {

					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
					fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3X.json', JSON.stringify(TOTAL_BETTING_HISTORY3X, null, 4));
					fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
					fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i + 1), null, 4));


					logFatal("LOSED ALL", i - 100);
					let logTxt = "LOSED ALL: " + i - 100 + '\n';


					console.log('END HASHE', hashes[i + 150]);
					fs.appendFileSync('log.txt', logTxt, function (err) {
						console.log('Saved!');
					});
					break;
				}
			}

			// if (currentAmount > depositAmount) {
			// 	currentAmount = depositAmount;
			// }

			currentBet2Xs.push(currentBet2X);
			maxBets2X.push(currentBet2X);
			currentBet3Xs.push(currentBet3X);
			maxBets3X.push(currentBet3X);
			maxBets4X.push(currentBet4X);
			maxBets8X.push(currentBet8X);


			if (bettingData.isRight == 1) {
				logSuccess(i - 100, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "4X BET: ", currentBet4X, "8X BET: ", currentBet8X);
				logSuccess(i - 100, 'MAX 2X:', Math.max(...maxBets2X), 'MAX 3X:', Math.max(...maxBets3X), 'MAX 4X:', Math.max(...maxBets4X), 'MAX 8X:', Math.max(...maxBets8X));
				logSuccess(i - 100, "SCORE:", nextPayout, "TOTAL:", totalAmount, "TOTAL 4X:", total4XBetAmount, "TOTAL 8X:", total8XBetAmount);
			} else {
				logFatal(i - 100, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "4X BET: ", currentBet4X, "8X BET: ", currentBet8X);
				logFatal(i - 100, 'MAX 2X:', Math.max(...maxBets2X), 'MAX 3X:', Math.max(...maxBets3X), 'MAX 4X:', Math.max(...maxBets4X), 'MAX 8X:', Math.max(...maxBets8X));
				logFatal(i - 100, "SCORE:", nextPayout, "TOTAL:", totalAmount, "TOTAL 4X:", total4XBetAmount);
			}


			// logWarn("VERIFIED CODES", JSON.stringify(verifiedCodes));


			// let currentLoseCount = 0;
			// const data = TOTAL_BETTING_HISTORY.slice(-30);
			// for (let j = 0; j < data.length; j++) {
			// 	if (data[j].betOrNot == false || data[j].betOrNot == 0) continue;

			// 	if (data[j].isRight == 1) {
			// 		currentLoseCount = 0;
			// 	} else {
			// 		currentLoseCount++;

			// 		if (currentLoseCount == 10) {
			// 			console.log('512 HASHE', hashes[j + 150]);
			// 			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
			// 			fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
			// 			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
			// 			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
			// 			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
			// 			fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i + 1), null, 4));
			// 			detectedDeadPoints.push(i - 100);

			// 			currentBet2X = initialBet;

			// 			await delay(5000);

			// 			TOTAL_BETTING_HISTORY1.length = 0;
			// 			TOTAL_BETTING_HISTORY2.length = 0;
			// 			TOTAL_BETTING_HISTORY3.length = 0;
			// 			TOTAL_BETTING_HISTORY.length = 0;
			// 			predictRates.length = 0;

			// 			prevPredictValue = null;

			// 			initializeData();

			// 		}
			// 	}

			// }

			if ((initialBet != 0 && currentBet2X >= initialBet * Math.pow(2, 10)) || (currentInitialBet3X != 0 && currentBet3X >= currentInitialBet3X * Math.pow(2, 15) )) {
				console.log('512 HASHE', hashes[i + 150]);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
				fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3X.json', JSON.stringify(TOTAL_BETTING_HISTORY3X, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
				fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i + 1), null, 4));

				detectedDeadPoints.push(i - 100);

				currentBet2X = initialBet;

				currentDeadPoint = i - 100;

				console.log("DEAD POINT FOUND #################################")
				await delay(3000);
			}
			let logTxt = `${i - 100}, SCORE: ${nextPayout}, 2X BET: ${currentBet2X}, 4X BET: ${currentBet4X}, 8X BET: ${currentBet8X}, MAX 2X: ${Math.max(...maxBets2X)}, MAX 4X: ${Math.max(...maxBets4X)}, MAX 8X: ${Math.max(...maxBets8X)}, TOTAL: ${totalAmount}, TOTAL 4X: ${total4XBetAmount}, TOTAL 8X: ${total8XBetAmount}\n`

			console.log("DEAD POINTS", detectedDeadPoints);
			//let logTxt = `${i - 100}, SCORE: ${nextPayout}, CURRENT LOSE BET: ${currentBet4X}, TOTAL LOSE AMOUNT: ${total4XBetAmount}, MAX LOSE BET: ${Math.max(...maxBets4X)}, CURRENT AMOUNT: ${currentAmount}, CURRENT 2X BET: ${currentBet2X}, TOTAL: ${totalAmount}, TREND 2X: ${currentTrend2X}, TREND 3X: ${currentTrend3X}, CURRENT MAX BET: ${Math.max(...currentBet2Xs)}, MAX BET: ${Math.max(...maxBets2X)}\n`

			// fs.appendFileSync('log.txt', logTxt, function (err) {
			// 	console.log('Saved!');
			// });




			// let maxLoseCounts = [];
			// let maxWinCounts = [];

			// let currentLoseCount = 0;
			// let currentWinCount = 0;

			// let checkLoseCount = 4;

			// let checkLosePatterns = [];


			// for (let i = 0; i < TOTAL_BETTING_HISTORY2.length; i++) {
			// 	if (TOTAL_BETTING_HISTORY2[i].isRight == 1) {
			// 		currentWinCount++;
			// 		maxLoseCounts.push(currentLoseCount);
			// 		currentLoseCount = 0;
			// 	} else {
			// 		maxWinCounts.push(currentWinCount);
			// 		currentLoseCount++;

			// 		// if (currentLoseCount == 5) {
			// 		// 	maxLoseCounts.push(currentLoseCount);
			// 		// 	currentLoseCount = 0;
			// 		// }

			// 		if (currentLoseCount >= checkLoseCount) {
			// 			// console.log(patternHistory[i], currentLoseCount);

			// 			checkLosePatterns.push(patternHistory[i]);
			// 		}
			// 		currentWinCount = 0;
			// 	}
			// }


			// let loseMap = {};
			// maxLoseCounts.map(a => {
			// 	if (loseMap[a] == undefined) {
			// 		loseMap[a] = 0;
			// 	}
			// 	loseMap[a] = loseMap[a] + 1;
			// });

			// const keys = Object.keys(loseMap);

			// let totalC = 0;
			// for (let i = 0; i < keys.length; i++) {
			// 	let c = parseInt(keys[i]) + 1;
			// 	totalC += c * loseMap[keys[i]];
			// }
			// console.log(Math.max(...maxWinCounts), Math.max(...maxLoseCounts), JSON.stringify(loseMap), totalC)



			// logTxt = `MAX WIN COUNTS: ${Math.max(...maxWinCounts)}, MAX LOSE COUNTS: ${Math.max(...maxLoseCounts)}, LOSE COUNTS: ${JSON.stringify(loseMap)}, TotalBetting Count: ${totalC}\n`
			// fs.appendFileSync('log.txt', logTxt, function (err) {
			// 	console.log('Saved!');
			// });
			// fs.appendFileSync('log.txt', '---------------------------------------------------------------------------------------------------------------------\n', function (err) {
			// 	console.log('Saved!');
			// });
			logWarn('---------------------------------------------------------------------------------------------------------------------\n')
			// fs.writeFileSync('./LOSE_PATTERNS.json', JSON.stringify(checkLosePatterns, null, 4));
		}

		prevPredictValue = predictResult;
		prevTrendStatus = trendStatus;

		// console.log(currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", predictResult, nextPayout);
	}




	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
	fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3X.json', JSON.stringify(TOTAL_BETTING_HISTORY3X, null, 4));
	fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
	// console.log('currentAmount===', currentAmount);
}

// checkResult('e648f452c53db37d11f9e03ca168ba65e9a6cfdcd2f5ef9cef7968346eff87ef', 700);
checkResult('86af6eb270e338932ec030752a7e0dc2758c6aebabe480f94d8fa6857437aed9', 30000);
// checkResult('097f22e974b968188cd71788c78137de6185e03d36a1c01bdf6ca5422a2e7112', 200);
