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

const TOTAL_BETTING_HISTORY = require('./TOTAL_BETTING_HISTORY_TEST.json');
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
export const getPredictResult = (payouts) => {
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


export const getBettingTypeTrend2 = (result) => {

	if (result.length < 10) return 1; // bad trend
	let sum = 0;
	let prevBust = -1;
	let plusArray = [];
	let minusArray = [];
	let yData = result.filter((row) => (row[1] == 1)).map((row, index) => {

		let isRight = false;
		if ((row[4] < 2 && row[5] == 1) || (row[4] >= 2 && row[5] == 2)) {
			isRight = true;
		}


		// console.log('row[4]====', row[4], row, isRight);
		if (isRight) {
			sum += 1;
			if (prevBust == -1) {
				plusArray.push(sum);
			} else if (prevBust == 1) {
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
			} else if (prevBust == 0) {
				if (minusArray.length > 0) {
					minusArray[minusArray.length - 1] = sum;
				}
			} else {
				minusArray.push(sum);
			}

		}
		prevBust = row[0];
		return sum;
	});

	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4].map((count, index) => {
			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count) {
				yDataSMA[index].push(0);
			} else {
				const v = yData.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}


	let trendStatus = 2;//'Mid';
	try {
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

		console.log("YDATA SMA", yDataSMA[0][yDataSMA[0].length - 1], yDataSMA[1][yDataSMA[1].length - 1], yDataSMA[2][yDataSMA[2].length - 1])

	}

	catch (err) {

	}



	return trendStatus;

}


export const getBettingTypeTrend = (result) => {

	if (result.length < 10) return 1; // bad trend
	let sum = 0;
	let prevBust = -1;
	let plusArray = [];
	let minusArray = [];
	let yData = result.map((row, index) => {
		if (row[0] == 1) {
			sum += 1;
			if (prevBust == -1) {
				plusArray.push(sum);
			} else if (prevBust == 1) {
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
			} else if (prevBust == 0) {
				if (minusArray.length > 0) {
					minusArray[minusArray.length - 1] = sum;
				}
			} else {
				minusArray.push(sum);
			}

		}
		prevBust = row[0];
		return sum;
	});


	sum = 0;
	prevBust = -1;
	let plusArray1 = [];
	let minusArray1 = [];
	let yData1 = result.slice(-15).map((row, index) => {
		if (row[0] == 1) {
			sum += 1;
			if (prevBust == -1) {
				plusArray1.push(sum);
			} else if (prevBust == 1) {
				if (plusArray1.length > 0) {
					plusArray1[plusArray1.length - 1] = sum;
				}
			} else {
				plusArray1.push(sum);
			}

		} else {
			sum -= 1;
			if (prevBust == -1) {
				minusArray1.push(sum);
			} else if (prevBust == 0) {
				if (minusArray1.length > 0) {
					minusArray1[minusArray1.length - 1] = sum;
				}
			} else {
				minusArray1.push(sum);
			}

		}
		prevBust = row[0];
		return sum;
	});

	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count) {
				yDataSMA[index].push(0);
			} else {
				const v = yData.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}


	sum = 0;
	let yData2 = result.map((row, index) => {
		// if (row[1] == 0) {
		// } else 
		if ((row[4] < 2 && row[5] == 1) || (row[4] >= 2 && row[5] == 2)) {
			sum += 1;
		} else {
			sum -= 1;
		}
		return sum;
	});

	let yDataSMA2 = [];
	for (let i = 0; i < yData2.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
			if (yDataSMA2.length < (index + 1)) {
				yDataSMA2.push([]);
			}
			if (i < count) {
				yDataSMA2[index].push(0);
			} else {
				const v = yData2.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA2[index].push(v);
			}
		})
	}


	let trendStatus = 2;//'Mid';
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


	const lastData = result[result.length - 1];
	if (lastData[0] == 0 && trendStatus == 0) {
		trendStatus = 2;
	}

	// if (trendStatus == 2 && lastData[0] == 1) {
	// 	trendStatus = 0;
	// }
	let smaEntireTrend = 2; // bad
	// if (
	// 	yDataSMA[0][yDataSMA[0].length - 1] >= yDataSMA[3][yDataSMA[3].length - 1]
	// 	|| Math.abs(yDataSMA[0][yDataSMA[0].length - 1] - yDataSMA[3][yDataSMA[3].length - 1]) <= 1
	// ) {
	// 	entireTrend = 0; // good
	// }

	if (
		yDataSMA2[0][yDataSMA2[0].length - 1] > yDataSMA2[1][yDataSMA2[1].length - 1]
		&& yDataSMA2[1][yDataSMA2[1].length - 1] >= yDataSMA2[2][yDataSMA2[2].length - 1]
	) {
		smaEntireTrend = 0 //"GOOD"; // good
	} else if (
		yDataSMA2[2][yDataSMA2[2].length - 1] >= yDataSMA2[1][yDataSMA2[1].length - 1]
		&& yDataSMA2[1][yDataSMA2[1].length - 1] > yDataSMA2[0][yDataSMA2[0].length - 1]
	) {
		smaEntireTrend = 1 //"BAD"; // bad
	}




	let entireTrend = 2;

	let minusArrayTrend = 2;
	let plusArrayTrend = 2;
	try {
		if (minusArray[minusArray.length - 1] > minusArray[minusArray.length - 3]) {
			minusArrayTrend = 0;
		} else if (minusArray[minusArray.length - 1] < minusArray[minusArray.length - 3]) {
			minusArrayTrend = 1;
		}

		if (plusArray[plusArray.length - 1] > plusArray[plusArray.length - 3]) {
			plusArrayTrend = 0;
		} else if (plusArray[plusArray.length - 1] < plusArray[plusArray.length - 3]) {
			plusArrayTrend = 1;
		}
	} catch (err) {

	}

	let minusArrayTrend1 = 2;
	let plusArrayTrend1 = 2;
	try {
		if (minusArray1[minusArray1.length - 1] > minusArray1[minusArray1.length - 3]) {
			minusArrayTrend1 = 0;
		} else if (minusArray1[minusArray1.length - 1] < minusArray1[minusArray1.length - 3]) {
			minusArrayTrend1 = 1;
		}

		if (plusArray1[plusArray1.length - 1] > plusArray1[plusArray1.length - 3]) {
			plusArrayTrend1 = 0;
		} else if (plusArray1[plusArray1.length - 1] < plusArray1[plusArray1.length - 3]) {
			plusArrayTrend1 = 1;
		}
	} catch (err) {

	}


	if (minusArrayTrend == 2 && plusArrayTrend == 2) {
		entireTrend = 2;
	} else if ((minusArrayTrend == 0 && minusArrayTrend1 == 0) || plusArrayTrend == 0) {
		entireTrend = 0;
	} else if (minusArrayTrend == 1 && plusArrayTrend == 1) {
		entireTrend = 1;
	} else {
		entireTrend = 2;
	}



	// if (trendStatus == 0) {
	// 	entireTrend = 0;
	// }


	// if (yDataSMA2[0][yDataSMA2[0].length - 1] == yDataSMA2[0][yDataSMA2[0].length - 2]) {
	// 	entireTrend = 2;
	// } else if (yDataSMA2[1][yDataSMA2[1].length - 1] == yDataSMA2[1][yDataSMA2[1].length - 2]) {
	// 	entireTrend = 2;
	// }

	// if (yDataSMA[0][yDataSMA[0].length - 1] == yDataSMA[0][yDataSMA[0].length - 2]) {
	// 	trendStatus = 2;
	// } else if (yDataSMA[2][yDataSMA[2].length - 1] == yDataSMA[2][yDataSMA[2].length - 2]) {
	// 	trendStatus = 2;
	// }


	// if (yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[2][yDataSMA[2].length - 2]) {
	// 	trendStatus = 0;
	// } else if (trendStatus != 0 && yDataSMA[2][yDataSMA[2].length - 1] < yDataSMA[2][yDataSMA[2].length - 2]) {
	// 	trendStatus = 1;
	// } else {

	// }


	return {
		engineTrend: trendStatus,
		entireTrend,
		values: [yDataSMA[0][yDataSMA[0].length - 1], yDataSMA[1][yDataSMA[1].length - 1], yDataSMA[2][yDataSMA[2].length - 1], yDataSMA[3][yDataSMA[3].length - 1]]
	}
}


