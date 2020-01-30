const mongoose = require('../../database');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	name:{
		type:String,
		require:true,
	},
	email:	{
		type:String,
		unique:true,
		required:true,
		lowercase:true,
	},
	password:{
		type:String,
		required:true,
		select:false,
	},
	passwordResetToken:{
		type:String,
		select:false,
	},
	passwordResetExpires:{
		type:Date,
		select:false,
	},
	createdAt:{
		type:Date,
		default:Date.now,
	},
});

UserSchema.pre('save',function(next){
	const hash_promise = bcrypt.hash(this.password, 8);
	hash_promise.then(hash => {
		this.password = hash;
		next();
	});
})

const User = mongoose.model('User', UserSchema);

module.exports = User;


