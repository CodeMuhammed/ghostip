#!/usr/bin/env node

var express = require('express');
var path = require('path');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors  = require('cors');

var app = express();
var agent = require('./server/agent');
var database = require('./server/database')('restapi' , app);

var bucketExplorer;
var ipSource;
var visitor;


//init database get the urls specific to this session then run ipSource
database.initColls(function(){
	bucketExplorer  = require('./server/bucketExplorer')(database);
	ipTracker = require('./server/ipTracker')(database);
	visitor = require('./server/visitor')(agent , database , ipTracker);

	(function getBucketFn(){
		bucketExplorer.getBucket(function(bucketObj){
            if(bucketObj){
				visitor.setBucket(bucketObj);
                ipSource = require('./server/ipSource')();
                ipSource.on('ip' , function(ip){
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

	// Bootstrap express app
	app.use(cors({credentials: true, origin: true}));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));

	app.use('/api' , require('./server/api')(database , visitor));
	app.use(express.static(path.join(__dirname , 'public')));

	//Start the main Express server
	app.listen((process.env.PORT || 5004), function() {
	    console.log("Listening on " + (process.env.PORT || 5004));
	});
});
