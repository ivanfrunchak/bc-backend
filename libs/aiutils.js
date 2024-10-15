import { createRequire } from "module";
import { getCurrentTrend2X } from "../engine.js";
const require = createRequire(import.meta.url);

export const getDataForPayout = (score) => {

    if (score >= 10) {
        return 1;
    }

    return parseFloat((score/10).toFixed(3));
    
    
    
}

export const getExpectedPayout = (score) => {
    return parseFloat((score * 10).toFixed(2));
}


export const getDataFor2FloorAmount = (amount, min, max) => {

    // let v = 0;

    // let totalCount = (max - min) / 5000;

    // if (amount <= min) {
    //     v = 0;
    // } else if (amount >= -60000 && amount < -50000){
    //     v = 0.1
    // } else if (amount >= -50000 && amount < -40000){
    //     v = 0.2
    // } else if (amount >= -40000 && amount < -30000){
    //     v = 0.3
    // } else if (amount >= -30000 && amount < -20000){
    //     v = 0.4
    // } else if (amount >= -20000 && amount < -10000){
    //     v = 0.5
    // } else if (amount >= -10000 && amount < 0) {
    //     v = 0.55
    // } else if (amount >= 0 && amount < 10000) {
    //     v = 0.6
    // } else if (amount >= 10000 && amount < 25000) {
    //     v = 0.7
    // } else if (amount >= 25000 && amount < 40000) {
    //     v = 0.8
    // } else if (amount >= 40000 && amount < 55000) {
    //     v = 0.9
    // } else if (amount >= 55000) {
    //     v = 1
    // }


    let v = 0;
    if (amount <= min) {
        v = 0;
    } else if (amount >= max) {
        v = 1;
    } else {
        let v1 = max - min + amount;

        v = parseFloat(v1 / (max - min).toFixed(3));
    }

    

    return v;
}


export const getDataForLoseAmount = (amount, min, max) => {

    // let v = 0;
    // if (amount < -30000) {
    //     v = 0;
    // } else if (amount >= -30000 && amount < -20000){
    //     v = 0.1
    // } else if (amount >= -20000 && amount < -10000){
    //     v = 0.2
    // } else if (amount >= -10000 && amount < 0){
    //     v = 0.3
    // } else if (amount >= 0 && amount < 10000){
    //     v = 0.4
    // } else if (amount >= 10000 && amount < 20000){
    //     v = 0.5
    // } else if (amount >= 20000 && amount < 30000) {
    //     v = 0.6
    // } else if (amount >= 30000 && amount < 40000) {
    //     v = 0.7
    // } else if (amount >= 40000 && amount < 50000) {
    //     v = 0.8
    // } else if (amount >= 60000) {
    //     v = 1
    // }

    let v = 0;
    if (amount <= min) {
        v = 0;
    } else if (amount >= max) {
        v = 1;
    } else {
        let v1 = max - min + amount;

        v = parseFloat(v1 / (max - min).toFixed(3));
    }
    

    return v;
}


export const getDataFor3FloorAmount = (amount, min, max) => {

    let v = 0;
    if (amount <= min) {
        v = 0;
    } else if (amount >= max) {
        v = 1;
    } else {
        let v1 = max - min + amount;

        v = parseFloat(v1 / (max - min).toFixed(3));
    }
    // else if (amount >= -60000 && amount < -50000){
    //     v = 0.1
    // } else if (amount >= -50000 && amount < -40000){
    //     v = 0.2
    // } else if (amount >= -40000 && amount < -30000){
    //     v = 0.3
    // } else if (amount >= -30000 && amount < -20000){
    //     v = 0.4
    // } else if (amount >= -20000 && amount < -10000){
    //     v = 0.5
    // } else if (amount >= -10000 && amount < 0) {
    //     v = 0.55
    // } else if (amount >= 0 && amount < 10000) {
    //     v = 0.6
    // } else if (amount >= 10000 && amount < 25000) {
    //     v = 0.7
    // } else if (amount >= 25000 && amount < 40000) {
    //     v = 0.8
    // } else if (amount >= 40000 && amount < 55000) {
    //     v = 0.9
    // } else if (amount >= 55000) {
    //     v = 1
    // }
    

    return v;
}


