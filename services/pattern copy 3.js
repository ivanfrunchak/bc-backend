import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CryptoJS = require("crypto-js");
const fs = require('fs');
import { SERVER_SALT } from "../libs/contants";
import { checkPattern, checkTrendDirection, gameResult, sortValues } from "../libs/utils";
import patternModel, { fetchAll } from "../models/pattern.model";
import { logFatal, logSuccess, logWarn } from "../libs/logging";
import brain from 'brain.js';
import { checkBettingScore, getExpected3XPayoutData, getExpectedPayout, getExpectedPayoutData, getNormalized3XPayoutData, getNormalizedData, getNormalizedData1, getNormalizedPayoutData } from "../libs/aiutils";

import predictRates from '../PREDICTS.json';
import predictScores from '../PREDICTS_SCORES.json';
import PAYOUTS from '../PREDICTS_PAYOUTS.json';
import { train1 } from "../brain";
import { checkBettingType, checkResult, getBettingTypeTrend, getBettingTypeTrend2, getCurrentTrend2X, getCurrentTrend3X, getEnginePredictResult, trainLastPayouts } from "../simulation";
const TOTAL_BETTING_HISTORY1 = require('../TOTAL_BETTING_HISTORY_TEST1.json');

let lastHash = null;
let loseHistory = require('../LOSE_AMOUNTS.json') || [];
let SCORES = require('../SCORE.json');
let BETTINGS = require('../BETTINGS.json');
let TIME_DATA = require('../TIME_DATA.json');
let isBetting = false;
let isRealBetting = false;
let prevFinalTime = 0;


let patterns = [];
let initialized = false;
let initialBet = 0.03;
let initialPayout = 2.8;
let maxAmount = 4;

let isEndTrain = true;

let currentInitialBet = initialBet;

let matchedCondition = null;
let trenball2XBetting = false;
let onlyAfterRed = false;
let trenball1XBetting = false;

let amounts = [];

let treballAmounts = [];

let prevPredictResult2X = null;

let prevPredictResultEngine = null;

let bettingTypes = [];

let bettingType = 0;

let currentPayout = 3;

setTimeout(async () => {
	try {
		patterns = await fetchAll();
		logFatal('patterns===========', patterns.length);
		initialized = true;
	} catch (err) {
		console.log('ERROR====', err);
	}
}, 3000)



export const handleExportLoseAmount = () => {
	fs.writeFileSync('./LOSE_AMOUNTS.json', JSON.stringify(loseHistory, null, 4));
}


let prevLoseAmount = 0;
let runningCrash = false;
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


export const checkPatternRate = (allPayouts) => {
	let prevBust = -1;
	const payouts = allPayouts.slice(-100);
	let minusArray = [], sumArray = [], plusArray = [];
	payouts.map((bust) => {
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
			// if (prevBust != -1 && prevBust < 3) {
			// 	minusArray.push(sum);
			// }
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
		}
		sumArray.push(sum);
		prevBust = bust;
	});

	return {
		minusArray, plusArray, sumArray
	}

}





let totalInvestAmount = 0;
let totalEarnAmount = 0;
let isStop = false;


let currentengineTrend = 0;
let currentEnginValues = [];

let isFirstPayout = true;
let RealBettingType = 0;

