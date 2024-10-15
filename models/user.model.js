import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	username: { type: String, require: true }, // username
	email: { type: String, require: true }, // email
	password: { type: String, require: true }, // password
    is_admin: { type: Boolean, default: false},
	enabled: { type: Boolean, default: true } // enabled user
});

// Export the model
const User = mongoose.model('User', UserSchema);

export default User