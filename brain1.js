import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');
const CryptoJS = require("crypto-js");

import { logFatal, logSuccess } from "./libs/logging.js";
import { getDataFor2FloorAmount, getDataFor3FloorAmount, getDataForDiv, getDataForPayout, getExpectedPayout, getNormalized3XPayoutData, getNormalizedData, getNormalizedData1, getNormalizedPayoutData } from "./libs/aiutils.js";
import brain from 'brain.js';
import { gameResult } from "./libs/utils.js";
import { SERVER_SALT } from "./libs/contants.js";
const lastPayout = require('./lastPayout.json');
//let SCORES = require('./SCORE.json');
let SCORES = require('./BETTINGS.json');
let BRAIN_NET = require('./brain_train.json');


const inputData = [];
const inputData1 = [];
const inputData3 = [];


const inputData3X0 = [];
const inputData3X1 = [];
const inputData3X3 = [];



const inputDataBad = [];
const inputData1Bad = [];
const inputData3Bad = [];


const inputData3X0Bad = [];
const inputData3X1Bad = [];
const inputData3X3Bad = [];



const layerCount = 10;

const delay = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout)
    })

}







const train = async () => {
    let trainCounts = 0;
    let startIndex = 0;
    let lastScore = SCORES[SCORES.length - 1];

    lastScore.payouts.split(',').map(a => {
        trainCounts += parseInt(a);
    })

    trainCounts = 200;
    if (SCORES.length > trainCounts) {
        startIndex = SCORES.length - trainCounts;
    }


    let x3InputData = [];
    let patternData = [];

    for (let i = startIndex; i < SCORES.length - 1; i++) {
        const s = SCORES[i];
        if (s.nextScore == undefined) continue;
        // if (s.step1Count == undefined) continue;
        // if (s.bettingCountOfWithLimit == 0 || s.bettingCountOfNoLimit == 0 || s.bettingCountOfLose == 0) return;
        let input = getNormalizedData(s);
        let input2 = getNormalizedData1(s);
        let output = {
            nextScore: getDataForPayout(s.nextScore),
        }
        inputData.push({
            input, output
        });

        inputData1.push({
            input: input2, output
        });

        if (s.nextScore >= 3) {
            x3InputData.push({
                input: input,
                output
            });
        }

        // const color = s.score < 2 ? 0 : 1;
        // const pattern = s.payouts.split(',').slice(0, 4).map((a, i) => {
        //     if (i == 0) return a;
        //     if (a >= 4) return '4+';
        //     return a;
        // }).join(',');

        // console.log('ppppppppp', pattern);
        // patternData.push({
        //     input: { c: color, p: pattern }, output: { nc: s.score < 2 ? 0 : 1 }
        // })

    }

    console.log(inputData.length);
    const net = new brain.NeuralNetwork({
        hiddenLayers: [30]
    });

    // net.fromJSON(BRAIN_NET)
    net.train(inputData);

    const json = net.toJSON();

    fs.writeFileSync('./brain_train.json', JSON.stringify(json, null, 4));

    const net2 = new brain.NeuralNetwork({
        hiddenLayers: [30, 30]
    });

    // net.fromJSON(BRAIN_NET)
    net2.train(inputData1);

    const json1 = net2.toJSON();

    fs.writeFileSync('./brain_train1.json', JSON.stringify(json1, null, 4));


    const output = net.run(getNormalizedData(SCORES[SCORES.length - 2])); // { white: 0.99, black: 0.002 }
    console.log("EXPECTED SCORE", output.nextScore, getExpectedPayout(output.nextScore));

    fs.writeFileSync('./data.json', JSON.stringify(inputData, null, 4));

    // const net3 = new brain.NeuralNetwork({
    //     hiddenLayers: [30, 30]
    // });

    // // net.fromJSON(BRAIN_NET)
    // net3.train(x3InputData);

    // const json3 = net3.toJSON();

    // fs.writeFileSync('./brain_train3x.json', JSON.stringify(json3, null, 4));


    // const net4 = new brain.NeuralNetwork({
    //     hiddenLayers: [30, 30]
    // });

    // // net.fromJSON(BRAIN_NET)
    // net4.train(patternData);

    // const json4 = net4.toJSON();

    // fs.writeFileSync('./brain_pattern.json', JSON.stringify(json4, null, 4));


    // const color = lastScore.score < 2 ? 0 : 1;
    // const pattern = lastScore.payouts.split(',').slice(0, 4).map((a, i) => {
    //     if (i == 0) return a;
    //     if (a >= 4) return '4+';
    //     return a;
    // }).join(',');

    // console.log('ppppppppp', pattern);
    // const output4 = net4.run({c: color, p: pattern});

    // console.log("COLOR PREDICT", output4);

    // const initialHash = SCORES[SCORES.length - 1].hash;
    // let prevHash = null;
    // let arrayOfScore = [];
    // let payouts = [];
    // for (let i = 0; i < 200; i++) {
    //     let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
    //     let bust = gameResult(hash, SERVER_SALT);
    //     prevHash = hash;
    //     payouts.unshift(bust);

    //     if (bust < 3) {
    //         arrayOfScore.unshift(0);
    //     } else {
    //         arrayOfScore.unshift(1);
    //     }
    // }

    // let graphInputData = [];
    // for (let i = 30; i < 200 - 40; i++) {
    //     const input = [];
    //     const output = [];
    //     for (let j = i - 30; j < i; j++) {
    //         input.push(arrayOfScore[j]);
    //     }
    //     for (let j = i; j < i + 10; j++) {
    //         output.push(arrayOfScore[j]);
    //     }
    //     graphInputData.push({
    //         input: input,
    //         output
    //     })
    // }

    // const config = {
    //     inputSize: 30,
    //     inputRange: 30,
    //     hiddenLayers: [30, 30],
    //     outputSize: 10,
    //     learningRate: 0.01,
    //     decayRate: 0.999,
    // };

    // // create a simple recurrent neural network
    // const net4 = new brain.recurrent.RNN(config);
    // console.log('LETS TRAIN')
    // // net.fromJSON(BRAIN_NET)
    // net4.train(graphInputData);

    // const json4 = net4.toJSON();

    // fs.writeFileSync('./brain_trend.json', JSON.stringify(json4, null, 4));


    // const testData = [];

    // console.log(arrayOfScore.length);

    // for (let i = arrayOfScore.length - 1; i >= 0; i--) {
    //     if (i < arrayOfScore.length - 30) break;

    //     testData.unshift(arrayOfScore[i]);
    // }

    // console.log('testData.length===', testData)

    // const output4 = net4.run(testData); // { white: 0.99, black: 0.002 }
    // console.log(output4);


    // const config = {
    //     inputSize: 2,
    //     inputRange: 2,
    //     hiddenLayers: [100, 100],
    //     outputSize: 1,
    //     learningRate: 0.01,
    //     decayRate: 0.999,
    //   };

    //   // create a simple recurrent neural network
    //   const net4 = new brain.recurrent.RNN(config);

    //   net4.train([
    //     { input: [0, 0], output: [0] },
    //     { input: [0, 1], output: [1] },
    //     { input: [1, 0], output: [1] },
    //     { input: [1, 1], output: [0] },
    //   ]);

    //   let output4 = net4.run([0, 0]); // [0]
    //   console.log({output4})
    //   output4 = net4.run([0, 1]); // [1]

    //   console.log({output4})
    //   output4 = net4.run([1, 0]); // [1]
    //   console.log({output4})
    //   output4 = net4.run([1, 1]); // [0]
    //   console.log({output4})

}