export const handleClosedBetting = (classic, trenball) => {


	if (prevFinalTime != 0) {
		TIME_DATA.push({ SCORE: classic.score, TIME: Date.now() - prevFinalTime });
		fs.writeFileSync('./TIME_DATA.json', JSON.stringify(TIME_DATA, null, 4));
		console.log('DIFF TIME', classic.score, Date.now() - prevFinalTime);
	}
	prevFinalTime = Date.now();

	fs.writeFileSync('./lastPayout.json', JSON.stringify({ hash: classic.hash, score: classic.score }));

	if (isFirstPayout) {
		isFirstPayout = false;
		checkResult(classic.hash, 120);
		// trainLastPayouts(classic.hash, 200, 100)
	}

	const initialHash = classic.hash;
	lastHash = classic.hash;
	let amount = classic.amount;
	let prevHash = null;
	let payouts = [];
	let sum = 0;
	let plusArray = [];
	let minusArray = [];
	let sumArray = [];
	for (let i = 0; i < 120; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}

	let prevBust = -1;

	payouts.map((bust) => {

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
		return;
	});

	if (bettingType != 0) {
		let isRight = false;

		if (classic.score >= 2 && bettingType == 2) {
			isRight = true;
		} else if (classic.score < 2 && bettingType == 1) {
			isRight = true;
		} else {
			isRight = false;
		}
		TOTAL_BETTING_HISTORY1.push([isRight ? 1 : 0, isBetting ? 1 : 0, currentengineTrend, currentEnginValues, classic.score, RealBettingType, 0]);
		fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
	}


	let minSum = Math.min(...plusArray);
	let maxSum = Math.max(...minusArray);

	const shortDirection = checkTrendDirection(payouts, payouts.length, -10);
	const longDirection = checkTrendDirection(payouts, payouts.length, -25);
	const payoutResult = sortValues(payouts, (v) => {
		return v >= 2 ? 1 : 0 // 1 is green, 0 is red
	}, 2);

	// let's calc the percentage matching
	let greenPattern, redPattern;
	let currentPattern = payoutResult.values.map(p => p.length).slice(0, 4);

	greenPattern = JSON.parse(JSON.stringify(currentPattern));
	redPattern = JSON.parse(JSON.stringify(currentPattern));
	if (classic.score < 2) {
		// current red
		greenPattern.unshift(1);
		greenPattern.pop();
		redPattern[0] += 1;
	} else {
		// current green
		greenPattern[0] += 1;
		redPattern.unshift(1);
		redPattern.pop();
	}

	greenPattern = greenPattern.map((a, index) => index != 0 && a >= 4 ? `${4}+` : a);
	redPattern = redPattern.map((a, index) => index != 0 && a >= 4 ? `${4}+` : a);


	logFatal('---------------------------------------------------------------------------------')

	const latestScores = payouts.slice(-4).reverse();
	const latestScores3 = payouts.slice(-3).reverse();


	logFatal('###############################################################################')

	const x3Counts = latestScores.filter(v => v >= 3).length;
	const x2Counts = latestScores3.filter(v => v >= 2).length;

	const maxScore = Math.max(...latestScores);


	let timeout = -1;
	let payout = 3;

	let isMatched = false;

	const redPatterns = ['2-,2-,4+', '3+r'];
	const greenPatterns = ['1,3+', '3,3', '3,2-,3'];
	if (classic.score < 2) {
		// need to check with redPatterns
		for (let i = 0; i < redPatterns.length; i++) {
			isMatched = checkPattern(payoutResult.values, {
				deeps: redPatterns[i].split(',')
			}, 3);
			if (isMatched) break;
		}
	} else {
		for (let i = 0; i < greenPatterns.length; i++) {
			isMatched = checkPattern(payoutResult.values, {
				deeps: greenPatterns[i].split(',')
			}, 3);
			if (isMatched) break;
		}
	}

	//const deadRedPatterns = ['2-,2-,4+', '2-,4+', '2,2,1', '6-,3+'];
	//const deadGreenPatterns = [/*'1,3+',*/ '3,3', '1,1,1', '2,1,2'];
	// const deadRedPatterns = ['20-,3+', '20-,10-,3+'];
	// const deadGreenPatterns = ['1,1,1'];


	const deadRedPatterns = ['3+,8-'];
	const deadGreenPatterns = ['3+,8-'];



	let isMatchedDeadHole = false;

	if (classic.score >= 2) {
		for (let i = 0; i < deadGreenPatterns.length; i++) {
			isMatchedDeadHole = checkPattern(payoutResult.values, {
				deeps: deadGreenPatterns[i].split(',')
			}, 3);
			if (isMatchedDeadHole) break;
		}

		if (isMatchedDeadHole) {
			logFatal('GREEN DEADHOLE DETECTED');
		}
	} else {
		for (let i = 0; i < deadRedPatterns.length; i++) {
			isMatchedDeadHole = checkPattern(payoutResult.values, {
				deeps: deadRedPatterns[i].split(',')
			}, 3);
			if (isMatchedDeadHole) break;
		}

		if (isMatchedDeadHole) {
			logFatal('RED PATTERN DEADHOLE DETECTED');
		}
	}

	let is2XUp = false;
	let isReset = false;
	let is2XDown = false;

	let rate = totalInvestAmount > 0 ? totalEarnAmount * 100 / totalInvestAmount : 0;

	console.log('PREV RATE:', totalEarnAmount, totalInvestAmount, rate);

	if (isRealBetting == true) {

		const data = getLatestPayoutBettingType(bettingTypes, payouts);
		const {
			lastBettingType, lastBetting2Type, lastBetting3Type, lastPayoutScore, lastPayout2Score, lastPayout3Score
		} = data;

		if (RealBettingType == 2) { // 2x betting

			console.log('LAST BETTING IS 2X');
			// let's calc score
			if (classic.score < 2) {
				is2XUp = true;
			} else {
				isReset = true;
				currentPayout = initialPayout;
				currentInitialBet = initialBet;
			}
		} else if (RealBettingType == 1) {
			console.log('LAST BETTING IS 1X')
			if (trenball1XBetting) {
				if (classic.score < 2) { // 1x betting
					isReset = true;
					currentPayout = initialPayout;
					currentInitialBet = initialBet;
				} else {
					is2XUp = true;
				}
			}
		} else {

		}

		if (trenball.amount >= maxAmount) {
			isReset = true;
			is2XUp = false;
			is2XDown = false;
			currentPayout = initialPayout;
			currentInitialBet = initialBet;
			totalInvestAmount = 0;
			totalEarnAmount = 0;
			isStop = true;
		}

		// if (lastBettingType == 2) { // 2x betting

		// 	console.log('LAST BETTING IS 2X');

		// 	if (classic.score < 2) {
		// 		is2XUp = true;
		// 	} else if (classic.score >= currentPayout) {
		// 		isReset = true;
		// 		currentPayout = initialPayout;
		// 	} else if (trenball2XBetting == false) {
		// 		is2XUp = true;
		// 	} else if (trenball1XBetting) {
		// 		if ((lastBetting2Type == 2 && lastPayout2Score < initialPayout && lastPayout2Score >= 2)
		// 			&& (lastBetting3Type == 2 && lastPayout3Score < initialPayout && lastPayout3Score >= 2)
		// 		) {
		// 			isReset = true;
		// 			currentPayout = initialPayout;
		// 		} else if ((lastBetting2Type == 1 && lastPayout2Score < 2)) {
		// 			isReset = true;
		// 			currentPayout = initialPayout;
		// 		}
		// 		else if ((lastBetting2Type == 2 && lastPayout2Score < initialPayout && lastPayout2Score >= 2)) {
		// 			is2XDown = true;
		// 		}
		// 	}
		// } else {
		// 	console.log('LAST BETTING IS 1X')
		// 	if (trenball1XBetting) {
		// 		if (classic.score < 2) { // 1x betting

		// 			if (lastBetting2Type == 1 && payouts[payouts.length - 2] < 2) {
		// 				isReset = true;
		// 				currentPayout = initialPayout;
		// 			} else if (lastBetting2Type == 2 && payouts[payouts.length - 2] >= 2) {
		// 				isReset = true;
		// 				currentPayout = initialPayout;
		// 			} else {
		// 				is2XDown = true;
		// 				currentPayout = 2;
		// 			}
		// 		} else {
		// 			is2XUp = true;
		// 		}
		// 	}
		// }
	}


	isBetting = false;

	logSuccess("Patterns", greenPattern, redPattern, isMatchedDeadHole, maxScore, shortDirection, longDirection)
	logWarn("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
	logSuccess("MIN SUM: ", minSum, "MAX SUM: ", maxSum, "CURRENT SUM: ", sum)



	let lastMinusSum = minusArray[minusArray.length - 1];
	let lastMinusSum1 = minusArray[minusArray.length - 2];
	let lastPlus1 = plusArray[plusArray.length - 2];
	let lastPlus0 = plusArray[plusArray.length - 1];
	let lastPlus2 = plusArray[plusArray.length - 3];
	let lastMinusSum2 = minusArray[minusArray.length - 3];
	let lastMinusSum3 = minusArray[minusArray.length - 4];
	let maxMinusSum2 = Math.max(...(minusArray.slice(-2)));
	let maxMinusSum3 = minusArray.length >= 3 ? Math.max(...(minusArray.slice(-3))) : -100000;

	const cloneArray = [...minusArray];
	cloneArray.pop();
	let maxMinus = Math.min(...cloneArray.slice(-60));
	let max4Minus = Math.max(...cloneArray.slice(-4));

	// let's check max and min values
	// check 3x counts


	let yData5SMA = [];
	let yData10SMA = [];
	let yData20SMA = [];


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

	for (let i = 0; i < 3; i++) {
		[5,10,15,20,25,30].map((c, j) => {
			const net = new brain.NeuralNetwork();
			const train_str = fs.readFileSync(`./brain_train_3x_${train_names[i]}_${j}.json`);
			net.fromJSON(JSON.parse(train_str));
			const p = net.run(getNormalized3XPayoutData(payouts.slice(c * -1)));
			predict3Xs.push(p['0']);
		})
	}


	const currentTrend2X = getCurrentTrend2X(payouts.slice(-100));
	const currentTrend3X = getCurrentTrend3X(payouts.slice(-100));


	logFatal("#######################################################################################################")
	logWarn("STATUS: ", currentTrend2X == 0 ? "GOOD" : currentTrend2X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
	logWarn("PREDICT 2X_GOOD", getExpectedPayoutData(predict2Xs[0]), getExpectedPayoutData(predict2Xs[1]), getExpectedPayoutData(predict2Xs[2]), predict2Xs[0], predict2Xs[1], predict2Xs[2]);
	logWarn("PREDICT 2X_BAD", getExpectedPayoutData(predict2Xs[3]), getExpectedPayoutData(predict2Xs[4]), getExpectedPayoutData(predict2Xs[5]), predict2Xs[3], predict2Xs[4], predict2Xs[5]);
	logWarn("PREDICT 2X_MID", getExpectedPayoutData(predict2Xs[6]), getExpectedPayoutData(predict2Xs[7]), getExpectedPayoutData(predict2Xs[8]), predict2Xs[6], predict2Xs[7], predict2Xs[8]);

	logFatal("#######################################################################################################")
	logWarn("STATUS: ", currentTrend3X == 0 ? "GOOD" : currentTrend3X == 1 ? "BAD" : "MIDDLE", "BALANCE: ", classic.balance);
	logWarn("PREDICT 3X_GOOD", getExpected3XPayoutData(predict3Xs[0]), getExpected3XPayoutData(predict3Xs[1]), getExpected3XPayoutData(predict3Xs[2]), predict3Xs[0], predict3Xs[1], predict3Xs[2]);
	logWarn("PREDICT 3X_BAD", getExpected3XPayoutData(predict3Xs[3]), getExpected3XPayoutData(predict3Xs[4]), getExpected3XPayoutData(predict3Xs[5]), predict3Xs[3], predict3Xs[4], predict3Xs[5]);
	logWarn("PREDICT 3X_MID", getExpected3XPayoutData(predict3Xs[6]), getExpected3XPayoutData(predict3Xs[7]), getExpected3XPayoutData(predict3Xs[8]), predict3Xs[6], predict3Xs[7], predict3Xs[8]);


	let diff1 = lastMinusSum - lastMinusSum1;
	let diff2 = lastMinusSum - lastMinusSum2;

	let diff3 = sum - lastMinusSum1;

	let status = 0;

	if (diff1 >= 0 && diff2 >= 0) {
		status = 2;
	} else if (diff1 >= 0 && diff2 < 0) {
		status = 1;
	}

	let x2MoreCount = 0;
	payouts.slice(-10).map(p => {
		if (p >= 2) {
			x2MoreCount++;
		}
	})


	const pLength = payoutResult.values.map(p => p.length).slice(0, 4);

	const vs = pLength.filter((ps, index) => {
		if (classic.score < 2) {
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
	let isPlusCheck = classic.score >= 3
		&& (
			(lastPlus2 <= sum && sum >= lastMinusSum1 && sum >= lastPlus0)
			|| status >= 1
			/*|| ((diff3 == -1 || diff3 == 0) && x2Counts == 1)*/
		);
	let isMinusCheck = classic.score < 3
		&&
		((lastPlus2 > lastPlus0 && (diff1 == 0 || diff1 == -1)) // it means the trend is down
			|| (lastPlus2 <= lastPlus0 && status >= 1) // it means the trend is up!
		)


	// isBetting = (isMinusCheck || isPlusCheck)
	// 	&& x3Counts >= 1
	// 	&& x2Counts >= 1
	// 	&& !isMatchedDeadHole
	// 	/*longDirection >= -7 && */
	// 	&& (onlyAfterRed ? classic.score < 2 : true)

	// // if (maxDeep <= 2 && initialPayout <= 2.01) {
	// // 	isBetting = !isMatchedDeadHole;
	// // }



	amounts.push(amount);
	treballAmounts.push(trenball.amount);
	let currentMaxAmount = Math.max(...amounts);

	let currentTrenballMaxAmount = Math.max(...treballAmounts);

	console.log({
		currentMaxAmount, currentTrenballMaxAmount, onlyAfterRed, initialBet, initialPayout, trenball2XBetting, maxDeep, maxAmount, amount, SMA3: yData5SMA[yData5SMA.length - 1]
		, SMA5: yData10SMA[yData10SMA.length - 1], SMA8: yData20SMA[yData20SMA.length - 1]
	})



	let currentDeep = payoutResult.values[0].length;



	let result = null;
	if (prevPredictResult2X != null) {
		result = checkBettingType(isMatchedDeadHole, currentTrend2X, currentTrend3X, 0, currentDeep, classic.score
			, prevPredictResult2X.map(p => getExpectedPayoutData(p))
			, predict2Xs.map(p => getExpectedPayoutData(p))
		)

		bettingType = result.bettingType;
	}

	let isBettingPoint = false;
	
	if (bettingType != 0) {
		const prevBettingHistory = TOTAL_BETTING_HISTORY1.slice(-100).map(b => b[0])
		const enginePredictResult = getEnginePredictResult(prevBettingHistory);

		let engineTrend = null, values = [], entireTrend = 0;


		
		if (prevPredictResultEngine != null) {
			const engineResult = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-200));

			engineTrend = engineResult.engineTrend;
			values = engineResult.values;
			entireTrend = engineResult.entireTrend;

			currentengineTrend = engineTrend;
			currentEnginValues = values;
			let isRightPrevious = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] ? TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1][0] == 1 : 0;

			const { bettingOrNot,
				bettingType2,
				bettingPoint } = checkEngineScore(bettingType, engineTrend, entireTrend, isRightPrevious, prevPredictResultEngine, enginePredictResult);

			isBetting = bettingOrNot;
			// RealBettingType = bettingType2;

			let bettingType2Trend = getBettingTypeTrend2(TOTAL_BETTING_HISTORY1.slice(-50));
			

			if (bettingType2Trend == 1 || bettingType2Trend == 2) {
				// TOTAL_BETTING_HISTORY2.push([isRight ? 1 : 0, 0, result, bettingType2]);
				// fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));

				isRealBetting = false;
			}

			RealBettingType = bettingType2;

			

		} else {
			prevPredictResultEngine = enginePredictResult;
		}
	}
	console.log("ALL SCORE: ", result);
	bettingTypes.push(bettingType);

	// isBetting = bettingType2 != 0 && bettingOrNot; // && trenball.amount <= maxAmount;



	console.log({
		isBetting, isRealBetting, isBettingPoint, amount, trenballAmount: trenball.amount, maxAmount, x2Counts, currentTrend2X, currentTrend3X
	})

	prevPredictResult2X = predict2Xs;
	return {
		isBetting: isRealBetting,
		bettingType: RealBettingType,
		trenball2XBetting,
		trenball1XBetting,
		timeout,
		payout: currentPayout,
		status,
		is2XUp,
		is2XDown,
		isReset,
		x2Result: predict2Xs,
		initialBet: currentInitialBet
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

const getSum = (values, isRemoveLastElement = false) => {
	const profitHistory = [...values].reverse().flat();

	if (isRemoveLastElement) {
		profitHistory.pop();
	}

	const loseResult = sortValues(profitHistory, (v) => {
		return v >= 0 ? 1 : 0 // 1 is green, 0 is red
	});

	const loseOf2Deep = loseResult.values.length >= 4 && loseResult.values[1] && loseResult.values[1].reduce((accumulator, currentValue) => {
		return accumulator + currentValue
	}, 0);

	let totalLoseOf3Deep = 0;
	for (let i = 0; i < 3; i++) {
		let lva = loseResult.values[i];
		totalLoseOf3Deep += lva.reduce((accumulator, currentValue) => {
			return accumulator + currentValue
		}, 0);
	}

	return {
		loseOf2Deep,
		totalLoseOf3Deep
	}
}
let isPrintedValue = false;

const checkCurrentPattern = () => {

}
const calcscoreOfPatternWithLimit = (greenPattern, redPattern, loseOf2Deep, totalLoseOf3Deep) => {

	// return {
	// 	totalBettingCount: 0,
	// 	totalWinCount: 0,
	// 	totalLoseCount: 0,
	// 	total3DeepWinCount: 0,
	// 	scoreOfPatternWithLimit: 0,
	// 	loseRate: 0,
	// 	win3XRate: 0,
	// 	totalBettingCountWithoutLimit: 0,
	// 	totalWinCountWithoutLimit: 0,
	// 	scoreOfPatternNoLimit: 0,
	// 	loseRateWithoutLimit: 0,
	// 	winScores: [],
	// 	loseScores: [],
	// 	winScores2: [],
	// 	loseScores2: [],
	// 	winScoresBasedOnLosing: [],
	// 	totalBettingCountBasedOnLosing: 0,
	// 	totalWinCountBasedOnLosing: 0,
	// 	totalLoseCountBasedOnLosing: 0,
	// 	scoreOfPatternWithLose: 0,
	// 	loseRateBasedOnLosing: 0
	// }

	let isPrintedGreenPattern = false;
	let isPrintedRedPattern = false;
	let totalBettingCount = 0;
	let totalWinCount = 0;
	let totalLoseCount = 0;
	let total3DeepWinCount = 0;

	let totalBettingCountWithoutLimit = 0;
	let totalWinCountWithoutLimit = 0;
	let totalLoseCountWithoutLimit = 0;
	let total3DeepWinCountWithoutLimit = 0;

	let totalBettingCountBasedOnLosing = 0;
	let totalWinCountBasedOnLosing = 0;
	let totalLoseCountBasedOnLosing = 0;
	let winScoresBasedOnLosing = [];


	let winScores = [];
	let loseScores = [];

	let winScores2 = [];
	let loseScores2 = [];

	if (loseOf2Deep < 6000) {
		loseOf2Deep = loseOf2Deep + 6000;
	} else if (loseOf2Deep > 20000) {
		loseOf2Deep = loseOf2Deep - 6000;
	}

	if (totalLoseOf3Deep < 6000) {
		totalLoseOf3Deep = loseOf2Deep + 6000;
	} else if (totalLoseOf3Deep > 20000) {
		totalLoseOf3Deep = loseOf2Deep - 6000;
	}

	let searchCount = 0;
	for (let i = patterns.length - 2; i >= 0; i--) {
		searchCount++;
		const p = patterns[i];
		const index = i;
		let isMatched = false;

		if (searchCount >= 1000) break;

		const sumResult = getSum(p.profits, true);
		isPrintedValue = true;
		if (p.values[0][0] >= 2) {
			// need to check with greenPattern
			isMatched = checkPattern(p.values, {
				deeps: greenPattern
			});


			if (isMatched) {
				totalWinCountWithoutLimit++;
				winScores2.push(p.score)

				if (sumResult.loseOf2Deep < (loseOf2Deep) && sumResult.totalLoseOf3Deep > (totalLoseOf3Deep)) {
					totalBettingCount++;
					totalWinCount++;
					winScores.push(p.score)
					// isPrintedGreenPattern == false && console.log('MATCHED GREEN PATTERN', greenPattern, p.values)
					isPrintedGreenPattern = true;
				}
			}
		} else {
			isMatched = checkPattern(p.values, {
				deeps: redPattern
			});

			if (isMatched) {
				//isPrintedRedPattern == false && console.log('MATCHED RED PATTERN', redPattern, p.values)
				totalLoseCountWithoutLimit--;
				loseScores2.push(p.score)

				if (sumResult.loseOf2Deep < loseOf2Deep && sumResult.totalLoseOf3Deep > totalLoseOf3Deep) {
					totalBettingCount++;
					totalLoseCount++;
					isPrintedRedPattern = true;
					loseScores.push(p.score)

					// let's get next pattern
					let nextPattern = patterns[index + 1];
					if (nextPattern && nextPattern.score >= 2) {
						total3DeepWinCount++;
					} else {
						let thirdPattern = patterns[index + 2];
						if (thirdPattern && thirdPattern.score >= 2) {
							total3DeepWinCount++;
						}
					}
				}

			}
		}

		if (isMatched) {
			totalBettingCountWithoutLimit++;
		}

		if (sumResult.loseOf2Deep < (loseOf2Deep + 10000) && (sumResult.loseOf2Deep > loseOf2Deep - 10000)
			&& (sumResult.totalLoseOf3Deep > totalLoseOf3Deep - 10000) && (sumResult.totalLoseOf3Deep < totalLoseOf3Deep + 10000)
		) {
			// console.log("SUM RESULT", sumResult.loseOf2Deep, sumResult.totalLoseOf3Deep, p.score)
			totalBettingCountBasedOnLosing++;
			if (p.score >= 2) {
				totalWinCountBasedOnLosing++;
				winScoresBasedOnLosing.push(p.score);
			} else {
				totalLoseCountBasedOnLosing++;
			}
		}
	}
	console.log('totalWinCountWithoutLimit===============', totalWinCountWithoutLimit)

	let scoreOfPatternWithLimit = totalBettingCount == 0 ? 0 : Math.round((totalWinCount * 100) / totalBettingCount);
	let loseRate = 100 - scoreOfPatternWithLimit;
	let win3XRate = (totalBettingCount - totalWinCount) == 0 ? 0 : total3DeepWinCount * 100 / (totalBettingCount - totalWinCount);

	let scoreOfPatternNoLimit = totalBettingCountWithoutLimit == 0 ? 0 : Math.round((totalWinCountWithoutLimit * 100) / totalBettingCountWithoutLimit);
	let loseRateWithoutLimit = 100 - scoreOfPatternNoLimit;


	let scoreOfPatternWithLose = totalBettingCountBasedOnLosing == 0 ? 0 : Math.round((totalWinCountBasedOnLosing * 100) / totalBettingCountBasedOnLosing);
	let loseRateBasedOnLosing = 100 - scoreOfPatternWithLose;

	return {
		totalBettingCount,
		totalWinCount,
		totalLoseCount,
		total3DeepWinCount,
		scoreOfPatternWithLimit,
		loseRate,
		win3XRate,
		totalBettingCountWithoutLimit,
		totalWinCountWithoutLimit,
		scoreOfPatternNoLimit,
		loseRateWithoutLimit,
		winScores,
		loseScores,
		winScores2,
		loseScores2,
		winScoresBasedOnLosing,

		totalBettingCountBasedOnLosing,
		totalWinCountBasedOnLosing,
		totalLoseCountBasedOnLosing,

		scoreOfPatternWithLose,
		loseRateBasedOnLosing

	}
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


	// if (matchedCondition != null) {
	// 	const initialHash = matchedCondition.lastHash;
	// 	let prevHash = null;
	// 	let payouts = [];
	// 	for (let i = 0; i < 200; i++) {
	// 		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
	// 		let bust = gameResult(hash, SERVER_SALT);
	// 		prevHash = hash;
	// 		payouts.unshift(bust);
	// 	}

	// 	return payouts;
	// } else {
	// 	return [];
	// }



	// const initialHash = SCORES[SCORES.length - 10].hash;
	// let prevHash = null;
	// let payouts = [];
	// for (let i = 0; i < 200; i++) {
	// 	let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
	// 	let bust = gameResult(hash, SERVER_SALT);
	// 	prevHash = hash;
	// 	payouts.unshift(bust);
	// }

	// return payouts;


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

const getLast3XPoints = () => {

	const lastScores = SCORES.slice(-60);

	const scores = {};
	lastScores.map(s => {

		if (s.nextScore == undefined) return;
		let total = 0;
		if (s.totalLoseOf3Deep >= 10000) {
			total = Math.floor(s.totalLoseOf3Deep / 10000) * 10000;
		} else if (s.totalLoseOf3Deep >= 1000) {
			total = Math.floor(s.totalLoseOf3Deep / 1000) * 1000;
		} else if (s.totalLoseOf3Deep >= 100) {
			total = Math.floor(s.totalLoseOf3Deep / 100) * 100;
		} else if (s.totalLoseOf3Deep >= 10) {
			total = Math.floor(s.totalLoseOf3Deep / 10) * 10;
		} else if (s.totalLoseOf3Deep >= 0) {
			total = 0;
		} else if (s.totalLoseOf3Deep <= -10000) {
			total = Math.ceil(s.totalLoseOf3Deep / 10000) * 10000;
		} else if (s.totalLoseOf3Deep <= -1000) {
			total = Math.ceil(s.totalLoseOf3Deep / 1000) * 1000;
		} else if (s.totalLoseOf3Deep <= -100) {
			total = Math.ceil(s.totalLoseOf3Deep / 100) * 100;
		} else if (s.totalLoseOf3Deep <= -10) {
			total = Math.ceil(s.totalLoseOf3Deep / 10) * 10;
		}
		if (scores[total] == undefined) {
			scores[total] = {
				lose: 0,
				winX2: 0,
				winX3: 0,
				winX10: 0,
				lastScore: []
			}
		}
		if (s.nextScore >= 10) {
			scores[total].winX10 = (scores[total].winX10 || 0) + 1;
			scores[total].winX3 = (scores[total].winX3 || 0) + 1;
			scores[total].winX2 = (scores[total].winX2 || 0) + 1;
			scores[total].lastScore.push(10)
		} else if (s.nextScore >= 3) {
			scores[total].winX3 = (scores[total].winX3 || 0) + 1;
			scores[total].winX2 = (scores[total].winX2 || 0) + 1;
			scores[total].lastScore.push(3)
		} else if (s.nextScore >= 2) {
			scores[total].winX2 = (scores[total].winX2 || 0) + 1;
			scores[total].lastScore.push(2)
		} else {
			scores[total].lose = (scores[total].lose || 0) + 1;
			scores[total].lastScore.push(0)
		}
	})

	return scores;
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

const getPointKey = (total) => {
	if (total >= 10000) {
		total = Math.floor(total / 10000) * 10000;
	} else if (total >= 1000) {
		total = Math.floor(total / 1000) * 1000;
	} else if (total >= 100) {
		total = Math.floor(total / 100) * 100;
	} else if (total >= 10) {
		total = Math.floor(total / 10) * 10;
	} else if (total >= 0) {
		total = 0;
	} else if (total <= -10000) {
		total = Math.ceil(total / 10000) * 10000;
	} else if (total <= -1000) {
		total = Math.ceil(total / 1000) * 1000;
	} else if (total <= -100) {
		total = Math.ceil(total / 100) * 100;
	} else if (total <= -10) {
		total = Math.ceil(total / 10) * 10;
	}
	return total;
}

export const getLastScore = () => {
	return SCORES[SCORES.length - 1];
}

// const predictRates = [
// 	[],
// 	[],
// 	[],
// 	[],
// 	[],
// 	[],

// ]

// const predictScores = [
// 	[],
// 	[],
// 	[],
// 	[],
// 	[],
// 	[],
// ]

// const PAYOUTS = [
// ]

const getLatestPayoutBettingType = (bettingTypes, payouts) => {

	let lastPayouts = [];
	let lastBettingTypes = [];
	for (let i = 0; i < bettingTypes.length; i++) {
		let bettingType = bettingTypes[bettingTypes.length - (i + 1)];
		let payout = payouts[payouts.length - (i + 1)];

		if (lastPayouts.length >= 3) break;
		if (bettingType != 0) {
			lastBettingTypes.push(bettingType);
			lastPayouts.push(payout)
		}
	}


	return {
		lastBettingType: lastBettingTypes[0],
		lastBetting2Type: lastBettingTypes[1],
		lastBetting3Type: lastBettingTypes[2],
		lastPayoutScore: lastPayouts[0],
		lastPayout2Score: lastPayouts[1],
		lastPayout3Score: lastPayouts[2],
	}
}
const checkMatchingRate = (isMatchedDeadHole, trendStatus, currentScore, p_2x_0_good, p_2x_1_good, output2, p_2x_0_bad, p_2x_1_bad, output2Bad, p_2x_0_mid, p_2x_1_mid, output2Mid, nextResult) => {


	const realTrendStatus = trendStatus

	let p1 = getExpectedPayoutData(p_2x_0_good['0']);
	let p2 = getExpectedPayoutData(p_2x_1_good['0']);
	let p3 = getExpectedPayoutData(output2['0']);
	let p1bad = getExpectedPayoutData(p_2x_0_bad['0']);
	let p2bad = getExpectedPayoutData(p_2x_1_bad['0']);
	let p3bad = getExpectedPayoutData(output2Bad['0']);

	let p1mid = getExpectedPayoutData(p_2x_0_mid['0']);
	let p2mid = getExpectedPayoutData(p_2x_1_mid['0']);
	let p3mid = getExpectedPayoutData(output2Mid['0']);




	p1 = p1 >= 2 ? 2 : p1;
	p2 = p2 >= 2 ? 2 : p2;
	p3 = p3 >= 2 ? 2 : p3;
	p1bad = p1bad >= 2 ? 2 : p1bad;
	p2bad = p2bad >= 2 ? 2 : p2bad;
	p3bad = p3bad >= 2 ? 2 : p3bad;

	p1mid = p1mid >= 2 ? 2 : p1mid;
	p2mid = p2mid >= 2 ? 2 : p2mid;
	p3mid = p3mid >= 2 ? 2 : p3mid;

	let ps = [p1, p2, p3, p1bad, p2bad, p3bad, p1mid, p2mid, p3mid];


	// console.log("PS:", ps);

	PAYOUTS.push(currentScore);
	currentScore = currentScore >= 2 ? 2 : 1;

	let nextResult1 = nextResult.map(p => {
		return p >= 2 ? p : 1
	})



	for (let i = 0; i < ps.length; i++) {
		// predictRates[i].pop();
		// console.log('SCORE', i, currentScore, ps[i]);
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

		// console.log("PREDICT RATE", i, lastPridectRates);
		if (lastPridectRates.length < 5) return 0;
		const pRate = lastPridectRates.reduce((a, b) => a + b, 0) * 100 / 5; //predictRates[i].length;
		pA.push(pRate);

		// if (predictRates[i][predictRates[i].length - 1] == 1 && pRate > maxP) {
		// 	maxP = pRate;
		// }
	}

	fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
	fs.writeFileSync('./PREDICTS_SCORES.json', JSON.stringify(predictScores, null, 4));
	fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(PAYOUTS, null, 4));



	const goodScore = pA.slice(0, 3).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const badScore = pA.slice(3, 6).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const midScore = pA.slice(6, 9).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)


	const totalgoodScore = pA.slice(0, 3).reduce((a, b) => (a + b), 0)
	const totalbadScore = pA.slice(3, 6).reduce((a, b) => (a + b), 0)
	const totalmidScore = pA.slice(6, 9).reduce((a, b) => (a + b), 0)

	let totalPassed = [goodScore, badScore, midScore].filter(a => a >= 120);

	const scoreV = [
		{
			s: goodScore,
			i: 0
		},
		{
			s: badScore,
			i: 1
		},
		{
			s: midScore,
			i: 2
		}
	]

	scoreV.sort((a, b) => {
		return b.s - a.s;
	});

	let realIndexes = [];

	console.log(scoreV, scoreV[0].i == 0 ? "GOOD" : scoreV[0].i == 2 ? "MIDDLE" : "BAD", scoreV[1].i == 0 ? "GOOD" : scoreV[1].i == 2 ? "MIDDLE" : "BAD");

	for (let i = scoreV[0].i * 3; i < scoreV[0].i * 3 + 3; i++) {
		realIndexes.push(i);
	}



	let pA21 = pA.slice(scoreV[0].i * 3, scoreV[0].i * 3 + 3);

	trendStatus = scoreV[1].i;

	if (scoreV[0].i != trendStatus) {
		pA21 = pA21.concat(pA.slice(trendStatus * 3, trendStatus * 3 + 3))

		for (let i = trendStatus * 3; i < trendStatus * 3 + 3; i++) {
			realIndexes.push(i);
		}
	}

	for (let i = 0; i < predictRates.length; i++) {

		if (realIndexes.includes(i)) {

			// console.log('MAXP I', i);
			const lastPridectRates = predictRates[i].slice(-5);
			const pRate = lastPridectRates.reduce((a, b) => a + b, 0) * 100 / 5; //predictRates[i].length;
			if (predictRates[i][predictRates[i].length - 1] == 1 && pRate > maxP) {
				maxP = pRate;
			}
		}

	}


	console.log('pA21===', pA21, scoreV[0].i, trendStatus);

	pA21.sort((a, b) => {
		return b - a;
	})
	let topIndexes = pA21.map((p, index) => {
		if (p >= maxP) {
			return index;
		} else
			return -1;
	});
	let filteredIndexes = topIndexes.filter(i => i != -1);

	if (filteredIndexes.length == 1) {
		maxP = pA21[1];
	}

	let x1Count = 0, x2Count = 0;

	console.log('realIndexes=', maxP, realIndexes);

	for (let i = 0; i < pA.length; i++) {
		if (pA[i] >= maxP && realIndexes.includes(i)) {

			//console.log('SCORE XI:', i);
			const score = 1 * (predictRates[i][predictRates[i].length - 1] == 1 ? 1 : 0.75) * pA[i];
			if (nextResult1[i] < 2) {
				x1Count += score;
			} else {
				x2Count += score;
			}
		}
	}

	topIndexes = pA.map((p, index) => {
		if (p >= maxP) {
			return index;
		} else
			return -1;
	});
	filteredIndexes = topIndexes.filter(i => i != -1);

	let totalPredictRates = [];
	let totalLoseCounts = [];
	for (let i = 0; i < predictRates.length; i++) {
		let winCount = 0;
		const loseCounts = [];
		const winCounts = [];
		let loseCount = 0;
		let maxWinCount = 0;
		predictRates[i].map((p, index) => {

			if (index >= predictRates[i].length - 100) {
				if (p == 1) {
					winCount++;
					maxWinCount++;
					loseCount = 0;
					winCounts.push(maxWinCount);
				}

				if (p == 0) {
					loseCount++;
					maxWinCount = 0;
					loseCounts.push(loseCount);
				}
			}

		})

		const cnt = predictRates[i].length >= 100 ? 100 : predictRates[i].length;
		console.log(i, winCount, cnt, winCount * 100 / cnt, Math.max(...loseCounts), Math.max(...winCounts));
		totalPredictRates[i] = winCount * 100 / cnt;
		totalLoseCounts[i] = Math.max(...loseCounts);
	}

	let minimizedLoseIndexes = [];
	let filteredPredictRates = [];
	totalLoseCounts.map((c, index) => {

		// console.log('C, P', c, totalPredictRates[index]);
		if (totalPredictRates[index] >= 0) {
			minimizedLoseIndexes.push(index);
			filteredPredictRates.push({
				r: totalPredictRates[index],
				l: totalLoseCounts[index],
				i: index,
				p: pA[index]
			})
		}
	});

	filteredPredictRates.sort((a, b) => {
		return b.r - a.r;
	});

	let total2XCounts = 0;
	let total1XCounts = 0;

	for (let i = 0; i < filteredPredictRates.length; i++) {
		if (i >= 3) break;

		if (nextResult1[filteredPredictRates[i].i] >= 2) {
			total2XCounts++;
		} else {
			total1XCounts++;
		}
	}

	console.log("FILTERED: ", filteredPredictRates, total1XCounts, total2XCounts, total1XCounts == total2XCounts ? "NOT SURE" : total1XCounts > total2XCounts ? "1X" : "2X");


	const maxMaxP = Math.max(...pA);
	// console.log(predictRates);
	console.log(pA)
	console.log(maxP, filteredIndexes, x1Count, x2Count);


	// if (
	// 	(nextResult1[0] == 1 && nextResult1[0] == nextResult1[1] && nextResult1[1] == nextResult1[2])
	// 	|| (nextResult1[3] == 1 && nextResult1[3] == nextResult1[4] && nextResult1[4] == nextResult1[5])
	// 	|| (nextResult1[5] == 1 && nextResult1[5] == nextResult1[6] && nextResult1[6] == nextResult1[7])
	// ) {
	// 	logWarn('PREDICT RESULT: DETECTED 1,1,1 pattern', nextResult1);
	// 	return 0;
	// }



	let bettingType = 0;
	if (filteredPredictRates.length < 3) {

		if (total2XCounts == total1XCounts || (filteredPredictRates.length <= 1 && maxP < 80)) {
			logWarn('PREDICT RESULT: NOT DETECTED, THE RATE IS LESS 49');
			return 0;
		} else {
			logWarn('PREDICT RESULT: THE RATE IS LESS 49, BUT WILL BETTING!');
		}

		// if (isMatchedDeadHole) {
		// 	if (currentScore >= 2) {
		// 		return 2;
		// 	} else {
		// 		return 1
		// 	}
		// }

	}

	if (x1Count == x2Count) {
		bettingType = 1;
		if (total2XCounts == total1XCounts) {
			bettingType = 0
		} else if (total2XCounts > total1XCounts) {
			bettingType = 2
		}
		logWarn('PREDICT RESULT: NOT SURE, BUT ', bettingType, 'X');
	} else if (x1Count > x2Count) {
		bettingType = 1;


		// if (realTrendStatus == 0) {
		// 	logFatal('PREDICT RESULT: 1X');

		// } else 
		if (x2Count != 0 && total2XCounts > total1XCounts && maxP < 80) {
			logFatal('PREDICT RESULT: 1X, But 2X');
			bettingType = 2;
		} else {
			logFatal('PREDICT RESULT: 1X');
		}
	} else {
		// GREEN
		bettingType = 2;
		// if (realTrendStatus == 0) { // good
		// 	logSuccess('PREDICT RESULT: 2X');
		// } // middle
		// else 
		if (x1Count != 0 && total1XCounts > total2XCounts && maxP < 80) {
			logFatal('PREDICT RESULT: 2X, But 1X');
			bettingType = 1;
		} else {
			logSuccess('PREDICT RESULT: 2X');
		}

	}


	if (maxP < 60) {
		// if (isMatchedDeadHole) {
		// 	if (currentScore >= 2) {
		// 		return 2;
		// 	} else {
		// 		return 1
		// 	}
		// }

		logWarn('PREDICT RESULT: TOO MUCH MAKE MISTAKE!');

		// bettingType = bettingType == 1 ? 2 : 1 
		return 0;
	}

	if (totalPassed.length < 2) {
		logFatal('REALLY BAD PREDICT ENGINE STATUS');
		return 0;
	}


	let pS0 = nextResult1.slice(scoreV[0].i * 3, scoreV[0].i * 3 + 3);
	let pS1 = nextResult1.slice(scoreV[1].i * 3, scoreV[1].i * 3 + 3);

	console.log('pA0', pS0.join(','))
	console.log('pA1', pS1.join(','))
	if (pS0.join(',') == '1,1,1' || pS1.join(',') == '1,1,1') {
		logWarn('PREDICT RESULT: DETECTED 1,1,1 PATTERN');
		return 0;
	}


	return bettingType;



}

const checkMatchingRate2 = (isToomuchLose, currentTrend2X, currentTrend3X, maxDeep, currentDeep, currentScore, prevResult, nextResult) => {


	const realTrendStatus = currentTrend2X

	const prevPs = [...prevResult];

	const ps = prevPs.map(p => {
		return p >= 2 ? 2 : p;
	})

	// console.log("PS:", ps);

	PAYOUTS.push(currentScore);
	currentScore = currentScore >= 2 ? 2 : 1;

	let next2XCounts = 0;
	let nextResult1 = nextResult.map(p => {
		if (p >= 2) next2XCounts++;
		return p >= 2 ? p : 1
	})
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

		if (lastPridectRates.length < 5) {
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

	const goodScore = pA.slice(0, 3).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const badScore = pA.slice(3, 6).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const midScore = pA.slice(6, 9).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)

	const totalgoodScore = pA.slice(0, 3).reduce((a, b) => (a + b), 0)
	const totalbadScore = pA.slice(3, 6).reduce((a, b) => (a + b), 0)
	const totalmidScore = pA.slice(6, 9).reduce((a, b) => (a + b), 0)



	fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
	fs.writeFileSync('./PREDICTS_SCORES.json', JSON.stringify(predictScores, null, 4));
	fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(PAYOUTS, null, 4));



	const scoreV = [
		{
			s: goodScore,
			i: 0,
			t: totalgoodScore
		},
		{
			s: badScore,
			i: 1,
			t: totalbadScore
		},
		{
			s: midScore,
			i: 2,
			t: totalmidScore
		}
	]
	scoreV.sort((a, b) => {
		return b.t - a.t;
	});


	if (scoreV[0].s == scoreV[1].s) {
		if (scoreV[0].t < scoreV[1].t) {
			let tmp = scoreV[0];
			scoreV[0] = scoreV[1];
			scoreV[1] = tmp;
		}
	}

	let bestTrendStatus = scoreV[0].i;
	let bestTrendPredict = nextResult1.slice(bestTrendStatus * 3, bestTrendStatus * 3 + 3);
	let x2BestCount = 0, x1BestCount = 0;
	bestTrendPredict.map(a => {
		if (a >= 2) {
			x2BestCount++;
		} else {
			x1BestCount++;
		}
	});

	let bestBettingType = 0;

	if (x2BestCount > x1BestCount) {
		bestBettingType = 2;
	} else {
		bestBettingType = 1;
	}

	// if (Math.abs(scoreV[0].t - scoreV[1].t) == 0 && Math.abs(scoreV[1].t - scoreV[2].t) == 0) {
	// 	return {
	// 		bettingType: 0,
	// 		trendStatus: 0,
	// 		bestScore: scoreV[0],
	// 		allScore: scoreV
	// 	}

	// }
	if (Math.abs(scoreV[0].t - scoreV[1].t) == 0) {

		bestTrendStatus = scoreV[1].i;
		bestTrendPredict = nextResult1.slice(bestTrendStatus * 3, bestTrendStatus * 3 + 3);
		x2BestCount = 0, x1BestCount = 0;
		bestTrendPredict.map(a => {
			if (a >= 2) {
				x2BestCount++;
			} else {
				x1BestCount++;
			}
		});

		let bestBettingType1 = 0;

		if (x2BestCount > x1BestCount) {
			bestBettingType1 = 2;
		} else {
			bestBettingType1 = 1;
		}

		if (bestBettingType1 != bestBettingType) {

			logFatal("NOT SURE: BETTING TYPE, ", bestBettingType, 'X, ', bestBettingType1, 'X')
			bestBettingType = currentTrend2X == 0 ? 2 : currentTrend2X == 1 ? 1 : 0;

			if (currentTrend3X == 1 && (currentTrend2X == 1)) {
				bestBettingType = 1;
			} else if (currentTrend3X == 0 && (currentTrend2X == 0)) {
				bestBettingType = 2;
			} else if (currentTrend3X == 2 && (currentTrend2X == 2)) {
				bestBettingType = 1;
			} else if (currentTrend3X == 1 && (currentTrend2X == 2)) {
				bestBettingType = 1;
			}

			// if (isToomuchLose) {
			// 	if (currentTrend3X == 1) {
			// 		bestBettingType = 1;	
			// 	} else if (currentTrend3X == 0) {
			// 		bestBettingType = 2;
			// 	}
			// }
			// bestBettingType = 0;
			// if (currentTrend2X == 2 && currentTrend3X == 1) {
			// 	bestBettingType = 1;
			// }

			// if (currentTrend3X == 1) {
			// 	bestBettingType = 1;
			// }
			logFatal("NOT SURE BUT =================================, ", bestBettingType, 'X')
		}

	}

	// check previous status

	// if (currentDeep >= 2) {
	// 	for (let i = 0; i < 3; i++) {
	// 		const c1 = prevPs.slice(0 * 3, 0 * 3 + 3);

	// 		for (let j = 0; j < 3; j++) {
	// 			const c2 = nextResult1.slice(0 * 3, 0 * 3 + 3);

	// 			if (c1.join(',') == c2.join(',')) {
	// 				if (currentScore < 2) bestBettingType = 1;
	// 				else bestBettingType = 2;

	// 				break;
	// 			}
	// 		}
	// 	}
	// }

	if (bestBettingType == 2) {
		logSuccess("PREDICT RESULT: ", bestBettingType, "X")
	} else {
		logWarn("PREDICT RESULT: ", bestBettingType, "X")
	}

	return {
		bettingType: bestBettingType,
		trendStatus: scoreV[0].i,
		bestScore: scoreV[0],
		allScore: scoreV
	}


}