export const getCurrentEngineBettingPointTrend = (result) => {

	if (result.length < 10) return 1; // bad trend
	let sum = 0;
	let yData = result.map((row, index) => {
		if (row == 1) {
			sum += 1;
		} else {
			sum -= 1;
		}
		return sum;
	});

	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4].map((count, index) => {
			if (yDataSMA.length < (index + 1)) {
				yDataSMA.push([]);
			}
			if (i < count) {
				yDataSMA[index].push(0);
			} else {
				const v = yData.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA[index].push(v);
			}
		})
	}
	let trendStatus = 2;//'Mid';
	if (
		yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[2][yDataSMA[2].length - 1]
	) {
		trendStatus = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[0][yDataSMA[0].length - 1]
	) {
		trendStatus = 1 //"BAD"; // bad
	}

	return {
		engineTrend: trendStatus,
		values: [yDataSMA[0][yDataSMA[0].length - 1], yDataSMA[1][yDataSMA[1].length - 1], yDataSMA[2][yDataSMA[2].length - 1]]
	}
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



export const checkEngineScore = (bettingType, currentTrend, entireTrend, isRight, prevResult, nextResult) => {

	// if (currentTrend == 1) return false;

	// if (isRight) return true;

	if (nextResult.length == 0) return false;

	// if (isRight == false) return false;

	let isChangedTrend = false;
	if (currentTrend == 1 && isRight == true) {
		isChangedTrend = true;
		// currentTrend = 2; // middle
		// return {
		// 	bettingOrNot: false,
		// 	bettingType2: bettingType
		// };
	} else if (currentTrend == 0 && isRight == false) {
		isChangedTrend = true;
		// currentTrend = 2; // middle
		// return {
		// 	bettingOrNot: false,
		// 	bettingType2: bettingType == 1 ? 2 : 1
		// };
	}

	const ps = [...prevResult];

	let currentScore = isRight ? 1 : 0;
	let nextResult1 = nextResult;

	for (let i = 0; i < ps.length; i++) {
		if (currentScore != ps[i]) {
			predictRatesEngine[i].push(0);
		} else {
			predictRatesEngine[i].push(1);
		}
		predictScoresEngine[i].push(ps[i]);
	}
	const pA = [];

	for (let i = 0; i < predictRatesEngine.length; i++) {
		const lastPridectRates = predictRatesEngine[i].slice(-5);

		if (lastPridectRates.length < 1) {
			return false;
		}
		const pRate = lastPridectRates.reduce((a, b) => a + b, 0) * 100 / 5; //predictRatesEngine[i].length;
		pA.push(pRate);
	}

	const goodScore = pA.slice(0, 3).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const badScore = pA.slice(3, 6).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)
	const midScore = pA.slice(6, 9).reduce((a, b) => (a >= 60 ? a : 0) + (b >= 60 ? b : 0), 0)

	const totalgoodScore = pA.slice(0, 3).reduce((a, b) => (a + b), 0)
	const totalbadScore = pA.slice(3, 6).reduce((a, b) => (a + b), 0)
	const totalmidScore = pA.slice(6, 9).reduce((a, b) => (a + b), 0)

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
		if (a == 1) {
			x2BestCount++;
		} else {
			x1BestCount++;
		}
	});

	let bettingPointType = 0;

	if (x2BestCount > x1BestCount) {
		bettingPointType = 1;
	} else {
		bettingPointType = 0;
	}

	// if (Math.abs(scoreV[0].t - scoreV[1].t) == 0) {

	// 	bestTrendStatus = scoreV[1].i;
	// 	bestTrendPredict = nextResult1.slice(bestTrendStatus * 3, bestTrendStatus * 3 + 3);
	// 	x2BestCount = 0, x1BestCount = 0;
	// 	bestTrendPredict.map(a => {
	// 		if (a >= 2) {
	// 			x2BestCount++;
	// 		} else {
	// 			x1BestCount++;
	// 		}
	// 	});

	// 	let bettingPointType1 = 0;

	// 	if (x2BestCount > x1BestCount) {
	// 		bettingPointType1 = 1;
	// 	} else {
	// 		bettingPointType1 = 0;
	// 	}

	// 	if (bettingPointType1 != bettingPointType) {
	// 		return {
	// 			bettingOrNot: false,
	// 			bettingType2: bettingType,
	// 			bettingPoint: bettingPointType,
	// 		};
	// 	}
	// }

	// if (bettingPointType == 1) {
	// 	logSuccess("GOOD POINT TO BET: ", bettingPointType, "X")
	// } else {
	// 	logWarn("BAD POINT TO BET: ", bettingPointType, "X")
	// }

	const history = TOTAL_BETTING_HISTORY.slice(-100).map(p => {
		if (p[0] == 1 && p[6] == 1) return 1;
		//if (p[0] == 0 && p[6] == 0) return 1;

		return 0;
	})


	const currentEnginPoint = getCurrentEngineBettingPointTrend(history);

	//if (!isChangedTrend) {
	if (currentTrend == 0) {
		return {
			bettingOrNot: true,
			bettingType2: bettingType,
			bettingPoint: bettingPointType,
		};
	}
	else if (currentTrend == 1) {
		return {
			bettingOrNot: true,
			bettingType2: bettingType == 1 ? 2 : 1,
			bettingPoint: bettingPointType,
		};
	}
	// }

	let bettingType2 = bettingType;
	return {
		bettingOrNot: true, //currentEnginPoint.engineTrend == 0,
		bettingType2: bettingType, /*bettingType2,*/
		bettingPoint: bettingPointType
	};



}

