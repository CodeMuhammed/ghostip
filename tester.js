/**This module searches for new ip addresses and tests them for validity**/
//Main process tells you to stop searching
//you return -1 for no tested ip found but search is still on
//you return -2 for no tested ip found and all untested ips have been tested and search has stopped
//Exports important functions to calling program
module.exports = function() {
	console.log('Search and test started');

	var request = require('request');
	var LineByLineReader = require('line-by-line');
    
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
						  //console.log(err+' =============================================================here');
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
		    var options = {
				url: 'https://fg1.herokuapp.com',
				retries: 1,
				headers: {
					'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
				},
				timeout: 20,
				proxy: raw
			 };
			 
             try{
                require('curlrequest').request(options, function(err, res) {
                        if(err){
                            //console.log('Cannot test proxy');//
                            untestedIpIndex++;
                            return testIp();
                        } 
                        else {
                            if(res){
                                console.log('test done '+raw);
                                goodIps.push(raw);
                                untestedIpIndex++;
                                return testIp();
                            }
                            else {
                                //console.log('invalid proxy');
                                untestedIpIndex++;
                                return testIp();
                            }
                        }
                    });  
             }
             catch(err){
                 console.log(err);
                 untestedIpIndex++;
                 return testIp();
             }
		}
		else{
		    if(STOP_SEARCH && (untestedIpIndex==untestedIps.length)){
		    	 console.log('All ips have been tested stopping testing phase');
			}
			else{
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