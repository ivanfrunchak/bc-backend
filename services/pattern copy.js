import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CryptoJS = require("crypto-js");
const fs = require('fs');
import { SERVER_SALT } from "../libs/contants";
import { checkPattern, checkTrendDirection, gameResult, sortValues } from "../libs/utils";
import patternModel, { fetchAll } from "../models/pattern.model";
import { logFatal, logSuccess, logWarn } from "../libs/logging";
import brain from 'brain.js';
import { checkBettingScore, getExpectedPayout, getNormalizedData, getNormalizedData1, getNormalizedPayoutData } from "../libs/aiutils";



let loseHistory = require('../LOSE_AMOUNTS.json') || [];
let SCORES = require('../SCORE.json');
let BETTINGS = require('../BETTINGS.json');
let TIME_DATA = require('../TIME_DATA.json');
let isBetting = false;
let prevFinalTime = 0;


let patterns = [];
let initialized = false;
let initialBet = 2;

let matchedCondition = null;


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
	if (trenball == null || classic == null) return;
	const realBetAmount = Math.round(classic.betAmount + trenball.betAmount);
	if (Math.abs(classic.totalBet - realBetAmount) > 30) {
		logFatal('NOT MATCHED TOTAL BET=========================================', classic.totalBet, realBetAmount);
		runningCrash = false;
		return;
	}

	return;


	const totalBet = Math.round(classic.totalBet);
	const loseAmount = Math.round(classic.totalBet - classic.loseAmount - trenball.loseAmount);
	const trenballLowBet = Math.round(trenball.lowBetAmount);
	const trenballMoonBet = Math.round(trenball.moonBetAmount);
	const trenballHighBet = Math.round(trenball.betAmount - trenball.moonBetAmount - trenball.lowBetAmount);

	//if (prevLoseAmount == (classic.totalBet - classic.loseAmount - trenball.loseAmount) || runningCrash) return;
	if (runningCrash) return;

	runningCrash = true;

	const lastScore = SCORES[SCORES.length - 1];
	lastScore.trenballLowBet = Math.round(trenballLowBet * 100 / realBetAmount);
	lastScore.trenballMoonBet = Math.round(trenballMoonBet * 100 / realBetAmount);
	lastScore.trenballHighBet = Math.round(trenballHighBet * 100 / realBetAmount);


	const net = new brain.NeuralNetwork();
	const BRAIN_NET_STR = fs.readFileSync('./brain_train.json');

	const BRAIN_NET = JSON.parse(BRAIN_NET_STR);
	net.fromJSON(BRAIN_NET);
	const output = net.run(getNormalizedData(lastScore));
	lastScore.aiScore4 = output.nextScore;

	const net1 = new brain.NeuralNetwork();

	const BRAIN_NET1_STR = fs.readFileSync('./brain_train1.json');
	const BRAIN_NET1 = JSON.parse(BRAIN_NET1_STR)
	net1.fromJSON(BRAIN_NET1);
	const output1 = net1.run(getNormalizedData1(lastScore));
	lastScore.aiScore5 = output1.nextScore;


	console.log({
		// totalBet,
		// realBetAmount,
		// loseAmount,
		// trenballLowBet,
		// trenballMoonBet,
		// trenballHighBet,
		aiScore4: lastScore.aiScore4,
		payout4: getExpectedPayout(lastScore.aiScore4),
		aiScore5: lastScore.aiScore5,
		payout5: getExpectedPayout(lastScore.aiScore5),

	})
}