export const getDataForDiv = (amount, dviser = 100) => {

    if (amount == undefined) return 0;
    return parseFloat((amount / dviser).toFixed(2));
}

export const getDataForCount = (amount) => {

    if (amount == 0) return 0;

    if (amount == 1) return 0.33;

    if (amount == 2) return 0.66;

    if (amount >= 3) return 1;
}

export const getDataForCount2 = (amount) => {

    if (amount == 0) return 0;

    if (amount == 1) return 0.2;

    if (amount == 2) return 0.4;

    if (amount == 3) return 0.6;

    if (amount == 4) return 0.8;

    if (amount >= 5) return 1;
}

export const getNormalizedData = (s) => {

    // return {
    //     x3Count: s.x3Count,
    //     scoreOfPatternWithLimit: s.scoreOfPatternWithLimit,
    //     scoreOfPatternNoLimit: s.scoreOfPatternNoLimit,
    //     scoreOfPatternWithLose: s.scoreOfPatternWithLose,
    //     x3OfPatternWithLimit: s.x3OfPatternWithLimit,
    //     x3OfPatternNoLimit: s.x3OfPatternNoLimit,
    //     x3OfPatternWithLose: s.x3OfPatternWithLose,
    //     payoutScore: s.score,
    //     scoreOf2Floor: s.loseOf2Deep,
    //     scoreOf3Floor: s.totalLoseOf3Deep,
        
    // }

    return {
        direction: s.score >= 2 ? 1 : 0,
        x3Count: getDataForCount(s.x3Count),
        //scoreOfPatternWithLimit: getDataForDiv(s.scoreOfPatternWithLimit),
        scoreOfPatternNoLimit: getDataForDiv(s.scoreOfPatternNoLimit),
        scoreOfPatternWithLose: getDataForDiv(s.scoreOfPatternWithLose),
        //x3OfPatternWithLimit: getDataForDiv(s.x3OfPatternWithLimit),
        x3OfPatternNoLimit: getDataForDiv(s.x3OfPatternNoLimit),
        x3OfPatternWithLose: getDataForDiv(s.x3OfPatternWithLose),
        payoutScore: getDataForPayout(s.score),
        scoreOf2Floor: getDataFor2FloorAmount(s.loseOf2Deep, -200000, 200000),
        scoreOf3Floor: getDataFor3FloorAmount(s.totalLoseOf3Deep, -200000, 200000),
        loseAmount: getDataForLoseAmount(s.loseAmount, -200000, 200000),
        // bettingCountOfWithLimit: getDataForCount2(s.bettingCountOfWithLimit),
		bettingCountOfNoLimit: getDataForCount2(s.bettingCountOfNoLimit),
		bettingCountOfLose: getDataForCount2(s.bettingCountOfLose),
        // shortDirection: getDataFor3FloorAmount(s.shortDirection, -20, 20),
        // longDirection: getDataFor3FloorAmount(s.longDirection, -20, 20)



        // trenballLowBet: getDataForDiv(s.trenballLowBet),
        // trenballMoonBet: getDataForDiv(s.trenballMoonBet),
        // trenballHighBet: getDataForDiv(s.trenballHighBet),
     }
}


