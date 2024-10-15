import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { gameResult, sortValues } from "./libs/utils.js";

// let PAYOUTS = require('./payouts.json');
const CryptoJS = require("crypto-js");
const fs = require('fs');
import { logDebug, logError, logFatal, logSuccess, logWarn } from "./libs/logging.js";
import { exit } from "process";
import { getBettingTypeTrend, checkBettingType2, getCurrentTrend2X, getCurrentTrend3X, getEnginePredictResult, predictRates, setLoseStatus, getLoseStatus, getPredictResult, getPredictResultFromJson, verifyPredict, verifyPredict3, verifyPredictFromJson, getHighScoreBet2, check1010Pattern, verifyPredictRate, checkSimulation, checkOppositPattern, TOTAL_BETTING_HISTORY1, TOTAL_BETTING_HISTORY2, TOTAL_BETTING_HISTORY3, checkSimulationWithEngine, verifyEngine, checkSimulationWithPredict, checkPatternWithString } from "./engine.js";
import { train1, trainEngine2, trainPredictRate } from "./brain.js";
import { getExpectedEnginData2, getExpectedEngineData } from "./libs/aiutils.js";




const delay = time => new Promise(res => setTimeout(res, time));

const verifiedCodes = [];


let lastBranch = 1;

let deadPoints = [348, 1775, 2677, 2724, 5333, 5910, 6844, 12163, 13093, 13946, 15876, 16785, 18181, 25340, 25452, 28027, 28642];

let currentDeadPoint = 0;


let detectedDeadPoints = [];