export const getBettings = (start, count) => {

	try {
		const initialHash = SCORES[SCORES.length - 1].hash;
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

	const initialHash = SCORES[SCORES.length - 1].hash;
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

export const handleClosedBetting = (classic, trenball) => {


	if (prevFinalTime != 0) {
		TIME_DATA.push({ SCORE: classic.score, TIME: Date.now() - prevFinalTime });
		fs.writeFileSync('./TIME_DATA.json', JSON.stringify(TIME_DATA, null, 4));
		console.log('DIFF TIME', classic.score, Date.now() - prevFinalTime);
	}
	prevFinalTime = Date.now();

	// const sumResult = getSum(patterns[60]);
	// console.log('SUM RESULT', sumResult);
	const totalBet = Math.round(classic.totalBet);


	let loseAmount = Math.round(classic.totalBet - classic.loseAmount - trenball.loseAmount);
	const trenballLowBet = Math.round(trenball.lowBetAmount);
	const trenballMoonBet = Math.round(trenball.moonBetAmount);
	const trenballHighBet = Math.round(trenball.betAmount - trenball.moonBetAmount - trenball.lowBetAmount);

	const realBetAmount = Math.round(classic.betAmount + trenball.betAmount);

	if (Math.abs(classic.totalBet - realBetAmount) > 30) {
		logWarn('NOT MATCHED TOTAL BET=========================================', classic.totalBet, realBetAmount);
		loseAmount = classic.totalBet > realBetAmount ? classic.totalBet : realBetAmount
	}

	// let's get payouts
	const initialHash = classic.hash;
	let prevHash = null;
	let payouts = [];
	let sum = 0;
	let plusArray = [];
	let minusArray = [];
	let sumArray = [];
	for (let i = 0; i < 60; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		payouts.unshift(bust);
	}

	let prevBust = -1;

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

			plusArray.push(sum);
			// if (prevBust == -1) {
			// 	plusArray.push(sum);
			// } else if (prevBust >= 3) {
			// 	if (plusArray.length > 0) {
			// 		plusArray[plusArray.length - 1] = sum;
			// 	}
			// } else {
			// 	plusArray.push(sum);
			// }

		}
		sumArray.push(sum);
		prevBust = bust;
	});
	let minSum = Math.min(...plusArray);
	let maxSum = Math.max(...minusArray);

	const shortDirection = checkTrendDirection(payouts, payouts.length, -10);
	const longDirection = checkTrendDirection(payouts, payouts.length, -25);
	const longDirection2 = checkTrendDirection(payouts, payouts.length, -40);
	const longDirection3 = checkTrendDirection(payouts, payouts.length, -60);
	const payoutResult = sortValues(payouts, (v) => {
		return v >= 2 ? 1 : 0 // 1 is green, 0 is red
	});

	loseHistory.push(loseAmount);
	fs.writeFileSync('./LOSE_AMOUNTS.json', JSON.stringify(loseHistory, null, 4));
	const loseResult = sortValues(loseHistory, (v) => {
		return v >= 0 ? 1 : 0 // 1 is green, 0 is red
	});


	// let's calc the percentage matching
	let greenPattern, redPattern;
	let currentPattern = payoutResult.values.map(p => p.length).slice(0, 4);
	greenPattern = JSON.parse(JSON.stringify(currentPattern));
	redPattern = JSON.parse(JSON.stringify(currentPattern));
	if (classic.score < 2) {
		// current red
		greenPattern.unshift(1);
		greenPattern.pop();
		//greenPattern[greenPattern.length - 1] = greenPattern[greenPattern.length - 1] >= 4 ? `${greenPattern[greenPattern.length - 1]}+` : greenPattern[greenPattern.length - 1];
		redPattern[0] += 1;
		//redPattern[redPattern.length - 1] = redPattern[redPattern.length - 1] >= 4 ? `${redPattern[redPattern.length - 1]}+` : redPattern[redPattern.length - 1];

	} else {
		// current green
		greenPattern[0] += 1;
		//greenPattern[greenPattern.length - 1] = greenPattern[greenPattern.length - 1] >= 4 ? `${greenPattern[greenPattern.length - 1]}+` : greenPattern[greenPattern.length - 1];
		redPattern.unshift(1);
		redPattern.pop();
		//redPattern[redPattern.length - 1] = redPattern[redPattern.length - 1] >= 4 ? `${redPattern[redPattern.length - 1]}+` : redPattern[redPattern.length - 1];
	}

	greenPattern = greenPattern.map((a, index) => index != 0 && a >= 4 ? `${4}+` : a);
	redPattern = redPattern.map((a, index) => index != 0 && a >= 4 ? `${4}+` : a);


	logFatal('---------------------------------------------------------------------------------')
	console.log({
		score: classic.score,
		hash: classic.hash,
		totalBet,
		realBetAmount,
		loseAmount,
		trenballLowBet,
		trenballMoonBet,
		trenballHighBet,
		greenPattern,
		redPattern
	});
	logFatal('---------------------------------------------------------------------------------')

	let loseCount = 0;
	for (let i = 0; i < loseResult.values.length; i++) {

		loseCount++;
		if (loseCount >= 4) break;
		console.log('+++++++++++++++++++++++++++++++++++')
		for (let j = 0; j < loseResult.values[i].length; j++) {
			if (loseResult.values[i][j] <= 0) {
				logFatal(loseResult.values[i][j])
			} else {
				logSuccess(loseResult.values[i][j])
			}
		}
		console.log('------------------------------------')
	}

	if (loseResult.values.length < 4 || initialized == false) return null;

	const patternData = {
		hash: classic.hash,
		totalBet,
		loseAmount,
		trenballLowBet,
		trenballMoonBet,
		trenballHighBet,
		score: classic.score,
		values: payoutResult.values,
		profits: loseResult.values,
		created: Date.now()
	};


	patterns.push(patternData);

	setTimeout(() => {
		patternModel.create(patternData)
	}, 2000);



	getSum(loseResult.values, false);
	// let's evaluate situation
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

	const rate = calcscoreOfPatternWithLimit(greenPattern, redPattern, loseOf2Deep, totalLoseOf3Deep);

	// console.log({
	// 	loseOf2Deep,
	// 	totalLoseOf3Deep,
	// 	...rate
	// })

	const latestScores = payouts.slice(-4).reverse();


	// let's check what I can do

	// 1. let's check it has 3x score first
	const has3XScore = latestScores.filter(v => v >= 3).length > 0 ? 4 : 0;
	// 2. let's check previous and current 3 block profits
	let loseScore = 0;
	loseScore += (loseOf2Deep < 12000) ? 4 : 0;
	loseScore += totalLoseOf3Deep < 12000 ? 6 : 0; // score 3 is good, 2 is might be they are getting money from user, 

	let bettingScoreOfPattern = rate.scoreOfPatternWithLimit >= 80 ? 4
		: rate.scoreOfPatternWithLimit >= 60 ? 3
			: rate.scoreOfPatternWithLimit >= 40 ? 2 : 0

	let bettingScoreOfPatternWithoutLimit = rate.scoreOfPatternNoLimit >= 80 ? 3
		: rate.scoreOfPatternNoLimit >= 60 ? 2
			: rate.scoreOfPatternNoLimit >= 40 ? 1 : 0

	let bettingScoreOfRateBasedOnLosing = rate.scoreOfPatternWithLose >= 80 ? 2
		: rate.scoreOfPatternWithLose >= 60 ? 1
			: rate.scoreOfPatternWithLose >= 40 ? 0 : 0


	let bettingScore2XRate = rate.win3XRate >= 80 ? 4
		: rate.win3XRate >= 60 ? 3
			: rate.win3XRate >= 38 ? 2 : 0

	// the total score
	let totalScore = loseScore + bettingScoreOfPattern + bettingScoreOfPatternWithoutLimit + bettingScoreOfRateBasedOnLosing + bettingScore2XRate + has3XScore;

	if (SCORES.length != 0) {
		SCORES[SCORES.length - 1].nextScore = classic.score;
	}

	const withLimit3XScores = rate.winScores.filter(s => s > 3);
	const noLimit3XScores = rate.winScores2.filter(s => s > 3);
	const basedOnLosing3XScores = rate.winScoresBasedOnLosing.filter(s => s > 3);

	const x3OfPatternWithLimit = rate.winScores.length == 0 ? 0 : Math.round(withLimit3XScores.length * 100 / rate.winScores.length);
	const x3OfPatternNoLimit = rate.winScores2.length == 0 ? 0 : Math.round(noLimit3XScores.length * 100 / rate.winScores2.length);
	const x3OfPatternWithLose = basedOnLosing3XScores.length == 0 ? 0 : Math.round(basedOnLosing3XScores.length * 100 / rate.winScoresBasedOnLosing.length);



	SCORES.push({
		hash: classic.hash,
		score: classic.score,
		totalScore,
		loseScore,
		bettingScoreOfPattern,
		bettingScoreOfPatternWithoutLimit,
		bettingScoreOfRateBasedOnLosing,
		bettingScore2XRate,
		x3Count: latestScores.filter(v => v >= 3).length,
		scoreOfPatternWithLimit: rate.scoreOfPatternWithLimit,
		win3XRate: rate.win3XRate,
		total3DeepWinCount: rate.total3DeepWinCount,
		scoreOfPatternWithLose: rate.scoreOfPatternWithLose,
		scoreOfPatternNoLimit: rate.scoreOfPatternNoLimit,
		loseOf2Deep,
		totalLoseOf3Deep,
		x3OfPatternWithLimit,
		x3OfPatternNoLimit,
		x3OfPatternWithLose,
		loseAmount,
		bettingCountOfWithLimit: rate.totalBettingCount,
		bettingCountOfNoLimit: rate.totalBettingCountWithoutLimit,
		bettingCountOfLose: rate.totalBettingCountBasedOnLosing,
		payouts: payoutResult.values.map(column => {
			return column.length
		}).join(','),
		shortDirection,
		longDirection,
		created: new Date()
	})

	const net = new brain.NeuralNetwork();
	const BRAIN_NET_STR = fs.readFileSync('./brain_train.json');

	const BRAIN_NET = JSON.parse(BRAIN_NET_STR);
	net.fromJSON(BRAIN_NET);
	const output = net.run(getNormalizedPayoutData(payouts.slice(-10)));
	
	const net1 = new brain.NeuralNetwork();

	const BRAIN_NET1_STR = fs.readFileSync('./brain_train1.json');
	const BRAIN_NET1 = JSON.parse(BRAIN_NET1_STR)
	net1.fromJSON(BRAIN_NET1);
	const output1 = net1.run(getNormalizedPayoutData(payouts.slice(-20)));


	const net3 = new brain.NeuralNetwork();

	const BRAIN_NET3_STR = fs.readFileSync('./brain_train3.json');
	const BRAIN_NET3 = JSON.parse(BRAIN_NET3_STR)
	net3.fromJSON(BRAIN_NET3);
	const output3 = net3.run(getNormalizedPayoutData(payouts.slice(-40)));
	

	console.log({'output' : output, 'output1' : output1, output3});

	// const net = new brain.NeuralNetwork();
	// const BRAIN_NET_STR = fs.readFileSync('./brain_train.json');

	// const BRAIN_NET = JSON.parse(BRAIN_NET_STR);
	// net.fromJSON(BRAIN_NET);
	// const output = net.run(getNormalizedData(SCORES[SCORES.length - 1]));
	// SCORES[SCORES.length - 1].aiScore = output.nextScore;

	// const net1 = new brain.NeuralNetwork();

	// const BRAIN_NET1_STR = fs.readFileSync('./brain_train1.json');
	// const BRAIN_NET1 = JSON.parse(BRAIN_NET1_STR)
	// net1.fromJSON(BRAIN_NET1);
	// const output1 = net1.run(getNormalizedData1(SCORES[SCORES.length - 1]));
	// SCORES[SCORES.length - 1].aiScore2 = output1.nextScore;


	// const net3 = new brain.NeuralNetwork();

	// const BRAIN_NET3_STR = fs.readFileSync('./brain_train3x.json');
	// const BRAIN_NET3 = JSON.parse(BRAIN_NET3_STR)
	// net3.fromJSON(BRAIN_NET3);
	// const output3 = net3.run(getNormalizedData1(SCORES[SCORES.length - 1]));
	// SCORES[SCORES.length - 1].aiScore3x = output3.nextScore;


	SCORES[SCORES.length - 1].aiPayoutScore = {
		p1: output,
		p2: output1,
		p3: output3
	}

	fs.writeFileSync('./SCORE.json', JSON.stringify(SCORES, null, 4));

	logFatal('###############################################################################')
	// console.log('BRAIN NET', BRAIN_NET.layers[1].weights[0], 'BRAIN NET 1', BRAIN_NET1.layers[1].weights[0])
	logSuccess("Scores: ", latestScores.join(', '));
	const x3Counts = latestScores.filter(v => v >= 3).length;

	const maxScore = Math.max(...latestScores);

	const deadScores = [1, 2, 1.1, 1.11, 1.02, 1.01, 1.05, 1.08, 2.1];

	const hasDeadPayout = deadScores.includes(classic.score) || classic.score < 1.2 || (classic.score >= 2 && classic.score < 2.1);


	if (isBetting && BETTINGS.length > 0) {
		BETTINGS[BETTINGS.length - 1].nextScore = classic.score;
		fs.writeFileSync('./BETTINGS.json', JSON.stringify(BETTINGS, null, 4));
	}

	isBetting = false;
	let timeout = -1;
	let payout = 3;



	const currentBetting = SCORES[SCORES.length - 1];
	let isMatched = false;

	const redPatterns = ['2-,2-,4+', '3+r'];
	const greenPatterns = ['1,3+', '3,3'];
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

	const deadRedPatterns = ['2-,2-,4+', '3+r', '2-,4+'];
	const deadGreenPatterns = ['1,3+', '3,3'];


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


	isBetting = false;

	let crashBetting = false;
	let trenball2XBetting = true;
	let trenball1XBetting = false;


	logSuccess("Patterns", greenPattern, redPattern, isMatchedDeadHole, maxScore, shortDirection, longDirection)
	logWarn("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")

	logSuccess("Prev Profit          : ", loseOf2Deep)
	logSuccess("Total Profit         : ", totalLoseOf3Deep, "Lose Amount:   ", loseAmount);
	logSuccess("has3XScore           : ", x3Counts);
	logSuccess("Pattern With Limit   : ", `${rate.scoreOfPatternWithLimit}% / ${x3OfPatternWithLimit}%  -  ${rate.totalBettingCount} / ${withLimit3XScores.join(', ')}`);
	logWarn("Pattern Without Limit: ", `${rate.scoreOfPatternNoLimit}% / ${x3OfPatternNoLimit}% -  ${rate.totalBettingCountWithoutLimit} / ${noLimit3XScores.join(', ')}`)
	logWarn("Based on Losing      : ", `${rate.scoreOfPatternWithLose}% / ${x3OfPatternWithLose}% -  ${rate.totalBettingCountBasedOnLosing} / ${basedOnLosing3XScores.join(', ')}`)
	logFatal("2X Betting           : ", `${rate.win3XRate}%  -  ${rate.total3DeepWinCount}`)
	logFatal("AI SCORE             : ", output[0], output1[0], output3[0])
	logFatal("OUTPUT0             : ", output.join(', '))
	logFatal("OUTPUT1             : ", output1.join(', '))
	logFatal("OUTPUT3             : ", output3.join(', '))
	// logFatal("AI SCORE             : ", output.nextScore, `${getExpectedPayout(output.nextScore)} X`, `${output1.nextScore} / ${getExpectedPayout(output1.nextScore)} X`)
	// if (x3Counts >= 1) {
	// 	logSuccess("AI SCORE 3X          : ", output3.nextScore, `${getExpectedPayout(output3.nextScore)} X`)
	// } else {
	// 	logFatal("AI SCORE 3X          : ", output3.nextScore, `${getExpectedPayout(output3.nextScore)} X`)
	// }
	logSuccess("MIN SUM: ", minSum, "MAX SUM: ", maxSum, "CURRENT SUM: ", sum)

	isBetting = false;
	currentBetting.strategy = undefined;

	const prevPayout = payouts.slice(-12);
	const MOON_STR = fs.readFileSync('./MOON.json');

	isBetting = false;
	currentBetting.strategy = undefined;
	let lastMinusSum = minusArray[minusArray.length - 1];
	let lastMinusSum1 = minusArray[minusArray.length - 2];
	let lastPlus1 = plusArray[plusArray.length - 2];
	let lastPlus0 = plusArray[plusArray.length - 1];
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

	const last3XPoints = getLast3XPoints();

	const key = getPointKey(totalLoseOf3Deep);

	isBetting = false;
	// console.log(minusArray);
	// console.log(cloneArray);
	if (classic.score < 3) {

		if ((lastMinusSum - lastMinusSum1) == 0 || (lastPlus1 == lastMinusSum)) {
			isBetting = true;
			logFatal('CONDITION 1')
		} else {
			if (lastPlus0 >= lastPlus1) {
				if ((lastMinusSum - lastMinusSum1) == 1) {
					isBetting = true;
					logFatal('CONDITION 2')
				}
			} else {
				if (lastMinusSum1 < lastMinusSum2) {
					if ((lastMinusSum - lastMinusSum1) == -1) {
						isBetting = true;
						logFatal('CONDITION 3')
					}
				} else {
					if ((lastMinusSum - lastMinusSum1) == 1) {
						isBetting = true;
						logFatal('CONDITION 4')
					}
				}
			}	
		}
		
		
	}

	// console.log('lastPlus1===', lastPlus1, plusArray);
	console.log({
		score: classic.score, maxMinus, x3Counts, longDirection2, longDirection, shortDirection, longDirection3, isBetting, lastMinusSum, lastMinusSum1, lastPlus1
	})

	

	console.log(JSON.stringify(matchedCondition));

	isBetting = isBetting && x3Counts >= 1;

	logFatal('===============================================================================')
	isBetting && logSuccess("Betting Limit           : ", timeout == -1 ? '3X' : '2X')
	if (isBetting) {
		BETTINGS.push(currentBetting);
		logWarn("STRATEGY: ", currentBetting.strategy);
	}

	if (last3XPoints[key] != undefined) {
		logSuccess(key, JSON.stringify(last3XPoints[key]));
	} else {
		logFatal(key, "NOT DETECTED!");
	}

	
	// const points = Object.keys(last3XPoints);
	// points.map(s => {
	// 	console.log(s, last3XPoints[s]);
	// })
	isBetting && logFatal('===============================================================================')


	return {
		isBetting,
		trenball2XBetting,
		trenball1XBetting,
		timeout,
		payout,
		output: {
			p1: output,
			p2: output1,
			p3: output3
		}
	}


}


export const checkBetting = () => {
	const lastScore = SCORES[SCORES.length - 1];

	// let's get payouts
	const initialHash = lastScore.hash;
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
		const initialHash = SCORES[SCORES.length - 1].hash;
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
		const initialHash = SCORES[SCORES.length - 1].hash;
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