export const getNormalizedData1 = (s) => {

    return {
        direction: s.score >= 2 ? 1 : 0,
        x3Count: getDataForCount(s.x3Count),
        //scoreOfPatternWithLimit: getDataForDiv(s.scoreOfPatternWithLimit),
        scoreOfPatternNoLimit: getDataForDiv(s.scoreOfPatternNoLimit),
        scoreOfPatternWithLose: getDataForDiv(s.scoreOfPatternWithLose),
        // x3OfPatternWithLimit: getDataForDiv(s.x3OfPatternWithLimit),
        x3OfPatternNoLimit: getDataForDiv(s.x3OfPatternNoLimit),
        x3OfPatternWithLose: getDataForDiv(s.x3OfPatternWithLose),
        payoutScore: getDataForPayout(s.score),
        scoreOf2Floor: getDataFor2FloorAmount(s.loseOf2Deep, -200000, 200000),
        scoreOf3Floor: getDataFor3FloorAmount(s.totalLoseOf3Deep, -200000, 200000),
        loseAmount: getDataForLoseAmount(s.loseAmount, -200000, 200000),

		bettingCountOfNoLimit: getDataForCount2(s.bettingCountOfNoLimit),

        // shortDirection: getDataFor3FloorAmount(s.shortDirection, -20, 20),
        // longDirection: getDataFor3FloorAmount(s.longDirection, -20, 20),
		bettingCountOfLose: getDataForCount2(s.bettingCountOfLose),
        aiScore: s.aiScore,
        // trenballLowBet: getDataForDiv(s.trenballLowBet),
        // trenballMoonBet: getDataForDiv(s.trenballMoonBet),
        // trenballHighBet: getDataForDiv(s.trenballHighBet),
        // win3XRate: getDataForDiv(s.win3XRate),
        // win3XRateCount: getDataForCount2(s.total3DeepWinCount),
     }
}

export const getNormalizedPayoutDataWithTrend = (payouts, count) => {

    const input = [];
    
    for (let i = payouts.length - count; i < payouts.length - 1; i++) {
        const {currentTrend, entireTrend10, entireTrend6} = getCurrentTrend2X(payouts.slice(0, i + 1));
        // let trendValue = 0.5
        // if (currentTrend == 0) {
        //     trendValue = 1;
        // } else if (currentTrend == 1) {
        //     trendValue = 0
        // }

        // input.push(trendValue);

        // trendValue = 0.5
        // if (entireTrend10 == 0) {
        //     trendValue = 1;
        // } else if (entireTrend10 == 1) {
        //     trendValue = 0
        // }

        // input.push(trendValue);


        // trendValue = 0.5
        // if (entireTrend6 == 0) {
        //     trendValue = 1;
        // } else if (entireTrend6 == 1) {
        //     trendValue = 0
        // }

        // input.push(trendValue);

        // if (payouts[i] >= 3) {
        //     input.push(1);
        // } else 
        if (payouts[i] >= 2) {
            input.push(1);
        } else {
            input.push(0);
        }
        // input.push(payouts[i] >= 2 ? 1 : 0);
    }

    return input;
    
}
export const getNormalizedPayoutData = (payouts) => {

    // return payouts.map(p => {
    //     if (p >= 5) return 1;
    //     if (p >= 4) return 0.8;
    //     if (p >= 3) return 0.7;

    //     if (p > 2) return 0.5;

    //     return 0.3;

    //     return p >= 3 ? 1 : 0
    // })

    return payouts.map(p => {

        // if (p >= 3) {
        //     return 1;
        // } else 
        if (p >= 2) {
            return 1
        } else {
            return 0;
        }

        // if (p >= 2) return 1;
        
        // return 0;

        // return p >= 3 ? 1 : 0
    })
}


export const getNormalized3XPayoutData = (payouts) => {

    
    return payouts.map(p => {
        
        if (p >= 3) return 0.6;

        return 0.3;
    })
}


export const getNormalizedEngineData = (payouts) => {

    
    return payouts.map(p => {
        
        if (p == 1) return 1;

        return 0;
    })
}


export const getNormalizedEngineData2 = (data) => {

    const inputData = [];
    return data.map(p => {
        return p.isRight
        inputData.push(p.isRight);
        inputData.push(p.engineTrend);
        inputData.push(p.entireTrend);
        // return [p.isRight, p.engineTrend, p.entireTrend]
    })

    return inputData;
}

