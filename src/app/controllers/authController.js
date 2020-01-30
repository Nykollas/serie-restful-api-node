const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth");
const crypto = require('crypto');
const mailer = require('../../modules/mailer');
const router = express.Router();


function generateToken(params = {}){
	return jwt.sign(params, authConfig.secret,{
		expiresIn:86400
	})
}

router.post('/register', async (req, res) => {	
	const { email } = req.body;
	try{
		if(await User.findOne({email}))
			return res.status(400).send({error:'User already exists'});
		const  user = await  User.create(req.body);	
		return res.send({
			user, 
			token:generateToken({id:user.id})
		})
		
	}catch(err){
		return res.status(400).send({error:'Registration failed'});
	}
});


router.post('/authenticate', async (req, res) => {
	const { email, password  }  = req.body;	
	try{
		const user =  await User.findOne({ email }).select('+password');
		if(!user)
			return res.status(400).send({error:'Not found!'});
		if(!await bcrypt.compare(password, user.password))
			return  res.status(400).send({error:'Invalid password'});
		user.password = undefined;
		res.send({
			user, 
			token:generateToken({id:user.id})
		})

		

	}catch(err){
		
	}
});


router.post("/forgot_password", async (req, res) => {
	const { email }  = req.body;
	try {
		const user  = await User.findOne({email});
		if(!user)
			return res.status(400).send({error:'User not found'});
		const token = crypto.randomBytes(20).toString('hex');
		const now = new Date();
		now.setHours(now.getHours() + 1);
		await User.findByIdAndUpdate(user.id,{
			'$set':{
				passwordResetToken:token,
				passwordResetExpires:now,
			}
		});
		
		mailer.sendMail({
			to:email,
			from:'nicolauarti11@gmail.com',
			template:'forgot_password',
			context:{token},
		}, (err) => {
			if(err) 
				return res.status(400).send({error:'Cannot send forgot password, try again '})
			return  res.send({text:"OK"});
		});

	}catch(err){
		console.log(err);
		res.status(400).send({error:'Erro on forgot password, try again'});
	}
});


router.post('/reset_password', async (req, res) => {
	const { email, token, password } = req.body;
	
	try {

		const user  = User.findOne({ email })
						  .select('+passwordResetToken passwordResetExpires');
		user.then( async user =>{
			console.log(user.passwordResetToken, token );		
			if(!user) 
				return res.status(400).send({error:'User not found!'});
			
			if(token !== user.passwordResetToken)
				return res.status(400).send({error:'Token invalid'});

			const now = new Date();

			if(now > user.passwordResetExpires)
				return res.status(400).send({error:'Token expired, generate a new one'});
			
			user.password = password;

			await user.save();
			res.status(200).send({text:'ok'});
		});
						

	}catch(error){
		return res.status(400).send({error: 'Cannot reset password, try again'});
	}
});

module.exports = app => app.use('/auth', router);
