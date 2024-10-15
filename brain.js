import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require('fs');
const CryptoJS = require("crypto-js");


import { getNormalized3XPayoutData, getNormalizedEngineData, getNormalizedEngineData2, getNormalizedEngineData3, getNormalizedPayoutData, getNormalizedPayoutDataWithTrend } from "./libs/aiutils.js";
import brain from 'brain.js';
import { gameResult } from "./libs/utils.js";
import { SERVER_SALT } from "./libs/contants.js";
import { exit } from "process";
import { getCurrentTrend2X } from "./engine.js";

// const PREDICTS = require('./PREDICTS1.json');


// const TOTAL_BETTING_HISTORY_TEST1 = require('./TOTAL_BETTING_HISTORY_TEST_ENGINE.json');

const lastPayout = require('./lastPayout.json');


const layerCount = 2;

const delay = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout)
    })

}

const train2X = (payouts, isWriteFile = false) => {
    let prevBust = -1;

    let sum = 0;
    let plusArray = [];
    let minusArray = [];
    let sumArray = [];
    payouts.map((bust) => {

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
        } else if (bust >= 2) {
            sum += 1;
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
        }
        sumArray.push(sum);
        prevBust = bust;
    });

    const inputData = [{}, {}, {}];

    let yDataSMA = [];
    for (let i = 0; i < sumArray.length; i++) {
        if (i < 20) {
            continue;
        }

        [5, 10, 15, 20, 25, 30].map((count, index) => {
            if (yDataSMA.length < (index + 1)) {
                yDataSMA.push([]);
            }
            if (i < count - 1) {
                yDataSMA[index].push(0);
            } else {
                const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
                yDataSMA[index].push(v);
            }
        })



        let trendStatus = 2;//'Mid';

        try {
            if ((yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1])
                && (yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1])) {
                trendStatus = 0 //"GOOD"; // good
            } else if ((yDataSMA[0][yDataSMA[0].length - 1] < yDataSMA[1][yDataSMA[1].length - 1])
                && (yDataSMA[1][yDataSMA[1].length - 1] < yDataSMA[2][yDataSMA[2].length - 1])) {
                trendStatus = 1 //"BAD"; // bad
            }
        } catch (err) {

        }


        [5, 10, 15, 20, 25, 30].map(count => {
            if (i < payouts.length - (count + 1)) {
                let input = getNormalizedPayoutData(payouts.slice(i, i + count));
                let output = getNormalizedPayoutData(payouts.slice(i + count, i + count + 1));

                if (inputData[trendStatus][count] == undefined) {
                    inputData[trendStatus][count] = [];
                }
                inputData[trendStatus][count].push({
                    input, output
                });
            }
        })

    }

    const train_names = ["good", "bad", "mid"];

    // console.log(inputData);

    const trainJsons = [];
    [0, 1, 2].map((trendStatus) => {
        [5, 10, 15, 20, 25, 30].map((count, index) => {
            try {
                const net = new brain.NeuralNetwork({
                    hiddenLayers: [4, 8]
                });
                net.train(inputData[trendStatus][count]);

                const json = net.toJSON();
                trainJsons.push(json);
                if (isWriteFile) {
                    fs.writeFileSync(`./brain_train_2x_${train_names[trendStatus]}_${index}.json`, JSON.stringify(json, null, 4));
                }

            } catch (err) {
                console.log('BC ENGINE ERROR');
                try {
                    const train_str = fs.readFileSync(`./brain_train_2x_${train_names[trendStatus]}_${index}.json`);
                    trainJsons.push(JSON.parse(train_str));
                } catch (err) {
                    trainJsons.push(null);
                }

            }

        })
        console.log(`COMPLETED 2X ${train_names[trendStatus]} TRAINING`);
    })
    return trainJsons;
}

