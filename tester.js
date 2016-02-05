/**This module searches for new ip addresses and tests thhem for validity**/
//Main process tells you to stop searching
//you return -1 for no tested ip found but search is still on
//you return -2 for no tested ip found and all untested ips have been tested and search has stopped

console.log('tester working');

var request = require('request');
var curl = require('curlrequest');
var LineByLineReader = require('line-by-line');

var goodIps = [];
var goodIpIndex = 0;

var untestedIps = [];
var untestedIpIndex=0;

//
var NO_IP = -1;
var STOP_SEARCH =false;
var TEST_DONE = -2;


//
function getIp(){
	if(!STOP_SEARCH){
		 request.get('http://gimmeproxy.com/api/get/3582af301a262cc0c917861d89121666/?timeout=0' , function(err , response , body){
			 if(err){
				 //console.log('cannot get ip address'); 
				 getIp();
			 } 
			 else {
				 var ip = JSON.parse(body).curl;
				 //console.log(ip);
				 var index = untestedIps.indexOf(ip);
				 if(index<0){
					 untestedIps.push(ip);
				 }
				 
				 getIp();
			 }
		 });
	}
	else{
		console.log('ip searching stopped');
		return;
	}
};
//Kick start the getting ip process
getIp();

//
function testIP(){
	if(untestedIpIndex<untestedIps.length){
		  console.log('testing proxy '+untestedIps[untestedIpIndex]);
	    var options = {
			url: 'https://fg1.herokuapp.com',
			retries: 5,
			headers: {
				'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
			},
			timeout: 15,
			proxy: untestedIps[untestedIpIndex]
		 };
		
		 curl.request(options, function(err, res) {
			   if(err){
					 console.log('Cannot test proxy');
					 untestedIpIndex++;
					 testIP();
				 } 
				 else {
					 if(res){
						 console.log('test done');
						 goodIps.push(untestedIps[untestedIpIndex]);
						 untestedIpIndex++;
						 testIP();
					 }
					 else {
						 console.log('invalid proxy');
						 untestedIpIndex++;
						 testIP();
					 }
				 }
		 });
	}
	else{
	    if(STOP_SEARCH && (untestedIpIndex==untestedIps.length)){
			 return;
		}
		else{
		    console.log('No untested ips will retry in 30secs');
			setTimeout(function(){
				testIP();
			} , 30000);
		}
		
	}
	
}
//Kick start the testing process
testIP();

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//


//public functions
var nextIp = function(){
	if(goodIpIndex < goodIps.length){
		goodIpIndex++;
		return goodIps[goodIpIndex-1];
	}
	else{
		//
		if(STOP_SEARCH && (untestedIpIndex==untestedIps.length) && (goodIpIndex==goodIps.length)){
			 return TEST_DONE;
		}
		else{
			return NO_IP;
		}
		
	}
}

//
var stopSearch = function(cb){
	STOP_SEARCH = true;
	cb();
}

//Exports important functions to calling program
module.exports = {
	nextIp : nextIp,
	stopSearch : stopSearch
};