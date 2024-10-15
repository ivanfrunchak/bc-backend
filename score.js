import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');

import { logFatal, logSuccess } from "./libs/logging.js";
import { getDataFor2FloorAmount, getDataFor3FloorAmount, getDataForDiv, getDataForPayout, getNormalizedData } from "./libs/aiutils.js";
import brain from 'brain.js';
let SCORES = require('./SCORE.json');

let bettingCount = 0, winCount = 0;
SCORES.map(s => {
    // if (s.totalLoseOf3Deep > 40000 && s.aiScore > 0.9) {
    //     bettingCount++;
    //     if (s.nextScore > 3) winCount++;
    // }

    const result1 = [s.bettingCountOfLose, s.bettingCountOfNoLimit, s.bettingCountOfWithLimit].filter(a => a >= 1);

    const result2 = [s.scoreOfPatternWithLimit, s.scoreOfPatternWithLose, s.scoreOfPatternNoLimit].filter(a => a < 30);

    if (s.totalLoseOf3Deep > 30000 && s.aiScore < 0.2 && result1.length >= 1 && result2 >= 1 && s.score >= 2) {
        bettingCount++;
        if (s.nextScore < 2) {
            winCount++;
        }
    }
})


console.log(bettingCount, winCount)

