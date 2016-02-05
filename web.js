#!/usr/bin/env node

var Spooky = require('spooky');
var request = require('request');
var express = require('express');
var tester = require('./tester');
var LineByLineReader = require('line-by-line');
var app = express();

var Greeting = 'Hello ghost';
var counter = 0;
var herokuAppsUrls = [];

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
			  cb();
		      return;
		   }  
	   };
	   
	   doPing();
	});
};

var runGhostProxy = function(){ 
	console.log('starting ghost');
	
	var ip = tester.nextIp();
	if(ip == -1){
		console.log('No new proxy available will try again in 59secs');
		setTimeout(function(){
			runGhostProxy();
		} , 60000);
	}
	else if(ip == -2){
		console.log('Process stopped and all available ips visited exiting...');
		process.exit(0);
	}
	else{
		continueT(ip);
	}
	
	function continueT(ip){
	
		console.log('process starting '+ip);
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
				console.log('here init');
				spooky.start('https://fg2.herokuapp.com');
				spooky.then([{ip : ip} , function(){
					console.log(ip);
					this.urls = [
					    ['https://crd.ht/CzAMpQv','[value=cr]'],
					    ['https://crd.ht/PUBZc4R','[value=cr]'],
						['https://crd.ht/71wMWN3','[value=cr]'],
						['https://crd.ht/H38xVxz','[value=cr]'],
						['https://crd.ht/81avGhp','[value=cr]'],
						['https://crd.ht/A7hTbCE','[value=cr]'],
						['https://crd.ht/2tueD5V','[value=cr]'],
						['https://crd.ht/E1Ne7GK','[value=cr]'],
						['https://crd.ht/FkQLUhk','[value=cr]'],
						['https://crd.ht/HEamS5V','[value=cr]'],
					];
					this.count= 0;
					
					this.visitAll = function(detail){
						this.start(detail[0])
						this.thenClick(detail[1] , function() {
								if(this.count==this.urls.length-1){
									phantom.clearCookies();
									this.emit('hi', 'Hello, from ' + this.evaluate(function () {
										return document.title;
									})); 
								}
								else{
									 phantom.clearCookies();
									 this.count++;
									 this.visitAll(this.urls[this.count]);
								} 
							   
						});
					};
					this.visitAll(this.urls[this.count]);
				}]);
					
					
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
				runGhostProxy();
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
				spooky.destroy();
				runGhostProxy();
			});

      }
	  return;
};

pingGhostWhite(runGhostProxy);

//app.use(express.logger());
app.get('/', function(request, response) {
    response.send(Greeting+" visited "+counter+" times ");
});

//restarts the app after every 500 visits and 120 minutes of app's uptime
var currentMin = 0;
setInterval(function(){
	currentMin++;
	if((counter>=0 && currentMin>90) || currentMin>90){ 
	    //stop searching for  new ips
		tester.stopSearch(function(){
			console.log('searching stopped');
		});
	}
	else {
		if(currentMin==30 || currentMin==60){
			pingGhostWhite(function(){
				console.log('ghost white pinged');
			});
		}
	}
} , 60000);

var port = process.env.PORT || 5003;
app.listen(port, function() {
    console.log("Listening on " + port);
});