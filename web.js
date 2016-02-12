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
var UrlObj;
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
		      console.log('Pinging done');
			  cb(UrlObj.url);
		      return;
		   }  
	   };
	   
	   doPing();
	});
};

var runGhostProxy = function(url){ 
	console.log('starting ghost');
	
	var ip = tester.nextIp();
	if(ip == -1){
		console.log('No new proxy available will try again in 59secs');
		setTimeout(function(){
			return runGhostProxy(url);
		} , 60000);
	}
	else if(ip == -2){
		console.log('Process stopped and all available ips visited exiting...');
		urlExplorer.exitProcess(Url);
	}
	else{
		if(visitedIps.indexOf(ip)<0){
			visitedIps.push(ip);
			continueT(ip , url);
		}
		else{
			console.log('this ip has been visited already');
			return runGhostProxy(url);
		}
		
	}
	
	function continueT(ip , url){
	
		console.log('process starting '+ip+' '+url);
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
				console.log('here init 00000000000000000000000000000000000 '+url);
				spooky.start(url);
				spooky.thenClick('[value=cr]' , function() {
					phantom.clearCookies();
					this.emit('hi', 'Hello, from ' + this.evaluate(function () {
						return document.title;
					})); 
				   
				});
					
					
				spooky.run();
					
			});
			
			// logs and listeners
			spooky.on('error', function (e, stack) {
				console.log('here');
				console.error(e);

				if (stack) {
					console.log(stack);
				}
				spooky.destroy();
				runGhostProxy(UrlObj.url);
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
				runGhostProxy(UrlObj.url);
			});

      }
};

//init database get the urls specific to this session then run pingGhostWhite and testers
database.initColls(function(){
	
	//api routes starts here
	app.use('/api' , require('./api')(database));

	//initialize  url explorer
	urlExplorer  = require('./urlExplorer')(database);

	function getUrlFn(){
		urlExplorer.getUrl(function(url){
			if(url == -1){
				Greeting = 'All urls are occupied by processes trying again in five minutes';
                console.log('All urls are occupied by processes trying again in five minutes');
                setTimeout(function(){
                     getUrlFn();
                } , 5000 );
			}
			else{
				UrlObj = url;

				//start main process
	            tester = require('./tester');
	            pingGhostWhite(runGhostProxy);
			}
	        
		});
	}
	getUrlFn();
	
});










//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//=============================================================================
//configure express static
app.use(express.static(path.join(__dirname , 'public')));

app.get('/progress', function(request, response) {
    response.send(Greeting+" visited "+counter+" times ");
});

app.get('/stats', function(request, response) {
    response.send(tester.getFound());
});

//restarts the app after every 500 visits and 120 minutes of app's uptime
var currentMin = 0;
setInterval(function(){
	currentMin++;
	if((counter>=0 && currentMin>60) || currentMin>60){ 
	    //stop searching for  new ips
		tester.stopSearch(function(){
			console.log('searching stopped');
		});
	}
	else {
		if(currentMin==30){
			pingGhostWhite(function(){
				console.log('ghost white pinged');
			});
		}
	}
} , 60000);

//
app.listen(port, function() {
    console.log("Listening on " + port);
});