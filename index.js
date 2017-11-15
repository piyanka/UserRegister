var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var request = require('request');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var hbs = require('handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require ('passport');
var LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/login');
var db = mongoose.connection;

    var routes = require(__dirname+'/server/routes/index');
    var users =  require(__dirname+'/server/routes/users');

//Init App

    var app = express();

//view engine
    
        app.set('views' , path.join(__dirname, 'views'));
        app.engine('handlebars' ,exphbs({defaultLayout:'layout'}));
        app.set('view engine', 'handlebars');

// bodyparser middleware

app.use(bodyParser.json());
app.use(bodyParser.urlencoded ({extended:false}));
app.use(cookieParser());


//set static

app.use(express.static(path.join(__dirname ,'public')));

//Express session

 app.use(session({
         secret: 'secret',
         saveUninitialized : true,
         resave: true

}));


//Init Passport

app.use(passport.initialize());
app.use(passport.session());

//Express Validator

app.use(expressValidator({
    errorFormatter : function(param, msg,value){
        var namespace = param.split('.')
        , root = namespace.shift()
        ,formParam = root;

        while(namespace.length) {
            formParam += '[' +namespace.shift() + ']';
        }
        return{
            param: formParam,
            msg : msg,
            value : value
        };
    }
}));



//connect flash

app.use(flash());

//global vars
app.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

app.use('/' ,routes);
app.use('/users' ,users);

//set port

app.set('port' ,(process.env.PORT || 2000));

app.listen(app.get('port'),function(){
    console.log("server is listening at this port:" + app.get('port'));

});

