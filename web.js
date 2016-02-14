#!/usr/bin/env node

var Spooky = require('spooky');
var request = require('request');
var express = require('express');
var path = require('path');
var LineByLineReader = require('line-by-line');
var app = express();
var database = require('./database')('restapi' , app);

var port = process.env.PORT || 5003;

var Greeting = 'Hello ghost';
var counter = 0;
var herokuAppsUrls = [];
var visitedIps = [];
var urlExplorer;
var tester;

function pingGhostWhite(cb){
	
    console.log('heroku ping here');
    //Read lines of ip use them to make request before resulting to gimmeproxy
	ha = new LineByLineReader('herokuapps.txt');
	ha.on('error', function (err) {
		console.log('error while reading file');
	});

	ha.on('line', function (line) {
		herokuAppsUrls.push(line.toString());
	});

	ha.on('end', function () {
	   console.log(herokuAppsUrls.length);
	   
	   //do pinging
	   var currentUrl = 0;
	   function doPing(){
	       if(currentUrl < herokuAppsUrls.length){
		        request.get(herokuAppsUrls[currentUrl] , function(err , response , body){
					 if(err){
						 console.log(err);
						 currentUrl++;					 
						 doPing();
					 } 
					 else {
					     Greeting = herokuAppsUrls[currentUrl]+' test done';
						 //console.log(herokuAppsUrls[currentUrl]+' test done'); 
						 currentUrl++;					 
						 doPing();
					 }
				 });
		   }
		   else{
			  cb();
		      return;
		   }  
	   };
	   
	   doPing();
	});
};

var runGhostProxy = function(ip , url , selector){ 
	console.log('starting ghost');
	
	if(visitedIps.indexOf(ip)<0){
		visitedIps.push(ip);
		continueT(ip);
	}
	else{
		console.log('this ip has been visited already');
		return ;//runGhostProxy(url);
	}
	
	function continueT(ip){
	
		console.log('process starting '+ip+' '+url+' '+selector);
		var spooky = new Spooky(
			 {
				child: {
					transport: 'http',
					proxy: ip
				},
				casper: {
					logLevel: 'debug',
					verbose: true
				}
			 },
			 function(err){
				 if (err) {
					e = new Error('Failed to initialize SpookyJS');
					e.details = err;
					throw e;
				 }
				
				//start the main site visiting process
				console.log('here init 00000000000000000000000000000000000 '+url+' '+selector);
				spooky.start(url);
				
				if(selector=='none'){
                     spooky.emit('hi', 'Hello, from ' + spooky.evaluate(function () {
							return document.title;
					 }));
				}
				else{
					spooky.thenClick(selector , function() {
						phantom.clearCookies();
						this.emit('hi', 'Hello, from ' + this.evaluate(function () {
							return document.title;
						})); 
					   
					});
				}
				
					
					
				spooky.run();
					
			});
			
			// logs and listeners
			spooky.on('error', function (e, stack) {
				console.log('here');
				console.error(e);
				Greeting = e;

				if (stack) {
					console.log(stack);
				}
				//spooky.destroy();
			});

			
			// Uncomment this block to see all of the things Casper has to say.
			// There are a lot.
			// He has opinions.
			spooky.on('console', function (line) {
				console.log(line);
			});
			 
			spooky.on('hi', function (greeting) {
				console.log(greeting);
				counter+=1;
				Greeting = greeting;
				//spooky.destroy();
			});

      }
};

//init database get the urls specific to this session then run pingGhostWhite and testers
database.initColls(function(){
	 
	//api routes starts here
	app.use('/api' , require('./api')(database));

	//initialize  url explorer
	urlExplorer  = require('./urlExplorer')(database , runGhostProxy);

	function getUrlFn(){
		urlExplorer.getUrl(function(urlObj){
			if(urlObj == -1){
				Greeting = 'All urls are occupied by processes trying again in 10 secs';
                console.log('All urls are occupied by processes trying again in ten secs');
                setTimeout(function(){
                     getUrlFn();
                } , 10000 );
			}
			else{
				//start main process of testing then visiting
	            tester = require('./tester')(runGhostProxy , urlObj , function(){
	            	console.log('Done here next is to exit the process successfully');
	            	urlExplorer.exitProcess(urlObj);
	            });
			}
	        
		});
	}
	getUrlFn();
	
});




//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=============================================================================
//configure express static
app.use(express.static(path.join(__dirname , 'public')));

app.get('/stats', function(request, response) {
	if(tester){
        var statsObj = tester.getFound();
	    statsObj.progress ="visited "+counter+" times ";
	    statsObj.status=Greeting;
	    statsObj.explorer = urlExplorer.getStat();
        response.send(statsObj);
	}
	else{
		var statsObj = {};
		statsObj.progress ="visited "+counter+" times ";
	    statsObj.status=Greeting;
	    statsObj.explorer = urlExplorer.getStat();
	    response.send(statsObj);
	}
	
});


//stop searching for new ips after the first 10 minutes of app's uptime
setTimeout(function(){
	if(true){ 
		pingGhostWhite(function(){
		    console.log('ghost white pinged');
		    //stop searching for  new ips
			tester.stopSearch(function(){
				console.log('searching stopped');
			});
		});
	   
	}
	
} , 60000*20);

//
app.listen(port, function() {
    console.log("Listening on " + port);
});