export const getNormalizedEngineData3 = (data) => {

    const inputData = [];
    data.map(p => {

        inputData.push(p.isRight);
        inputData.push(p.payout >= 2 ? 1 : 0);
        // inputData.push(p.engineTrend);
        // inputData.push(p.entireTrend);
        // return [p.isRight, p.engineTrend, p.entireTrend]
    })

    return inputData;
}


export const getExpectedVerifyData = (score) => {
    if (score >= 0.5) return 1;
    // if (score >= 0.4) return -1;
    return 0;
}

export const getExpectedEnginData2 = (score) => {
    if (score >= 0.51) return 1;
    // if (score >= 0.4) return -1;
    return 0;
}

export const getExpectedEngineData = (score) => {

    if (score > 0.5) return 1;

    return 0;
}


export const getExpectedPayoutData = (score, predictRate) => {
    if (score >= 0.43) {
        return 2;
    } else {
        return 1;
    }

    if (predictRate == undefined || predictRate == null) {
        if (score >= 0.43) {
            return 2;
        } else {
            return 1;
        }
    } else {
        let winCount2XRight = 0;
		let loseCount2XRight = 0;

        let winCount2XLeft = 0;
		let loseCount2XLeft = 0;
        for (let i = 0; i < predictRate.length; i++) {
            // right side percentage
			if (predictRate[i].score >= score && predictRate[i].score <= 1) {
				if (predictRate[i].payout >= 2) {
					winCount2XRight++;
				} else {
					loseCount2XRight++
				}
			} 
            // left side percentage
            if (predictRate[i].score >= 0 && predictRate[i].score <= score) {
				if (predictRate[i].payout >= 2) {
					winCount2XLeft++;
				} else {
					loseCount2XLeft++
				}
			}
		}


        const x2PRight = loseCount2XRight == 0 ? 0 : winCount2XRight / loseCount2XRight; // 2x percentage
        const x2PLeft = loseCount2XLeft == 0 ? 0 : winCount2XLeft  / loseCount2XLeft; // 1x percentage

        

        let betType = 1;
        if (x2PRight >= 1 && x2PLeft >= 1) {
            betType = 2;
        } else if (x2PRight < 1 && x2PLeft < 1) {
            betType = 1;    
        } else {

            let totalCountRight = winCount2XRight + loseCount2XRight;
            let totalCountLeft = winCount2XLeft + loseCount2XLeft;

            if (totalCountRight > totalCountLeft) {

                if (x2PRight >= 1) {
                    betType = 2;
                } else {
                    betType = 1
                }
                
            } else {
                if (x2PLeft >= 1) {
                    betType = 2;
                } else {
                    betType = 1
                }
            }
        }

        console.log("SCORE VALIDATE", score, x2PRight, x2PLeft, "BET TYPE: ", betType);

        return betType;
        
        
    }

    
}

export const getExpected3XPayoutData = (score) => {

    if (score >= 0.6) {
        return 3;
    } 
    
    return 1;
    let data = [];
    return payouts.map(p => {
        if (p >= 5) return 1;
        if (p >= 4) return 0.8;
        if (p >= 3) return 0.7;

        if (p > 2) return 0.5;

        return 0.3;

        return p >= 3 ? 1 : 0
    })
}


export const checkBettingScore = (x2Score, x3Score, count, x2Limit = 50, x3Limit = 50) => {

    if (count == 0) return true;

    if (x2Score == 0 && x3Score == 0 && count <= 2) return true;

    if (count == 1 && x2Score == 100) return true;

    if (count == 2) {
        return (x2Score >= 100 || x3Score >= 100);
    }

    if (x3Score == 100) return true;


    if (count >= 3) {
        return (x2Score >= x2Limit && x3Score >= x3Limit);
    } 

    return false;
}