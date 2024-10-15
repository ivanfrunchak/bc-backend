import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { gameResult, sortValues } from "./libs/utils.js";

// let PAYOUTS = require('./payouts.json');
const CryptoJS = require("crypto-js");
const fs = require('fs');
import { logFatal, logSuccess, logWarn } from "./libs/logging.js";
import { exit } from "process";
import { getBettingTypeTrend, checkBettingType2, getCurrentTrend2X, getCurrentTrend3X, getEnginePredictResult, predictRates, setLoseStatus, getLoseStatus, getPredictResult, getPredictResultFromJson, getBadTrendScore, verifyPredict, verifyPredict3 } from "./engine.js";
import { train1 } from "./brain.js";
import { getExpectedEnginData2, getExpectedEngineData } from "./libs/aiutils.js";

const TOTAL_BETTING_HISTORY1 = require('./TOTAL_BETTING_HISTORY_TEST1.json');
const TOTAL_BETTING_HISTORY2 = require('./TOTAL_BETTING_HISTORY_TEST2.json');


const delay = time => new Promise(res => setTimeout(res, time));

const verifiedCodes = [];

export const checkResult = async (initialHash, counts) => {

	let depositAmount = 100000;

	let initialBet = 1;
	let initialBet3X = 0;

	let initialBetLose = 0 * Math.pow(2, 3);

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

	let previousTrainJsons = null;


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


	console.log(payouts.length);

	let errorCount = 0;

	let breakCount = 3;

	for (let i = 100; i < payouts.length - 1; i++) {

		// await delay(1000);
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
		const result = payouts[i];


		console.log("PAYOUTS~~~~~~~~~~~~~", lastPayout, result)


		const currentTrend2X = getCurrentTrend2X(subPayouts);
		const currentTrend3X = getCurrentTrend3X(subPayouts);
		//const predictResult = getPredictResult(subPayouts, previousTrainJsons, currentTrainJsons);
		const predictResult = getPredictResultFromJson(subPayouts);

		const prevBettingHistory = TOTAL_BETTING_HISTORY1.slice(-100).map(b => b[0])
		const enginePredictResult = getEnginePredictResult(prevBettingHistory);


		// if (previousTrainJsons == null) {
		// 	previousTrainJsons = currentTrainJsons;
		// 	continue;
		// }

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

		// if (currentDeep >= 8) {
		// 	console.log(prevPayoutResult.values, lastPayout)
		// }

		let currentPattern = payoutResult.values.map(p => p.length).slice(0, 17);

		let isWinBet = false;

		if (currentBet2X == initialBet) {
			isWinBet = true;
		}

		let isRightEngine = TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1] ? TOTAL_BETTING_HISTORY1[TOTAL_BETTING_HISTORY1.length - 1].isRight == 1 : false;




		// console.log(maxDeep);
		let { isSameLevel, engineTrend, values, entireTrend, realGoodTrend } = getBettingTypeTrend(TOTAL_BETTING_HISTORY1.slice(-50));
		let { bettingType, trendStatus, skipCount, currentIndex, bettingAvailable } = checkBettingType2(isRightEngine, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
			, prevPredictValue, predictResult);



		let isRightPrevious = true;
		let isRightVerified = true;

		let isRightVerified3 = 0;
		try {

			console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$')
			const verifiedResult = verifyPredict(TOTAL_BETTING_HISTORY1.slice(-50), 20);
			const verifiedResult3 = verifyPredict3(predictRates[2].slice(-50), 20);

			isRightVerified3 = verifiedResult3;

			// if (!verifiedCodes.includes(verifiedResult)) {
			// 	verifiedCodes.push(verifiedResult);
			// }

			console.log('BBBBBBBBBBBBBBBBBBBBBBBBBB', verifiedResult, isRightVerified, bettingType)
			isRightVerified = getExpectedEnginData2(verifiedResult);

			console.log('AAAAAAAAAAAAAAA', verifiedResult, isRightVerified, bettingType)
		} catch (err) {
			console.log('SOMETHING ERROR', err);
		}

		// const badBettingType = getBadTrendScore(isRightEngine, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
		// 	, prevPredictValue, predictResult);

		if (isWinBet) {
			setLoseStatus(false);
		}
		if (currentSkipCount == 0) {
			currentSkipCount = skipCount;
		} else {
			currentSkipCount--;
		}


		
		console.log('Skip Count', currentSkipCount);

		fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i), null, 4));

		if (bettingType != 0) {
			const currentTrendPredict = predictResult.slice(currentTrend2X * 3, currentTrend2X * 3 + 3);

			// console.log("LOSE STATUS----------------", getLoseStatus(), badBettingType, bettingAvailable)
			if (getLoseStatus()) {

				// if (badBettingType != 0 && bettingAvailable) {
				// 	bettingType = badBettingType;
				// 	bettingType2 = bettingType;
				// 	bettingAvailable = true;
				// } else {
				// 	bettingAvailable = false;
				// }

			}


			let bettingOrNot = false;

			if (prevPredictEnginValue == null) {
				bettingOrNot = false;
			} else {
				bettingOrNot = bettingAvailable && predictRates[0].length >= 10;
			}

			let isRight = false;

			if (result >= 2 && bettingType == 2) {
				isRight = true;
			} else if (result < 2 && bettingType == 1) {
				isRight = true;
			}

			const bettingData = {
				isRight: isRight ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend,
				entireTrend,
				currentIndex,
				payout: payouts[i]
			};


			let bettingType2 = bettingType;


			let isRight2 = false;


			const trendPosition = entireTrend * 3 + engineTrend;

			// if (isRightEngine == false && !isRightVerified && (entireTrend == 1 || engineTrend == 1)) {
			// 	bettingType2 = bettingType == 2 ? 1 : 2;
			// }

			console.log("RIGHT VERIFIED", isRightVerified, isSameLevel, result);

			// if (isRightVerified == 0) {
			// 	bettingType2 = bettingType == 2 ? 1 : 2;
			// } else if (isRightVerified == -1) {
			// 	if (isRightEngine) {
			// 		bettingType2 = bettingType;
			// 	} else {
			// 		bettingType2 = bettingType == 2 ? 1 : 2;
			// 	}
			// }


			// bettingType2 = predictResult[2];

			//if (isRightVerified == 0) {
				bettingType2 = bettingType == 2 ? 1 : 2;
			//}

			

			if (result >= 2 && bettingType2 == 2) {
				isRight2 = true;
			} else if (result < 2 && bettingType2 == 1) {
				isRight2 = true;
			} else {
				isRight2 = false;
			}




			const bettingData2 = {
				isRight: isRight2 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend,
				entireTrend,
				currentIndex,
				payout: payouts[i]
			};


			prevPredictEnginValue = enginePredictResult;
			// console.log('ENGINE PREDICT: ', enginePredictResult, engineTrend, bettingOrNot);

			// let's check origin engin


			if (isNormalBet) {
				if ((engineTrend == 0 || engineTrend == 2) && entireTrend == 0) {
					// currentBetLose = initialBetLose;
					isNormalBet = false;
				}
			} else {
				if ((engineTrend == 0 || engineTrend == 2) && entireTrend == 0) {
					// currentBetLose = initialBetLose;
					isNormalBet = false;
				} else {
					isNormalBet = true;
				}
			}


			isNormalBet = true;

			if (!bettingOrNot || currentSkipCount > 0) {
				TOTAL_BETTING_HISTORY1.push(bettingData);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
				TOTAL_BETTING_HISTORY2.push(bettingData2);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));

				fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
				continue;
			}

			TOTAL_BETTING_HISTORY1.push(bettingData);
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));

			fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));



			TOTAL_BETTING_HISTORY2.push(bettingData2);
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));

			if (isNormalBet) {
				currentAmount = currentAmount - currentBet2X;
				totalAmount = totalAmount - currentBet2X;
			} else {
				currentAmount = currentAmount - currentBetLose;
				totalAmount = totalAmount - currentBetLose;
				totalLoseAmount += currentBetLose;
			}


			let has3XPayout = subPayouts.slice(-4).filter(p => p >= 3);
			if (bettingType2 == 2 && has3XPayout) {
				currentAmount = currentAmount - currentBet3X;
				totalAmount = totalAmount - currentBet3X;
			}

			bettingHistory.push(isRight ? 1 : 0);
			let loseCount = 0;
			if (bettingHistory[bettingHistory.length - 1] == 0) {
				for (let i = bettingHistory.length - 1; i >= 0; i--) {
					if (bettingHistory[i] == 0) {
						loseCount++;
					} else {
						break;
					}
				}
			}
			// bettingType2 = bettingType;
			if ((result >= 2 && bettingType2 == 2) || (result < 2 && bettingType2 == 1)) {
				logSuccess('RESULT ###################: ', result, "REAL BET TYPE", bettingType2, 'X')
				isRight = true;
			} else {
				isRight = false;
				logFatal('RESULT ###################: ', result, "REAL BET TYPE", bettingType2, 'X')
			}

			if (isRight) {
				let currentBet = currentBet2X;
				if (isNormalBet) {
					currentBet = currentBet2X;
					currentBet2X = initialBet;
				} else {
					currentBet = currentBetLose;
					totalLoseAmount -= currentBetLose * 2;
					if (totalLoseAmount < 0) {
						totalLoseAmount = 0;
					}
					currentBetLose = initialBetLose;

				}
				if (result < 2) {
					currentAmount += parseFloat((currentBet * 1.96).toFixed(5));
					totalAmount += parseFloat((currentBet * 1.96).toFixed(5));
				} else {
					currentAmount += parseFloat((currentBet * 2).toFixed(5));
					totalAmount += parseFloat((currentBet * 2).toFixed(5));
				}


				// realBet2X = initialBet;
				if (bettingType2 == 2) {
					if (result >= x3Payout) {
						currentAmount += parseFloat((currentBet3X * 3).toFixed(5));
						totalAmount += parseFloat((currentBet3X * 3).toFixed(5));
						currentBet3X = initialBet3X;
					} else {
						currentBet3X = currentBet3X * 2;
					}
				}


			} else {
				if (isNormalBet) {
					// if (currentBet2X >= initialBet * Math.pow(2, 3)) {
					// 	// if (bestScore.s < 60) {
					// 	currentBet2X = initialBet;
					// 	totalLoseAmount += initialBet * Math.pow(2, 4)
					// } else {
					// 	currentBet2X = currentBet2X * 2;
					// }

					currentBet2X = currentBet2X * 2;
				} else {
					// if (currentBetLose >= initialBet * Math.pow(2, 4)) {
					// 	// if (bestScore.s < 60) {
					// 	currentBetLose = initialBetLose;
					// 	isNormalBet = true;
					// } else {
					currentBetLose = currentBetLose * 2;

				}
				if (bettingType2 == 2) {
					currentBet3X = currentBet3X * 2;
				}
			}

			// if (currentAmount > depositAmount) {
			// 	currentAmount = depositAmount;
			// }

			currentBet2Xs.push(currentBet2X);
			maxBets2X.push(currentBet2X);

			currentBet3Xs.push(currentBet3X);
			maxBets3X.push(currentBet3X);

			maxBetLose.push(currentBetLose);


			if (isRight) {
				logSuccess(i - 100, "SCORE:", result, "TOTAL LOSE AMOUNT: ", totalLoseAmount, "MAX LOSE BET: ", Math.max(...maxBetLose), "CURRENT AMOUNT:", currentAmount, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "TOTAL:", totalAmount, "TREND 2X:", currentTrend2X, "TREND 3X:", currentTrend3X, 'ENGINE:', engineTrend, 'MAX BET 2X:', Math.max(...maxBets2X), 'CURRENT 3X MAX BET:', Math.max(...currentBet3Xs), 'MAX BET 3X:', Math.max(...maxBets3X))
			} else {
				logFatal(i - 100, "SCORE:", result, "TOTAL LOSE AMOUNT: ", totalLoseAmount, "MAX LOSE BET: ", Math.max(...maxBetLose), "CURRENT AMOUNT:", currentAmount, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "TOTAL:", totalAmount, "TREND 2X:", currentTrend2X, "TREND 3X:", currentTrend3X, 'ENGINE:', engineTrend, 'MAX BET 2X:', Math.max(...maxBets2X), 'CURRENT 3X MAX BET:', Math.max(...currentBet3Xs), 'MAX BET 3X:', Math.max(...maxBets3X))
			}


			// logWarn("VERIFIED CODES", JSON.stringify(verifiedCodes));
			// if (currentBet2X >= initialBet * Math.pow(2, 8)) {
			// 	console.log('512 HASHE', hashes[i + 150]);
			// 	exit(0);
			// }

			// if (isRight) {

			// 	if (!isNormalBet) {
			// 		exit(0);
			// 	}
			// }

			let logTxt = `${i - 100}, SCORE: ${result}, CURRENT AMOUNT: ${currentAmount}, CURRENT 2X BET: ${currentBet2X}, TOTAL: ${totalAmount}, TREND 2X: ${currentTrend2X}, TREND 3X: ${currentTrend3X}, ENGINE: ${engineTrend}, CURRENT MAX BET: ${Math.max(...currentBet2Xs)}, MAX BET: ${Math.max(...maxBets2X)}\n`

			fs.appendFileSync('log.txt', logTxt, function (err) {
				console.log('Saved!');
			});


			//console.log(currentAmount)
			patternHistory.push({ Pattern: currentPattern, values: payoutResult.values, score: loseCount, predicts: predictResult, trendStatus: trendStatus, hash: hashes[i] });
			if ((currentAmount - currentBetLose) < 0) {
				logFatal("LOSED ALL", i - 100);
				logTxt = "LOSED ALL: " + i - 100 + '\n';


				console.log('END HASHE', hashes[i + 150]);
				fs.appendFileSync('log.txt', logTxt, function (err) {
					console.log('Saved!');
				});
				break;
			}

			let maxLoseCounts = [], maxLoseCounts1 = [];
			let maxWinCounts = [], maxWinCounts1 = [];

			let currentLoseCount = 0, currentLoseCount1 = 0;
			let currentWinCount = 0, currentWinCount1 = 0;

			let checkLoseCount = 4, checkLoseCount1 = 4;

			let checkLosePatterns = [];


			for (let i = 0; i < TOTAL_BETTING_HISTORY2.length; i++) {
				if (TOTAL_BETTING_HISTORY2[i].isRight == 1) {
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



			logTxt = `MAX WIN COUNTS: ${Math.max(...maxWinCounts)}, MAX LOSE COUNTS: ${Math.max(...maxLoseCounts)}, LOSE COUNTS: ${JSON.stringify(loseMap)}, TotalBetting Count: ${totalC}\n`
			fs.appendFileSync('log.txt', logTxt, function (err) {
				console.log('Saved!');
			});
			fs.appendFileSync('log.txt', '---------------------------------------------------------------------------------------------------------------------\n', function (err) {
				console.log('Saved!');
			});
			logWarn('---------------------------------------------------------------------------------------------------------------------\n')
			fs.writeFileSync('./LOSE_PATTERNS.json', JSON.stringify(checkLosePatterns, null, 4));
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


checkResult('90067234de303b034b8e9949fb4e7bc60c9783bf0564fd7b8c2435c5cf4894bb', 30000);