const train0 = async () => {

    let trainCounts = 0;
    let startIndex = 0;
    let lastScore = SCORES[SCORES.length - 1];

    lastScore.payouts.split(',').map(a => {
        trainCounts += parseInt(a);
    })

    trainCounts = 600;

    // let's get payouts
    const initialHash = lastScore.hash;
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }


    for (let i = startIndex; i < payouts.length - 50; i++) {
        let input = getNormalizedPayoutData(payouts.slice(i, i + 10));
        let output = getNormalizedPayoutData(payouts.slice(i + 11, i + 16));
        inputData.push({
            input, output
        });

        let input2 = getNormalizedPayoutData(payouts.slice(i, i + 20));
        let output2 = getNormalizedPayoutData(payouts.slice(i + 21, i + 26));

        inputData1.push({
            input: input2, output: output2
        })

        let input3 = getNormalizedPayoutData(payouts.slice(i, i + 40));
        let output3 = getNormalizedPayoutData(payouts.slice(i + 41, i + 46));

        inputData3.push({
            input: input3, output: output3
        })
    }

    const net = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // net.fromJSON(BRAIN_NET)
    net.train(inputData);

    const json = net.toJSON();

    fs.writeFileSync('./brain_train.json', JSON.stringify(json, null, 4));

    const net2 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net2.train(inputData1);

    const json1 = net2.toJSON();

    fs.writeFileSync('./brain_train1.json', JSON.stringify(json1, null, 4));


    const net3 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3.train(inputData3);

    const json3 = net3.toJSON();

    fs.writeFileSync('./brain_train3.json', JSON.stringify(json3, null, 4));

    const output = net.run(getNormalizedPayoutData(payouts.slice(-10))); // { white: 0.99, black: 0.002 }
    // console.log("EXPECTED SCORE WITH 10", output);

    const output2 = net2.run(getNormalizedPayoutData(payouts.slice(-20))); // { white: 0.99, black: 0.002 }
    // console.log("EXPECTED SCORE WITH 20", output2);

    const output3 = net3.run(getNormalizedPayoutData(payouts.slice(-40))); // { white: 0.99, black: 0.002 }
    // console.log("EXPECTED SCORE WITH 30", output3);

}


