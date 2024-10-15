
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CryptoJS = require("crypto-js");

export const match = (a, b) => {
  if (a === null || a === undefined) return false;
  return a.toLowerCase() === b.toLowerCase();
};


// get bc game score
export const gameResult = (seed, salt) => {
  const nBits = 52; // number of most significant bits to use

  // 1. HMAC_SHA256(message=seed, key=salt)  
  if (salt) {

    const hmac = CryptoJS.HmacSHA256(CryptoJS.enc.Hex.parse(seed), salt);
    seed = hmac.toString(CryptoJS.enc.Hex);
  }

  // 2. r = 52 most significant bits
  seed = seed.slice(0, nBits / 4);
  const r = parseInt(seed, 16);

  // 3. X = r / 2^52
  let X = r / Math.pow(2, nBits); // uniformly distributed in [0; 1)
  X = parseFloat(X.toPrecision(9));

  // 4. X = 99 / (1-X)
  X = 99 / (1 - X);

  // 5. return max(trunc(X), 100)
  const result = Math.floor(X);
  return Math.max(1, result / 100);
};


export const checkColor = (patternValue, deep, color) => {

  
  // check color
  if (patternValue.toString().includes('g')) {
    if (color == 'r') return -1; // not matched but ignore it
  } else if (patternValue.toString().includes('r')) {
    if (color == 'g') return -1; // not matched but ignore it
  }

  if (patternValue.toString().includes('+')) {
    // it means over
    if (deep >= parseInt(patternValue.toString())) {
      return 1;
    }
    if (patternValue.toString().includes('g') || patternValue.toString().includes('r')) return -1

  } else if (patternValue.toString().includes('-')) {
    // it means over
    if (deep <= parseInt(patternValue.toString())) {
      return 1;
    }
    if (patternValue.toString().includes('g') || patternValue.toString().includes('r')) return -1

  } else {
    if (parseInt(patternValue.toString()) == deep) return 1
    if (patternValue.toString().includes('g') || patternValue.toString().includes('r'))
      return -1
    else
      return 0;
  }

  return 0;
}

export const checkPattern = (values, pItem, maxIndex = 20) => {
  let currentValueIndex = 0;
  for (let j = 0; j < pItem.deeps.length; j++) {
    if (values[currentValueIndex] == undefined) return null;

    if (currentValueIndex >= maxIndex) return false;
    let patternType = checkColor(pItem.deeps[j], values[currentValueIndex].length, values[currentValueIndex][0] >= 2 ? 'g' : 'r')

    if (patternType == 1) {
      currentValueIndex++;
    } else if (patternType == 0) { // not matched
      return false
    } else { // ignore
      currentValueIndex++;
      j--;
      continue
    }

    if (j == pItem.deeps.length - 1) {
      return true;
    }
  }
  return false;
}

export const checkTrendDirection = (payouts, start, count = 0) => {
	let endPoint = 0;
    let startPoint = 0;
    if (count >= 0) {
        startPoint = start;
        endPoint = start + count;
    } else {
        startPoint = start + count;
        endPoint = start;
    }

    // console.log(startPoint, endPoint);
    const lastPayouts = payouts.slice(startPoint, endPoint);
    let sum = 0;
    lastPayouts.map(p => {
        if (p >= 3) {
            sum = sum + 2
        } else {
            sum = sum - 1
        }
    })

    return sum;

}


// BC Game payout list
export const sortValues = (data, sortFuc, basePayout = 2) => {
	if (data.length == 0) return;
	let position = data.length;
	let currentIndex = position - 1;
	let cColor = sortFuc(data[currentIndex]); // >= basePayout ? 1 : 0 // 1 is green, 0 is red
	let currentColor = cColor;
	let values = [[data[currentIndex]]]

	currentIndex--;

	while (currentIndex >= 0) {
		if (data[currentIndex] >= basePayout) {
			if (currentColor == 1) {
				// same color, need to push
				values[values.length - 1].unshift(data[currentIndex]);
			} else {
				// different color, need to initialize new array and push it
				values.push([data[currentIndex]]);
			}
			currentColor = 1
		} else {
			if (currentColor == 0) {
				// same color, need to push
				values[values.length - 1].unshift(data[currentIndex]);
			} else {
				// different color, need to initialize new array and push it
				values.push([data[currentIndex]]);
			}
			currentColor = 0
		}

		currentIndex--;

    // console.log('CURRENT INDEX', currentIndex);
		if (values.length > 20) break;
	}

	const v = {
		color: cColor,
		values
	}
	return v;
}