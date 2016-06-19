#!/usr/bin/env node

var express = require('express');
var path = require('path');
var app = express();
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors  = require('cors');

app.use(cors({credentials: true, origin: true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var database = require('./database')('restapi' , app);

var port = process.env.PORT || 5004;
//
var Greeting = 'Hello ghost';
var counter = 0;
var herokuAppsUrls = [];
var visitedIps = [];

var bucketExplorer;
var tester;
var visitor;
var agent = require('./agent');

//init database get the urls specific to this session then run testers
database.initColls(function(){

	bucketExplorer  = require('./bucketExplorer')(database);
  visitor = require('./visitor')(agent , database);
	app.use('/api' , require('./api')(database , visitor));

	(function getBucketFn(){
		bucketExplorer.getBucket(function(bucketObj){
            if(bucketObj){
                visitor.setBucket(bucketObj);
                tester = require('./tester')(bucketObj);

                //
                tester.on('ip' , function(ip){
                    visitor.visitWith(ip);
                });
            }
            else{
               console.log('No buckets available at the moment ----- retrying in 19secs');
               setTimeout(function(){
               	    getBucketFn();
               } , 20000);
            }
		});
	})();

	//=============================================================================
	//configure express static
	app.use(express.static(path.join(__dirname , 'public')));

	//Start the main Express server
	app.listen(port, function() {
	    console.log("Listening on " + port);
	});

});
