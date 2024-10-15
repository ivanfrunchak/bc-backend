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

const TOTAL_BETTING_HISTORY1 = require('./TOTAL_BETTING_HISTORY_TEST1.json');
const TOTAL_BETTING_HISTORY2 = require('./TOTAL_BETTING_HISTORY_TEST2.json');



let predictRates = [[], [], [], [], [], [], [], [], []]
let predictScores = [[], [], [], [], [], [], [], [], []]
let PAYOUTS = [];


let predictRatesEngine = [[], [], [], [], [], [], [], [], []]
let predictScoresEngine = [[], [], [], [], [], [], [], [], []]


export const getEnginePredictResult = (payouts) => {
	try {
		let train_names = ['good', 'bad', 'mid'];

		let predict2Xs = [];
		if (payouts.length < 20) return predict2Xs;

		for (let i = 0; i < 3; i++) {
			[-2, -3, -4].map((c, j) => {
				const net = new brain.NeuralNetwork();
				const train_str = fs.readFileSync(`./engine_train_${train_names[i]}_${j}.json`);
				net.fromJSON(JSON.parse(train_str));
				const p = net.run(getNormalizedEngineData(payouts.slice(c)));
				predict2Xs.push(p['0']);
			})
		}

		const p2xs = predict2Xs.map(p => getExpectedEngineData(p));

		// console.log("ENGINE PREDICT!", predict2Xs, p2xs);

		return p2xs;
	} catch (err) {
		console.log('ENGINE ERROR', err)
		return [];
	}




}
export const getPredictResult = (payouts, previousTrainJsons, currentTrainJsons) => {
	let train_names = ['good', 'bad', 'mid'];


	let predict2Xs = [];
	let predict3Xs = [];
	for (let i = 0; i < 3; i++) {
		[5,10,15,20,25,30].map((c, j) => {
			const net = new brain.NeuralNetwork();
			const train_str = fs.readFileSync(`./brain_train_2x_${train_names[i]}_${j}.json`);

			const trainJson = currentTrainJsons[i * 3 + j] != null
				? currentTrainJsons[i * 3 + j]
				: (previousTrainJsons != null && previousTrainJsons[i * 3 + j] != null) ?
					previousTrainJsons[i * 3 + j]
					: null

			if (trainJson == null) {
				predict2Xs.push(0.1);
			} else {
				//net.fromJSON(JSON.parse(train_str));
				net.fromJSON(trainJson);
				const p = net.run(getNormalizedPayoutData(payouts.slice(c * -1)));
				predict2Xs.push(p['0']);
			}


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

	const p2xs = predict2Xs.map(p => getExpectedPayoutData(p));

	return p2xs

}

export const getCurrentTrend2X = (payouts) => {

	let sum = 0;
	let plusArray = [];
	let minusArray = [];
	let sumArray = [];
	let prevBust = -1;

	payouts.map(bust => {

		if (bust >= 3) {
			sum += 2;

			if (prevBust == -1) {
				plusArray.push(sum);
			} else if (prevBust >= 3) {
				if (plusArray.length > 0) {
					plusArray[plusArray.length - 1] = sum;
				}
			} else {
				plusArray.push(sum);
			}

		} else {

			if (bust >= 2) {
				sum += 1;
			} else {
				sum -= 1;
			}

			if (prevBust == -1) {
				minusArray.push(sum);
			} else if (prevBust < 3) {
				if (minusArray.length > 0) {
					minusArray[minusArray.length - 1] = sum;
				}
			} else {
				minusArray.push(sum);
			}

		}


		sumArray.push(sum);
		prevBust = bust;
	});


	let yDataSMA = [];
	for (let i = 0; i < sumArray.length; i++) {
		[5,10,15,20,25,30].map((count, index) => {
			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count) {
				yDataSMA[index].push(0);
			} else {
				const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}

	let trendStatus = 2;//'Mid';

	try {
		if ((yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1])
			&& (yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1])) {
			trendStatus = 0 //"GOOD"; // good
		} else if ((yDataSMA[0][yDataSMA[0].length - 1] < yDataSMA[1][yDataSMA[1].length - 1])
			&& (yDataSMA[1][yDataSMA[1].length - 1] < yDataSMA[2][yDataSMA[2].length - 1])) {
			trendStatus = 1 //"BAD"; // bad
		}
	} catch (err) {

	}

	return trendStatus;
}


export const getCurrentTrend3X = (payouts) => {

	let sum = 0;
	let plusArray = [];
	let minusArray = [];
	let sumArray = [];
	let prevBust = -1;

	payouts.map(bust => {

		if (bust >= 3) {
			sum += 2;

			if (prevBust == -1) {
				plusArray.push(sum);
			} else if (prevBust >= 3) {
				if (plusArray.length > 0) {
					plusArray[plusArray.length - 1] = sum;
				}
			} else {
				plusArray.push(sum);
			}

		} else {


			sum -= 1;
			if (prevBust == -1) {
				minusArray.push(sum);
			} else if (prevBust < 3) {
				if (minusArray.length > 0) {
					minusArray[minusArray.length - 1] = sum;
				}
			} else {
				minusArray.push(sum);
			}

		}


		sumArray.push(sum);
		prevBust = bust;
	});


	let yDataSMA = [];
	for (let i = 0; i < sumArray.length; i++) {
		[5,10,15,20,25,30].map((count, index) => {
			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count) {
				yDataSMA[index].push(0);
			} else {
				const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}




	let trendStatus = 2;//'Mid';

	try {
		if ((yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1])
			&& (yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1])) {
			trendStatus = 0 //"GOOD"; // good
		} else if ((yDataSMA[0][yDataSMA[0].length - 1] < yDataSMA[1][yDataSMA[1].length - 1])
			&& (yDataSMA[1][yDataSMA[1].length - 1] < yDataSMA[2][yDataSMA[2].length - 1])) {
			trendStatus = 1 //"BAD"; // bad
		}
	} catch (err) {

	}

	return trendStatus;
}




let currentIndex = -1;
let currentFailedCount = 0;

let isLoseStatus = false;
export const checkBettingType2 = (isRightPrevious, currentTrend2X, currentTrend3X, maxDeep, currentDeep, currentScore, prevResult, nextResult) => {
	const prevPs = [...prevResult];
	const ps = prevPs.map(p => {
		return p >= 2 ? 2 : p;
	})

	// console.log("PS:", ps);

	let nextResult1 = nextResult;
	PAYOUTS.push(currentScore);
	currentScore = currentScore >= 2 ? 2 : 1;


	for (let i = 0; i < ps.length; i++) {
		if (currentScore != ps[i]) {
			predictRates[i].push(0);
		} else {
			predictRates[i].push(1);
		}
		predictScores[i].push(ps[i]);
	}

	const pA = [];

	let maxP = -1000;
	for (let i = 0; i < predictRates.length; i++) {
		const lastPridectRates = predictRates[i].slice(-5);

		if (lastPridectRates.length < 1) {
			return {
				bettingType: 0,
				trendStatus: 0,
				bestScore: null,
				allScore: []
			}
		}
		const pRate = lastPridectRates.reduce((a, b) => a + b, 0) * 100 / 5; //predictRates[i].length;
		pA.push(pRate);
	}
	let isStillValidCurrentIndex = (isRightPrevious || currentIndex == -1) ? false : true;


	let tmpCurrentIndex = -1;
	let goodTrendScoreResult = getGoodTrendScores(nextResult1);

	let bestScores = goodTrendScoreResult.bestScores;
	let selectedBestScore = goodTrendScoreResult.selectedBestScore;


	selectedBestScore = goodTrendScoreResult.selectedBestScore;

	if (selectedBestScore == null) {
		if (bestScores.length > 0) {
			selectedBestScore = bestScores[0];
		}
	}

	tmpCurrentIndex = selectedBestScore != null ? selectedBestScore.index : -1

	console.log("CHANGED GOOD CURRENT INDEX ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", tmpCurrentIndex);


	let skipCount = 0;

	if (!isStillValidCurrentIndex) {
		currentIndex = tmpCurrentIndex;

		if (currentIndex != -1) {
			currentFailedCount = selectedBestScore.failedCount;
		}
	}

	// sort current scores by sma

	if (currentIndex != -1) {
		let failedCount = 0, foundRight = false;
		predictRates[currentIndex].slice(-10).reverse().map(p => {
			if (foundRight) return;
			if (p == 1) {
				foundRight = true;
				return;
			}
			failedCount++;
		})

		console.log(predictRates[currentIndex].slice(-10), predictRates[currentIndex].slice(-10).reverse());
		console.log('FAILED COUNTS', failedCount, currentFailedCount);
	}

	let bestBettingType = 0;
	try {

		if (currentIndex == -1) {
			bestBettingType = 0;
			currentFailedCount = 0;
			// bestBettingType = nextResult1[isStillValidCurrentIndex] >= 2 ? 2 : 1;
		} else {
			bestBettingType = nextResult1[currentIndex] >= 2 ? 2 : 1;
		}

	} catch (err) {

	}

	if (bestBettingType == 0) {
		logWarn("PREDICT~~~~~~~~ NOT SURE")
	} else if (bestBettingType == 2) {
		logSuccess("PREDICT 2X ~~~~~~~~")

	} else if (bestBettingType == 1) {
		logFatal("PREDICT 1X ~~~~~~~~~")
	}

	return {
		bettingType: bestBettingType, //bestScores.length == 0 ? 0 : bestBettingType,
		skipCount: skipCount,
		bettingAvailable: isLoseStatus
	}
}

const getGoodTrendScores = (nextResult1) => {

	const bestScores = [];
	for (let i = 0; i < predictRates.length; i++) {
		const data = predictRates[i].slice(-50);


		const payoutResult = sortValues(data.slice(-20), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		const checkLength = 5
		const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

		const lastValue = data[data.length - 1];

		const vs = pLength.filter((ps, index) => {
			if (lastValue == 0) {
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


		let sum = 0;
		let yData = data.map((row, index) => {
			if (row == 1) {
				sum += 1;
			} else {
				sum -= 1;
			}
			return sum;
		});

		let yDataSMA = [];
		for (let j = 0; j < yData.length; j++) {
			[2, 3, 4].map((count, index) => {
				if (yDataSMA.length < (index + 1)) {
					yDataSMA.push([]);
				}
				if (j < count) {
					yDataSMA[index].push(0);
				} else {
					const v = yData.slice(j - count + 1, j + 1).reduce((a, b) => a + b, 0) / count;
					yDataSMA[index].push(v);
				}
			})
		}

		let trendStatus = 2;
		if (
			yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1]
		) {
			trendStatus = 0 //"GOOD"; // good
		} else if (
			yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[0][yDataSMA[0].length - 1]
		) {
			trendStatus = 1 //"BAD"; // bad
		}

		if ((trendStatus == 0 || trendStatus == 2)) {

			let failedCount = 0, foundRight = false;
			predictRates[i].slice(-3).reverse().map(p => {
				if (foundRight) return;
				if (p == 1) {
					foundRight = true;
					return;
				}

				failedCount++;
			})
			bestScores.push({
				trendStatus: trendStatus,
				index: i,
				maxDeep,
				lastSma2: yDataSMA[0][yDataSMA[0].length - 1],
				lastSma3: yDataSMA[1][yDataSMA[1].length - 1],
				lastSma4: yDataSMA[2][yDataSMA[2].length - 1],
				payout: nextResult1[i],
				rate5: predictRates[i].slice(-5).filter(p => p == 1).length * 100 / predictRates[i].slice(-5).length,
				rate50: predictRates[i].slice(-50).filter(p => p == 1).length * 100 / predictRates[i].slice(-50).length,
				failedCount: failedCount
			});
		}
	}

	bestScores.sort((a, b) => {
		if (a.rate5 == b.rate5) {
			return b.lastSma2 - a.lastSma2;
		} else {
			return b.rate5 - a.rate5;
		}

		// return a.lastSma2 - b.lastSma2;
	});
	// check current index is still avaialbe;
	let selectedBestScore = null, foundBestScore = false;
	bestScores.map(b => {
		if (foundBestScore) return;
		if (b.trendStatus == 0) {
			selectedBestScore = b;
			foundBestScore = true;
			return;
		}
	})

	return {
		bestScores,
		selectedBestScore
	}
}


export const checkResult = (initialHash, counts) => {

	let depositAmount = 10000;

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
	for (let i = 0; i < counts; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		hashes.unshift(hash);
		payouts.unshift(bust);
	}


	let currentBets = [];
	
	let currentLoseCounts = [];
	let maxLoseBets = [];
	let loseCount = 0;

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


	let previousTrainJsons = null;


	for (let i = 100; i < payouts.length - 1; i++) {

		// if (i == 100) {

		// 	console.log('LAST HASH', hashes[i - 1])
		// 	train1({hash: hashes[i-1]}, 20000);
		// }
		// if ((i - 100) % 2 == 0) {
		const currentTrainJsons = train1({ hash: hashes[i - 2] }, 40, false);
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
		const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);


		if (previousTrainJsons == null) {
			previousTrainJsons = currentTrainJsons;
			continue;
		}

		const prevBettingHistory = TOTAL_BETTING_HISTORY1.slice(-100).map(b => b[0])

		if (prevPredictValue == null) {
			console.log('prevPredictValue==', null);
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



		let isEngineRight = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1][0] == 1;



		let { bettingType, trendStatus, bestScore, allScore, skipCount } = checkBettingType2(isEngineRight, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
			, prevPredictValue, predictResult);

		if (bettingType != 0) {
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


			totalAmount = totalAmount - currentBets[loseCount].real;
			if (isRight) {
				totalAmount += currentBets[loseCount].real * 2;
				currentBets[loseCount].real = initialBet;
				currentBets[loseCount].show = initialBet;

				if (loseCount == 0) {
					currentBets[loseCount].show = initialBet;
				}
				loseCount = 0
			} else {
				currentLoseCounts[loseCount].real = currentLoseCounts[loseCount].real + 1;
				currentLoseCounts[loseCount].show = currentLoseCounts[loseCount].show + 1;
				if (currentBets[loseCount].show > maxLoseBets[loseCount].show) {
					maxLoseBets[loseCount].real = currentBets[loseCount].real;
					maxLoseBets[loseCount].show = currentBets[loseCount].show;
				}
				loseCount++;
				if (loseCount > 1) {
					currentBets[loseCount].real = currentBets[loseCount].real * 2;
					currentBets[loseCount].show = currentBets[loseCount].show * 2;
				} else {
					currentBets[loseCount].show = currentBets[loseCount].show * 2;
					currentBets[0].show = currentBets[0].show * 2;
				}
			}
			if (isRight) {
				logSuccess(i - 100, "SCORE:", result, "TOTAL:", totalAmount)
			} else {
				logFatal(i - 100, "SCORE:", result, "TOTAL:", totalAmount)
			}

			if ((currentAmount - currentBets[loseCount]) < 0) {
				logFatal("LOSED ALL", i - 100);
				logTxt = "LOSED ALL: " + i - 100 + '\n';
				break;
			}

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
			logWarn('---------------------------------------------------------------------------------------------------------------------\n')

		}

		prevPredictValue = predictResult;
		prevTrendStatus = trendStatus;

		// console.log(currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", predictResult, result);
	}

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


	// console.log(predictRates);
	let predictCounts = [];

	for (let i = 0; i < predictRates.length; i++) {

		let bH = predictRates[i];

		currentWinCount = 0;
		currentLoseCount = 0;
		maxWinCounts = [];
		maxLoseCounts = [];
		for (let j = 0; j < bH.length; j++) {
			if (bH[j] == 1) {
				maxLoseCounts.push(currentLoseCount);
				currentWinCount++;
				currentLoseCount = 0;
			} else {
				maxWinCounts.push(currentWinCount);
				currentLoseCount++;
				currentWinCount = 0;
			}



		}

		predictCounts.push({
			maxWinCounts, maxLoseCounts
		})

	}


	for (let i = 0; i < predictCounts.length; i++) {
		let loseMap = {};
		predictCounts[i].maxLoseCounts.map(a => {
			if (loseMap[a] == undefined) {
				loseMap[a] = 0;
			}
			loseMap[a] = loseMap[a] + 1;
		});

		console.log(`PREDICT RATES[${i}]`, loseMap)


	}




}


checkResult('9825f70d35f32030abdd69fa636164cbc55a7f5cafe6ecc7e80db40348e3d6dd', 30000);