var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var waterfall = require('async-waterfall');
var xoauth2 = require('xoauth2');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var session = require('express-session');

var User = require('../../server/models/user');


//register
router.get('/register', function(req,res){
  res.render('register');
});

// login
router.get('/login' , function(req,res){
	res.render('login');
});

router.get('/forgot' , function(req,res){
	res.render('forgot' ,{
		user : req.user
	});
});

router.get('/reset/:token' , function(req,res){
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() } } ,function(err,user){
		if(!user) {
			req.flash('error' , 'password reset token is invalid or has expired');
			//return res.status(200).json({msg : "msg not found"});
		}
		res.render('reset' , {
			user: req.user
		});
	});
});


// dashboards
router.get('/index' , function(req,res){
	res.render('index');
});

// register User

router.post('/register' , function(req,res){
	
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;
	var password2  = req.body.password2;
	var address = req.body.address;
	var dateofbirth = req.body.dateofbirth;
	

console.log(address);


// validation 
	
req.checkBody('username','Username is required').notEmpty();
req.checkBody('email', 'Email is required').notEmpty();
req.checkBody('email','Email is not valid').isEmail();
req.checkBody('password','Password is required').notEmpty();
req.checkBody('password2', 'Passwords did not match').equals(req.body.password);
req.checkBody('address','Address is required').notEmpty();
req.checkBody('dateofbirth','dateofbirth is required').notEmpty();
	
	var errors = req.validationErrors();
		if(errors){
			res.render('register' ,{
				errors:errors
			});
		}else{
			
			var newUser = new User({
				username : username,
				email : email,
				password : password,
				address : address,
				dateofbirth : dateofbirth
				
			});

			User.createUser(newUser ,function(err,user){
					if(err) throw err;
					console.log(user);
			});

			return res.status(200).json({msg: 'Customer Account created successfully', err: false });

			req.flash('success_msg' , ' you are registered now you can login');
			res.redirect('/users/login');
		}
});

passport.use(new LocalStrategy(
	function(username,password, done){
		User.getUserByUsername(username,function(err,user){ 
			if(err) throw err;
			if(!user){
				return done(null,false,{message: 'Unknown user'});
			}
			User.comparePassword(password,user.password,function(err,isMatch){
				if(err) throw err;
				if(isMatch){
					return done(null, user);
				} else {

					return done(null,false, {message: 'Invalid password'});
				}
			});		
		});
	}));

passport.serializeUser(function(user, done){
	done(null,user.id);
});
passport.deserializeUser(function(id,done){
	User.getUserById(id, function(err,user){
		done(err,user);
	});
});

router.post('/login',
	passport.authenticate('local',{successRedirect:'/' ,failureRedirect:'/users/login' ,failureFlash: true}),
		function(req,res){
	           res.redirect('/');
});	



router.post('/forgot', function(req,res,next) {
	async.waterfall([
		function(done) {
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				done(err, token);
			});
		},
		function(token, done) {
		
			User.findOne({ email: req.body.email }, function(err,user) {



				if(!user) {
					console.log(user);
					req.flash('error' , 'No account with that email address exists ');
					return sendmail(req, req.body.email, token)
					// return res.status(200).json({msg : "not found"})

				}
				user.resetPasswordToken = token;
				user.resetPasswordExpires = Date.now() + 36000000 //1 hour

				user.save(function(err){
					done(err, token , user);
				});
			});
},

function(token, user, done) {
	
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});


function sendmail(req, email, token) {
	var smtpTransport = nodemailer.createTransport({
		service: 'gmail',
		auth: {
     
			user: 'your email id',
			pass: 'your password'
	
    }

});

	var mailOptions = {
		to: email,
		from: 'your email id',
		subject: 'Password Reset',
		text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'

	};

	smtpTransport.sendMail(mailOptions, function(err) {

		if (err) {
			console.log('there was a problem');
			console.log(err);

		}
		else{
			console.log('Email sent!!!');
		}

        //req.flash('info', 'An e-mail has been sent to ' + email + ' with further instructions.');
        //done(err, 'done');
      });
}






router.post('/reset/:token', function(req, res) {
	console.log(req.params.token, new Date());
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt:  new Date() } }, function(err, user) {
      	console.log( user);
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
         // return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save();
        done(null, user);
        });
      //});
    },
    function(user, done) {
    console.log(user);	
      var smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your emailid',
          pass: 'your password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'priyankajoshi19942@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
      	if (err) {
			console.log('there was a problem');
			console.log(err);

		}
		else{
			console.log('Your password has succesfully changed!!!');
		}

        // req.flash('success', 'Success! Your password has been changed.');
        // done(err);
      });
    }
  ], function(err) {
    res.redirect('/index');
  });
});


router.get('/logout',function(req,res){
	req.logout();
	req.flash('success_msg','you are logged out');
	res.redirect('/users/login');
});

module.exports = router;
