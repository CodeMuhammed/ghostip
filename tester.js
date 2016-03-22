/**This module searches for new ip addresses and tests them for validity**/
//Main process tells you to stop searching
//you return -1 for no tested ip found but search is still on
//you return -2 for no tested ip found and all untested ips have been tested and search has stopped
//Exports important functions to calling program
module.exports = function() {
	console.log('Search and test started');

	var request = require('request');
	var LineByLineReader = require('line-by-line');
    var tunnel = require('tunnel');
    var https = require('https');
    var EventEmitter = require('events').EventEmitter;
    var moduleEvents = new EventEmitter;
	var goodIps = [];
	var goodIpIndex = 0;

	var untestedIps = [];
	var untestedIpIndex=0;

	//
	var STOP_SEARCH =false;

	//Alternatives to gimmeproxy are
    //http://proxy.tekbreak.com/
    //https://happy-proxy.com/en
    //https://incloak.com/proxy-list/
    //https://kingproxies.com/register
    //http://www.getproxy.jp/en/api
    //https://getproxy.net/en/api/
    
    //gip = 41-45
    //gip1 = 36-40
    //gip2 = 21-25
    //gip3 = 1-5
    //gip4 = 6-10
    //gip5 = 11-15
    //gip6 = 16-20
    //gip7 = 26-30
    //gip8 = 31-35
    //gip9 = 46-50
    //gip10 = 51-55
    
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
                         
						 //
						 untestedIps.push(rawIp.ip);
					    
						 setTimeout(function(){
						 	getIp();
						 } ,500)
					 } 
					 catch (err) {
						   //console.log(body);
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
			var ip = untestedIps[untestedIpIndex]+'';
            untestedIpIndex++;
            var ipPort = ip.split(':');
            console.log(ipPort);
            

            var tunnelingAgent = tunnel.httpsOverHttp({
                proxy: {
                    host: ipPort[0],
                    port: ipPort[1]
                }
            });

            var req = https.request({
                host: 'www.google.com',
                port: 80,
                agent: tunnelingAgent
            });
            
            req.on('data' , function(data){
                console.log(data);
            });
            
            req.on('error' , function(err){
                //console.log(err);
                if(err.toString().indexOf('Parse')>=0){
                    moduleEvents.emit('ip' , 'http://'+ip);
                    testIp();
                }
                else{
                    moduleEvents.emit('notify' , 'ip not alive');
                    testIp();
                }
            });
		}
        else{
		    if(STOP_SEARCH && (untestedIpIndex==untestedIps.length)){
		    	 console.log('All ips have been tested stopping testing phase');
                 moduleEvents.emit('done' , '');
			}
			else{
				return setTimeout(function(){
                    console.log('No ip yet');
					return testIp();
				} , 5000);
			}

		}
		
	}
	//Kick start the testing process
	testIp();

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//
   
	return moduleEvents;	
};