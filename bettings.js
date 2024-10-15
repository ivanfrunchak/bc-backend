import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');

import { logFatal, logSuccess } from "./libs/logging.js";
import { getDataFor2FloorAmount, getDataFor3FloorAmount, getDataForDiv, getDataForPayout, getNormalizedData } from "./libs/aiutils.js";
import brain from 'brain.js';
let BETTINGS = require('./BETTINGS.json');

let bettingCount = 0, winCount = 0;
BETTINGS.map(s => {
    // if (s.nextScore > 3.3) {
    //     winCount++;
    // }

    if (s.aiScore < 0.1) {
        
    }
})


console.log(BETTINGS.length, winCount)