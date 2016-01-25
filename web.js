#!/usr/bin/env node

var spooky = require("spooky");
var request = require('request');
var curl = require('curlrequest');
var express = require("express");
var app = express();

urls = [
	   'https://crd.ht/43xknrA'
];
	
var Greeting = 'Hello ghost';
var counter = 0;

var runGhostProxy = function(){
	var url=urls[0];
	console.log('starting ghost');
	function getIp(){
		console.log('getting ip');
		request.get( 'http://gimmeproxy.com/api/get/8bb99df808d75d71ee1bdd9e5d/?timeout=1' , function(err , response , body){
			 if(err){
				 console.log('Internal server error 1');
				 setTimeout(function(){
					  runGhostProxy();
				 }, 3000);
				
			 } 
			 else {
				 console.log(JSON.parse(body).curl);
				 testIP(JSON.parse(body).curl);
			 }
		 });
	};
	getIp();
	 function testIP(ip){
		 console.log('testing ip');
		  if(ip.indexOf('http')>=0 && ip.indexOf('https')<0){
			 console.log('http proxy gotten');
		 }
		 else{
			 console.log('Not http proxy');
			  runGhostProxy();
		 }
		 var options = {
			url: 'https://credhot.com',
			retries: 5,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
			},
			timeout: 18,
			proxy: ip
		 };
		
		 curl.request(options, function(err, res) {
			   if(err){
					 console.log('Internal server error 2');
					 runGhostProxy();
				 } 
				 else {
					 if(res){
						 console.log('test done');
						 continueT(ip);
					 }
					 else {
						  console.log('invalid here');
						  runGhostProxy();
					 }
					
				 }
		 });
		
	 }
	function continueT(ip){
	
		console.log('process starting '+url+' '+ip);
		var Spooky = require('spooky');
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
				spooky.start('https://crd.ht/5Q7Urnp');
				spooky.then(function () {
					this.start('https://crd.ht/5Q7Urnp');
					this.waitForSelector('[value=cr]' , function(){
						this.thenClick('[value=cr]' , function() {
						  this.emit('hi', 'Hello, from ' + this.evaluate(function () {
								return document.title;
						   }));
						   phantom.clearCookies();
						});
					});
					
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
				//spooky.removeAllListeners();
				spooky.destroy();
				runGhostProxy();
			});

			/*
			// Uncomment this block to see all of the things Casper has to say.
			// There are a lot.
			// He has opinions.
			spooky.on('console', function (line) {
				console.log(line);
			});
			*/

			spooky.on('hi', function (greeting) {
				console.log(greeting);
				counter++;
				Greeting = greeting;
				spooky.destroy();
				runGhostProxy();
			});

      }
	  return;
};
runGhostProxy();

//app.use(express.logger());
app.get('/', function(request, response) {
    response.send(Greeting+" visited "+counter+" times ");
});

//restarts the app after every 500 visits and 20 minutes of app's uptime
var currentMin = 0;
setInterval(function(){
	currentMin++;
	if((counter>=500 && currentMin>20) || currentMin>20){
		 process.exit(0); 
	}
} , 60000);

var port = process.env.PORT || 5005;
app.listen(port, function() {
    console.log("Listening on " + port);
});