export const checkBettingType = (isToomuchLose, currentTrend2X, currentTrend3X, maxDeep, currentDeep, currentScore, prevResult, nextResult) => {
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
	if (currentDeep >= 2) {
		for (let i = 0; i < 3; i++) {
			const c1 = prevPs.slice(i * 3, i * 3 + 3);

			for (let j = 0; j < 3; j++) {
				const c2 = nextResult1.slice(j * 3, j * 3 + 3);

				if (c1.join(',') == c2.join(',')) {
					if (currentScore < 2) bestBettingType = 1;
					else bestBettingType = 2;

					break;
				}
			}
		}
	}

	if (bestBettingType == 2) {
		logSuccess("PREDICT RESULT: ", bestBettingType, "X")
	} else {
		logWarn("PREDICT RESULT: ", bestBettingType, "X")
	}


	fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));

	return {
		bettingType: bestBettingType,
		trendStatus: scoreV[0].i,
		bestScore: scoreV[0],
		allScore: scoreV
	}

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
		// console.log(i, winCount, cnt, winCount * 100 / cnt, Math.max(...loseCounts), Math.max(...winCounts));
		totalPredictRates[i] = winCount * 100 / cnt;
		totalLoseCounts[i] = Math.max(...loseCounts);
	}

	let minimizedLoseIndexes = [];
	let filteredPredictRates = [];
	totalLoseCounts.map((c, index) => {
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
	const maxMaxP = Math.max(...pA);
	let bettingType = 0;

	if (filteredPredictRates.length < 3) {
		logWarn('PREDICT RESULT: NOT DETECTED, THE RATE IS LESS 49');
		return 0;
	}

	const currentTrendPredict = nextResult1.slice(trendStatus * 3, trendStatus * 3 + 3);
	const currentPredictRate = pA.slice(trendStatus * 3, trendStatus * 3 + 3);

	const currentPredicts = predictRates.slice(trendStatus * 3, trendStatus * 3 + 3);

	const maxRate = Math.max(...currentPredictRate);

	if (maxRate < 40) return 0;

	//console.log(maxRate, currentTrendPredict, currentPredictRate);

	let x2Count = 0, x1Count = 0;
	currentTrendPredict.map((a, i) => {

		const lastSuccess = currentPredicts[i][currentPredicts[i].length - 1];
		const score = currentPredictRate[i] * (lastSuccess == 0 ? 0.2 : 1);


		if (a >= 2) {
			x2Count += score;
		} else {
			x1Count += score;
			// x1Count++;
		}
	})

	if (trendStatus == 0) {
		x2Count = x2Count * 1.3;
	} else if (trendStatus == 1) {
		x1Count = x1Count * 1.8;
	}
	if (x1Count == x2Count) {
		bettingType = 1;
		if (total2XCounts == total1XCounts) {
			bettingType = 0
		} else if (total2XCounts > total1XCounts) {
			bettingType = 2
		}
		// logWarn('PREDICT RESULT: NOT SURE, BUT ', bettingType, 'X');
	} else if (x1Count > x2Count) {
		bettingType = 1;

		if (maxDeep <= 2) {
			bettingType = 2;
		}
		// if (realTrendStatus == 0) {
		// 	logFatal('PREDICT RESULT: 1X');

		// } else 
		// if (x2Count != 0 && total2XCounts > total1XCounts && maxP < 80) {
		// 	logFatal('PREDICT RESULT: 1X, But 2X');
		// 	bettingType = 2;
		// } else {
		//	logFatal('PREDICT RESULT: 1X');
		// }
	} else {
		// GREEN
		bettingType = 2;
		// if (realTrendStatus == 0) { // good
		// 	logSuccess('PREDICT RESULT: 2X');
		// } // middle
		// else 
		// if (x1Count != 0 && total1XCounts > total2XCounts && maxP < 80) {
		// 	logFatal('PREDICT RESULT: 2X, But 1X');
		// 	bettingType = 1;
		// } else {
		//	logSuccess('PREDICT RESULT: 2X');
		// }

	}

	return bettingType;
}


let currentIndex = -1;
let currentFailedCount = 0;

let isLoseStatus = false;
export const checkBettingType2 = (isRightPrevious, currentTrend2X, currentTrend3X, maxDeep, currentDeep, currentScore, prevResult, nextResult) => {
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

			logFatal("NOT SURE BUT =================================, ", bestBettingType, 'X')
		}
	}
	// check previous status
	// if (currentDeep >= 2) {
	// 	for (let i = 0; i < 3; i++) {
	// 		const c1 = prevPs.slice(i * 3, i * 3 + 3);

	// 		for (let j = 0; j < 3; j++) {
	// 			const c2 = nextResult1.slice(j * 3, j * 3 + 3);

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


	fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));

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


		// if (!isLoseStatus) {
		if ((failedCount - currentFailedCount) >= 2) {

			// tmpCurrentIndex = -1;
			// let badTrendScoreResult = getBadTrendScores(nextResult1);

			// bestScores = badTrendScoreResult.bestScores;
			// selectedBestScore = badTrendScoreResult.selectedBestScore;

			// if (selectedBestScore == null) {
			// 	if (bestScores.length > 0) {
			// 		selectedBestScore = bestScores[0];
			// 	}
			// }

			// tmpCurrentIndex = selectedBestScore != null ? selectedBestScore.index : -1


			// console.log("CHANGED BAD CURRENT INDEX ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", tmpCurrentIndex);

			// currentFailedCount = 0;

			// if (currentIndex == tmpCurrentIndex) {
			// 	currentIndex = -1
			// } else {
			// 	currentIndex = tmpCurrentIndex;
			// 	if (currentIndex != -1) {
			// 		currentFailedCount = selectedBestScore.failedCount;
			// 	}
			// }

			// skipCount = 0;
			// currentIndex = -1;
			// currentFailedCount = 0;
			isLoseStatus = true;

			// let's check it's same layer
			// let sameLayers = [];
			// if (currentIndex >= 0 && currentIndex < 3) {
			// 	sameLayers = [0, 1, 2]
			// } else if (currentIndex >= 3 && currentIndex < 6) {
			// 	sameLayers = [3, 4, 5]
			// } else if (currentIndex >= 6 && currentIndex < 9) {
			// 	sameLayers = [6, 7, 8]
			// } 

			// let has80PScore = bestScores.filter(b => b.rate5 >= 80).length > 0 ? true : false;
			// const tmpBestScores = bestScores.filter(b => !sameLayers.includes(b.index));
			// console.log('has80PScore====', has80PScore);
			// if (has80PScore == false || tmpBestScores.length == 0) {
			// 	currentIndex = -1;
			// 	currentFailedCount = 0;
			// } else {
			// 	currentIndex = tmpBestScores[0].index;
			// 	currentFailedCount = tmpBestScores[0].failedCount;
			// }
			if (tmpCurrentIndex != -1 && currentIndex != tmpCurrentIndex) {
				currentIndex = tmpCurrentIndex;
				currentFailedCount = selectedBestScore.failedCount;
			}
		}
		// } else {
		// 	if (tmpCurrentIndex != -1 && currentIndex != tmpCurrentIndex) {
		// 		currentIndex = tmpCurrentIndex;
		// 		currentFailedCount = selectedBestScore.failedCount;
		// 	}
		// }

	}


	console.log('BEST SCORES', bestScores, isStillValidCurrentIndex, currentIndex, nextResult1);
	bestBettingType = 0;
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
		trendStatus: scoreV[0].i,
		bestScore: scoreV[0],
		allScore: scoreV,
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

		console.log(`MAX DEEP ${i}`, maxDeep, lastValue, pLength);
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
			console.log("TREND STATUS: ", i, trendStatus)

			if (trendStatus == 1) {
				exit(0);
			}
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

