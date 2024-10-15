var config = {
	initialBet: { label: 'Base Amount', value: 1, type: 'number' },
	initialPayout: { label: 'Base Payout', value: 2, type: 'number' },
	startNow: { label: 'Start Now', value: 0, type: 'number' },
	maxBet: { label: 'Max Bet', value: 100, type: 'number' },
	maxLose: { label: 'Max Lose', value: 200, type: 'number' },
	loseTotal: { label: 'Total Lose', value: 0, type: 'number' },
	// winLimit: { label: 'Increase Trigger Count', value: 2, type: 'number' },
	// lossLimit: { label: 'Increase Invest Trigger Count', value: 2, type: 'number' }
}


function getScore(index = 0) {
	let currentIndex = 1 + index
	let color = currentColor = game.history[index].crash >= 200 ? 1 : 0 // 1 is green, 0 is red
	let values = [[game.history[index].crash]]

	while (true) {
		if (currentIndex >= game.history.length) break;
		if (game.history[currentIndex].crash >= 200) {
			if (currentColor == 1) {
				// same color, need to push
				values[values.length - 1].push(game.history[currentIndex].crash);
			} else {
				// different color, need to initialize new array and push it
				values.push([game.history[currentIndex].crash]);
			}
			currentColor = 1
		} else {
			if (currentColor == 0) {
				// same color, need to push
				values[values.length - 1].push(game.history[currentIndex].crash);
			} else {
				// different color, need to initialize new array and push it
				values.push([game.history[currentIndex].crash]);
			}
			currentColor = 0
		}
		currentIndex++;

		if (values.length > 6) break;
	}

	// let's calcuate the score
	let score = 0
	let maxDeep = 0;
	let deep = 0;
	let minusDeepCount = 0;
	let minusDeepScore = 0;
	let greenCount = 0;
	let redCount = 0;
	for (let i = 0; i < values.length; i++) {
		let diffLine = values.length - i - 1;
		if (values[i][0] < 200) {
			minusDeepScore += values[i].length;
			minusDeepCount++

			redCount += values[i].length;
			score -= diffLine * values[i].length
			if (values[i].length > maxDeep) {
				maxDeep = values[i].length;
			}
		} else {
			// log.success(values[i].length)
			score += diffLine * values[i].length
			greenCount += values[i].length;
			// if (i <= 1 && values[i].length > maxDeep) {
			// 	maxDeep = values[i].length;
			// }
		}
	}

	if (values[0][0] < 200) {
		deep = values[0].length;
	}

	return {
		score,
		deep: deep,
		color: color,
		maxDeep: maxDeep,
		avgDeep: (minusDeepScore / minusDeepCount).toFixed(2),
		values: values,
		rate: (greenCount / redCount).toFixed(1)
	}

}


function checkLostRecoverPoint() {

	if (game.history[0].crash >= 200 && game.history[0].crash <= 240) {
		return true;
	}
	if (game.history[0].crash == 100 || game.history[0].crash == 101) {
		return true;
	}
	if (game.history[0].crash >= 172 && game.history[1].crash >= 200) {
		return true;
	}
	if (game.history[0].crash >= 1000 && game.history[0].crash <= 1500) {
		return true;
	}
	var isBadAll = true;
	for (i = 0; i < 7; i++) {
		if (game.history[i].crash >= 2) {
			isBadAll = false;
			break;
		}
	}

	if (isBadAll) return true;

	return false;
}
function checkMoonPositive(alwaysBuy) {
	var isBadAll = true
	for (i = 1; i < 4; i++) {
		if (game.history[i].crash >= 2) {
			isBadAll = false;
			break;
		}
	}

	if (isBadAll) return true
	var checkMoon1 = game.history[0].crash % 10;
	if (checkMoon1 == 0 || checkMoon1 == 9 || checkMoon1 == 1 || checkMoon1 == 4) {
		return true;
	}

	if (game.history[0].crash >= 1000 && game.history[0].crash <= 1500) {
		return true;
	} else if (game.history[0].crash >= 200 && game.history[0].crash <= 250) {
		return true;
	}

	var isAllGreen = true;
	for (i = 0; i < 3; i++) {
		if (game.history[i].crash < 2) {
			isAllGreen = false;
			break;
		}
	}

	if (!isAllGreen) return true;

	return alwaysBuy == 0 ? false : true;
}

function checkMoonNegotive(alwaysBuy) {

	if (game.history[1].crash >= 200 && game.history[1].crash <= 250) { // check prev bust
		return true;
	}

	if (game.history[0].crash == 100 || game.history[0].crash == 101) {
		return true;
	}

	if (game.history[0].crash <= 192  && game.history[0].crash >= 144 && game.history[1].crash >= 200) {
		return true;
	}
	if (game.history[0].crash >= 1000 && game.history[0].crash <= 1500) {
		return true;
	}

	var checkMoon1 = game.history[0].crash % 10;
	if ((checkMoon1 == 0 || checkMoon1 == 9 || checkMoon1 == 1 || checkMoon1 == 4 || checkMoon1 == 5)) {
		return true;
	}
	return alwaysBuy == 0 ? false : true;
}


