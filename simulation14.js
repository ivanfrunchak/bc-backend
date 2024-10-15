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

	initialBets[1] = 0;
	initialBets[2] = 0;
	initialBets[3] = 4;
	initialBets[5] = 0;
	initialBets[6] = 5;
	initialBets[7] = 0;
	initialBets[8] = 0;



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


	let x2Map = {};
	let currentWinCount = 0;
	for (let i = 0; i < payouts.length; i++) {
		
		if (payouts[i] < 2) {
			currentWinCount++;
		} else {

			if (x2Map[currentWinCount] == undefined) {
				x2Map[currentWinCount] = 0;
			}
			x2Map[currentWinCount] = x2Map[currentWinCount] + 1
			currentWinCount = 0;
		}

		if ((i % 4000) == 0) {
			console.log(i, x2Map);
			currentWinCount = 0;
			x2Map = {};
		}

	}
	

	
}

// checkResult('e648f452c53db37d11f9e03ca168ba65e9a6cfdcd2f5ef9cef7968346eff87ef', 700);
checkResult('86af6eb270e338932ec030752a7e0dc2758c6aebabe480f94d8fa6857437aed9', 30000);
// checkResult('097f22e974b968188cd71788c78137de6185e03d36a1c01bdf6ca5422a2e7112', 200);
