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
import { checkBettingType2, getBettingTypeTrend, getCurrentTrend2X, getCurrentTrend3X, getPredictResult, getPredictResultFromJson, predictRates } from "./engine.js";

const TOTAL_BETTING_HISTORY1 = require('./TOTAL_BETTING_HISTORY_TEST1.json');
const TOTAL_BETTING_HISTORY2 = require('./TOTAL_BETTING_HISTORY_TEST2.json');
const delay = time => new Promise(res => setTimeout(res, time));


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

	let depositAmount = 1000;

	let initialBet = 0.01;
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

	let currentLoseCounts = [];
	let maxLoseBets = [];
	let loseCount = 0;

	for (let i = 0; i < 30; i++) {
		const betAmount = initialBet;
		initialBets.push(betAmount);
		currentBets.push({
			real: betAmount,
			show: betAmount,
			startBet: betAmount
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


	let payoutCounts = [];

	for (let i = 0; i < 7; i++) {
		payoutCounts.push({
			currentIndex: 1,
			foundPositions: [],
			lastIndex: 0,
		});
	}


	initialBets[0] = 0.001


	for (let i = 0; i < payouts.length; i++) {
		// await delay(100);
		
		let score = 5;
		if (payouts[i] >= 5) {
			score = 5;
		} else {
			score = parseInt(payouts[i])
		}

		console.log("PAYOUT: ", payouts[i], score)

		for (let i = 2; i <= score; i++) {
			payoutCounts[i].foundPositions.push(payoutCounts[i].currentIndex);
			payoutCounts[i].currentIndex = 1;
		}

		for (let i = (score + 1); i < 6; i++) {
			payoutCounts[i].currentIndex = payoutCounts[i].currentIndex + 1;
		}
		payoutCounts.map((p, i) => {
			if ( i < 2 || i > 5) return;

			console.log(i, JSON.stringify(p.foundPositions.slice(-15)), Math.max(...p.foundPositions));
		})
	}

	

}

checkResult('9825f70d35f32030abdd69fa636164cbc55a7f5cafe6ecc7e80db40348e3d6dd', 100000);