const train1 = async () => {

    let trainCounts = 0;
    let startIndex = 0;
    let lastScore = SCORES[SCORES.length - 1];

    // lastScore.payouts.split(',').map(a => {
    //     trainCounts += parseInt(a);
    // })

    trainCounts = 600;

    // let's get payouts
    const initialHash = lastPayout.hash;
    let prevHash = null;
    let payouts = [];
    let sum = 0;
    let plusArray = [];
    let minusArray = [];
    let sumArray = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }


    let prevBust = -1;

    payouts.map((bust) => {
        if (bust < 3) {
            sum += -1;
            if (prevBust == -1) {
                minusArray.push(sum);
            } else if (prevBust < 3) {
                if (minusArray.length > 0) {
                    minusArray[minusArray.length - 1] = sum;
                }
            } else {
                minusArray.push(sum);
            }
        } else {
            // if (prevBust != -1 && prevBust < 3) {
            // 	minusArray.push(sum);
            // }
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
        }
        sumArray.push(sum);
        prevBust = bust;
    });


    let yData5SMA = [];
    let yData10SMA = [];
    let yData20SMA = [];


    for (let i = 0; i < sumArray.length; i++) {
        let count = 3;
        if (i < count) {
            yData5SMA.push(0);
        } else {
            const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
            yData5SMA.push(v);
        }

        count = 5;
        if (i < count) {
            yData10SMA.push(0);
        } else {
            const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
            yData10SMA.push(v);
        }

        count = 8;
        if (i < count) {
            yData20SMA.push(0);
        } else {
            const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
            yData20SMA.push(v);
        }

        if (i < 5) {
            continue;
        }
        let isBetting =
            (
                (yData5SMA[yData5SMA.length - 1] >= yData10SMA[yData10SMA.length - 1])
                || (yData5SMA[yData5SMA.length - 1] >= yData20SMA[yData20SMA.length - 1])
            );

        if (isBetting) {

            if (i < payouts.length - 12) {
                let input = getNormalizedPayoutData(payouts.slice(i, i + 10));
                let output = getNormalizedPayoutData(payouts.slice(i + 11, i + 12));
                inputData.push({
                    input, output
                });
            }


            if (i < payouts.length - 22) {
                let input2 = getNormalizedPayoutData(payouts.slice(i, i + 20));
                let output2 = getNormalizedPayoutData(payouts.slice(i + 21, i + 22));

                inputData1.push({
                    input: input2, output: output2
                })
            }


            if (i < payouts.length - 42) {
                let input3 = getNormalizedPayoutData(payouts.slice(i, i + 40));
                let output3 = getNormalizedPayoutData(payouts.slice(i + 41, i + 42));

                inputData3.push({
                    input: input3, output: output3
                })
            }



            if (i < payouts.length - 12) {
                let input3x1 = getNormalized3XPayoutData(payouts.slice(i, i + 10));
                let output3x1 = getNormalized3XPayoutData(payouts.slice(i + 11, i + 12));
                inputData3X0.push({
                    input: input3x1, output: output3x1
                });
            }


            if (i < payouts.length - 22) {
                let input3x2 = getNormalized3XPayoutData(payouts.slice(i, i + 20));
                let output3x2 = getNormalized3XPayoutData(payouts.slice(i + 21, i + 22));


                inputData3X1.push({
                    input: input3x2, output: output3x2
                })
            }

            if (i < payouts.length - 42) {
                let input3x3 = getNormalized3XPayoutData(payouts.slice(i, i + 40));
                let output3x3 = getNormalized3XPayoutData(payouts.slice(i + 41, i + 42));

                inputData3X3.push({
                    input: input3x3, output: output3x3
                })
            }
        } else {
            if (i < payouts.length - 12) {
                let input = getNormalizedPayoutData(payouts.slice(i, i + 10));
                let output = getNormalizedPayoutData(payouts.slice(i + 11, i + 12));
                inputDataBad.push({
                    input, output
                });
            }


            if (i < payouts.length - 22) {
                let input2 = getNormalizedPayoutData(payouts.slice(i, i + 20));
                let output2 = getNormalizedPayoutData(payouts.slice(i + 21, i + 22));

                inputData1Bad.push({
                    input: input2, output: output2
                })
            }


            if (i < payouts.length - 42) {
                let input3 = getNormalizedPayoutData(payouts.slice(i, i + 40));
                let output3 = getNormalizedPayoutData(payouts.slice(i + 41, i + 42));

                inputData3Bad.push({
                    input: input3, output: output3
                })
            }



            if (i < payouts.length - 12) {
                let input3x1 = getNormalized3XPayoutData(payouts.slice(i, i + 10));
                let output3x1 = getNormalized3XPayoutData(payouts.slice(i + 11, i + 12));
                inputData3X0Bad.push({
                    input: input3x1, output: output3x1
                });
            }


            if (i < payouts.length - 22) {
                let input3x2 = getNormalized3XPayoutData(payouts.slice(i, i + 20));
                let output3x2 = getNormalized3XPayoutData(payouts.slice(i + 21, i + 22));


                inputData3X1Bad.push({
                    input: input3x2, output: output3x2
                })
            }

            if (i < payouts.length - 42) {
                let input3x3 = getNormalized3XPayoutData(payouts.slice(i, i + 40));
                let output3x3 = getNormalized3XPayoutData(payouts.slice(i + 41, i + 42));

                inputData3X3Bad.push({
                    input: input3x3, output: output3x3
                })
            }
        }
    }

    const net = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // console.log(inputData);
    net.train(inputData);

    const json = net.toJSON();

    fs.writeFileSync('./brain_train.json', JSON.stringify(json, null, 4));

    const net2 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net2.train(inputData1);

    const json1 = net2.toJSON();

    fs.writeFileSync('./brain_train1.json', JSON.stringify(json1, null, 4));


    const net3 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3.train(inputData3);

    const json3 = net3.toJSON();

    fs.writeFileSync('./brain_train3.json', JSON.stringify(json3, null, 4));

    console.log('COMPLETED 2X TRAINING');
    const net3x0 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });


    net3x0.train(inputData3X0);

    const json3x0 = net3x0.toJSON();

    fs.writeFileSync('./brain_train3x0.json', JSON.stringify(json3x0, null, 4));

    const net3x2 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3x2.train(inputData3X1);

    const json3x1 = net3x2.toJSON();

    fs.writeFileSync('./brain_train3x1.json', JSON.stringify(json3x1, null, 4));


    const net3x3 = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3x3.train(inputData3X3);

    const json3x3 = net3x3.toJSON();

    fs.writeFileSync('./brain_train3x3.json', JSON.stringify(json3x3, null, 4));

    console.log('COMPLETED 3X TRAINING');



    const netBad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });


    netBad.train(inputDataBad);

    const jsonBad = net.toJSON();

    fs.writeFileSync('./brain_train_bad.json', JSON.stringify(jsonBad, null, 4));

    const net2Bad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net2Bad.train(inputData1Bad);

    const json1Bad = net2Bad.toJSON();

    fs.writeFileSync('./brain_train1_bad.json', JSON.stringify(json1Bad, null, 4));


    const net3Bad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3Bad.train(inputData3Bad);

    const json3Bad = net3Bad.toJSON();

    fs.writeFileSync('./brain_train3_bad.json', JSON.stringify(json3Bad, null, 4));

    console.log('COMPLETED 2X TRAINING');
    const net3x0Bad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });


    net3x0Bad.train(inputData3X0Bad);

    const json3x0Bad = net3x0Bad.toJSON();

    fs.writeFileSync('./brain_train3x0_bad.json', JSON.stringify(json3x0Bad, null, 4));

    const net3x2Bad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3x2Bad.train(inputData3X1Bad);

    const json3x1Bad = net3x2Bad.toJSON();

    fs.writeFileSync('./brain_train3x1_bad.json', JSON.stringify(json3x1Bad, null, 4));


    const net3x3Bad = new brain.NeuralNetwork({
        hiddenLayers: [layerCount]
    });

    // // net.fromJSON(BRAIN_NET)
    net3x3Bad.train(inputData3X3Bad);

    const json3x3Bad = net3x3Bad.toJSON();

    fs.writeFileSync('./brain_train3x3_bad.json', JSON.stringify(json3x3Bad, null, 4));

    console.log('COMPLETED 3X TRAINING');

}


