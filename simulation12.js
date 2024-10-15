import { createRequire } from "module";
import { logFatal, logSuccess, logWarn } from "./libs/logging.js";
const require = createRequire(import.meta.url);

const TOTAL_BETTING_HISTORY1 = require('./TOTAL_BETTING_HISTORY_TEST1.json');
const TOTAL_BETTING_HISTORY2 = require('./TOTAL_BETTING_HISTORY_TEST2.json');
const TOTAL_BETTING_HISTORY3 = require('./TOTAL_BETTING_HISTORY_TEST3.json');
const TOTAL_BETTING_HISTORY4 = require('./TOTAL_BETTING_HISTORY_TEST4.json');
const TOTAL_BETTING_HISTORY = require('./TOTAL_BETTING_HISTORY_TEST.json');

const PREDICTS = require('./PREDICTS.json');



const checkPredictRates = () => {



	PREDICTS.map((p, branchId) => {

		logFatal('----------------------------------------------------------')
		logWarn("BRANCH: ", branchId);
		let maxLoseCounts = [];
		let maxLosePayouts = [];
		let maxWinCounts = [];

		let currentLoseCount = 0;

		const data = p.slice(-300000);
		for (let i = 0; i < data.length; i++) {
			if (data[i].isRight == 1) {
				maxLoseCounts.push(currentLoseCount);
				maxLosePayouts.push(data.slice(i - currentLoseCount - 0, i).map(p => {
					return p.payout >= 2 ? 1 : 0
					// return {
					// 	p: p.payout >= 2 ? 1 : 0,
					// 	a: p.isRight ? 1 : 0
					// }

				}).slice(0, 12));
				currentLoseCount = 0;
			} else {
				currentLoseCount++;

			}
		}
		console.log("MAX LOSE", Math.max(...maxLoseCounts));

		let loseMap = {};
		maxLoseCounts.map((a, index) => {
			if (loseMap[a] == undefined) {
				loseMap[a] = 0;
			}
			loseMap[a] = loseMap[a] + 1;


			if (a >= 3 && branchId == 0) {

				logSuccess("COUNTS: ", a, "PATOUTS: ", JSON.stringify(maxLosePayouts[index]));

			}
		});

		const keys = Object.keys(loseMap);

		let totalC = 0;
		for (let i = 0; i < keys.length; i++) {
			let c = parseInt(keys[i]) + 1;
			totalC += c * loseMap[keys[i]];
		}
		console.log(branchId, Math.max(...maxWinCounts), Math.max(...maxLoseCounts), loseMap, totalC)
	})




}



const checkTotalBettingHistory = () => {

	let maxLoseCounts = [];
	let maxWinCounts = [];
	let maxLosePayouts = [];
	let currentLoseCount = 0;

	const data = TOTAL_BETTING_HISTORY1.slice(-300000);
	for (let i = 0; i < data.length; i++) {
		if (data[i].betOrNot == false || data[i].betOrNot == 0) continue;

		if (data[i].isRight == 1) {
			maxLoseCounts.push(currentLoseCount);
			maxLosePayouts.push(data.slice(i - currentLoseCount - 0, i).map(p => {
				return p.payout >= 2 ? 1 : 0
				// return {
				// 	p: p.payout >= 2 ? 1 : 0,
				// 	a: p.isRight ? 1 : 0
				// }

			}).slice(0, 12));
			currentLoseCount = 0;


		} else {
			currentLoseCount++;
		}

	}
	console.log("MAX LOSE", Math.max(...maxLoseCounts));

	let loseMap = {};
	maxLoseCounts.map((a, index) => {
		if (loseMap[a] == undefined) {
			loseMap[a] = 0;
		}
		loseMap[a] = loseMap[a] + 1;
		if (a >= 8) {

			logSuccess("COUNTS: ", a, "PATOUTS: ", JSON.stringify(maxLosePayouts[index]));

		}

	});

	const keys = Object.keys(loseMap);

	let totalC = 0;
	for (let i = 0; i < keys.length; i++) {
		let c = parseInt(keys[i]) + 1;
		totalC += c * loseMap[keys[i]];
	}
	console.log(Math.max(...maxWinCounts), Math.max(...maxLoseCounts), loseMap, totalC)
}


