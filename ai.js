import { createRequire } from "module";
const require = createRequire(import.meta.url);

import { logFatal, logSuccess } from "./libs/logging.js";
import { getDataFor2FloorAmount, getDataFor3FloorAmount, getDataForDiv, getDataForPayout } from "./libs/aiutils.js";

let SCORES = require('./SCORE.json');
let BETTINGS = require('./BETTINGS.json');
const fs = require('fs');

const inputData = [];
const tf = require('@tensorflow/tfjs-node');
for (let i = 0; i < 100; i++) {
    const s = SCORES[i];

    inputData.push({
        // payout: s.score,
        x3Count: s.x3Count,
        scoreOfPatternWithLimit: getDataForDiv(s.scoreOfPatternWithLimit),
        scoreOfPatternNoLimit: getDataForDiv(s.scoreOfPatternNoLimit),
        scoreOfPatternWithLose: getDataForDiv(s.scoreOfPatternWithLose),
        x3OfPatternWithLimit: getDataForDiv(s.x3OfPatternWithLimit),
        x3OfPatternNoLimit: getDataForDiv(s.x3OfPatternNoLimit),
        x3OfPatternWithLose: getDataForDiv(s.x3OfPatternWithLose),
        payoutScore: getDataForPayout(s.score),
        scoreOf2Floor: getDataFor2FloorAmount(s.loseOf2Deep),
        scoreOf3Floor: getDataFor3FloorAmount(s.totalLoseOf3Deep),
        nextScore: getDataForPayout(s.nextScore)
    })

}



fs.writeFileSync('./data.json', JSON.stringify(inputData, null, 4));
// const inputData = SCORES.map(s => {

//     return {
//         // payout: s.score,
//         x3Count: s.x3Count,
//         scoreOfPatternWithLimit: getDataForDiv(s.scoreOfPatternWithLimit),
//         scoreOfPatternNoLimit: getDataForDiv(s.scoreOfPatternNoLimit),
//         scoreOfPatternWithLose: getDataForDiv(s.scoreOfPatternWithLose),
//         x3OfPatternWithLimit: getDataForDiv(s.x3OfPatternWithLimit),
//         x3OfPatternNoLimit: getDataForDiv(s.x3OfPatternNoLimit),
//         x3OfPatternWithLose: getDataForDiv(s.x3OfPatternWithLose),
//         payoutScore: getDataForPayout(s.score),
//         scoreOf2Floor: getDataFor2FloorAmount(s.loseOf2Deep),
//         scoreOf3Floor: getDataFor3FloorAmount(s.totalLoseOf3Deep),
//     }
// });

// inputData.pop();
console.log(inputData);

const outputData = SCORES.map(s => {
    return getDataForPayout(s.nextScore)
});


const model = tf.sequential();

model.add(tf.layers.dense({units: 100, activation: 'relu', inputShape: [10]}));
model.add(tf.layers.dense({units: 1, activation: 'linear'}));
model.compile({optimizer: 'sgd', loss: 'meanSquaredError'});

const xs = tf.randomNormal([100, 10]);

console.log('xs', xs);
const ys = tf.randomNormal([100, 1]);

// Train the model.
model.fit(xs, ys, {
  epochs: 100,
//   callbacks: {
//     onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
//   }
});

// const firstLayer = tf.layers.dense({
//     units: 1,
//     inputShape: [10]
// })
// model.add(firstLayer);

// model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' })

// console.log(firstLayer.getWeights());

// model.fit(inputData, outputData, {
//     epochs: 100,
//     callbacks: {
//       onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`)
//     }
//   });