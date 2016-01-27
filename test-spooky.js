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

var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
			 pageSettings: {
				loadImages:  true,
				loadPlugins: false
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
		
		spooky.emit('Clog' , 'hello clog');
		
		spooky.start('http://localhost:3002/test');
		spooky.then(function() {
			
		});
        spooky.run(); 
});

spooky.on('Clog', function (log) {
    console.log(log);
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