const checkTotalBettingHistory2 = () => {



	const data = PREDICTS[7].slice(-300000);

	// for (let i = 0; i < PREDICTS[0].length; i++) {
	// 	const predicts = [];
	// 	for (let j = 0; j < PREDICTS.length; j++) {

	// 		console.log(PREDICTS[j][i]);
	// 		if (PREDICTS[j][i] >= 2) {
	// 			predicts.push(2)
	// 		} else {
	// 			predicts.push(1)
	// 		}
	// 	}

	// 	console.log({i, predicts});
	// }
	PREDICTS.map((data, index) => {
		let x2Count = 0;
		let x1Count = 0;

		let winCount = 0;
		let loseCount = 0;

		let maxLoseCounts = [];
		let maxWinCounts = [];

		let currentLoseCount = 0;

		for (let i = 0; i < data.length; i++) {
			if (data[i].bettingType == 2) {
				x2Count++;
			} else {
				x1Count++;
			}

			if (data[i].isRight == 1) {
				winCount++;
				maxLoseCounts.push(currentLoseCount);
				currentLoseCount = 0;
			} else {
				currentLoseCount++;
				loseCount++;
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

		console.log('````````````````````````````````````````````````````````````````````````')
		console.log(Math.max(...maxLoseCounts), totalC, JSON.stringify(loseMap))

		console.log({ index, x2Count, x1Count, WinP: x2Count * 100 / (x2Count + x1Count) });
		console.log({ winCount, loseCount, WinP: winCount * 100 / (winCount + loseCount) });
		console.log('````````````````````````````````````````````````````````````````````````')
	})



}


const checkTotalBettingHistory3 = () => {

	let winCount = 0;
	let loseCount = 0;

	const data = TOTAL_BETTING_HISTORY1.slice(-300000);
	for (let i = 0; i < data.length; i++) {
		if (data[i].betOrNot == false || data[i].betOrNot == 0) continue;

		if (data[i].isRight == 1) {
			winCount++;
		} else {
			loseCount++;
		}

	}
	console.log({ winCount, loseCount, WinP: winCount * 100 / (winCount + loseCount) });


}

const checkScores = () => {

	const scores = [];
	PREDICTS.map((data, index) => {
		let x2Count = 0;
		let x1Count = 0;

		let winCount = 0;
		let loseCount = 0;

		let maxLoseCounts = [];
		let maxWinCounts = [];

		let currentLoseCount = 0;


		let scoreArray = [];
		for (let i = 0; i < data.length; i++) {
			// console.log(data[i]);

			if (scoreArray.includes(data[i].score)) {

			} else {
				scoreArray.push(data[i].score);
			}
			if (data[i].score >= 0.7 && data[i].score <= 1) {
				if (data[i].payout > 2) {
					winCount++;
					maxLoseCounts.push(currentLoseCount);
					currentLoseCount = 0;
				} else {
					currentLoseCount++;
					loseCount++;
				}
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

		scores.push({
			index, winCount, loseCount, WinP: (winCount + loseCount) == 0 ? 0 : winCount * 100 / (winCount + loseCount), length: scoreArray.length
		})

		// console.log('````````````````````````````````````````````````````````````````````````')
		// console.log(index, Math.max(...maxLoseCounts), totalC, JSON.stringify(loseMap))

		// console.log({ index, x2Count, x1Count, WinP: x2Count * 100 / (x2Count + x1Count) });
		// console.log({ index, winCount, loseCount, WinP: winCount * 100 / (winCount + loseCount) });
		// console.log('````````````````````````````````````````````````````````````````````````')
	})

	scores.sort((a, b) => {
		return b.WinP - a.WinP
	});

	scores.map(s => {
		console.log(JSON.stringify(s));
		console.log('`````````````````````````````````````````````````````````````````');
	})

}


const test = () => {

	let yData = [0, 1]
	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4].map((count, index) => {


			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count - 1) {
				yDataSMA[index].push(0);
			} else {
				const v = yData.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}

	console.log(yDataSMA);
}

test();
//checkTotalBettingHistory();
// checkPredictRates();

// checkScores();