function main() {
	var initialBet = config.initialBet.value;
	var initialPayout = config.initialPayout.value;
	var maxBet = config.maxBet.value;
	// var maxLose = config.maxLose.value;
	var loseTotal = config.loseTotal.value;

	var startNow = config.startNow.value;
	var minimumBet = 0.01
	var currentBet = startNow == 1 ? initialBet : minimumBet;
	var currentPayout = initialPayout;
	var currentBaseBet = initialBet;
	var currentBasePayout = initialPayout;
	var alwaysBuySetting = 0; //config.alwaysBuy.value;
	var currentAlwaysBuy = alwaysBuySetting;


	
	var loseCountLt164 = 0;
	var isStillLosing = false;

	var loseDeep = 5

	var avgDeep1 = 100
	var maxDeep1 = 100

	game.onBet = function () {
		game.bet(currentBet, currentPayout).then(function (payout) {
			// check score
			const { color, score, deep, maxDeep, avgDeep, rate } = getScore();
			if (color == 0) {
				log.error('LOST: Score: ' + score + " , AvgDeep: " + avgDeep + " , Deep: " + deep + " , MaxDeep: " + maxDeep + " , AvgDeep1: " + avgDeep1 + " , MaxDeep1: " + maxDeep1  + " , Rate: " + rate + ", Total lost: " + loseTotal + ", Length: " + game.history.length);
			} else {
				log.success('SUCCESS: Score: ' + score + " , AvgDeep: " + avgDeep + " , Deep: " + deep + " , MaxDeep: " + maxDeep + " , AvgDeep1: " + avgDeep1 + " , MaxDeep1: " + maxDeep1 + " , Rate: " + rate + " Total lost: " + loseTotal + ", Length: " + game.history.length);
			}

			avgDeep1 = avgDeep;
			maxDeep1 = maxDeep;
			return;
			if (payout == 0) {
				// losing!
				log.error(`Lost! bet: ${currentBet} payout: ${currentPayout}, point: ${game.history[0].crash}`);

				if (currentBet != minimumBet) {
					loseTotal += currentBet;
					maxBet = loseTotal;
				}

				currentBet = currentBet * 2

			} else {
				log.success(`Win! bet: ${currentBet} payout: ${currentPayout}, point: ${game.history[0].crash}, payout: ${payout}`);

				if (currentBet != minimumBet) {
					loseTotal = loseTotal - currentBet * payout + currentBet;
				}

				if (loseTotal < 0) {
					loseTotal = 0;
					currentBaseBet = initialBet
					currentBet = initialBet;
					currentPayout = currentBasePayout = initialPayout;
					maxBet = config.maxBet.value;
				}

				currentBet = minimumBet;
				currentPayout = currentBasePayout = initialPayout;
			}



			if (deep >= 4) {
				log.error(`Really Bad situation!`);
				currentAlwaysBuy = 0;
				currentBet = minimumBet;
				currentBasePayout = initialPayout;
				avgDeep1 = avgDeep;
				maxDeep1 = maxDeep;
				return;
			} else if (deep == 3) { // bad
				log.success(`Bad situation!`);
				currentAlwaysBuy = alwaysBuySetting;
				// check average deep
				if ((avgDeep < 2.7 && avgDeep1 < 2.7) && checkMoonNegotive(currentAlwaysBuy)) {
					// it might to be success, let's invest more
				} else {
					currentBet = minimumBet;
					avgDeep1 = avgDeep;
					maxDeep1 = maxDeep;
					return;
				}
			} else if (deep <= 2) { // good
				log.success(`Good situation!`);
				currentAlwaysBuy = alwaysBuySetting;
				if (currentBet < initialBet) { // it means the invest is minimum for now
					if ((avgDeep <= 1.7 && maxDeep <= 2 && avgDeep1 <= 1.7 && maxDeep1 <= 2) || checkMoonNegotive(currentAlwaysBuy)) {
						currentBaseBet = initialBet;
						currentBet = initialBet;
						currentPayout = currentBasePayout = 2;
					}
				} else { // it means you lost and need to be increased!
					// no idea, just go!
				}
			} else {
				if (currentBet < initialBet) { // it means the invest is minimum for now
					currentBaseBet = initialBet;
					currentBet = initialBet;
					currentPayout = currentBasePayout = 2;
					
				} else { // it means you lost and need to be increased!
					// no idea, just go!
				}
			}

			if (deep <= 1 && avgDeep <= 1.8 && maxDeep <= 2 && avgDeep1 <= 1.8 && maxDeep1 <= 2) { // losing one!

				if (currentBet < loseTotal ) {
					// started lose total
					currentBet = loseTotal * 2 + 3
					//currentBet = maxBet + 10; // need to make profit as big
					currentPayout = currentBasePayout = 2;
				} else {
					// just let's go!
				}
			}
			avgDeep1 = avgDeep;
			maxDeep1 = maxDeep;
		});
	}
}