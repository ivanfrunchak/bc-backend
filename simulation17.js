import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { SERVER_SALT } from "./libs/contants.js";
import { gameResult, sortValues } from "./libs/utils.js";
import { predictHistory } from "./engine.js";
const CryptoJS = require("crypto-js");
const fs = require('fs');

const delay = time => new Promise(res => setTimeout(res, time));


export const checkResult = async (initialHash, counts) => {


	const patternRates = [];

	predictHistory.map((ph, index) => {


		if (patternRates[index] == undefined) {
			patternRates.push([]);
		}
		const count = index + 5;

		for (let i = count; i < ph.length; i++) {
	
			const data = ph.slice(i - count, i);
			const result = ph[i];
	
			const dataPattern = sortValues(data.map(p => p.payout).slice(count * -1), (v) => {
				return v == 2 ? 1 : 0 // 1 is green, 0 is red
			}, 2);
	
	
			const predictColor = dataPattern.color;
			const predictPattern = dataPattern.values.map(p => p.length).join(',');

			const idx = patternRates[index].findIndex(p => p.predictColor == predictColor && p.predictPattern == predictPattern);

			
			if (idx == -1) {
				patternRates[index].push({
					totalCount: 1,
					winCount: result.isRight == 1 ? 1 : 0,
					predictColor,
					predictPattern
				})
			} else {
				patternRates[index][idx].totalCount = patternRates[index][idx].totalCount + 1;
				patternRates[index][idx].winCount += result.isRight == 1 ? 1 : 0;
			}

		}
		

		//console.log(patternRates.slice(-10));
	});


	fs.writeFileSync('./WIN_RATES.json', JSON.stringify(patternRates, null, 4))
}

checkResult();