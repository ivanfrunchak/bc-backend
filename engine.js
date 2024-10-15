import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { checkPattern, gameResult, sortValues } from "./libs/utils.js";


const CryptoJS = require("crypto-js");
const fs = require('fs');
import brain from 'brain.js';
import { getExpectedEnginData2, getExpectedEngineData, getExpectedPayoutData, getNormalized3XPayoutData, getNormalizedEngineData, getNormalizedEngineData2, getNormalizedEngineData3, getNormalizedPayoutData, getNormalizedPayoutDataWithTrend } from "./libs/aiutils.js";
import { logDebug, logError, logFatal, logInfo, logSuccess, logWarn } from "./libs/logging.js";
import { train1, trainPredictRate } from "./brain.js";
import { exit } from "process";

export const TOTAL_BETTING_HISTORY1 = []; //require('./TOTAL_BETTING_HISTORY_TEST1.json');
export const TOTAL_BETTING_HISTORY2 = []; //require('./TOTAL_BETTING_HISTORY_TEST2.json');
export const TOTAL_BETTING_HISTORY3 = []; //require('./TOTAL_BETTING_HISTORY_TEST3.json');
export const TOTAL_BETTING_HISTORY4 = []; //require('./TOTAL_BETTING_HISTORY_TEST4.json');
export const TOTAL_BETTING_HISTORY2X = []; //require('./TOTAL_BETTING_HISTORY_TEST2X.json');
export const TOTAL_BETTING_HISTORY3X = []; //require('./TOTAL_BETTING_HISTORY_TEST3X.json');
export const TOTAL_BETTING_HISTORY = []; //require('./TOTAL_BETTING_HISTORY_TEST.json');
export const predictRates = []; //require('./PREDICTS.json');


export const predictHistory = require('./PREDICTS_DATA.json');
export const predictWinRates = require('./WIN_RATES.json');



TOTAL_BETTING_HISTORY1.length = 0;
TOTAL_BETTING_HISTORY2.length = 0;
TOTAL_BETTING_HISTORY3.length = 0;
TOTAL_BETTING_HISTORY4.length = 0;
TOTAL_BETTING_HISTORY2X.length = 0;
TOTAL_BETTING_HISTORY3X.length = 0;
TOTAL_BETTING_HISTORY.length = 0;
predictRates.length = 0;





export const initializeData = () => {
	let isEmptyPredictRates = predictRates.length == 0;

	for (let i = 0; i < 3; i++) {
		[5, 10, 15, 20, 25, 30].map(() => {
			if (isEmptyPredictRates) {
				predictRates.push([]);
			}
		});
	}
}

export const initializeData3 = () => {
	let isEmptyPredictRates = predictRates.length == 0;
	const counts = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 50000, 10000];


	counts.map((c, j) => {
		if (isEmptyPredictRates) {
			predictRates.push([]);
		}
	})
}

export const getPredictWinRate1 = (subPayoutsPattern, count, index) => {

	const subPayoutcolor = subPayoutsPattern.color;
	const subPayoutPattern = subPayoutsPattern.values.map(p => p.length).join(',');

	// let totalCount = 0;
	// let winCount = 0;
	// for (let i = count; i < predictHistory[index].length; i++) {

	// 	const data = predictHistory[index].slice(i - count, i);
	// 	const result = predictHistory[index][i];

	// 	const dataPattern = sortValues(data.map(p => p.payout).slice(count * -1), (v) => {
	// 		return v == 2 ? 1 : 0 // 1 is green, 0 is red
	// 	}, 2);


	// 	const predictColor = dataPattern.color;
	// 	const predictPattern = dataPattern.values.map(p => p.length).join(',');

	// 	if (subPayoutcolor == predictColor && subPayoutPattern == predictPattern) {
	// 		totalCount++;

	// 		if (result.isRight == 1) {
	// 			winCount++;
	// 		}
	// 	}
	// }

	// const rate = totalCount ? winCount * 100 / totalCount : 0;


	const foundWinRateIndex = predictWinRates[index].findIndex(p => p.predictColor == subPayoutcolor && p.predictPattern == subPayoutPattern);

	let winRate1 = 0, totalCount = 0;

	if (foundWinRateIndex != -1) {
		const foundWinRate = predictWinRates[index][foundWinRateIndex];
		winRate1 = foundWinRate.winCount * 100 / foundWinRate.totalCount;
		totalCount = foundWinRate.totalCount;
	}

	// console.log("PATTERN: ", index, subPayoutPattern, winRate1);
	return {winRate: winRate1, totalCount};
}

