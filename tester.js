/**This module searches for new ip addresses and tests them for validity**/
//Main process tells you to stop searching
//you return -1 for no tested ip found but search is still on
//you return -2 for no tested ip found and all untested ips have been tested and search has stopped
//Exports important functions to calling program
module.exports = function() {
	console.log('Search and test started');

	var request = require('request'); 
	var curl = require('curlrequest');
	var LineByLineReader = require('line-by-line');
    
	var goodIps = [];
	var goodIpIndex = 0;

	var untestedIps = [];
	var untestedIpIndex=0;

	//
	var STOP_SEARCH =false;

	
	function getIp(){
		if(!STOP_SEARCH){
			 request.get('http://gimmeproxy.com/api/getProxy' , function(err , response , body){
				 if(err){
					 //console.log('cannot get ip address'); 
					 getIp();
				 } 
				 else {
					 if(untestedIps.length > 2500){
						 STOP_SEARCH = true;
					 }
				     
	                 try {
						 var rawIp = JSON.parse(body);
						 //only http proxies allowed
						 if(rawIp.curl.indexOf('socks')<0){
						 	 untestedIps.push('http://'+rawIp.ip);
						 }
						    
						 setTimeout(function(){
						 	getIp();
						 } ,500)
					 } 
					 catch (err) {
						  // Handle the error here.
						   console.log(err+' =============================================================here');
						   setTimeout(function(){
						 	  getIp();
						   } ,500)
					 }
					 
				 }
			 });
		}
		else{
			console.log('ip searching stopped');
			return;
		}
	};
    getIp();

	//
	var testIp = function(){
		if(untestedIpIndex<untestedIps.length){
			var raw = untestedIps[untestedIpIndex];
            console.log(raw);
		    var options = {
				url: 'https://fg1.herokuapp.com',
				retries: 5,//
				headers: {
					'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
				},
				timeout: 15,
				proxy: raw
			 };
			
			 curl.request(options, function(err, res) {
				   if(err){
						 console.log('Cannot test proxy');
						 untestedIpIndex++;
						 return testIp();
					 } 
					 else {
						 if(res){
							 console.log('test done');
							 goodIps.push(raw);
                             untestedIpIndex++;
							 return testIp();
						 }
						 else {
							 console.log('invalid proxy');
							 untestedIpIndex++;
							 return testIp();
						 }
					 }
			 }); 
		}
		else{
		    if(STOP_SEARCH && (untestedIpIndex==untestedIps.length)){
		    	 console.log('All ips have been tested stopping testing phase');
			}
			else{
			    console.log('No untested ips will retry in 10secs');
				return setTimeout(function(){
					return testIp();
				} , 10000);
			}
			
		}
		
	}
	//Kick start the testing process
	testIp();

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//
    var getNext = function(){
    	if(goodIps.length > 0 && goodIpIndex < goodIps.length && !STOP_SEARCH ){
            var ip = goodIps[goodIpIndex];
            goodIpIndex++;
            return ip;
    	}
    	else if(goodIpIndex >= goodIps.length && STOP_SEARCH){
    		//All good ips have been exhausted no more new ips
            return -2;
    	}
    	else{
    		//All good ips exhausted but untested ips available
            return -1;
    	}
    }

	return {
	    getNext:getNext
	}
	
};