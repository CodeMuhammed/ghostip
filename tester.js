/*
**This module searches for new ip addresses and tests thhem for validity*/

var request = require('request');
var curl = require('curlrequest');
var LineByLineReader = require('line-by-line');

var foundIps = [];
var currentIp = 0;
var sentinel = -1;

console.log('tester working');
/*Read lines of ip use them to make request before resulting to gimmeproxy
function getLocalProxy1(){
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
		//
		getLocalProxy();
	});
};


//Read lines of ip use them to make request before resulting to gimmeproxy
function getLocalProxy(){
	lr = new LineByLineReader('proxies.txt');
	lr.on('error', function (err) {
		console.log('error while reading file');
		Greeting = err;
	});

	lr.on('line', function (line) {
		localIps.push(line.toString());
	});

	lr.on('end', function () {
		console.log(localIps);  
		
		pingGhostWhite();
	});
}*/

function getIp(){
	request.get('http://gimmeproxy.com/api/get/3582af301a262cc0c917861d89121666/?timeout=0' , function(err , response , body){
		 if(err){
			 //console.log('cannot get ip address'); 
			 getIp();
		 } 
		 else {
			 console.log(JSON.parse(body).curl);
			 testIP(JSON.parse(body).curl);
		 }
	 });
};

function testIP(ip){
	 console.log('testing proxy');
	 
	 //Accepts both http and https proxies
	 if(!(ip.indexOf('http')>=0 && ip.indexOf('https')<=0)){
		  console.log('Not http proxy');
		  getIp();
	 }
	 else {
		 var options = {
			url: 'https://fg1.herokuapp.com',
			retries: 5,
			headers: {
				'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
			},
			timeout: 15,
			proxy: ip
		 };
		
		 curl.request(options, function(err, res) {
			   if(err){
					 console.log('Cannot test proxy');
					  getIp();;
				 } 
				 else {
					 if(res){
						 console.log('test done');
						 foundIps.push(ip);
						 getIp();
					 }
					 else {
						  console.log('invalid proxy');
						 getIp();;
					 }
				 }
		 });
	 }
}

//Kick start the getting ip process
getIp();

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//


//public functions
var nextIp = function(){
	if(currentIp < foundIps.length){
		currentIp++;
		return foundIps[currentIp-1];
	}
	else{
		return sentinel;
	}
}

//
var stopSearch = function(cb){
	sentinel = -2;
	cb();
}

//Exports important functions to calling program
module.exports = {
	nextIp : nextIp,
	stopSearch : stopSearch
};