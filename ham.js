#!/usr/bin/env node

var express = require("express");
var app = express();
var Spooky = require('spooky');

//run ip changing credhot visiting bot
//var ipful = require('./ipful');
//ipful.init();

//run main non ip address changing bot
var gGreeting = 'Hello World';
var counter = 0;
console.log(gGreeting);

var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
			 pageSettings: {
				loadImages:  true,
				loadPlugins: false,
				clearMemoryCaches:true	
			},
            logLevel: 'info',
            verbose: true
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e;
        }
				/** 
		 * Auto waitForResource on all Ajax requests.
		 * Inserts a 250ms delay after load to allow any page renders with response   
		 */
		spooky.options.onResourceRequested = function (spooky, requestData){
			//is this Ajax..
			var isAjax = requestData.headers.some(function(header) {
				return (header.name == "X-Requested-With" && header.value == "XMLHttpRequest");
			});

			if(isAjax){
				spooky.waitForResource(requestData.url, function(){
					spooky.wait(250); //wait quarter of a sec for any page render after an ajax load...
				}, function(){
					console.error("AJAX request for " + requestData.url + " timed out.")
				}, 10000);
			}
		}
		
		
		spooky.start('https://1.hidemyass.com/ip-1');
		spooky.then(function() {
			this.fillSelectors('form', {
				'input[name="u"]': 'http://www.palingram.com/ads-test.html'
			}, true);
		});

		spooky.waitFor(function check() {
			return this.evaluate(function() {
				return document.querySelectorAll('iframe').length > 8;
			});
		}, function then() {
			this.evaluate(function() {
				console.log('moving on to the next one');
			});
			this.then(function() {
			    this.emit('palingram.loaded');
			});
			
		}, function timeout() {
		    process.exit(0);
		} , 20000);
				
        spooky.run(); 
});

spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});


// Uncomment this block to see all of the things Casper has to say.
// There are a lot.
// He has opinions.
spooky.on('console', function (line) {
    console.log(line);
});

spooky.on('palingram.loaded' , function(){
	function extractParts(url) {
		var temp = url;
		var protocol = url.substr(0,'https://'.length);
		var temp = temp.substr(protocol.length);
		var VPN = temp.substr(0 , temp.indexOf('.'));
		temp = temp.substr(VPN.length);
		var address = temp.substr(0 , temp.indexOf('-')+1);
		temp = temp.substr(address.length);
		var ip = temp.substr(0 , temp.indexOf('/') );
		temp = temp.substr(ip.length);
		var last = temp;
		return {protocol:protocol, VPN:VPN , address:address , ip:ip , last:last};
	}
	
	this.extracted = extractParts(this.getCurrentUrl());
	this.emit('palingram.rotate');
});

spooky.on('palingram.rotate' , function(){
	this.counter = 0;
	this.visitor = function(url){
		console.log('here is your url '+url);
		this.start(url);
		this.then(function() {
		    this.counter++;
			if(this.extracted.ip*1 >= 1000){
				this.extracted.ip = '1';
				this.VPN++;
			}
			if(this.VPN*1 == 100){
				this.exit();
			}
			phantom.clearCookies();
			this.extracted.ip++;
	        this.visitor(this.extracted.protocol+this.extracted.VPN+this.extracted.address+this.extracted.ip+this.extracted.last);
		});
	}
	this.extracted.ip++;
	this.visitor(this.extracted.protocol+this.extracted.VPN+this.extracted.address+this.extracted.ip+this.extracted.last);
});

spooky.on('log', function (log) {
    if (log.space === 'remote') {
        console.log(log.message.replace(/ \- .*/, ''));
    }
});


//app.use(express.logger());
app.get('/', function(request, response) {
    response.send(gGreeting+" visited "+counter+" times");
});

var port = process.env.PORT || 5002;
app.listen(port, function() {
    console.log("Listening on " + port);
});