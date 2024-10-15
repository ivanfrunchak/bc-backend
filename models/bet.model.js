import mongoose, { Schema } from 'mongoose';
const BetSchema = new Schema({
	
});

// Export the model
const BetModel = mongoose.model('Bet', BetSchema);
export default BetModel;