const train2X_01 = (payouts, isWriteFile = false) => {

    const inputData = [{}, {}, {}];

    const counts =  [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

    for (let i = 10; i < payouts.length; i++) {

        counts.map((count, index) => {
            if (i < payouts.length - (count + 1)) {
                let input = getNormalizedPayoutDataWithTrend(payouts.slice(i - 10, i + count), count);
                let output = getNormalizedPayoutData(payouts.slice(i + count, i + count + 1));
                if (inputData[count] == undefined) {
                    inputData[count] = [];
                }
                inputData[count].push({
                    input, output
                });
            }
        })
    }

    const trainJsons = [];

    counts.map((count, index) => {
        try {
            const net = new brain.NeuralNetwork({
                hiddenLayers: [4, 8]
            });
            net.train(inputData[count]);

            const json = net.toJSON();
            trainJsons.push(json);
            if (isWriteFile) {
                fs.writeFileSync(`./brain_train_2x_${count}.json`, JSON.stringify(json, null, 4));
            }

        } catch (err) {
            console.log('BC ENGINE ERROR');
        }

        console.log(`COMPLETED 2X ${count} TRAINING`);
    })
    return trainJsons;
}

const train3X = async (payouts) => {
    let prevBust = -1;

    let sum = 0;
    let plusArray = [];
    let minusArray = [];
    let sumArray = [];
    payouts.map((bust) => {

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
        }
        sumArray.push(sum);
        prevBust = bust;
    });


    const inputData = [{}, {}, {}];

    let yDataSMA = [];

    for (let i = 0; i < sumArray.length; i++) {
        if (i < 20) {
            continue;
        }

        [5, 10, 15, 20, 25, 30].map((count, index) => {
            if (yDataSMA.length < (index + 1)) {
                yDataSMA.push([]);
            }
            if (i < count - 1) {
                yDataSMA[index].push(0);
            } else {
                const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
                yDataSMA[index].push(v);
            }
        })



        let trendStatus = 2;//'Mid';

        try {
            if ((yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1])
                && (yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[2][yDataSMA[2].length - 1])) {
                trendStatus = 0 //"GOOD"; // good
            } else if ((yDataSMA[0][yDataSMA[0].length - 1] < yDataSMA[1][yDataSMA[1].length - 1])
                && (yDataSMA[1][yDataSMA[1].length - 1] < yDataSMA[2][yDataSMA[2].length - 1])) {
                trendStatus = 1 //"BAD"; // bad
            }
        } catch (err) {

        }


        [5, 10, 15, 20, 25, 30].map(count => {
            if (i < payouts.length - (count + 1)) {
                let input = getNormalized3XPayoutData(payouts.slice(i, i + count));
                let output = getNormalized3XPayoutData(payouts.slice(i + count, i + count + 1));

                if (inputData[trendStatus][count] == undefined) {
                    inputData[trendStatus][count] = [];
                }
                inputData[trendStatus][count].push({
                    input, output
                });
            }
        })

    }

    const train_names = ["good", "bad", "mid"];

    // console.log(inputData);
    [0, 1, 2].map((trendStatus) => {


        [5, 10, 15, 20, 25, 30].map((count, index) => {
            const net = new brain.NeuralNetwork({
                hiddenLayers: [layerCount]
            });

            net.train(inputData[trendStatus][count]);

            const json = net.toJSON();

            fs.writeFileSync(`./brain_train_3x_${train_names[trendStatus]}_${index}.json`, JSON.stringify(json, null, 4));
        })

        // console.log(`COMPLETED 3X ${train_names[trendStatus]} TRAINING`);

    })
}



export const trainPredictRate = (result, dataCount, counts) => {

    const data = result.slice(dataCount * -1);
    const trainJsons = [];
    counts.map(count => {
        const inputData = [];
        if (result.length < count) {
            trainJsons.push[null];
            return;
        }
        for (let i = count + 1; i < data.length - (count + 1); i++) {
            if (i < data.length - (count + 1)) {
                let input = getNormalizedEngineData2(data.slice(i, i + count));
                let output = [data[i + count].isRight];
                inputData.push({
                    input, output
                });
            }
        }


        try {
            const config = {
                binaryThresh: 0.5,
                hiddenLayers: [8, 4], // array of ints for the sizes of the hidden layers in the network
                activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
                // leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
            };

            const net = new brain.NeuralNetwork(config);
            net.train(inputData);
            const json = net.toJSON();
            trainJsons.push(json);

        } catch (err) {
            console.log("TRAIN ENGINE ERROR", err);
            trainJsons.push[null];
            return;
        }
    })

    return trainJsons;

}



export const trainPredictRate2 = (result, idx, dataCount, counts) => {

    const data = result.slice(dataCount * -1);
    counts.map(count => {
        console.log(`START TRAIN PREDICT ${idx}_${count}`)
        const inputData = [];
        if (result.length < count) {
            return;
        }
        for (let i = count + 1; i < data.length - (count + 1); i++) {
            if (i < data.length - (count + 1)) {
                let input = getNormalizedEngineData2(data.slice(i, i + count));
                let output = [data[i + count].isRight];
                inputData.push({
                    input, output
                });
            }
        }


        try {
            const config = {
                binaryThresh: 0.5,
                hiddenLayers: [8, 4], // array of ints for the sizes of the hidden layers in the network
                activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
                // leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
            };

            const net = new brain.NeuralNetwork(config);
            net.train(inputData);
            const json = net.toJSON();
            fs.writeFileSync(`./predict_train_${idx}_${count}.json`, JSON.stringify(json, null, 4));

            console.log(`FINISH TRAIN PREDICT ${idx}_${count}`)
        } catch (err) {
            console.log("TRAIN ENGINE ERROR", err);
            return;
        }
    })
}


