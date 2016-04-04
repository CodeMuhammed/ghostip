/**This module searches for new ip addresses and tests them for validity**/
//Main process tells you to stop searching
//you return -1 for no tested ip found but search is still on
//you return -2 for no tested ip found and all untested ips have been tested and search has stopped
//Exports important functions to calling program

module.exports = function(bucketObj) {
	console.log('Search and test started');

	var request = require('request');
    var curl = require('curlrequest');
    
	var LineByLineReader = require('line-by-line');
    var tunnel = require('tunnel');
    var https = require('https');
    var EventEmitter = require('events').EventEmitter;
    var moduleEvents = new EventEmitter;
	
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
			 request.get('http://gimmeproxy.com/api/get/'+bucketObj._id+'/?timeout=7200' , function(err , response , body){
				 if(err){
					 getIp();
				 } 
				 else {
	                 try {
						 var raw = JSON.parse(body);
                         if(raw.status == 429){
                             console.log('Rate limit exceeded');
                             setTimeout(function(){
                                  return getIp();
                             } ,1000)
                         }
                         else{
                             //@TODO test ip
                             testIp(raw.curl);
                         }
                         
					 } 
					 catch (err) {
						   setTimeout(function(){
						 	  getIp();
						   } ,1000)
					 }
					 
				 }
			 });
		}
		else{
			console.log('ip searching stopped');
			return;
		}
	};

	//
	var testIp = function(curlIp){
        var options = {
            url: 'https://google.com',
            retries: 2,
            headers: {
                'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
            },
            timeout: 15,
            proxy: curlIp
        };
        
        curl.request(options, function(err, res) {
            if(err){
                console.log('Proxy error: invalid');
                return getIp();
            } 
            else {
                if(res){
                    console.log('test done');
                    moduleEvents.emit('ip' , curlIp);
                    return getIp();
                }
                else {
                    console.log('Connection was timed out');
                    return getIp();
                }
            }
        }); 
	}
    
    //Kick start the process
    getIp();
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//
   
	return moduleEvents;	
};