export const checkResult = async (initialHash, counts) => {

	let depositAmount = 2000000;

	let initialBet = 1;
	let initialBet3X = 0;

	let initialBet4X = 1 * Math.pow(2, 1);

	let initialBet8X = 1 * Math.pow(2, 2);

	let currentAmount = depositAmount;
	let totalAmount = depositAmount;
	let currentBet2X = initialBet;
	let currentBet4X = initialBet4X;
	let currentBet8X = initialBet8X;


	let currentBetMaxBet2X = initialBet * Math.pow(2, 2);
	let currentBetMaxBet4X = initialBet * Math.pow(2, 5);
	let currentBetMaxBet8X = initialBet * Math.pow(2, 4);

	let isNormalBet = true;


	let profitType = 0; // 0 : normal from start 1, 1: fast grow from start 4, 2: dip model : from start 8

	let realBet2X = initialBet;
	let currentBet3X = initialBet3X;
	let x3Payout = 2.6;

	let total4XBetAmount = 0;
	let total8XBetAmount = 0;

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

	let isStop = false;

	let previousTrainJsons = null;


	let isFoundRightChangePoint = false;


	let prevHash = null;
	let payouts = [];
	let hashes = [];
	for (let i = 0; i < counts; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		hashes.unshift(hash);
		payouts.unshift(bust);
	}


	console.log(payouts.length, hashes[0]);


	let isGoodMatchedEngine = false;

	let errorCount = 0;

	let breakCount = 3;

	let mainBranch = 1;

	let lostCount = 0;

	let tIndex = 0;

	let isChangeFlag = false;
	for (let i = 100; i < payouts.length - 1; i++) {


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


		const currentTrend2X = getCurrentTrend2X(subPayouts);
		const currentTrend3X = getCurrentTrend3X(subPayouts);
		//const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);
		const predictResult = getPredictResultFromJson(subPayouts);


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

		// if (currentDeep >= 8) {
		// 	console.log(prevPayoutResult.values, lastPayout)
		// }

		let currentPattern = payoutResult.values.map(p => p.length).slice(0, 17);

		let isWinBet = false;

		if (currentBet2X == initialBet) {
			isWinBet = true;
		}

		let isRightEngine1 = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] ? TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 1 : false;
		let isRightEngine2 = TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1] ? TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 1 : false;
		let isRightEngine3 = TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1] ? TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 1 : false;

		// console.log(maxDeep);
		//console.log('TREND 1')
		const bettingType1Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-50));
		//console.log('TREND 2')
		const bettingType2Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY2.slice(-50));
		// console.log('TREND 3')
		const bettingType3Trend = getBettingTypeTrend(TOTAL_BETTING_HISTORY3.slice(-50));
		let { bettingType, trendStatus, skipCount, currentIndex, bettingAvailable } = checkBettingType2(prevPredictValue, lastPayout, predictResult);

		let isRightVerified = 1;
		try {
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

			const trainJsons = [];

			[5, 10, 15].map(count => {
				const train_str = fs.readFileSync(`./predict_train_${currentIndex}_${count}.json`);
				const json = JSON.parse(train_str);

				trainJsons.push(json);
			})

			const predictRatesClone = predictRates[currentIndex].slice(-80);
			const bestIndexes = checkSimulationWithPredict(predictRatesClone, trainJsons, [5, 10, 15]);
			const verifiyDatas = [];
			[5, 10, 15].map((count, index) => {
				let verifyData = verifyPredictRate(trainJsons[index], predictRatesClone.slice(count * -1))
				console.log('verifyData===', verifyData)
				verifiyDatas.push(getExpectedEnginData2(verifyData));
			})
			let rightCount = 0, failCount = 0;
			for (let i = 0; i < bestIndexes.length; i++) {
				if (verifiyDatas[bestIndexes[i]] == 1) {
					rightCount++;
				} else {
					failCount++;
				}
			}
			isRightVerified = rightCount > failCount ? 1 : 0;

			

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
			currentSkipCount = skipCount;
		} else {
			currentSkipCount--;
		}


		let bettingType2 = bettingType;
		console.log('Skip Count', currentSkipCount);

		// fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i), null, 4));

		if (bettingType != 0) {
			let bettingOrNot = false;
			console.log("PREDICT RATES LENGTH================================================", predictRates[0].length)
			bettingOrNot = bettingAvailable && predictRates[0].length >= 40;

			let isRight = false;

			if (nextPayout >= 2 && bettingType == 2) {
				isRight = true;
			} else if (nextPayout < 2 && bettingType == 1) {
				isRight = true;
			}

			const bettingData = {
				isRight: isRight ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend: bettingType1Trend ? bettingType1Trend.engineTrend : 1,
				entireTrend: bettingType1Trend ? bettingType1Trend.entireTrend2 : 1,
				currentIndex,
				payout: payouts[i]
			};


			let bettingType2 = bettingType;
			let isRight2 = false;

			if (isRightVerified == 0) {
				bettingType2 = bettingType == 2 ? 1 : 2;
			}


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
				currentIndex,
				payout: payouts[i]
			};
			let bettingType3 = bettingType2;
			let is1010Pattern1 = check1010Pattern(TOTAL_BETTING_HISTORY1.slice(-3).map(p => p.isRight), 1) && bettingType1Trend && bettingType1Trend.entireTrend2 != 1;
			let is1010Pattern2 = check1010Pattern(TOTAL_BETTING_HISTORY2.slice(-3).map(p => p.isRight), 1) && bettingType2Trend && bettingType2Trend.entireTrend2 != 1;
			let is1010Pattern3 = check1010Pattern(TOTAL_BETTING_HISTORY3.slice(-3).map(p => p.isRight), 1);

			let isOppositPattern = checkOppositPattern(TOTAL_BETTING_HISTORY1.slice(-3).map(p => p.isRight), TOTAL_BETTING_HISTORY2.slice(-3).map(p => p.isRight))
			logDebug("1010 PATTERN", JSON.stringify({ is1010Pattern1, is1010Pattern2, is1010Pattern3 }), "OPPOSIT? ", isOppositPattern)

			let current1010Pattern = null;

			let isChangedBranch = false;



			// if (!is1010Pattern3) {

			// 	if (mainBranch == 1 && is1010Pattern1) {
			// 		bettingType3 = bettingType;
			// 	} else if (mainBranch == 2 && is1010Pattern2) {
			// 		bettingType3 = bettingType2;
			// 	} else {

			// 		if (!isOppositPattern) {
			// 			let type = getHighScoreBet2(TOTAL_BETTING_HISTORY1.slice(-10), TOTAL_BETTING_HISTORY2.slice(-10), 6, 4, bettingType1Trend ? bettingType1Trend.entireTrend4 : 0, bettingType2Trend ? bettingType2Trend.entireTrend4 : 0);
			// 			logDebug("CHANGED BRANCH ~~~~~~~~~~~~~", type);
			// 			if (type != mainBranch) {
			// 				isChangedBranch = true;
			// 			}
			// 			mainBranch = type;
			// 		}
			// 	}

			// }

			let currentBettingTypeTrend = bettingType1Trend;
			// mainBranch = 1;

			let percentCount = -10


			// if (currentBet2X > currentBetMaxBet2X) {
			// 	percentCount = -10;
			// }

			// if (maxDeep > 5) {
			// 	percentCount = -5;
			// } else {
			// 	percentCount = (maxDeep + 2) * -1;
			// }
			
			// percentCount = (maxDeep + 3) * -1;


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

			let diff = Math.abs(graph1 - graph2);


			


			// if (diff == 20) {


			if (graph1 > graph2 && diff >= 10) {
				mainBranch = 1;
			} else if (graph1 < graph2 && diff >= 10) {
				mainBranch = 2;
			}

			// if (currentBet2X > currentBetMaxBet2X) {
			// 	if (bettingType1Trend.entireTrend10 == 0) {
			// 		mainBranch = 1;
			// 	} else if (bettingType2Trend.entireTrend10 == 0) {
			// 		mainBranch = 2;
			// 	} else {
			// 		mainBranch = 0;
			// 	}
			// } else {
			// 	mainBranch = 1;
			// }

			

			// if (isOppositPattern) {
			// 	mainBranch = mainBranch == 1 ? 2 : 1;
			// }


			// if (isOppositPattern) {
			// 	let type = getHighScoreBet2(TOTAL_BETTING_HISTORY1.slice(-10), TOTAL_BETTING_HISTORY2.slice(-10), 6, 4, bettingType1Trend ? bettingType1Trend.entireTrend4 : 0, bettingType2Trend ? bettingType2Trend.entireTrend4 : 0);
			// 	logDebug("CHANGED BRANCH ~~~~~~~~~~~~~", type);
			// 	if (type != mainBranch) {
			// 		isChangedBranch = true;
			// 	}
			// 	mainBranch = type;
			// }

			// mainBranch = 1;
			if (mainBranch == 1) {
				bettingType3 = bettingType;
				currentBettingTypeTrend = bettingType1Trend;
				current1010Pattern = is1010Pattern1;
			} else {
				bettingType3 = bettingType2;
				currentBettingTypeTrend = bettingType2Trend;
				current1010Pattern = is1010Pattern2;
			}



			logError("MAIN BRANCH", mainBranch, bettingType3, nextPayout, graph1, graph2);
			let isGoodBetting = true;

			if (bettingType1Trend && bettingType1Trend.entireTrend4 != 1) {
				isGoodBetting = true;
			}


			let isSameFailed = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] && TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 0 && TOTAL_BETTING_HISTORY2[TOTAL_BETTING_HISTORY2.length - 1].isRight == 0
			let lastBettingInfo = TOTAL_BETTING_HISTORY3[TOTAL_BETTING_HISTORY3.length - 1];
			// let's check origin engin
			let isRight3 = false;
			if (nextPayout >= 2 && bettingType3 == 2) {
				isRight3 = true;
			} else if (nextPayout < 2 && bettingType3 == 1) {
				isRight3 = true;
			} else {
				isRight3 = false;
			}

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

			// let isBetting3 = bettingOrNot && (!isSameFailed || is1010Pattern3 || current1010Pattern); //(normalCondition || anotherChangePoint);

			// if (isChangedBranch) {
			// 	isBetting3 = isBetting3 && (normalCondition || anotherChangePoint);
			// }
			// let isBetting3 = bettingOrNot; // && (is1010Pattern3 || current1010Pattern); //(normalCondition || anotherChangePoint);
			let isBetting3 = true; //!isSameFailed;// (normalCondition || anotherChangePoint);
			// let is0010Pattern = checkPatternWithString(TOTAL_BETTING_HISTORY3.slice(-5).map(p => p.isRight), '0,1,0,1,0');
			// let is0010Pattern = false; //check1010Pattern(TOTAL_BETTING_HISTORY3.slice(-3).map(p => p.isRight), 1) && bettingType3Trend && bettingType3Trend.entireTrend2 == 0;

			// if ((graph1 < 50 && graph2 < 50)) {
			// 	isBetting3 = false;
			// }

			// if (isBetting3 == false && (graph1 >= 60 || graph2 >= 60)) {
			// 	isBetting3 = true;
			// } else if ((graph1 == 60 && graph2 == 40) || (graph2 == 60 && graph1 == 40) && !isRightEngine3) {
			// 	// isBetting3 = false;
			// }

			if (mainBranch == 0) {
				isBetting3 = false;
			}

			isBetting3 = isBetting3;

			// if (TOTAL_BETTING_HISTORY3.slice(-4).filter(p => p.isRight == 0).length == 4) {
			// 	isBetting3 = false;
			// 	bettingOrNot = false;
			// }


			const bettingData3 = {
				isRight: isRight3 ? 1 : 0,
				betOrNot: bettingOrNot && isBetting3, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType3Trend ? bettingType3Trend.engineTrend : 1,
				entireTrend: bettingType3Trend ? bettingType3Trend.entireTrend2 : 1,
				currentIndex,
				payout: payouts[i]
			};
			bettingOrNot = bettingData3.betOrNot;
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


			if (bettingType3Trend) {
				console.log("Trend 10:", bettingType3Trend.entireTrend10, bettingType3Trend.entireTrend2, bettingType3Trend.engineTrend, ", TREND 2: ", currentBettingTypeTrend.entireTrend10, currentBettingTypeTrend.entireTrend2, currentBettingTypeTrend.engineTrend)
				// let's check current graph status
				if (
					(bettingType3Trend && bettingType3Trend.entireTrend10 != 1 && (bettingType3Trend.entireTrend2 == 0 || is1010Pattern3))
					//|| (currentBettingTypeTrend && currentBettingTypeTrend.entireTrend10 != 1 && (currentBettingTypeTrend.entireTrend2 == 0 || current1010Pattern))
					// (bettingType3Trend && /*bettingType3Trend.entireTrend10 != 1 && */bettingType3Trend.entireTrend2 != 1 && bettingType3Trend.engineTrend != 1)
					// || (currentBettingTypeTrend && /*currentBettingTypeTrend.entireTrend10 != 1  && */currentBettingTypeTrend.entireTrend2 != 1 && currentBettingTypeTrend.engineTrend != 1)
				) {
					// really good status
					profitType = loseArray[0].type;
				} else if (bettingType3Trend && (bettingType3Trend.entireTrend2 == 0 || is1010Pattern3)) {
					if (currentBet4X > currentBet2X) {
						if (currentBet4X >= currentBetMaxBet4X) {
							if (bettingType3Trend.entireTrend10 != 1 && bettingType3Trend.entireTrend2 != 1) {
								profitType = 1;
							} else {
								profitType = 0;
							}
						} else {
							profitType = 1;
						}
					}
				}
			}

			// if (currentBet2X > currentBetMaxBet2X) {
			// 	if (bettingType3Trend.engineTrend != 1 && bettingType3Trend.entireTrend2 == 0) {
			// 		bettingData3.betOrNot = true;
			// 		isBetting3 = true;
			// 		bettingOrNot = true;
			// 	} else {
			// 		bettingData3.betOrNot = false;
			// 		isBetting3 = false;
			// 		bettingOrNot = false;
			// 	}
			// }



			// isNormalBet = true;
			if (!bettingOrNot || currentSkipCount > 0) {
				TOTAL_BETTING_HISTORY1.push(bettingData);
				TOTAL_BETTING_HISTORY2.push(bettingData2);
				TOTAL_BETTING_HISTORY3.push(bettingData3);
				continue;
			}

			TOTAL_BETTING_HISTORY1.push(bettingData);
			TOTAL_BETTING_HISTORY2.push(bettingData2);
			TOTAL_BETTING_HISTORY3.push(bettingData3);


			if ((i - 100) >= 10000000 /*(deadPoints[currentDeadPoint] - 20)*/) {

				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
				fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
				// await delay(2000);
			}

			// if ((i - 100) == deadPoints[currentDeadPoint]) {
			// 	currentDeadPoint++;
			// }


			profitType = 0;
			switch (profitType) {
				case 0: {
					currentAmount = currentAmount - currentBet2X;
					totalAmount = totalAmount - currentBet2X;
					break;
				}
				case 1: {
					currentAmount = currentAmount - currentBet4X;
					totalAmount = totalAmount - currentBet4X;
					total4XBetAmount += currentBet4X;
					break;
				}
				case 2: {
					currentAmount = currentAmount - currentBet8X;
					totalAmount = totalAmount - currentBet8X;
					total8XBetAmount += currentBet8X;
					break;
				}
			}

			// let has3XPayout = subPayouts.slice(-4).filter(p => p >= 3);
			// if (bettingType3 == 2 && has3XPayout) {
			// 	currentAmount = currentAmount - currentBet3X;
			// 	totalAmount = totalAmount - currentBet3X;
			// }

			bettingHistory.push(isRight ? 1 : 0);

			// bettingType3 = bettingType;
			if (isRight3) {
				logSuccess('RESULT ###################: ', nextPayout, "REAL BET TYPE", bettingType3, 'X')
			} else {
				logFatal('RESULT ###################: ', nextPayout, "REAL BET TYPE", bettingType3, 'X')
			}

			if (isRight3) {
				if (bettingType == bettingType3) {
					isGoodMatchedEngine = true;
					console.log("ENGINE IS GOOD~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
				} else {
					isGoodMatchedEngine = false;
				}
				let currentBet = currentBet2X;

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


				// realBet2X = initialBet;
				if (bettingType3 == 2) {
					if (nextPayout >= x3Payout) {
						currentAmount += parseFloat((currentBet3X * 3).toFixed(5));
						totalAmount += parseFloat((currentBet3X * 3).toFixed(5));
						currentBet3X = initialBet3X;
					} else {
						currentBet3X = currentBet3X * 2;
					}
				}
				lostCount = 0;

			} else {
				lostCount++;
				let currentBet = 0;
				switch (profitType) {
					case 0: {
						// if (currentBet2X >= initialBet * Math.pow(2, 5)) {
						// 	setLoseStatus(true);
						// 	currentBet2X = initialBet;
						// } else {
						// 	setLoseStatus(false);
						// 	currentBet2X = currentBet2X * 2;
						// 	currentBet = currentBet2X;
						// }

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

				if (bettingType3 == 2) {
					currentBet3X = currentBet3X * 2;
				}

				if ((currentAmount - currentBet) < 0) {
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


			if (isRight3) {
				logSuccess(i - 100, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "4X BET: ", currentBet4X, "8X BET: ", currentBet8X);
				logSuccess(i - 100, 'MAX 2X:', Math.max(...maxBets2X), 'MAX 3X:', Math.max(...maxBets3X), 'MAX 4X:', Math.max(...maxBets4X), 'MAX 8X:', Math.max(...maxBets8X));
				logSuccess(i - 100, "SCORE:", nextPayout, "TOTAL:", totalAmount, "TOTAL 4X:", total4XBetAmount, "TOTAL 8X:", total8XBetAmount);
			} else {
				logFatal(i - 100, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "4X BET: ", currentBet4X, "8X BET: ", currentBet8X);
				logFatal(i - 100, 'MAX 2X:', Math.max(...maxBets2X), 'MAX 3X:', Math.max(...maxBets3X), 'MAX 4X:', Math.max(...maxBets4X), 'MAX 8X:', Math.max(...maxBets8X));
				logFatal(i - 100, "SCORE:", nextPayout, "TOTAL:", totalAmount, "TOTAL 4X:", total4XBetAmount);
			}


			// logWarn("VERIFIED CODES", JSON.stringify(verifiedCodes));
			if (currentBet2X >= initialBet * Math.pow(2, 10)) {
				console.log('512 HASHE', hashes[i + 150]);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
				fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));


				detectedDeadPoints.push(i - 100);

				currentBet2X = initialBet;
				await delay(10000);
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
}

// checkResult('e648f452c53db37d11f9e03ca168ba65e9a6cfdcd2f5ef9cef7968346eff87ef', 700);
checkResult('86af6eb270e338932ec030752a7e0dc2758c6aebabe480f94d8fa6857437aed9', 30000);
// checkResult('097f22e974b968188cd71788c78137de6185e03d36a1c01bdf6ca5422a2e7112', 200);
