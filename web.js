#!/usr/bin/env node

var spooky = require("spooky");
var request = require('request');
var curl = require('curlrequest');
var express = require("express");
var LineByLineReader = require('line-by-line');
var app = express();

var Greeting = 'Hello ghost';
var counter = 0;
var currentIp = 0;
var visitedIp = [];
var localIps = [];
var herokuAppsUrls = [];


//Read lines of ip use them to make request before resulting to gimmeproxy
lr = new LineByLineReader('rawProxy.txt');
lr.on('error', function (err) {
	console.log('error while reading file');
	Greeting = err;
});

lr.on('line', function (line) {
	localIps.push(line.toString());
});

lr.on('end', function () {
    var nr = [];
	var i;
	for(i=0; i<localIps.length; i++){
	    if(localIps[i].length>30){
			var temp = localIps[i].substr(localIps[i].indexOf('\t')).trim();
			temp = temp.substr(0 , temp.indexOf('\tflag'));
			temp=temp.trim();
			var ip = temp.substr(0 , temp.indexOf(' ')).trim();
			var port = temp.substr(temp.indexOf('\t')).trim();
			nr.push(ip+':'+port);
		}
	}
    
	localIps = nr;
	console.log(localIps);  
	
	//
	pingGhostWhite();
});

function pingGhostWhite(){
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
	   console.log(herokuAppsUrls);
	   
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
						 console.log(herokuAppsUrls[currentUrl]+' test done'); 
						 currentUrl++;					 
						 doPing();
					 }
				 });
		   }
		   else{
		      console.log('Pinging done');
			  runGhostProxy();
		      return;
		   }  
	   };
	   
	   doPing();
	});
}

var runGhostProxy = function(){ 
	console.log('starting ghost');
	function getIp(){
		if(currentIp<localIps.length){
			console.log('getting local ip');
			testIP('http://'+localIps[currentIp]);
		}
		else{
			request.get('http://gimmeproxy.com/api/getProxy' , function(err , response , body){
				 if(err){
					 console.log('cannot get ip address'); 
					 runGhostProxy();
				 } 
				 else {
					 console.log(JSON.parse(body).curl);
					 testIP(JSON.parse(body).curl);
				 }
			 });
		}
	};
	getIp();
	
	function testIP(ip){
		 currentIp++;
		 console.log('testing proxy');
		 
		 //check if proxy has already been used for this round
		 if(visitedIp.indexOf(ip)>=0){
			 console.log('ip already visited');
			 runGhostProxy();
		 }
		 else if(!(ip.indexOf('http')>=0 && ip.indexOf('https')<=0)){
			  console.log('Not http proxy');
			  runGhostProxy();
		 }
		 else {
			 var options = {
				url: 'https://credhot.com',
				retries: 5,
				headers: {
					'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
				},
				timeout: 20,
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
							 visitedIp.push(ip);
							 continueT(ip);
						 }
						 else {
							  console.log('invalid proxy');
							  runGhostProxy();
						 }
						
					 }
			 });
	     }
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
					    ['https://crd.ht/71wMWN3' , '[value=cr]'],
					    ['http://cur.lv/ur5hp' , 'a#skip-ad.btn.btn-inverse'],
						
					];
					this.count= 0;
					
					this.visitAll = function(detail){
						this.start(detail[0]);
						this.waitForSelector(detail[1] , function(){
							this.thenClick(detail[1] , function() {
								if(this.count==this.urls.length-1){
									phantom.clearCookies();
									this.emit('hi', 'Hello, from ' + this.evaluate(function () {
										return document.title;
									})); 
								}
								else{
									 phantom.clearCookies();
									 //this.emit('notify', 'Hey, we have visited '+this.count+' timmes');]
									 this.count++;
									 this.clear();
									 this.visitAll(this.urls[this.count]);
								} 
							   
							});
						});
					};
					this.visitAll(this.urls[this.count]);
						
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
				counter+=1;
				Greeting = greeting;
				runGhostProxy();
			});

      }
	  return;
};

//app.use(express.logger());
app.get('/', function(request, response) {
    response.send(Greeting+" visited "+counter+" times ");
});

//restarts the app after every 1000 visits and 120 minutes of app's uptime
var currentMin = 0;
setInterval(function(){
	currentMin++;
	if((counter>=500 && currentMin>40) || currentMin>40){ 
	    //ping other apps before restarting 
		 process.exit(0); 
	}
} , 60000);

var port = process.env.PORT || 5003;
app.listen(port, function() {
    console.log("Listening on " + port);
});