export const trainPredictRate3 = (result, idx, dataCount, counts) => {

    const data = result.slice(dataCount * -1);


    console.log(data.length);
    counts.map(count => {
        console.log(`START TRAIN PREDICT ${idx}_${count}`)
        const inputData = [];
        if (result.length < count) {
            return;
        }
        for (let i = count + 1; i < data.length - (count + 1); i++) {
            if (i < data.length - (count + 1 + 3)) {
                let input = getNormalizedEngineData2(data.slice(i, i + count));
                let output = [data[i + count].isRight, data[i + count + 1].isRight, data[i + count + 2].isRight];
                inputData.push({
                    input, output
                });
            }
        }


        try {
            const config = {
                binaryThresh: 0.5,
                hiddenLayers: [8, 4], // array of ints for the sizes of the hidden layers in the network
                activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
                // leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
            };

            const net = new brain.NeuralNetwork(config);
            net.train(inputData);
            const json = net.toJSON();
            fs.writeFileSync(`./predict_train_3_${idx}_${count}.json`, JSON.stringify(json, null, 4));

            console.log(`FINISH TRAIN PREDICT ${idx}_${count}`)
        } catch (err) {
            console.log("TRAIN ENGINE ERROR", err);
            return;
        }
    })
}


export const trainEngine2 = (result, dataCount, counts, isWriteFile = false) => {

    const data = result.slice(dataCount * -1);
    counts.map(count => {
        console.log(`START TRAIN ENGINE ${count}`)
        const inputData = [];
        if (result.length < count) {
            return;
        }
        for (let i = count + 1; i < data.length - (count + 1); i++) {
            if (i < data.length - (count + 1)) {
                let input = getNormalizedEngineData3(data.slice(i, i + count));
                let output = [data[i + count].isRight];
                inputData.push({
                    input, output
                });
            }
        }


        try {
            const config = {
                binaryThresh: 0.5,
                hiddenLayers: [8, 4], // array of ints for the sizes of the hidden layers in the network
                activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
                // leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
            };

            const net = new brain.NeuralNetwork(config);
            net.train(inputData);
            const json = net.toJSON();
            fs.writeFileSync(`./engine_train_${count}.json`, JSON.stringify(json, null, 4));

            console.log(`FINISH TRAIN ENGINE ${count}`)
        } catch (err) {
            console.log("TRAIN ENGINE ERROR", err);
            return;
        }
    })
}

export const trainEngine3 = (result, count, isWriteFile = false) => {

    const data = result[2].slice(-10000);


    if (data.length < count * 2) return 1;

    const inputData = [];

    for (let i = 20; i < data.length - (count + 1); i++) {
        if (i < data.length - (count + 1)) {
            let input = data.slice(i, i + count);
            let output = [data[i + count]];
            inputData.push({
                input, output
            });
        }
    }


    try {
        const net = new brain.NeuralNetwork({
            hiddenLayers: [20]
        });
        net.train(inputData);

        const json = net.toJSON();

        fs.writeFileSync(`./engine_train3.json`, JSON.stringify(json, null, 4));
    } catch (err) {
        console.log("TRAIN ENGINE ERROR");
    }
}

