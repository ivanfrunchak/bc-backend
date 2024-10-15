import { createRequire } from "module";
const require = createRequire(import.meta.url);

const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const PatternSchema = new Schema({
    created: { type: Number },
    totalBet: { type: Number },
    loseAmount: {type: Number },
    trenballLowBet: {type: Number },
    trenballHighBet: {type: Number },
    trenballMoonBet: {type: Number },
    hash: {type: String },
    score: {type: Number },
    values: {type: [[Number]]},
    profits: {type: [[Number]] },
    pattern: {type: [String], default: []},
    status: {type: Number, default: 0},
    payouts: {type: [Object], default: []}, // [{payout: 1.5, prevProfit: 25000, loseAmount, trenballLowBet, trenballHighBet, }]
    patternType: {type: Number, default: 0}, // 1: blue, 0: red
    greenProfitLimit: {type: Number, default: 0 },
    greenSellLimit: {type: Number, default: 0 },
    redLoseLimit: {type: Number, default: 0 },
    checkDeepLimit: {type: Number, default: 8 },
});

// Export the model
const Pattern = mongoose.model('Pattern', PatternSchema);

export const fetchAll = async () => {
    return await Pattern.find()
}

export default Pattern