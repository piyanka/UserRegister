var express = require('express');
var router = express.Router();
var mongo = require('mongodb');

//Get home page

router.get('/',function(req,res){
 res.render('index.handlebars');
});

module.exports = router;