export const getPredictWinRate = (subPayoutsPattern, count, index) => {

	return {winRate: 0, totalCount: 1};
	const subPayoutcolor = subPayoutsPattern.color;
	const subPayoutPattern = subPayoutsPattern.values.map(p => p.length).join(',');

	let totalCount = 0;
	let winCount = 0;
	for (let i = count; i < predictHistory[index].length; i++) {

		const data = predictHistory[index].slice(i - count, i);
		const result = predictHistory[index][i];

		const dataPattern = sortValues(data.map(p => p.payout).slice(count * -1), (v) => {
			return v == 2 ? 1 : 0 // 1 is green, 0 is red
		}, 2);


		const predictColor = dataPattern.color;
		const predictPattern = dataPattern.values.map(p => p.length).join(',');

		if (subPayoutcolor == predictColor && subPayoutPattern == predictPattern) {
			totalCount++;

			if (result.isRight == 1) {
				winCount++;
			}
		}
	}

	const rate = totalCount ? winCount * 100 / totalCount : 0;

	return {winRate: rate, totalCount};


	// const foundWinRateIndex = predictWinRates[index].findIndex(p => p.predictColor == subPayoutcolor && p.predictPattern == subPayoutPattern);

	// let winRate1 = 0, totalCount = 0;

	// if (foundWinRateIndex != -1) {
	// 	const foundWinRate = predictWinRates[index][foundWinRateIndex];
	// 	winRate1 = foundWinRate.winCount * 100 / foundWinRate.totalCount;
	// 	totalCount = foundWinRate.totalCount;
	// }

	// console.log("PATTERN: ", index, subPayoutPattern, winRate1);
	return {winRate: winRate1, totalCount};
}

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
		[5, 10, 15, 20, 25, 30].map((c, j) => {
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

export const getPredictResultFromJson = (payouts) => {
	let train_names = ['good', 'bad', 'mid'];


	let predict2Xs = [];
	let predict3Xs = [];
	for (let i = 0; i < 3; i++) {
		[5, 10, 15, 20, 25, 30].map((c, j) => {
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

	// console.log('P:', predict2Xs);
	// console.log('P:', p2xs);

	return p2xs

}


export const getPredictResultFromJson20 = (payouts) => {
	let predict2Xs = [];

	const counts = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];


	console.log("COUNTS", counts.length);
	counts.map((c, j) => {
		const net = new brain.NeuralNetwork();
		const train_str = fs.readFileSync(`./brain_train_2x_${c}.json`);
		net.fromJSON(JSON.parse(train_str));
		const p = net.run(getNormalizedPayoutDataWithTrend(payouts.slice(c * 2 * -1), c));

		predict2Xs.push(p['0']);
	})

	// console.log("PREDICTS: ", predict2Xs)

	const p2xs = predict2Xs.map((p, index) => getExpectedPayoutData(p, predictRates[index]));
	return {
		original: predict2Xs,
		values: p2xs
	}

}

export const get3XPercent = (payouts, count) => {

	let x3Count = 0;
	payouts.slice(-1 * count).map(p => {
		if (p >= 3) {
			x3Count++;
		}
	})
	return x3Count / count;
}

export const get1XPercent = (payouts, count) => {

	let x1Count = 0;
	payouts.slice(-1 * count).map(p => {
		if (p < 2) {
			x1Count++;
		}
	})
	return x1Count / count;
}



export const getBettingTypeTrend = (result, smaCount = 5) => {

	if (result.length < 3) return null; // bad trend

	let sum = 0;
	let prevBust = -1;
	let plusArray = [];
	let minusArray = [];
	let yData = result.map((row, index) => {
		if (row.isRight == 1) {
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
		prevBust = row.isRight;
		return sum;
	});


	sum = 0;
	prevBust = -1;
	let plusArray1 = [];
	let minusArray1 = [];
	let yData1 = result.slice(smaCount * -1).map((row, index) => {

		if (row.isRight == 1) {
			sum += (index == 0 ? 0 : 1);
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
			sum -= (index == 0 ? 0 : 1);
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
		prevBust = row.isRight;
		return sum;
	});

	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
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

	let yDataSMA1 = [];
	for (let i = 0; i < yData1.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
			if (yDataSMA1.length < (index + 1)) {
				yDataSMA1.push([]);
			}
			if (i < count - 1) {
				yDataSMA1[index].push(0);
			} else {
				const v = yData1.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
				yDataSMA1[index].push(v);
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


	let engineTrend2 = 2;//'Mid';
	if (
		yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[0][yDataSMA[0].length - 2]
	) {
		engineTrend2 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[0][yDataSMA[0].length - 1] < yDataSMA[0][yDataSMA[0].length - 2]
	) {
		engineTrend2 = 1 //"BAD"; // bad
	}
	// console.log("WWWWWWWWWWWWWWWWWWWW", yDataSMA[0].slice(-10));

	let entireTrend = 2;

	let minusArrayTrend = 2;
	let plusArrayTrend = 2;
	try {
		if (minusArray[minusArray.length - 1] >= minusArray[minusArray.length - 2]) {
			minusArrayTrend = 0;
		} else if (minusArray[minusArray.length - 1] < minusArray[minusArray.length - 2]) {
			minusArrayTrend = 1;
		}

		if (plusArray[plusArray.length - 1] >= plusArray[plusArray.length - 2]) {
			plusArrayTrend = 0;
		} else if (plusArray[plusArray.length - 1] < plusArray[plusArray.length - 2]) {
			plusArrayTrend = 1;
		}
	} catch (err) {

	}

	let minusArrayTrend1 = 2;
	let plusArrayTrend1 = 2;
	try {
		if (minusArray1[minusArray1.length - 1] >= minusArray1[minusArray1.length - 2]) {
			minusArrayTrend1 = 0;
		} else if (minusArray1[minusArray1.length - 1] < minusArray1[minusArray1.length - 2]) {
			minusArrayTrend1 = 1;
		}

		if (plusArray1[plusArray1.length - 1] >= plusArray1[plusArray1.length - 2]) {
			plusArrayTrend1 = 0;
		} else if (plusArray1[plusArray1.length - 1] < plusArray1[plusArray1.length - 2]) {
			plusArrayTrend1 = 1;
		}
	} catch (err) {

	}


	if (minusArrayTrend == 2 && plusArrayTrend == 2) {
		entireTrend = 2;
	} else if ((minusArrayTrend == 0 && minusArrayTrend1 == 0) || plusArrayTrend == 0) {
		entireTrend = 0;
	} else if (minusArrayTrend == 1 || plusArrayTrend == 1) {
		entireTrend = 1;
	} else {
		entireTrend = 2;
	}

	// const lastData = result[result.length - 1];
	// if (lastData[0] == 0 && trendStatus == 0) {
	// 	trendStatus = 2;
	// 	entireTrend = 2;
	// }


	// if (trendStatus == 0) {
	// 	entireTrend = 0;
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

	let isSameLevel = false;
	let realGoodTrend = false;
	if ((yDataSMA[0][yDataSMA[0].length - 1] == yDataSMA[0][yDataSMA[0].length - 2]) || (yDataSMA[0][yDataSMA[0].length - 1] == yDataSMA[0][yDataSMA[0].length - 3])) {
		isSameLevel = true;
	}

	if (((yDataSMA[0][yDataSMA[0].length - 1] - yDataSMA[1][yDataSMA[1].length - 1]) == 0.5) && (yDataSMA[1][yDataSMA[1].length - 1] == yDataSMA[2][yDataSMA[2].length - 1])) {
		realGoodTrend = true;
	}

	let entireTrend4 = 2;
	if (
		yDataSMA[3][yDataSMA[3].length - 1] > yDataSMA[3][yDataSMA[3].length - 4]
	) {
		entireTrend4 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[3][yDataSMA[3].length - 1] < yDataSMA[3][yDataSMA[3].length - 4]
	) {
		entireTrend4 = 1 //"BAD"; // bad
	}


	let entireTrend2 = 2;
	if (
		yDataSMA[3][yDataSMA[3].length - 1] > yDataSMA[3][yDataSMA[3].length - 2]
	) {
		entireTrend2 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[3][yDataSMA[3].length - 1] < yDataSMA[3][yDataSMA[3].length - 2]
	) {
		entireTrend2 = 1 //"BAD"; // bad
	}

	entireTrend2 = 2;
	entireTrend4 = 2;
	let entireTrend6 = 2;
	let entireTrend8 = 2;
	let entireTrend10 = 2;

	[2, 4, 6, 8, 10].map(count => {
		let entireTrend = 2;
		const diff10 = Math.abs(yDataSMA[3][yDataSMA[3].length - 1] - yDataSMA[3][yDataSMA[3].length - count - 1]);
		if (
			yDataSMA[3][yDataSMA[3].length - 1] > yDataSMA[3][yDataSMA[3].length - count - 1]
		) {
			entireTrend = 0 //"GOOD"; // good
		} else if (
			yDataSMA[3][yDataSMA[3].length - 1] < yDataSMA[3][yDataSMA[3].length - count - 1]
		) {
			entireTrend = 1 //"BAD"; // bad
		}

		if (count == 2) {
			entireTrend2 = entireTrend;
		} else if (count == 4) {
			entireTrend4 = entireTrend;
		} else if (count == 6) {
			entireTrend6 = entireTrend;
		} else if (count == 8) {
			entireTrend8 = entireTrend;
		} else if (count == 10) {
			entireTrend10 = entireTrend;
		}
	})




	let entireTrend100 = yDataSMA[0][yDataSMA[0].length - 1] >= yDataSMA[3][yDataSMA[3].length - 1] ? 0 : 1

	// if (entireTrend10 != 0 && diff10 <= 1) {
	// 	entireTrend10 = 0;
	// }
	// console.log(yDataSMA[0], yDataSMA[3])

	const payoutResult = sortValues(result.map(p => p.isRight).slice(-5), (v) => {
		return v == 1 ? 1 : 0 // 1 is green, 0 is red
	}, 1);

	const checkLength = 5
	const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

	const lastValue = result[result.length - 1].isRight;

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

	// console.log("PLENGTH", pLength, payoutResult.values);
	let maxDeep = vs.length > 0 ? Math.max(...vs) : 0;



	// console.log("====================================================", trendStatus, entireTrend, yDataSMA[3], entireTrend2, entireTrend10);
	return {
		isSameLevel,
		realGoodTrend,
		engineTrend: trendStatus,
		engineTrend2: engineTrend2,
		entireTrend2,
		entireTrend4,
		entireTrend6,
		entireTrend8,
		entireTrend10,
		entireTrend100,
		maxDeep,
		diff10: Math.abs(yDataSMA[3][yDataSMA[3].length - 1] - yDataSMA[3][yDataSMA[3].length - 5]),
		values: [yDataSMA[0][yDataSMA[0].length - 1], yDataSMA[1][yDataSMA[1].length - 1], yDataSMA[2][yDataSMA[2].length - 1], yDataSMA[3][yDataSMA[3].length - 1]],
		values1: [yDataSMA1[0][yDataSMA1[0].length - 1], yDataSMA1[1][yDataSMA1[1].length - 1], yDataSMA1[2][yDataSMA1[2].length - 1], yDataSMA1[3][yDataSMA1[3].length - 1]]
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
			if (i < count - 1) {
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
	let prevBust = -1;

	let yData = payouts.map(bust => {
		if (bust >= 2) {
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
		prevBust = bust;
		return sum;
	});


	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
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




	let trendStatus = 2;//'Mid';
	if (
		yDataSMA[0][yDataSMA[0].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[2][yDataSMA[2].length - 1]
	) {
		trendStatus = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[0][yDataSMA[0].length - 1]
	) {
		trendStatus = 1 //"BAD"; // bad
	}

	let entireTrend10 = 2;

	const diff10 = Math.abs(yDataSMA[2][yDataSMA[2].length - 1] - yDataSMA[2][yDataSMA[2].length - 2]);
	if (
		yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[2][yDataSMA[2].length - 2]
	) {
		entireTrend10 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] < yDataSMA[2][yDataSMA[2].length - 2]
	) {
		entireTrend10 = 1 //"BAD"; // bad
	}


	let entireTrend6 = 2;

	if (
		yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[2][yDataSMA[2].length - 6]
	) {
		entireTrend6 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] < yDataSMA[2][yDataSMA[2].length - 6]
	) {
		entireTrend6 = 1 //"BAD"; // bad
	}



	return {
		currentTrend: trendStatus,
		entireTrend10,
		entireTrend6
	};
}


export const getCurrentTrend3X = (payouts) => {

	let sum = 0;
	let plusArray = [];
	let minusArray = [];
	let sumArray = [];
	let prevBust = -1;

	let yData = payouts.map(bust => {

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


		return sum;
	});


	let yDataSMA = [];
	for (let i = 0; i < yData.length; i++) {
		[2, 3, 4, 5].map((count, index) => {
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




	let trendStatus = 2;//'Mid';
	if (
		yDataSMA[0][yDataSMA[0].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[2][yDataSMA[2].length - 1]
	) {
		trendStatus = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
		&& yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[0][yDataSMA[0].length - 1]
	) {
		trendStatus = 1 //"BAD"; // bad
	}

	let entireTrend10 = 2;

	const diff10 = Math.abs(yDataSMA[2][yDataSMA[2].length - 1] - yDataSMA[2][yDataSMA[2].length - 2]);
	if (
		yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[2][yDataSMA[2].length - 2]
	) {
		entireTrend10 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] < yDataSMA[2][yDataSMA[2].length - 2]
	) {
		entireTrend10 = 1 //"BAD"; // bad
	}


	let entireTrend6 = 2;

	if (
		yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[2][yDataSMA[2].length - 6]
	) {
		entireTrend6 = 0 //"GOOD"; // good
	} else if (
		yDataSMA[2][yDataSMA[2].length - 1] < yDataSMA[2][yDataSMA[2].length - 6]
	) {
		entireTrend6 = 1 //"BAD"; // bad
	}

	let is3XPoint = false;
	const diffMinus = Math.abs(minusArray[minusArray.length - 1] - minusArray[minusArray.length - 2]);

	if (trendStatus != 1) {
		if ((minusArray[minusArray.length - 1] <= minusArray[minusArray.length - 2] && diffMinus <= 0)) {
			trendStatus = 0;
			is3XPoint = true;
		}
	} else if (entireTrend6 == 1) {
		if ((minusArray[minusArray.length - 1] <= minusArray[minusArray.length - 2] && diffMinus == 1)) {
			trendStatus = 0;
			is3XPoint = true;
		}
	} else {
		if ((minusArray[minusArray.length - 1] <= minusArray[minusArray.length - 2] && diffMinus <= 0)) {
			trendStatus = 0;
			is3XPoint = true;
		}
	}

	const retValue = {
		currentTrend: trendStatus,
		entireTrend10,
		entireTrend6,
		minusArray,
		is3XPoint
	};
	// console.log("SMA 2", JSON.stringify(yDataSMA[0].slice(-10)))
	// console.log("SMA 3", JSON.stringify(yDataSMA[1].slice(-10)))
	// console.log("SMA 4", JSON.stringify(yDataSMA[2].slice(-10)))
	// console.log("SMA 5", JSON.stringify(yDataSMA[3].slice(-10)))
	// logDebug("3X TREND", JSON.stringify(retValue))

	return retValue;
}


let currentFailedCount = 0;

let isLoseStatus = false;


export const getLoseStatus = () => {
	return isLoseStatus;
}

export const setLoseStatus = (s) => {
	isLoseStatus = s;
}

let currentCheckCount = 3;



export const verifyPredict = (input, count) => {
	const net = new brain.NeuralNetwork();
	const train_str = fs.readFileSync(`./engine_train.json`);
	net.fromJSON(JSON.parse(train_str));
	const p = net.run(getNormalizedEngineData2(input.slice(count * -1)));
	console.log("EEEEEEEEEEEEEEEEEEEEEEEE", p);
	return p['0'];
}

export const verifyPredictFromJson = (trainJson, input, count) => {

	if (trainJson == null) return 0;
	const net = new brain.NeuralNetwork();
	net.fromJSON(trainJson);
	const p = net.run(getNormalizedEngineData2(input.slice(count * -1)));

	return p['0'];
}

export const verifyPredict3 = (input, count) => {
	const net = new brain.NeuralNetwork();
	const train_str = fs.readFileSync(`./engine_train3.json`);
	net.fromJSON(JSON.parse(train_str));
	const p = net.run(input.slice(count * -1));
	console.log("VERIFY PREDICT 3 ~~~~~~~~~~~~~~~~~~~", p['0']);
	return p['0'];
}

export const checkOppositPattern = (data, data2) => {
	try {
		const firstPattern = data.join(',');
		const secondPattern = data2.join(',');

		// return (
		// 	((firstPattern == '0,1,0' || firstPattern == '1,1,0') && (secondPattern == '0,0,1' || secondPattern == '1,0,1'))
		// 	|| ((secondPattern == '0,1,0' || secondPattern == '1,1,0') && (firstPattern == '0,0,1' || firstPattern == '1,0,1'))
		// )

		let isOpposit = true;
		data.map((d, idx) => {
			if (idx > 0 && isOpposit && d == data2[idx]) {
				isOpposit = false;
			}
		})
		console.log(isOpposit, firstPattern, secondPattern, data, data2);

		return isOpposit;


	} catch (err) {
		return false;
	}

}


export const checkPatternWithString = (data, pattern) => {
	try {
		const str = data.join(',');

		console.log("PATTERN~~~~~~~~~~~~~~~~~~~~~~~~~~", str, pattern);

		if (pattern == str) return true;

		return false;


	} catch (err) {
		return false;
	}

}

export const check1010Pattern = (data, deep) => {
	try {
		const payoutResult = sortValues(data, (v) => {
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


		let maxDeep = Math.max(...vs);
		if (maxDeep <= deep) return true;

		return false;
	} catch (err) {
		return false;
	}

}

export const checkSimulation = (predictRatesClone, trainJsons, counts) => {

	try {
		const rates = [];
		counts.map((count, index) => {
			if (rates.length < index + 1) {
				rates.push([]);
			}
			predictRatesClone.map((d, idx) => {
				if (idx < (count + 1)) return;

				if (trainJsons[index] == null) {
					rates[index].push(1);
					return;
				}
				const predictData = verifyPredictRate(trainJsons[index], predictRatesClone.slice(idx - count, idx), count);
				const isRight = getExpectedEnginData2(predictData);
				if (predictRatesClone[idx].isRight == isRight) {
					rates[index].push(1);
				} else {
					rates[index].push(0);
				}
			})
		});



		logInfo('-----------------------------------------------------------------------------------')
		const sma2s = [];
		counts.map((count, index) => {
			const sma = getSma(rates[index], 5, [2]);
			sma2s.push({
				sma2: sma[0][sma[0].length - 1],
				index: index
			});
		});
		logInfo('-----------------------------------------------------------------------------------')
		sma2s.sort((a, b) => {
			return b.sma2 - a.sma2
		});


		if (sma2s[0].sma2 == sma2s[1].sma2) {
			// let's check 
			return [0, 1, 2];
		} else if (sma2s[0].sma2 > sma2s[1].sma2) {
			return [0];
		}
	} catch (err) {
		return 1;
	}

}


export const checkSimulationWithPredict = (dataClone, trainJsons, counts) => {

	try {
		const rates = [];
		counts.map((count, index) => {
			if (rates.length < index + 1) {
				rates.push([]);
			}
			dataClone.map((d, idx) => {
				if (idx < (count + 1)) return;

				if (trainJsons[index] == null) {
					rates[index].push(1);
					return;
				}
				const predictData = verifyPredictRate(trainJsons[index], dataClone.slice(idx - count, idx), count);
				const isRight = getExpectedEnginData2(predictData);
				if (dataClone[idx].isRight == isRight) {
					rates[index].push(1);
				} else {
					rates[index].push(0);
				}
			})
		});



		logInfo('-----------------------------------------------------------------------------------')
		const sma2s = [];
		counts.map((count, index) => {
			const sma = getSma(rates[index], 5, [2]);
			sma2s.push({
				sma2: sma[0][sma[0].length - 1],
				index: index
			});
		});
		logInfo('-----------------------------------------------------------------------------------')
		sma2s.sort((a, b) => {
			return b.sma2 - a.sma2
		});


		if (sma2s[0].sma2 == sma2s[1].sma2) {
			// let's check 
			return [0, 1, 2];
		} else if (sma2s[0].sma2 > sma2s[1].sma2) {
			return [sma2s[0].index];
		}
	} catch (err) {
		return 1;
	}

}



export const checkSimulationWithEngine = (dataClone, trainJsons, counts) => {

	try {
		const rates = [];
		counts.map((count, index) => {
			if (rates.length < index + 1) {
				rates.push([]);
			}
			dataClone.map((d, idx) => {
				if (idx < (count + 1)) return;

				if (trainJsons[index] == null) {
					rates[index].push(1);
					return;
				}
				const predictData = verifyEngine(trainJsons[index], dataClone.slice(idx - count, idx), count);
				const isRight = getExpectedEnginData2(predictData);
				if (dataClone[idx].isRight == isRight) {
					rates[index].push(1);
				} else {
					rates[index].push(0);
				}
			})
		});



		logInfo('-----------------------------------------------------------------------------------')
		const sma2s = [];
		counts.map((count, index) => {
			const sma = getSma(rates[index], 10, [2]);
			sma2s.push({
				sma2: sma[0][sma[0].length - 1],
				index: index
			});
		});
		logInfo('-----------------------------------------------------------------------------------')
		sma2s.sort((a, b) => {
			return b.sma2 - a.sma2
		});


		if (sma2s[0].sma2 == sma2s[1].sma2) {
			// let's check 
			return [0, 1, 2];
		} else if (sma2s[0].sma2 > sma2s[1].sma2) {
			return [sma2s[0].index];
		}
	} catch (err) {
		return 1;
	}

}


export const verifyPredictRate = (trainJson, input, count) => {

	const net = new brain.NeuralNetwork();
	net.fromJSON(trainJson);
	const p = net.run(getNormalizedEngineData2(input.slice(count * -1)));
	return p['0'];
}

export const verifyPredictRateWith3 = (trainJson, input, count) => {

	const net = new brain.NeuralNetwork();
	net.fromJSON(trainJson);
	const p = net.run(getNormalizedEngineData2(input.slice(count * -1)));
	return [p['0'], p['1'], p['2']];
}


export const verifyEngine = (trainJson, input, count) => {

	const net = new brain.NeuralNetwork();
	net.fromJSON(trainJson);
	const p = net.run(getNormalizedEngineData3(input.slice(count * -1)));
	return p['0'];

}

export const addPredictRates = (nextResult, bettingTypeBC) => {
	const nextPs = [...nextResult.values];

	let x2Count = 0;
	let x1Count = 0;

	const ps = nextPs.map(p => {
		if (p >= 2) {
			x2Count++;
		} else {
			x1Count++;
		}
		return p >= 2 ? 2 : p;
	})


	for (let i = 0; i < ps.length; i++) {
		predictRates[i].push({
			payout: ps[i],
			isRight: 1,
			bettingType: ps[i],
			score: nextResult.original[i]
		});
	}

	const betType = x2Count > x1Count ? 2 : 1;
	predictRates[ps.length].push({
		payout: betType,
		isRight: 1,
		type: 'all',
		color: 'lightblue',
		bettingType: betType,
		score: 100
	})

	predictRates[ps.length + 1].push({
		payout: bettingTypeBC,
		isRight: 1,
		type: 'bc',
		color: 'gainsboro',
		bettingType: bettingTypeBC,
		score: 100
	});

	// predictRates[ps.length + 2].push({
	// 	payout: bettingType1,
	// 	isRight: 1,
	// 	type: 'LOW CHART',
	// 	color: 'yellow',
	// 	bettingType: bettingType1,
	// 	score: 100
	// });

	// predictRates[ps.length + 3].push({
	// 	payout: bettingType2,
	// 	isRight: 1,
	// 	type: 'HIGH CHART',
	// 	color: 'red',
	// 	bettingType: bettingType2,
	// 	score: 100
	// });

	// predictRates[ps.length + 4].push({
	// 	payout: bettingType3,
	// 	isRight: 1,
	// 	type: 'MID CHART',
	// 	color: 'blue',
	// 	bettingType: bettingType3,
	// 	score: 100
	// });

}

export const getStatisticBranchBettingType = (nextResult) => {
	const nextPs = [...nextResult.values];

	let x2Count = 0;
	let x1Count = 0;

	nextPs.map(p => {
		if (p >= 2) {
			x2Count++;
		} else {
			x1Count++;
		}
		return p >= 2 ? 2 : p;
	})

	const betType = x2Count > x1Count ? 2 : 1;
	return betType;
}

export const addPredictRatesForTest = (nextScore, nextResult, bettingTypeBC) => {
	const nextPs = [...nextResult.values];

	let x2Count = 0;
	let x1Count = 0;

	const ps = nextPs.map(p => {
		if (p >= 2) {
			x2Count++;
		} else {
			x1Count++;
		}
		return p >= 2 ? 2 : p;
	})

	const originalPayout = nextScore;
	nextScore = nextScore >= 2 ? 2 : 1;


	for (let i = 0; i < ps.length; i++) {
		if (nextScore != ps[i]) {
			predictRates[i].push({
				payout: originalPayout,
				isRight: 0,
				bettingType: ps[i],
				score: nextResult.original[i]
			});
		} else {
			predictRates[i].push({
				payout: originalPayout,
				isRight: 1,
				bettingType: ps[i],
				score: nextResult.original[i]
			});
		}

	}

	const betType = x2Count > x1Count ? 2 : 1;
	console.log("BET TYPE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", betType);
	let isRight = (originalPayout >= 2 && betType == 2) || (originalPayout < 2 && betType == 1)
	predictRates[ps.length].push({
		payout: originalPayout,
		isRight: isRight ? 1 : 0,
		color: 'lightblue',
		type: 'all',
		bettingType: betType,
		score: 100
	});


	isRight = (originalPayout >= 2 && bettingTypeBC == 2) || (originalPayout < 2 && bettingTypeBC == 1)
	predictRates[ps.length + 1].push({
		payout: originalPayout,
		isRight: isRight ? 1 : 0,
		type: 'bc',
		color: 'gainsboro',
		bettingType: bettingTypeBC,
		score: 100
	});

	// isRight = (originalPayout >= 2 && bettingType1 == 2) || (originalPayout < 2 && bettingType1 == 1)
	// predictRates[ps.length + 2].push({
	// 	payout: originalPayout,
	// 	isRight: isRight ? 1 : 0,
	// 	type: 'LOW CHART',
	// 	color: 'yellow',
	// 	bettingType: bettingType1,
	// 	score: 100
	// });

	// isRight = (originalPayout >= 2 && bettingType2 == 2) || (originalPayout < 2 && bettingType2 == 1)
	// predictRates[ps.length + 3].push({
	// 	payout: originalPayout,
	// 	isRight: isRight ? 1 : 0,
	// 	type: 'HIGH CHART',
	// 	color: 'red',
	// 	bettingType: bettingType2,
	// 	score: 100
	// });

	// isRight = (originalPayout >= 2 && bettingType3 == 2) || (originalPayout < 2 && bettingType3 == 1)
	// predictRates[ps.length + 4].push({
	// 	payout: originalPayout,
	// 	isRight: isRight ? 1 : 0,
	// 	type: 'MID CHART',
	// 	color: 'blue',
	// 	bettingType: bettingType3,
	// 	score: 100
	// });

}

export const updatePredictRates = (nextScore, nextResult) => {
	const nextPs = [...nextResult.values];

	const ps = nextPs.map(p => {
		return p >= 2 ? 2 : p;
	})

	const originalPayout = nextScore;

	nextScore = nextScore >= 2 ? 2 : 1;


	for (let i = 0; i < ps.length; i++) {

		const originalRate = predictRates[i][predictRates[i].length - 1];
		if (nextScore != ps[i]) {
			predictRates[i][predictRates[i].length - 1] = Object.assign(originalRate, {
				isRight: 0,
				payout: originalPayout,
			});
		} else {
			predictRates[i][predictRates[i].length - 1] = Object.assign(originalRate, {
				isRight: 1,
				payout: originalPayout,
			});
		}
	}

	for (let j = 0; j < 2; j++) {
		let originalRate = predictRates[ps.length + j][predictRates[ps.length + j].length - 1];
		let isRight = (originalPayout >= 2 && originalRate.bettingType == 2) || (originalPayout < 2 && originalRate.bettingType == 1)
		predictRates[ps.length + j][predictRates[ps.length + j].length - 1] = Object.assign(originalRate, {
			isRight: isRight ? 1 : 0,
			payout: originalPayout,
		});
	}
}

export const selectBettingTypeWithBranches = (nextResult, branches) => {
	let goodTrendScoreResult = getGoodTrendScores(nextResult.values, 5, branches);
	const bestBranch = goodTrendScoreResult.bestScores[0];
	// console.log("GOOD TREND RESULT ~~~~~~~~~~~~~~~~~~", bestBranch);
	return {
		bettingType: nextResult.values[bestBranch.index] >= 2 ? 2 : 1,
		branchIndex: bestBranch.index
	}
}

let bettingAvailable = true;
let checkLoseCount = 3;
export const checkBettingType2 = (subPayouts, maxDeep, currentDeep, prevResult, prevScore, nextResult) => {

	addPredictRates(prevScore, prevResult);
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
	}
	let bestBettingTypeLow = 0;
	let bestBettingTypeHigh = 0;
	let bestBettingTypeMid = 0;

	let isPattern1010 = false;

	let isStillValidCurrentIndex = false; //(isRightEngine || currentIndex == -1) ? false : true;

	if (currentIndexLow != -1) {
		// let's check the current line has 1,0,1,0 pattern
		const pRates = predictRates[currentIndexLow].slice(-5);
		const payoutResult = sortValues(pRates.map(p => p.isRight), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		const checkLength = 5
		const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

		const lastValue = pRates[pRates.length - 1].isRight;

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
		let maxDeep = Math.max(...vs);

	}

	let tmpCurrentIndex = -1;
	let goodTrendScoreResult = getGoodTrendScores(nextResult, 5, null);

	let bestScoresLow = goodTrendScoreResult.bestScores[goodTrendScoreResult.bestScores.length - 1];
	let bestScoresMid = goodTrendScoreResult.bestScores[2];
	let bestScoresHigh = goodTrendScoreResult.bestScores[0];



	// console.log("CHANGED GOOD CURRENT INDEX ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", tmpCurrentIndex);


	let skipCount = 0;



	// sort current scores by sma

	// if (!isPattern1010 && currentIndex != -1) {
	// 	let failedCount = 0, foundRight = false;
	// 	predictRates[currentIndex].slice(-10).reverse().map(p => {
	// 		if (foundRight) return;
	// 		if (p.isRight == 1) {
	// 			foundRight = true;
	// 			return;
	// 		}
	// 		failedCount++;
	// 	})
	// }


	// console.log('BEST SCORES', bestScores, isStillValidCurrentIndex, currentIndex, nextResult, isLoseStatus);
	// bestBettingType = 0;
	currentIndexHigh = bestScoresHigh.index;
	currentIndexLow = bestScoresLow.index;
	currentIndexMid = bestScoresMid.index;

	try {
		bestBettingTypeLow = nextResult.values[currentIndexLow] >= 2 ? 2 : 1;
		bestBettingTypeHigh = nextResult.values[currentIndexHigh] >= 2 ? 2 : 1;
		bestBettingTypeMid = nextResult.values[currentIndexMid] >= 2 ? 2 : 1;
	} catch (err) {

	}

	// if (bestBettingType == 0) {
	// 	logWarn("PREDICT~~~~~~~~ NOT SURE")
	// } else if (bestBettingType == 2) {
	// 	logSuccess("PREDICT 2X ~~~~~~~~")

	// } else if (bestBettingType == 1) {
	// 	logFatal("PREDICT 1X ~~~~~~~~~")
	// }

	const currentBet2XTrend = getCurrentTrend2X(subPayouts);

	let bettingTypeBC = 2;

	// console.log("currentBet2XTrend===", currentBet2XTrend);

	if (currentBet2XTrend.currentTrend == 0) {
		bettingTypeBC = 2;
	} else if (currentBet2XTrend.currentTrend == 1) {
		bettingTypeBC = 1;
	} else {
		if (currentBet2XTrend.entireTrend10 == 0) {
			bettingTypeBC = 2;
		} else if (currentBet2XTrend.entireTrend10 == 1) {
			bettingTypeBC = 1
		} else {
			if (prevScore >= 2) {
				bettingTypeBC = 2;
			} else {
				bettingTypeBC = 1;
			}
		}
	}

	// if (currentBet2XTrend.entireTrend10 == 2) {
	// 	if (maxDeep <= 2) {
	// 		if (prevScore >= 2) {
	// 			bettingTypeBC = maxDeep == 2 ? 2 : 1;
	// 		} else {
	// 			bettingTypeBC = maxDeep == 2 ? 1 : 2;
	// 		}
	// 	}

	// }

	return {
		bettingType1: bestBettingTypeLow, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingType2: bestBettingTypeHigh, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingType3: bestBettingTypeMid,
		bettingTypeBC,
		currentIndexLow,
		currentIndexHigh,
		currentIndexMid,
		skipCount: skipCount,
		bettingAvailable: true
	}
}


export const checkBettingType3 = (subPayouts, maxDeep, currentDeep, prevResult, prevScore, nextResult) => {

	//addPredictRates(prevScore, prevResult);

	// console.log('predictRates.length================', predictRates.length);

	const lastPridectRates = predictRates[0].slice(-5);



	if (lastPridectRates.length < 1) {

		return {
			bettingType1: 0, //bestScores.length == 0 ? 0 : bestBettingType,
			bettingType2: 0, //bestScores.length == 0 ? 0 : bestBettingType,
			bettingType3: 0,
			bettingTypeBC: 0,
			bettingAvailable: false
		}
	}
	// console.log(lastPridectRates);

	let bestBettingTypeLow = 0;
	let bestBettingTypeHigh = 0;
	let bestBettingTypeMid = 0;

	let isPattern1010 = false;

	let isStillValidCurrentIndex = false; //(isRightEngine || currentIndex == -1) ? false : true;

	if (currentIndexLow != -1) {
		// let's check the current line has 1,0,1,0 pattern
		const pRates = predictRates[currentIndexLow].slice(-5);
		const payoutResult = sortValues(pRates.map(p => p.isRight), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		const checkLength = 5
		const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

		const lastValue = pRates[pRates.length - 1].isRight;

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
		let maxDeep = Math.max(...vs);

	}

	let tmpCurrentIndex = -1;
	let goodTrendScoreResult = getGoodTrendScores(nextResult.values, 8, null);

	let bestScoresLow = goodTrendScoreResult.bestScores[2];
	let bestScoresMid = goodTrendScoreResult.bestScores[1];
	let bestScoresHigh = goodTrendScoreResult.bestScores[0];



	// console.log("CHANGED GOOD CURRENT INDEX ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~", tmpCurrentIndex);


	let skipCount = 0;



	// sort current scores by sma

	// if (!isPattern1010 && currentIndex != -1) {
	// 	let failedCount = 0, foundRight = false;
	// 	predictRates[currentIndex].slice(-10).reverse().map(p => {
	// 		if (foundRight) return;
	// 		if (p.isRight == 1) {
	// 			foundRight = true;
	// 			return;
	// 		}
	// 		failedCount++;
	// 	})
	// }


	// console.log('BEST SCORES', bestScores, isStillValidCurrentIndex, currentIndex, nextResult, isLoseStatus);
	// bestBettingType = 0;
	currentIndexHigh = bestScoresHigh.index;
	currentIndexLow = bestScoresLow.index;
	currentIndexMid = bestScoresMid.index;
	try {
		bestBettingTypeLow = nextResult.values[currentIndexLow] >= 2 ? 2 : 1;
		bestBettingTypeHigh = nextResult.values[currentIndexHigh] >= 2 ? 2 : 1;
		bestBettingTypeMid = nextResult.values[currentIndexMid] >= 2 ? 2 : 1;
	} catch (err) {

	}

	// if (bestBettingType == 0) {
	// 	logWarn("PREDICT~~~~~~~~ NOT SURE")
	// } else if (bestBettingType == 2) {
	// 	logSuccess("PREDICT 2X ~~~~~~~~")

	// } else if (bestBettingType == 1) {
	// 	logFatal("PREDICT 1X ~~~~~~~~~")
	// }

	const currentBet2XTrend = getCurrentTrend2X(subPayouts);

	let bettingTypeBC = 2;

	// console.log("currentBet2XTrend===", currentBet2XTrend);

	if (currentBet2XTrend.currentTrend == 0) {
		bettingTypeBC = 2;
	} else if (currentBet2XTrend.currentTrend == 1) {
		bettingTypeBC = 1;
	} else {
		if (currentBet2XTrend.entireTrend10 == 0) {
			bettingTypeBC = 2;
		} else if (currentBet2XTrend.entireTrend10 == 1) {
			bettingTypeBC = 1
		} else {
			if (prevScore >= 2) {
				bettingTypeBC = 2;
			} else {
				bettingTypeBC = 1;
			}
		}
	}

	const currentBet3XTrend = getCurrentTrend3X(subPayouts);

	let bettingType3X = 2;

	// console.log("currentBet2XTrend===", currentBet2XTrend);

	if (currentBet3XTrend.currentTrend == 0) {
		bettingType3X = 2;
	} else if (currentBet3XTrend.currentTrend == 1) {
		bettingType3X = 1;
	} else {
		if (currentBet3XTrend.entireTrend10 == 0) {
			bettingType3X = 2;
		} else if (currentBet3XTrend.entireTrend10 == 1) {
			bettingType3X = 1
		} else {
			if (prevScore >= 3) {
				bettingType3X = 2;
			} else {
				bettingType3X = 1;
			}
		}
	}

	// if (currentBet2XTrend.entireTrend10 == 2) {
	// 	if (maxDeep <= 2) {
	// 		if (prevScore >= 2) {
	// 			bettingTypeBC = maxDeep == 2 ? 2 : 1;
	// 		} else {
	// 			bettingTypeBC = maxDeep == 2 ? 1 : 2;
	// 		}
	// 	}

	// }


	let foundRight = false;
	for (let i = 0; i < predictRates.length - 1; i++) {
		if (predictRates[i][predictRates[i].length - 1].isRight == 1) {
			foundRight = true;
			break;
		}
	}

	if (foundRight == false) {
		console.log("FOUND INFO", predictRates[0][predictRates[0].length - 1].isRight, predictRates[1][predictRates[1].length - 1].isRight, predictRates[2][predictRates[2].length - 1].isRight)
	}

	// console.log('NEXT RESULT', nextResult);
	// bestBettingTypeLow = nextResult[0] >= 2 ? 2 : 1;
	// bestBettingTypeMid = nextResult[1] >= 2 ? 2 : 1;
	// bestBettingTypeHigh = nextResult[2] >= 2 ? 2 : 1;


	// bestBettingTypeLow = prevScore >= 2 ? 2 : 1
	// bestBettingTypeHigh = prevScore >= 2 ? 1 : 2



	return {
		bettingType1: bestBettingTypeLow, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingType2: bestBettingTypeHigh, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingType3: bestBettingTypeMid,
		bettingTypeBC: bettingTypeBC,
		bettingType3X,
		currentIndexLow,
		currentIndexHigh,
		currentIndexMid,
		skipCount: skipCount,
		is3XPoint: currentBet3XTrend.is3XPoint,
		bettingAvailable: true
	}
}

export const getGoodBranch = (branches, maxCount, checkCount) => {

	const branchArray = branches.map((bData) => {
		let sum = 0;
		let prevBust = -1;
		let plusArray = [];
		let minusArray = [];

		maxCount = bData.data.slice(maxCount * -1).length;
		const data = bData.data.slice(maxCount * -1);
		data.map((row, index) => {
			if (row.isRight == 1) {
				sum += 1;
				if (prevBust == -1) {
					plusArray.push({
						index: index
						, sum
					});
				} else if (prevBust == 1) {
					if (plusArray.length > 0) {
						plusArray[plusArray.length - 1] = {
							index: index
							, sum
						};
					}
				} else {
					plusArray.push({
						index: index
						, sum
					});
				}

			} else {
				sum -= 1;
				if (prevBust == -1) {
					minusArray.push({
						index: index
						, sum
					});
				} else if (prevBust == 0) {
					if (minusArray.length > 0) {
						minusArray[minusArray.length - 1] = {
							index: index
							, sum
						};
					}
				} else {
					minusArray.push({
						index: index
						, sum
					});
				}

			}
			prevBust = row.isRight;
			return sum;
		});

		let currentLosePoint = 1;
		let currentLoseSum = 0;
		let theFirstLoseSum = 0;
		let foundMinuses = [];
		let currentLosePointIndex = 1;
		try {
			// let's get the first minus;
			if (minusArray.length != 0) {
				foundMinuses.push(minusArray[minusArray.length - currentLosePointIndex]);
				theFirstLoseSum = currentLoseSum = minusArray[minusArray.length - currentLosePointIndex].sum;
				currentLosePoint = minusArray[minusArray.length - currentLosePointIndex].index;

				while (currentLosePointIndex < minusArray.length
					|| minusArray[minusArray.length - currentLosePointIndex].index >= (maxCount - checkCount)) {
					currentLosePointIndex++;
					if (minusArray[minusArray.length - currentLosePointIndex].sum <= theFirstLoseSum) {
						foundMinuses.push(minusArray[minusArray.length - currentLosePointIndex]);
						currentLoseSum = minusArray[minusArray.length - currentLosePointIndex].sum;
						currentLosePoint = minusArray[minusArray.length - currentLosePointIndex].index;
						if (minusArray[minusArray.length - currentLosePointIndex].sum < theFirstLoseSum) {
							//console.log('WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', i, theFirstLoseSum, minusArray, );
							break;
						}
					}

				}
			}
		} catch (err) {
			console.log('ERRRRRRRR', bData.branchIndex, theFirstLoseSum, currentLosePointIndex, minusArray, foundMinuses)
		}

		if (foundMinuses.length == 0) {
			currentLosePoint = maxCount - checkCount;
		} else if (foundMinuses.length < 2) {

			// console.log('aaaaaaaaa', foundMinuses);
			currentLosePoint = foundMinuses[0].index; //maxCount - checkCount;
			// currentLosePoint = foundMinuses[0].index;
		} else if (foundMinuses[0].sum == foundMinuses[foundMinuses.length - 1].sum) {
			currentLosePoint = maxCount - checkCount;
		} else if (currentLosePoint < (maxCount - checkCount)) {
			currentLosePoint = maxCount - checkCount;
		}

		// console.log("CURRENT POINTS: ", bData.branchIndex, currentLosePointIndex);
		const data10 = data.slice(currentLosePoint - 0, data.length);


		let sum1 = 0;
		let yData = data10.map((row, index) => {
			if (index == 0) {
				sum1 = 0;
			} else {
				if (row.isRight == 1) {
					sum1 += 1;
				} else {
					sum1 -= 1;
				}
				return sum1;
			}

			return sum1
		});

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
		
		return {
			branchIndex: bData.branchIndex,
			sma2: yDataSMA[0] ? yDataSMA[0][yDataSMA[0].length - 1] : -100,
			sma3: yDataSMA[1] ? yDataSMA[1][yDataSMA[1].length - 1] : -100,
			sma4: yDataSMA[2] ? yDataSMA[2][yDataSMA[2].length - 1] : -100,
			yData: yData,
			data: bData.data,
			isRight: bData.data.length != 0 ? bData.data[bData.data.length - 1].isRight : 0,
			sum,
			bettingType: bData.bettingType
		}
	})

	branchArray.sort((a, b) => {
		if (b.isRight == a.isRight) {
			if (b.sma2 == a.sma2) {
				return b.sum - a.sum;
			}
			return b.sma2 - a.sma2
		}

		return b.isRight - a.isRight
		
	});

	return branchArray;

}


export const getBettingTypeWithCount = (bettingTypes, bettingTypeIndexes, count = 3) => {

	const win3Indexes = [];

	predictRates.map((p, index) => {
		if (p.slice(count * -1).filter(p => p.isRight == 1).length == count) {
			win3Indexes.push(index);
		}
	});

	// console.log(win3Indexes);

	if (win3Indexes.length == 0) return {
		bettingType: 0
	};
	let x2Count = 0, x1Count = 0;
	win3Indexes.map(wI => {
		const idx = bettingTypeIndexes.findIndex(p => p == wI);

		if (bettingTypes[idx] == 2) {
			x2Count++;
		} else {
			x1Count++;
		}
	})

	if (x2Count == x1Count) {
		return {
			bettingType: 0,
			x2Count,
			x1Count
		};
	}

	return {
		bettingType: x2Count > x1Count ? 2 : 1,
		x2Count,
		x1Count
	};
}

let prevLine0TotalCount = -1;
export const checkBettingType4 = (subPayouts, maxDeep, currentDeep, prevResult, prevScore, nextResult) => {

	const lastPridectRates = predictRates[0].slice(-5);
	if (lastPridectRates.length < 1) {

		return {
			bettingTypes: [], //bestScores.length == 0 ? 0 : bestBettingType,
			bettingTypeIndexes: [], //bestScores.length == 0 ? 0 : bestBettingType,
			bettingTypeBC: 0,
			bettingAvailable: false
		}
	}

	let goodTrendScoreResult = getGoodTrendScores4(subPayouts, 10, null);





	// console.log("TOP SCORES", goodTrendScoreResult.bestScores.slice(0, 5).map(p => 
	// 	p.index
	// ).join(','));

	




	let skipCount = 0;




	const currentBet2XTrend = getCurrentTrend2X(subPayouts);

	let bettingTypeBC = 2;

	// console.log("currentBet2XTrend===", currentBet2XTrend);

	if (currentBet2XTrend.currentTrend == 0) {
		bettingTypeBC = 2;
	} else if (currentBet2XTrend.currentTrend == 1) {
		bettingTypeBC = 1;
	} else {
		if (currentBet2XTrend.entireTrend10 == 0) {
			bettingTypeBC = 2;
		} else if (currentBet2XTrend.entireTrend10 == 1) {
			bettingTypeBC = 1
		} else {
			if (prevScore >= 2) {
				bettingTypeBC = 2;
			} else {
				bettingTypeBC = 1;
			}
		}
	}


	let totalBettingType = 0;
	let x2Count = 0, x1Count = 0;
	logFatal('TOP SCORES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')


	let satisticType = 1;
	
	goodTrendScoreResult.bestScores.filter(p => p.winRate >= 50).map(p => {
		
		let bettingType = 0;
		if (p.index < nextResult.values.length) {
			bettingType = nextResult.values[p.index] >= 2 ? 2 : 1
			
		} else if (p.index == nextResult.values.length) {
			bettingType = getStatisticBranchBettingType(nextResult);
		} else {
			bettingType = bettingTypeBC;
		}

		if (bettingType == 2) {
			x2Count++;
		} else {
			x1Count++;
		}
		console.log(p.index, p.winRate, p.totalCount, bettingType);
	});

	console.log("BETTING TYPE: ", x1Count, x2Count, x2Count > x1Count ? '2X' : '1X')

	if (x2Count > x1Count) {
		satisticType = 2;
	} else if (x1Count > x2Count) {
		satisticType = 1;
	} else {
		satisticType = 0;
	}

	if (x2Count > x1Count) {
		totalBettingType = 2;
	} else if (x2Count < x1Count) {
		totalBettingType = 1;
	}

	logFatal('TOP SCORES ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#')


	const currentBet3XTrend = getCurrentTrend3X(subPayouts);

	let bettingType3X = 2;

	// console.log("currentBet2XTrend===", currentBet2XTrend);

	if (currentBet3XTrend.currentTrend == 0) {
		bettingType3X = 2;
	} else if (currentBet3XTrend.currentTrend == 1) {
		bettingType3X = 1;
	} else {
		if (currentBet3XTrend.entireTrend10 == 0) {
			bettingType3X = 2;
		} else if (currentBet3XTrend.entireTrend10 == 1) {
			bettingType3X = 1
		} else {
			if (prevScore >= 3) {
				bettingType3X = 2;
			} else {
				bettingType3X = 1;
			}
		}
	}

	let foundRight = false;
	for (let i = 0; i < predictRates.length - 1; i++) {
		if (predictRates[i][predictRates[i].length - 1].isRight == 1) {
			foundRight = true;
			break;
		}
	}

	if (foundRight == false) {
		console.log("FOUND INFO", predictRates[0][predictRates[0].length - 1].isRight, predictRates[1][predictRates[1].length - 1].isRight, predictRates[2][predictRates[2].length - 1].isRight)
	}

	const bettingTypes = [];
	const bettingTypeIndexes = [];
	const bettingTypeWinRates = [];
	goodTrendScoreResult.bestScores.map((b) => {
		if (b.index < nextResult.values.length) {
			bettingTypes.push(nextResult.values[b.index] >= 2 ? 2 : 1)
			bettingTypeIndexes.push(b.index);
		} else if (b.index == nextResult.values.length) {
			bettingTypes.push(getStatisticBranchBettingType(nextResult));
			bettingTypeIndexes.push(b.index);
		} else {
			bettingTypes.push(bettingTypeBC);
			bettingTypeIndexes.push(b.index);
		}

		bettingTypeWinRates.push(b.winRate);
	})


	// const sortedBranches = getSortedBranches(predictRates, 30, 10);

	// sortedBranches.map((b) => {
		
	// 	if (b.branchIndex < nextResult.values.length) {
	// 		bettingTypes.push(nextResult.values[b.branchIndex] >= 2 ? 2 : 1)
	// 		bettingTypeIndexes.push(b.branchIndex);
	// 	} else if (b.branchIndex == nextResult.values.length) {
	// 		bettingTypes.push(getStatisticBranchBettingType(nextResult));
	// 		bettingTypeIndexes.push(b.branchIndex);
	// 	} else {
	// 		bettingTypes.push(bettingTypeBC);
	// 		bettingTypeIndexes.push(b.branchIndex);
	// 	}

	// 	bettingTypeWinRates.push(0);
	// })




	// console.log('ORIGIN 0', goodTrendScoreResult.originalScores[0]);
	const returnResult = {	
		bettingTypes: bettingTypes, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingTypeIndexes: bettingTypeIndexes, //bestScores.length == 0 ? 0 : bestBettingType,
		bettingTypeWinRates,
		bettingTypeBC: bettingTypeBC,
		bettingType3X,
		bettingTypeSpecial: (goodTrendScoreResult.originalScores[0].totalCount >= 6155 
			&& prevLine0TotalCount != goodTrendScoreResult.originalScores[0].totalCount) ? satisticType : 0,
		totalBettingType,
		skipCount: skipCount,
		is3XPoint: currentBet3XTrend.is3XPoint,
		bettingAvailable: true
	}

	prevLine0TotalCount = goodTrendScoreResult.originalScores[0].totalCount;


	return returnResult;
}


export const getSma = (data, length, counts) => {
	try {
		let sum = 0;
		let yData = data.slice(length * -1).map((row, index) => {
			if (index == 0) return 0;
			if (row == 1) {
				sum += 1;
			} else {
				sum -= 1;
			}
			return sum;
		});
		let yDataSMA = [];
		for (let i = 0; i < yData.length; i++) {
			counts.map((count, index) => {
				if (yDataSMA.length < (index + 1)) {
					yDataSMA.push([]);
				}
				if (i < (count - 1)) {
					yDataSMA[index].push(0);
				} else {
					const v = yData.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
					yDataSMA[index].push(v);
				}
			})
		}

		// console.log("SMA DATA", yDataSMA);

		return yDataSMA;
	} catch (err) {
		return null;
	}
}
export const getHighScoreBet2 = (data, data2, longCount, shortCount, trend1, trend2) => {


	try {
		const smaData1 = getSma(data.map(p => p.isRight), shortCount, [2, 4]);
		const smaData2 = getSma(data2.map(p => p.isRight), shortCount, [2, 4]);


		logInfo("GRAPH DATA", smaData2[0][smaData2[0].length - 1], smaData1[0][smaData1[0].length - 1],);

		if (smaData2[0][smaData2[0].length - 1] > smaData1[0][smaData1[0].length - 1]) {
			return 2
		} else if (smaData2[0][smaData2[0].length - 1] == smaData1[0][smaData1[0].length - 1]) {

			if (trend1 == 0) return 1;
			if (trend2 == 0) return 2;

			return trend1 == 1 ? 2 : 1;
			// const smaData1 = getSma(data.map(p => p.isRight), longCount, [2]);
			// const smaData2 = getSma(data2.map(p => p.isRight), longCount, [2]);

			// if (smaData2[0][smaData2[0].length - 1] > smaData1[0][smaData1[0].length - 1]) {
			// 	return 2

			// } else {
			// 	return 1;
			// }
		} else {
			return 1;
		}
	} catch (err) {
		console.log("ERROR ~~~~~~~~~~~~~~~~~~~~~~~~ getHighScoreBet", err)

		return 1;
	}


}
export const getHighScoreBet = (data, bettingType) => {

	try {
		let sum = 0;
		let sum2 = 0;
		let yData2 = [];

		let yData = data.map((row, index) => {
			if (row.isRight == 1) {
				sum += 1;
				sum2 -= 1;
			} else {
				sum -= 1;
				sum2 += 1;
			}

			yData2.push(sum2);
			return sum;
		});

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

		let yDataSMA2 = [];
		for (let i = 0; i < yData2.length; i++) {
			[2, 3, 4].map((count, index) => {
				if (yDataSMA2.length < (index + 1)) {
					yDataSMA2.push([]);
				}
				if (i < count - 1) {
					yDataSMA2[index].push(0);
				} else {
					const v = yData2.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
					yDataSMA2[index].push(v);
				}
			})
		}

		if (yDataSMA2[0][yDataSMA2[0].length - 1] > yDataSMA[0][yDataSMA[0].length - 1]) {
			return bettingType == 2 ? 1 : 2;

		} else {
			return bettingType;
		}
	} catch (err) {
		console.log("ERROR ~~~~~~~~~~~~~~~~~~~~~~~~ getHighScoreBet", err)
	}


}
const getGoodTrendScores = (nextResult, checkCount, branches = null) => {

	const rateCount = 10;
	let winCount = 0;
	const loseCounts = [];
	const winCounts = [];
	let loseCount = 0;
	let maxWinCount = 0;
	const bestScores = [];
	for (let i = 0; i < predictRates.length; i++) {
		predictRates[i].slice(rateCount * -1).map((p, index) => {
			if (p.isRight == 1) {
				winCount++;
				maxWinCount++;
				loseCount = 0;
				winCounts.push(maxWinCount);
			}

			if (p.isRight == 0) {
				loseCount++;
				maxWinCount = 0;
				loseCounts.push(loseCount);
			}


		})

		const data = predictRates[i].slice(checkCount * -1);


		const payoutResult = sortValues(data.slice(-20).map(p => p.isRight), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		// console.log("PPPPPPPPPPPPPPPPP~", i, payoutResult);
		const checkLength = 5
		const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

		const lastValue = data[data.length - 1].isRight;

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


		// console.log(`MAX DEEP ${i}`, maxDeep, lastValue, pLength);
		let sum = 0;
		let yData = data.map((row, index) => {
			if (index == 0) {
				sum = 0;
			} else {
				if (row.isRight == 1) {
					sum += 1;
				} else {
					sum -= 1;
				}
				return sum;
			}

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

		let trendStatus = 1;
		if (
			yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1]
		) {
			trendStatus = 0 //"GOOD"; // good
		} else if (
			yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[0][yDataSMA[0].length - 1]
		) {
			trendStatus = 2 //"BAD"; // bad
		}

		let failedCount = 0, foundRight = false;
		predictRates[i].slice(-3).reverse().map(p => {
			if (foundRight) return;
			if (p.isRight == 1) {
				foundRight = true;
				return;
			}

			failedCount++;
		})
		if (branches == null || branches.includes(i)) {
			// if (i==0) {
			bestScores.push({
				trendStatus: trendStatus,
				index: i,
				maxDeep,
				lastSma2: yDataSMA[0][yDataSMA[0].length - 1],
				lastSma3: yDataSMA[1][yDataSMA[1].length - 1],
				lastSma4: yDataSMA[2][yDataSMA[2].length - 1],
				payout: nextResult[i],
				rate5: predictRates[i].slice(-5).filter(p => p.isRight == 1).length * 100 / predictRates[i].slice(-5).length,
				rate50: predictRates[i].slice(rateCount * -1).filter(p => p.isRight == 1).length * 100 / predictRates[i].slice(rateCount * -1).length,
				failedCount: failedCount,
				maxLose: Math.max(...loseCounts),
				maxWin: Math.max(...winCounts),
			});
		}

		//}
	}

	// bestScores.sort((a, b) => {
	// 	return b.lastSma2 - a.lastSma2;
	// 	if (a.rate5 == b.rate5) {
	// 		return b.lastSma2 - a.lastSma2;
	// 	} else {
	// 		return b.rate5 - a.rate5;
	// 	}
	// 	// return a.lastSma2 - b.lastSma2;
	// });


	const finalBestScoresLow = bestScores.sort((a, b) => {
		return b.rate5 - a.rate5;
	}).slice(0, 5);


	const finalBestScoresHigh = bestScores.sort((a, b) => {
		return b.lastSma2 - a.lastSma2;
	}).slice(0, 50000);

	finalBestScoresLow.sort((a, b) => {
		return a.lastSma2 - b.lastSma2;
	});

	finalBestScoresHigh.sort((a, b) => {
		// return b.lastSma2 - a.lastSma2;
		return a.trendStatus - b.trendStatus
	});

	// check current index is still avaialbe;
	let selectedBestScore = null, foundBestScore = false;
	finalBestScoresHigh.map(b => {
		if (foundBestScore) return;
		if (b.failedCount == 0) {
			selectedBestScore = b;
			foundBestScore = true;
			return;
		}
	});

	// console.log({finalBestScoresHigh});

	return {
		bestScores: finalBestScoresHigh,
		selectedBestScore: finalBestScoresHigh[0]
	}
}


export const getSortedBranches = (predictRates, maxCount, checkCount) => {


	let bestScores = [];

	try {
		for (let i = 0; i < predictRates.length; i++) {
			const data = predictRates[i].slice(maxCount * -1);

			let sum = 0;
			let prevBust = -1;
			let plusArray = [];
			let minusArray = [];


			data.map((row, index) => {
				if (row.isRight == 1) {
					sum += 1;
					if (prevBust == -1) {
						plusArray.push({
							index: index
							, sum
						});
					} else if (prevBust == 1) {
						if (plusArray.length > 0) {
							plusArray[plusArray.length - 1] = {
								index: index
								, sum
							};
						}
					} else {
						plusArray.push({
							index: index
							, sum
						});
					}

				} else {
					sum -= 1;
					if (prevBust == -1) {
						minusArray.push({
							index: index
							, sum
						});
					} else if (prevBust == 0) {
						if (minusArray.length > 0) {
							minusArray[minusArray.length - 1] = {
								index: index
								, sum
							};
						}
					} else {
						minusArray.push({
							index: index
							, sum
						});
					}

				}
				prevBust = row.isRight;
				return sum;
			});

			let currentLosePoint = 1;
			let currentLoseSum = 0;
			let theFirstLoseSum = 0;
			let foundMinuses = [];
			let currentLosePointIndex = 1;
			try {
				if (minusArray.length != 0) {
					// let's get the first minus;
					foundMinuses.push(minusArray[minusArray.length - currentLosePointIndex]);
					theFirstLoseSum = currentLoseSum = minusArray[minusArray.length - currentLosePointIndex].sum;
					currentLosePoint = minusArray[minusArray.length - currentLosePointIndex].index;

					while (currentLosePointIndex <= minusArray.length
						|| minusArray[minusArray.length - currentLosePointIndex].index >= (maxCount - checkCount)) {
						currentLosePointIndex++;
						if (minusArray[minusArray.length - currentLosePointIndex].sum <= theFirstLoseSum) {
							foundMinuses.push(minusArray[minusArray.length - currentLosePointIndex]);
							currentLoseSum = minusArray[minusArray.length - currentLosePointIndex].sum;
							currentLosePoint = minusArray[minusArray.length - currentLosePointIndex].index;
							if (minusArray[minusArray.length - currentLosePointIndex].sum < theFirstLoseSum) {

								//console.log('WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', i, theFirstLoseSum, minusArray, );
								break;
							}
						}

					}
				}
			} catch (err) {
				// console.log('ERRRRRRRR', i, theFirstLoseSum, currentLosePointIndex, minusArray)
			}

			if (foundMinuses.length == 0) {
				currentLosePoint = maxCount - checkCount;
			}
			else if (foundMinuses.length < 2) {
				currentLosePoint = maxCount - checkCount;
				// currentLosePoint = foundMinuses[0].index;
			} else if (foundMinuses[0].sum == foundMinuses[foundMinuses.length - 1].sum) {
				currentLosePoint = maxCount - checkCount;
			} else if (currentLosePoint < (maxCount - checkCount)) {
				currentLosePoint = maxCount - checkCount;
			}
			const data10 = data.slice(currentLosePoint - 0, data.length);



			let sum1 = 0;

			// console.log(`MAX DEEP ${i}`, maxDeep, lastValue, pLength);
			let yData = data10.map((row, index) => {
				if (index == 0) {
					sum1 = 0;
				} else {
					if (row.isRight == 1) {
						sum1 += 1;
					} else {
						sum1 -= 1;
					}
					return sum1;
				}

				return sum1;
			});


			let yDataSMA = [];
			for (let j = 0; j < yData.length; j++) {
				[2, 3, 4].map((count, index) => {
					if (yDataSMA.length < (index + 1)) {
						yDataSMA.push([]);
					}
					if (j < (count - 1)) {
						yDataSMA[index].push(0);
					} else {
						const v = yData.slice(j - count + 1, j + 1).reduce((a, b) => a + b, 0) / count;
						yDataSMA[index].push(v);
					}
				})
			}

			bestScores.push({
				branchIndex: i,
				type: data[0] ? data[0].type : 'normal',
				lastSma2: yDataSMA[0] ? yDataSMA[0][yDataSMA[0].length - 1] : 0,
				payouts10: data10,
				sum: sum,
				payouts100: predictRates[i].slice(-100)
			});
		}

		bestScores.sort((a, b) => {
			if (b.lastSma2 == a.lastSma2) {
				return b.sum - a.sum;
			}
			return b.lastSma2 - a.lastSma2;
		}).slice(0, 50000);
		//bestScores.slice(0, 50000);
		return bestScores;
	} catch (err) {
		console.log("ERRRRRRRRRRRRRRRRRRR", err);

		return [];
	}
}

const getGoodTrendScores4 = (subPayouts, checkCount, branches = null) => {

	const rateCount = 10;
	let winCount = 0;
	const loseCounts = [];
	const winCounts = [];
	let loseCount = 0;
	let maxWinCount = 0;
	const bestScores = [];
	for (let i = 0; i < predictRates.length; i++) {


		if (predictRates[i].length == 0) continue;
		predictRates[i].slice(rateCount * -1).map((p, index) => {
			if (p.isRight == 1) {
				winCount++;
				maxWinCount++;
				loseCount = 0;
				winCounts.push(maxWinCount);
			}

			if (p.isRight == 0) {
				loseCount++;
				maxWinCount = 0;
				loseCounts.push(loseCount);
			}
		});


		const subPayoutsPattern = sortValues(subPayouts.slice((i + 5) * -1), (v) => {
			return v == 2 ? 1 : 0 // 1 is green, 0 is red
		}, 2);

		const {winRate, totalCount} = getPredictWinRate(subPayoutsPattern, i + 5, i);

		console.log(i, winRate, totalCount);



		let maxDeep = 0;

		const data = predictRates[i].slice(checkCount * -1);

		const payoutResult = sortValues(data.slice(-20).map(p => p.isRight), (v) => {
			return v == 1 ? 1 : 0 // 1 is green, 0 is red
		}, 1);

		// console.log("PPPPPPPPPPPPPPPPP~", i, JSON.stringify(payoutResult.values));
		const checkLength = 5
		const pLength = payoutResult.values.map(p => p.length).slice(0, checkLength);

		const lastValue = data[data.length - 1].isRight;

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
		maxDeep = Math.max(...vs);



		let sum = 0;
		let prevBust = -1;
		let plusArray = [];
		let minusArray = [];


		data.map((row, index) => {
			if (row.isRight == 1) {
				sum += 1;
				if (prevBust == -1) {
					plusArray.push({
						index: index
						, sum
					});
				} else if (prevBust == 1) {
					if (plusArray.length > 0) {
						plusArray[plusArray.length - 1] = {
							index: index
							, sum
						};
					}
				} else {
					plusArray.push({
						index: index
						, sum
					});
				}

			} else {
				sum -= 1;
				if (prevBust == -1) {
					minusArray.push({
						index: index
						, sum
					});
				} else if (prevBust == 0) {
					if (minusArray.length > 0) {
						minusArray[minusArray.length - 1] = {
							index: index
							, sum
						};
					}
				} else {
					minusArray.push({
						index: index
						, sum
					});
				}

			}
			prevBust = row.isRight;
			return sum;
		});

		let currentLosePoint = 1;
		let currentLoseSum = 100000;
		let foundMinuses = [];

		let isRightLastPoint = data[data.length - 1].isRight == 1;
		let currentLosePointIndex = 1;
		try {
			while (currentLosePointIndex <= minusArray.length) {
				if (minusArray[minusArray.length - currentLosePointIndex].sum <= currentLoseSum) {
					foundMinuses.push(minusArray[minusArray.length - currentLosePointIndex]);
					currentLoseSum = minusArray[minusArray.length - currentLosePointIndex].sum;
					currentLosePoint = minusArray[minusArray.length - currentLosePointIndex].index;
					if (minusArray[minusArray.length - currentLosePointIndex].sum < currentLoseSum) {
						break;
					}
				}
				currentLosePointIndex++;
			}
		} catch (err) {
			console.log('ERRRRRRRR', err, i, minusArray)
		}

		let is1010Pattern = false;
		if (foundMinuses.length == 0) {
			currentLosePoint = 0;
		}
		else if (foundMinuses.length < 2) {
			currentLosePoint = foundMinuses[0].index;
		} else if (foundMinuses[0].sum == foundMinuses[foundMinuses.length - 1].sum) {
			currentLosePoint = 0;
			is1010Pattern = true;
		} else {
			// let's check it's 1010 pattern

			if (foundMinuses.length >= 3) {
				is1010Pattern = true;
			}
		}
		const data10 = data.slice(currentLosePoint - 0, data.length);


		// is1010Pattern = is1010Pattern && check1010Pattern(data10.map(p => p.isRight), 1) && !isRightLastPoint;

		const pattern = pLength.slice(0, 3).join(',');
		const pattern1 = pLength.join(',');

		is1010Pattern = pattern == '1,1,1,1' && isRightLastPoint;

		if (is1010Pattern) {
			console.log("1010 PATTERN FOUND", i, pattern, pattern1)
		}
		sum = 0;

		// console.log(`MAX DEEP ${i}`, maxDeep, lastValue, pLength);
		let yData = data10.map((row, index) => {
			if (index == 0) {
				sum = 0;
			} else {
				if (row.isRight == 1) {
					sum += 1;
				} else {
					sum -= 1;
				}
				return sum;
			}

			return sum;
		});


		let yDataSMA = [];
		for (let j = 0; j < yData.length; j++) {
			[2, 3, 4].map((count, index) => {
				if (yDataSMA.length < (index + 1)) {
					yDataSMA.push([]);
				}
				if (j < (count - 1)) {
					yDataSMA[index].push(0);
				} else {
					const v = yData.slice(j - count + 1, j + 1).reduce((a, b) => a + b, 0) / count;
					yDataSMA[index].push(v);
				}
			})
		}

		// console.log('WWWWWWWWWW', yDataSMA);
		let trendStatus = 1;
		if (
			yDataSMA[0] && yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1]
		) {
			trendStatus = 0 //"GOOD"; // good
		} else if (
			yDataSMA[0] && yDataSMA[2][yDataSMA[2].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
			&& yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[0][yDataSMA[0].length - 1]
		) {
			trendStatus = 2 //"BAD"; // bad
		}

		let failedCount = 0, foundRight = false;
		predictRates[i].slice(-3).reverse().map(p => {
			if (foundRight) return;
			if (p.isRight == 1) {
				foundRight = true;
				return;
			}

			failedCount++;
		})
		if (branches == null || branches.includes(i)) {
			// if (i==0) {
			bestScores.push({
				trendStatus: trendStatus,
				is1010Pattern,
				index: i,
				maxDeep,
				lastSma2: yDataSMA[0] ? yDataSMA[0][yDataSMA[0].length - 1] : 0,
				lastSma3: yDataSMA[1] ? yDataSMA[1][yDataSMA[1].length - 1] : 0,
				lastSma4: yDataSMA[2] ? yDataSMA[2][yDataSMA[2].length - 1] : 0,
				rate5: predictRates[i].slice(-5).filter(p => p.isRight == 1).length * 100 / predictRates[i].slice(-5).length,
				rate50: predictRates[i].slice(rateCount * -1).filter(p => p.isRight == 1).length * 100 / predictRates[i].slice(rateCount * -1).length,
				failedCount: failedCount,
				maxLose: Math.max(...loseCounts),
				maxWin: Math.max(...winCounts),
				winRate,
				totalCount
				
			});
		}
	}


	const originalScores = [...bestScores];
	const finalBestScoresHigh = bestScores.sort((a, b) => {
		return b.winRate - a.winRate;
		// return b.lastSma2 - a.lastSma2
	}).slice(0, 50000);

	// console.log(finalBestScoresHigh);
	let selectedTop1010Branch = null, found1010Pattern = false;
	finalBestScoresHigh.map(b => {
		if (found1010Pattern) return;
		if (b.is1010Pattern) {
			selectedTop1010Branch = b;
			found1010Pattern = true;
			return;
		}
	});

	// console.log({finalBestScoresHigh});

	return {
		bestScores: finalBestScoresHigh,
		originalScores,
		selectedBestScore: finalBestScoresHigh[0],
		selectedTop1010Branch: selectedTop1010Branch ? selectedTop1010Branch : finalBestScoresHigh[2]
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
		train1({ hash: hashes[i - 2] }, trainCount, TOTAL_BETTING_HISTORY1, 50);
	}
}



export const simulationPastData = (initialHash, counts) => {

	let depositAmount = 100000000;

	let initialBet = 1;
	let initialBet3X = 0;

	let initialBetLose = 1 * Math.pow(2, 2);

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
	let prevTrendStatus = null;

	let currentBet2Xs = [];
	let currentBet3Xs = [];
	let maxBets2X = [];

	let maxBets3X = [];

	let maxBetLose = [];


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


	console.log(payouts.length);


	initializeData3();


	let isGoodMatchedEngine = false;

	let errorCount = 0;

	let breakCount = 3;

	let mainBranch = 1;

	let lostCount = 0;

	for (let i = 100; i < payouts.length - 1; i++) {

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

		let { bettingTypes, bettingTypeIndexes, bettingTypeBC, bettingType3X, is3XPoint, trendStatus, skipCount, bettingAvailable }
			= checkBettingType4(subPayouts, maxDeep, currentDeep, prevPredictValue, lastPayout, predictResult);
		console.log({ bettingTypeBC, trendStatus, skipCount, bettingAvailable })

		if (bettingTypes.length != 0) {
			let bettingOrNot = false;
			bettingOrNot = bettingAvailable && predictRates[0].length >= 40;

			let isRight1 = false;

			if (nextPayout >= 2 && bettingTypes[0] == 2) {
				isRight1 = true;
			} else if (nextPayout < 2 && bettingTypes[0] == 1) {
				isRight1 = true;
			}

			const bettingData1 = {
				isRight: isRight1 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend: bettingType1Trend ? bettingType1Trend.engineTrend : 1,
				entireTrend: bettingType1Trend ? bettingType1Trend.entireTrend2 : 1,
				currentIndex: bettingTypeIndexes[0],
				bettingType: bettingTypes[0],
				payout: payouts[i]
			};

			let isRight2 = false;

			if (nextPayout >= 2 && bettingTypes[1] == 2) {
				isRight2 = true;
			} else if (nextPayout < 2 && bettingTypes[1] == 1) {
				isRight2 = true;
			} else {
				isRight2 = false;
			}

			const bettingData2 = {
				isRight: isRight2 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0,
				engineTrend: bettingType2Trend ? bettingType2Trend.engineTrend : 1,
				entireTrend: bettingType2Trend ? bettingType2Trend.entireTrend2 : 1,
				currentIndex: bettingTypeIndexes[1],
				bettingType: bettingTypes[1],
				payout: payouts[i]
			};

			let isRight3 = false;
			if (nextPayout >= 2 && bettingTypes[2] == 2) {
				isRight3 = true;
			} else if (nextPayout < 2 && bettingTypes[2] == 1) {
				isRight3 = true;
			} else {
				isRight3 = false;
			}

			const bettingData3 = {
				isRight: isRight3 ? 1 : 0,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType3Trend ? bettingType3Trend.engineTrend : 1,
				entireTrend: bettingType3Trend ? bettingType3Trend.entireTrend2 : 1,
				currentIndex: bettingTypeIndexes[2],
				bettingType: bettingTypes[2],
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

			if (lastPayout >= 3) {
				bettingType3X = 2;
			}

			const bettingData3X = {
				isRight: false,
				betOrNot: bettingOrNot ? 1 : 0, //&& (isBetting3 || isSameUp),
				engineTrend: bettingType4Trend ? bettingType4Trend.engineTrend : 1,
				entireTrend: bettingType4Trend ? bettingType4Trend.entireTrend2 : 1,
				currentIndex: 0,
				bettingType: bettingType3X,
				payout: payouts[i],
			};

			let percentCount = -6

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
			const branches = JSON.parse(fs.readFileSync(`./branch.json`));

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
					bettingType: bettingTypes[1],
				},
				{
					value: graph1, branchIndex: 1, maxDeep: bettingType1Trend ? bettingType1Trend.maxDeep : 0,
					diff10: bettingType1Trend ? bettingType1Trend.diff10 : 0,
					sma2: bettingType1Trend ? bettingType1Trend.values1[0] : 0,
					sma3: bettingType1Trend ? bettingType1Trend.values1[1] : 0,
					bettingType: bettingTypes[0],
				}
				,
				{
					value: graph3, branchIndex: 3, maxDeep: bettingType3Trend ? bettingType3Trend.maxDeep : 0,
					diff10: bettingType3Trend ? bettingType3Trend.diff10 : 0,
					sma2: bettingType3Trend ? bettingType3Trend.values1[0] : 0,
					sma3: bettingType3Trend ? bettingType3Trend.values1[1] : 0,
					bettingType: bettingTypes[2],
				},

			].filter(p => branches.includes(p.branchIndex));



			let specialBranch = branches.filter(p => p >= 100);
			let specialBranchIndex = -1;
			if (specialBranch.length == 0) {
				specialBranchIndex = -1;
			} else {
				specialBranchIndex = specialBranch[0] - 100;

				rightCount = 0;

				// console.log("specialBranchIndex-", specialBranchIndex, predictRates, predictResult);
				predictRates[specialBranchIndex].slice(percentCount).map(p => {
					if (p.isRight == 1) {
						rightCount++;
					}
				});

				const graph5 = rightCount * 100 / predictRates[specialBranchIndex].slice(percentCount).length;
				TOTAL_BETTING_HISTORY.slice(-50), 3
				const bettingTypeTrend5 = getBettingTypeTrend(predictRates[specialBranchIndex].slice(-50), 3);

				graphArray.push({
					value: graph5, branchIndex: 5, maxDeep: bettingTypeTrend5 ? bettingTypeTrend5.maxDeep : 0,
					diff10: bettingTypeTrend5 ? bettingTypeTrend5.diff10 : 0,
					sma2: bettingTypeTrend5 ? bettingTypeTrend5.values1[0] : 0,
					sma3: bettingTypeTrend5 ? bettingTypeTrend5.values1[1] : 0,
					bettingType: predictResult.values[specialBranchIndex],
				});



			}

			const sortedGraph = [...graphArray].sort((a, b) => {

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

			let selectedGraph = sortedGraph[0];
			if (selectedGraph) {

				// if (is3XPoint || lastPayout >= 3) {
				// 	selectedGraph.bettingType = 2;
				// }
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



			console.log("3X BET~~~~~~~~~~~", payouts[i], bettingData.bettingType, bettingData3X.bettingType, bettingOrNot, bettingData.betOrNot)

			if (bettingData.betOrNot == 1) {
				let isRight = false;
				bettingData.isRight = isRight ? 1 : 0
				bettingData.currentIndex = 0;
			}

			// console.log({ selectedGraph, bettingData });

			logError("MAIN BRANCH", JSON.stringify({
				branch: selectedGraph ? selectedGraph.branchIndex : 0, nextPayout
			}));
			// logSuccess("BETTING TYPES", JSON.stringify({ bettingType1, bettingType2, bettingType3, bettingTypeBC }));
			addPredictRatesForTest(payouts[i], predictResult, bettingTypeBC);

			
			TOTAL_BETTING_HISTORY1.push(bettingData1);
			TOTAL_BETTING_HISTORY2.push(bettingData2);
			TOTAL_BETTING_HISTORY3.push(bettingData3);
			TOTAL_BETTING_HISTORY4.push(bettingData4);
			TOTAL_BETTING_HISTORY2X.push(bettingData2X);
			TOTAL_BETTING_HISTORY3X.push(bettingData3X);
			bettingData.betOrNot = 0;
			TOTAL_BETTING_HISTORY.push(bettingData);

			console.log('3333333333333333333333333')
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST1.json', JSON.stringify(TOTAL_BETTING_HISTORY1, null, 4));
			fs.writeFileSync('./PREDICTS.json', JSON.stringify(predictRates, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2.json', JSON.stringify(TOTAL_BETTING_HISTORY2, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3.json', JSON.stringify(TOTAL_BETTING_HISTORY3, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST4.json', JSON.stringify(TOTAL_BETTING_HISTORY4, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST.json', JSON.stringify(TOTAL_BETTING_HISTORY, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST3X.json', JSON.stringify(TOTAL_BETTING_HISTORY3X, null, 4));
			fs.writeFileSync('./TOTAL_BETTING_HISTORY_TEST2X.json', JSON.stringify(TOTAL_BETTING_HISTORY2X, null, 4));
			console.log('444444444444444444444444444')
			fs.writeFileSync('./PREDICTS_PAYOUTS.json', JSON.stringify(payouts.slice(i - 100, i + 1), null, 4));

			console.log('5555555555555555555555555555')


			console.log(
				'BETTING DATA2X', TOTAL_BETTING_HISTORY2X.slice(-1)[0]
			)
			if (isRight3) {
				logSuccess(i - 100, "SCORE:", nextPayout, "CURRENT LOSE BET: ", currentBetLose, "TOTAL LOSE AMOUNT: ", totalLoseAmount, "MAX LOSE BET: ", Math.max(...maxBetLose), "CURRENT AMOUNT:", currentAmount, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "TOTAL:", totalAmount, "TREND 2X:", currentTrend2X, "TREND 3X:", currentTrend3X, 'MAX BET 2X:', Math.max(...maxBets2X), 'CURRENT 3X MAX BET:', Math.max(...currentBet3Xs), 'MAX BET 3X:', Math.max(...maxBets3X))
			} else {
				logFatal(i - 100, "SCORE:", nextPayout, "CURRENT LOSE BET: ", currentBetLose, "TOTAL LOSE AMOUNT: ", totalLoseAmount, "MAX LOSE BET: ", Math.max(...maxBetLose), "CURRENT AMOUNT:", currentAmount, "2X BET:", currentBet2X, "3X BET:", currentBet3X, "TOTAL:", totalAmount, "TREND 2X:", currentTrend2X, "TREND 3X:", currentTrend3X, 'MAX BET 2X:', Math.max(...maxBets2X), 'CURRENT 3X MAX BET:', Math.max(...currentBet3Xs), 'MAX BET 3X:', Math.max(...maxBets3X))
			}

			let logTxt = `${i - 100}, SCORE: ${nextPayout}, CURRENT LOSE BET: ${currentBetLose}, TOTAL LOSE AMOUNT: ${totalLoseAmount}, MAX LOSE BET: ${Math.max(...maxBetLose)}, CURRENT AMOUNT: ${currentAmount}, CURRENT 2X BET: ${currentBet2X}, TOTAL: ${totalAmount}, TREND 2X: ${currentTrend2X}, TREND 3X: ${currentTrend3X}, CURRENT MAX BET: ${Math.max(...currentBet2Xs)}, MAX BET: ${Math.max(...maxBets2X)}\n`

			fs.appendFileSync('log.txt', logTxt, function (err) {
			});

			logWarn('---------------------------------------------------------------------------------------------------------------------\n')

		} else {
			addPredictRatesForTest(payouts[i], predictResult, bettingTypeBC);
		}

		// console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW");

		prevPredictValue = predictResult;
		prevTrendStatus = trendStatus;
	}
}

// initializeData();

// initializeData3();