const getBadTrendScores = (nextResult1) => {

	let bestScores = [];
	for (let i = 0; i < predictRates.length; i++) {
		const data = predictRates[i].slice(-50);


		const payoutResult = sortValues(data.slice(-20), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		let pLength = payoutResult.values.map(p => p.length).slice(0, 2);

		let lastValue = data[data.length - 1];

		let vs = pLength.filter((ps, index) => {
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

		pLength = payoutResult.values.map(p => p.length).slice(0, 5);

		lastValue = data[data.length - 1];

		vs = pLength.filter((ps, index) => {
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


		let maxDeep1 = Math.max(...vs);
		console.log(`MAX DEEP ${i}`, maxDeep, lastValue, pLength);
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

		if ((trendStatus == 0 || trendStatus == 2) && maxDeep <= 2 /* && predictRates[i][predictRates[i].length - 1] == 1*/) {
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
				maxDeep1,
				lastSma2: yDataSMA[0][yDataSMA[0].length - 1],
				lastSma3: yDataSMA[1][yDataSMA[1].length - 1],
				lastSma4: yDataSMA[2][yDataSMA[2].length - 1],
				payout: nextResult1[i],
				failedCount: failedCount
			});
		}
	}

	bestScores.sort((a, b) => {
		// return b.lastSma2 - a.lastSma2;
		return b.maxDeep1 - a.maxDeep1;
		// return b.failedCount - a.failedCount;
		// return a.lastSma2 - b.lastSma2;
	});

	bestScores.slice(0, 3).sort((a, b) => {
		// return b.lastSma2 - a.lastSma2;
		return b.failedCount - a.failedCount;
		// return b.failedCount - a.failedCount;
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
export const trainLastPayouts = (initialHash, count, trainCount) => {

	let prevHash = null;
	let payouts = [];
	let hashes = [];
	for (let i = 0; i <= count + trainCount; i++) {
		let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
		let bust = gameResult(hash, SERVER_SALT);
		prevHash = hash;
		hashes.unshift(hash);
		payouts.unshift(bust);
	}

	for (let i = count; i < payouts.length - 1; i++) {

		// if (i == 100) {

		// 	console.log('LAST HASH', hashes[i - 1])
		// 	train1({hash: hashes[i-1]}, 20000);
		// }
		// if ((i - 100) % 2 == 0) {
		train1({ hash: hashes[i - 2] }, trainCount, TOTAL_BETTING_HISTORY, 50);
	}
}



export const checkResult = (initialHash, counts) => {

	let depositAmount = 1000;

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

	for (let i = 100; i < payouts.length - 1; i++) {

		// if (i == 100) {

		// 	console.log('LAST HASH', hashes[i - 1])
		// 	train1({hash: hashes[i-1]}, 20000);
		// }
		// if ((i - 100) % 2 == 0) {
		train1({ hash: hashes[i - 2] }, i < 130 ? 50 : 50, TOTAL_BETTING_HISTORY, 30);
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
		const predictResult = getPredictResult(subPayouts);

		const prevBettingHistory = TOTAL_BETTING_HISTORY.slice(-100).map(b => b[0])
		const enginePredictResult = getEnginePredictResult(prevBettingHistory);

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

		let isEngineRight = TOTAL_BETTING_HISTORY[TOTAL_BETTING_HISTORY.length - 1][0] == 1;

		// console.log(maxDeep);
		let { engineTrend, values, entireTrend } = getBettingTypeTrend(TOTAL_BETTING_HISTORY.slice(-50));
		let { bettingType, trendStatus, bestScore, allScore, skipCount } = checkBettingType2(isWinBet, currentTrend2X, currentTrend3X, maxDeep, currentDeep, lastPayout
			, prevPredictValue, predictResult);

		let bettingAvailable = true;

		if (isWinBet) {
			isLoseStatus = false;
		}
		if (currentSkipCount == 0) {
			currentSkipCount = skipCount;
		} else {
			currentSkipCount--;
		}

		isLoseStatus = true;

		let bettingType2 = bettingType;
		console.log('Skip Count', currentSkipCount);

		fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i), null, 4));

		if (bettingType != 0) {
			const currentTrendPredict = predictResult.slice(currentTrend2X * 3, currentTrend2X * 3 + 3);
			if (isLoseStatus) {
				if (engineTrend == 0 || ((engineTrend == 0 || engineTrend == 2) && isEngineRight && entireTrend == 0)) {
					bettingAvailable = true;
					bettingType2 = bettingType;
				} else if (engineTrend == 1 || ((engineTrend == 1  || engineTrend == 2) && !isEngineRight && entireTrend == 1)) {
					bettingAvailable = true;
					bettingType2 = bettingType == 2 ? 1 : 2;
				} else {
					bettingAvailable = true;
				}
			}
			let isRightPrevious = TOTAL_BETTING_HISTORY[TOTAL_BETTING_HISTORY.length - 1] ? TOTAL_BETTING_HISTORY[TOTAL_BETTING_HISTORY.length - 1][0] == 1 : 0;

			let bettingOrNot = false;

			if (prevPredictEnginValue == null) {
				bettingOrNot = false;
			} else {
				bettingOrNot = bettingAvailable && predictRates[0].length >= 50;
			}

			prevPredictEnginValue = enginePredictResult;
			// console.log('ENGINE PREDICT: ', enginePredictResult, engineTrend, bettingOrNot);

			// let's check origin engin
			let isRight = false;

			if (result >= 2 && bettingType == 2) {
				isRight = true;
			} else if (result < 2 && bettingType == 1) {
				isRight = true;
			} else {
				isRight = false;
			}

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
				TOTAL_BETTING_HISTORY.push([isRight ? 1 : 0, 0, engineTrend, values, payouts[i], bettingType, isNormalBet ? currentBet2X : currentBetLose]);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
				TOTAL_BETTING_HISTORY2.push([isRight ? 1 : 0, 0, result, bettingType]);
				fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
				continue;
			}

			TOTAL_BETTING_HISTORY.push([isRight ? 1 : 0, 1, engineTrend, values, payouts[i], bettingType, isNormalBet ? currentBet2X : currentBetLose]);
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));

			let isRight2 = false;
			if (result >= 2 && bettingType2 == 2) {
				isRight2 = true;
			} else if (result < 2 && bettingType2 == 1) {
				isRight2 = true;
			} else {
				isRight2 = false;
			}

			TOTAL_BETTING_HISTORY2.push([isRight2 ? 1 : 0, 1, result, bettingType2]);
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

			if (currentBet2X >= initialBet * Math.pow(2, 9)) {
				console.log('512 HASHE', hashes[i + 150]);
				exit(0);
			}

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


checkResult('90067234de303b034b8e9949fb4e7bc60c9783bf0564fd7b8c2435c5cf4894bb', 30000);