const trainEngine = async (result) => {


    if (result.length < 20) return 1;



    let sum = 0;
    let sumArray = result.map((row, index) => {
        if (row == 1) {
            sum += 1;
        } else {
            sum -= 1;
        }
        return sum;
    });



    const inputData = [{}, {}, {}];

    let yDataSMA = [];

    for (let i = 0; i < sumArray.length; i++) {
        [2, 3, 4].map((count, index) => {
            if (yDataSMA.length < (index + 1)) {
                yDataSMA.push([]);
            }
            if (i < count - 1) {
                yDataSMA[index].push(0);
            } else {
                const v = sumArray.slice(i - count + 1, i + 1).reduce((a, b) => a + b, 0) / count;
                yDataSMA[index].push(v);
            }
        })


        if (i < 2) {
            continue;
        }

        let trendStatus = 2;//'Mid';

        if (
            (yDataSMA[0][yDataSMA[0].length - 1] > yDataSMA[1][yDataSMA[1].length - 1]
                && yDataSMA[1][yDataSMA[1].length - 1] >= yDataSMA[2][yDataSMA[2].length - 1])

        ) {
            trendStatus = 0 //"GOOD"; // good
        } else if (
            (yDataSMA[2][yDataSMA[2].length - 1] >= yDataSMA[1][yDataSMA[1].length - 1]
                && yDataSMA[1][yDataSMA[1].length - 1] > yDataSMA[0][yDataSMA[0].length - 1])) {
            trendStatus = 1 //"BAD"; // bad
        }



        [2, 3, 4].map(count => {
            if (i < result.length - (count + 1)) {
                let input = getNormalizedEngineData(result.slice(i, i + count));
                let output = getNormalizedEngineData(result.slice(i + count, i + count + 1));

                if (inputData[trendStatus][count] == undefined) {
                    inputData[trendStatus][count] = [];
                }
                inputData[trendStatus][count].push({
                    input, output
                });
            }
        })

    }

    const train_names = ["good", "bad", "mid"];


    // console.log(inputData);
    [0, 1, 2].map((trendStatus) => {
        [2, 3, 4].map((count, index) => {
            try {
                const net = new brain.NeuralNetwork({
                    hiddenLayers: [layerCount]
                });
                net.train(inputData[trendStatus][count]);

                const json = net.toJSON();

                fs.writeFileSync(`./engine_train_${train_names[trendStatus]}_${index}.json`, JSON.stringify(json, null, 4));
            } catch (err) {
                console.log("TRAIN ENGINE ERROR", trendStatus);
            }
        })

        console.log(`COMPLETED ENGINE ${train_names[trendStatus]} TRAINING`);

    })


}



export const train1 = (lastPayout2, trainCounts = 100, isWriteFile = false) => {
    // let's get payouts


    console.log('TRAIN HASH:', lastPayout2.hash);
    const initialHash = lastPayout2.hash;
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }

    const trainJsons = train2X(payouts, isWriteFile);

    return trainJsons;
    // train3X(payouts);

    // const history = bettingHistory.slice(enginTrainCounts * -1).map(b => b[0]);
    // trainEngine(history);


}

export const train2 = async (trainCounts = 100, enginTrainCounts = 60) => {
    // let's get payouts


    console.log('TRAIN HASH:', lastPayout.hash);
    const initialHash = lastPayout.hash;
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }

    train2X(payouts, true);

    // const history = TOTAL_BETTING_HISTORY1.slice(enginTrainCounts * -1).map(b => b[0]);
    // trainEngine(history);

    //        train3X(payouts);
}

export const train3 = async (lastHash, trainCounts = 100, enginTrainCounts = 60) => {
    // let's get payouts


    console.log('TRAIN HASH:', lastHash);
    const initialHash = lastHash;
    let prevHash = null;
    let payouts = [];
    for (let i = 0; i < trainCounts; i++) {
        let hash = String(prevHash ? CryptoJS.SHA256(String(prevHash)) : initialHash);
        let bust = gameResult(hash, SERVER_SALT);
        prevHash = hash;
        payouts.unshift(bust);
    }

    train2X_01(payouts, true);

}


const sample = () => {
    const config = {
        binaryThresh: 0.5,
        hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
        activation: 'sigmoid', // supported activation types: ['sigmoid', 'relu', 'leaky-relu', 'tanh'],
        leakyReluAlpha: 0.01, // supported for activation type 'leaky-relu'
    };

    // create a simple feed-forward neural network with backpropagation
      const net = new brain.NeuralNetwork(config);

      net.train([
        { input: [0, 0], output: [0] },
        { input: [0, 1], output: [1] },
        { input: [1, 0], output: [0] },
        { input: [1, 0], output: [0] },
        { input: [1, 0], output: [0] },
        { input: [1, 0], output: [1] },
      ]);

      const output = net.run([1, 0]); // [0.987]

      console.log(output);


    // const net = new brain.recurrent.LSTM();

    // net.train(['I am brainjs, Hello World!']);

    // const output = net.run('I am brainjs');
    // console.log(output);
}

// const trainAllPredicts = () => {
//     PREDICTS.map((result, idx) => {
//         trainPredictRate2(result, idx, 3000, [5, 10, 15]);
//     })
// }

// const trainAllPredictsWith3 = () => {

    
//     PREDICTS.map((result, idx) => {
//         console.log(idx);
//         trainPredictRate3(result, idx, 3000, [5, 10, 15]);
//     })
// }




// trainAllPredictsWith3();
// trainEngine2(TOTAL_BETTING_HISTORY_TEST1, 3000, [5,10,15], true);
// trainEngine3(PREDICTS, 20);

//train3('7fc3b5f0a4477fa112079c89e0e032937a96b3c932e4f7f60f50e43f86a6b987', 30000);
// train3('b755b1d4cd6952683f00e33d4495248183c3538629dc31b7c3cdaee98d5f6e97', 30000);

// train2(30000, 60);
// train1();
//test1();

// sample();