const test = () => {

    let trainCounts = 0;
    let startIndex = 0;
    let lastScore = SCORES[SCORES.length - 1];

    lastScore.payouts.split(',').map(a => {
        trainCounts += parseInt(a);
    })

    trainCounts = 500;

    // let's get payouts
    const initialHash = lastScore.hash;
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }


    const net = new brain.NeuralNetwork();
    let BRAIN_NET = require('./brain_train.json');
    net.fromJSON(BRAIN_NET);

    const testData = SCORES[SCORES.length - 3];
    const output = net.run(getNormalizedData(testData));
    testData.aiScore = output.nextScore;

    console.log(output);

    const net2 = new brain.NeuralNetwork();
    let BRAIN_net2 = require('./brain_train1.json');
    net2.fromJSON(BRAIN_net2);
    const output2 = net2.run(getNormalizedData1(testData));

    console.log(output2);


}





const test1 = () => {

    let trainCounts = 0;
    let startIndex = 0;
    let lastScore = SCORES[SCORES.length - 1];

    console.log('LAST SCORE', lastScore);

    lastScore.payouts.split(',').map(a => {
        trainCounts += parseInt(a);
    })

    trainCounts = 500;

    // let's get payouts
    const initialHash = lastScore.hash;

    console.log(initialHash);
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }


    const net = new brain.NeuralNetwork();
    let BRAIN_NET = require('./brain_train.json');
    net.fromJSON(BRAIN_NET);

    const input = getNormalizedPayoutData(payouts.slice(-10));
    const output = net.run(getNormalizedPayoutData(payouts.slice(-10)));

    // console.log(payouts.slice(-10), input, output);

    const net2 = new brain.NeuralNetwork();
    let BRAIN_net2 = require('./brain_train1.json');
    net2.fromJSON(BRAIN_net2);
    const output2 = net2.run(getNormalizedPayoutData(payouts.slice(-20)));

    // console.log(output2);

    // const net3 = new brain.NeuralNetwork();
    // let BRAIN_net3 = require('./brain_train3.json');
    // net2.fromJSON(BRAIN_net3);
    // const output3 = net3.run(getNormalizedPayoutData(payouts.slice(-30)));

    // console.log(output3);

}

train1();
//test1();
