import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');
const CryptoJS = require("crypto-js");
let PREDICTS = require('./PREDICTS.json');


const checkPredictPercentage = () => {


    for (let i = 0; i < PREDICTS.length; i++) {
        let winCount = 0;
        const loseCounts = [];
        const winCounts = [];
        let loseCount = 0;
        let maxWinCount = 0;

        
        PREDICTS[i].map((p, index) => {

            if (index >= PREDICTS[i].length - 100) {
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

        console.log(i, winCount * 100 / 100, Math.max(...loseCounts), Math.max(...winCounts));
    }
}

checkPredictPercentage();