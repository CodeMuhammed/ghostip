#!/usr/bin/env node

var spooky = require("spooky");
var request = require('request');
var curl = require('curlrequest');
var express = require("express");
var app = express();
	
var Greeting = 'Hello ghost';
var counter = 0;

var runGhostProxy = function(){
	console.log('starting ghost');
	function getIp(){
		console.log('getting ip');
		request.get( 'http://gimmeproxy.com/api/get/8bb99df808d75d71ee1bdd9e5d/?timeout=1' , function(err , response , body){
			 if(err){
				 console.log('cannot get ip address');
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
		 console.log('testing proxy');
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
					 console.log('Cannot test proxy');
					 runGhostProxy();
				 } 
				 else {
					 if(res){
						 console.log('test done');
						 continueT(ip);
					 }
					 else {
						  console.log('invalid proxy');
						  runGhostProxy();
					 }
					
				 }
		 });
		
	 }
	function continueT(ip){
	
		console.log('process starting '+ip);
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
				spooky.start('http://www.palingram.com/ads-test.html');
				
				spooky.then(function () {
					this.urls = [
					  'https://crd.ht/5Q7Urnp',
					  'https://crd.ht/AubKZrd',
					  'https://crd.ht/5hpzV51',
					  'https://crd.ht/52NdGeA',
					  'https://crd.ht/DQy7Gxh',
					  'https://crd.ht/HAH3C26',
					  'https://crd.ht/CprrR2t',
					  'https://crd.ht/EDsT5nM',
					  'https://crd.ht/HJXP3f5',
					  'https://crd.ht/6iqA42M',
					  'https://crd.ht/Gsx25KY',
					  'https://crd.ht/8TzwpyX',
					  'https://crd.ht/9Ua166d',
					  'https://crd.ht/43xknrA',
					  'https://crd.ht/7bbh5Qt',
					  'https://crd.ht/3BndR4T',
					  'https://crd.ht/As5qS5F',
					  'https://crd.ht/6hSjjMi',
					  'https://crd.ht/96aJ3bm',
					  'https://crd.ht/3Jn7y2G'
					 ];
					this.count= 0;
					
					this.visitAll = function(){
						this.start(this.urls[this.count%this.urls.length]);
						this.waitForSelector('[value=cr]' , function(){
							this.thenClick('[value=cr]' , function() {
								if(this.count==this.urls.length-1){
									phantom.clearCookies();
									this.emit('hi', 'Hello, from ' + this.evaluate(function () {
										return document.title;
									}));
								}
								else{
									 phantom.clearCookies();
									 this.emit('notify', 'Hey, we have visited '+this.count+' timmes');
									 this.count++;
									 this.clear();
									 this.visitAll();
								} 
							   
							});
						});
					};
					this.visitAll();
						
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
				counter+=20;
				Greeting = greeting;
				spooky.destroy();
				runGhostProxy();
			});
			
			
			
			spooky.on('notify', function (notify) {
				console.log(notify);
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