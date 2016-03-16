#!/usr/bin/env node

var express = require('express');
var path = require('path');
var app = express();  
var methodOverride = require('method-override');  
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'); 
    
//cors  
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


//init database get the urls specific to this session then run testers
database.initColls(function(){
	
	bucketExplorer  = require('./bucketExplorer')(database);
    visitor = require('./visitor')(bucketExplorer , database);
	app.use('/api' , require('./api')(database , visitor));

	function getBucketFn(){
		bucketExplorer.getBucket(function(bucketObj){
            if(bucketObj){
                visitor.setBucket(bucketObj);
                tester = require('./tester')();

                //@TODO : get a good ip every 5 secs and visit with it
                function tryVisiting(){
                	console.log('Next visit starts in 5 secs');
                	setTimeout(function(){
                		var ip = tester.getNext();
                        if(ip == -1){
                            console.log('No ip yet retrying ....');
                            tryVisiting();
                        }
                        else if(ip == -2){
                             console.log('Tester done working ....');
                             visitor.exitWhenDone();
                        }
                        else{
                            visitor.visitWith(ip);
                            tryVisiting();
                        }
                	} , 60000);
                	
                }
                tryVisiting();
                
            }
            else{
               console.log('No buckets available at the moment ----- retrying in 9secs');
               setTimeout(function(){
               	    getBucketFn();
               } , 10000);
            }
		});
	};
	getBucketFn()

	//=============================================================================
	//configure express static
	app.use(express.static(path.join(__dirname , 'public')));

	//Start the main Express server
	app.listen(port, function() {
	    console.log("Listening on " + port);
	});
	 
});