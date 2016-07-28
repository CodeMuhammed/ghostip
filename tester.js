'use strict';
//This module searches for new ip addresses and tests them for validity
//you emit a message to main process when an ip is found

//Alternatives to gimmeproxy are//
//http://proxy.tekbreak.com/
//https://happy-proxy.com/en
//https://incloak.com/proxy-list/
//https://kingproxies.com/register
//http://www.getproxy.jp/en/api
//https://getproxy.net/en/api/

//Blockadz accounts
//ghostip4@outlookcom --- muhammed
//ghostip10@outlookcom --- muhammed2

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

//visit 3H 10S         ***

module.exports = function(bucketObj) {
	  console.log('Ip Search and test started');

	  var request = require('request');
    var curl = require('curlrequest');

 	  var LineByLineReader = require('line-by-line');
    var EventEmitter = require('events').EventEmitter;
    var moduleEvents = new EventEmitter;

 	  //
    var untestedIps = [];
    var untestedIndex = 0;
    var _max_ip_count = 1500;

	(function getIp(){
		 request.get('http://gimmeproxy.com/api/getProxy' , function(err , response , body){
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
                        } ,3000)
                    }
                    else{
                        if(untestedIps.length < _max_ip_count){
                            untestedIps.push(raw.curl);
                            return getIp();
                        }
                        else{
                            console.log(_max_ip_count+' ips gotten');
                            return;
                        }
                    }

                }
                catch (err) {
                    setTimeout(function(){
                        getIp();
                    } ,3000)
                }

            }
        });
	})();

	//
	(function testIp(){
        if(untestedIndex < untestedIps.length){
           let proxy = untestedIps[untestedIndex]
           let options = {
                url: 'https://google.com',
                retries: 1,
                headers: {
                    'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                },
                timeout: 10,
                proxy: proxy
            };
            untestedIndex++;
            curl.request(options, function(err, res) {
                if(err){
                    console.log('Proxy error: invalid');
                    return testIp();
                }
                else {
                    if(res){
                        console.log('test done');
                        moduleEvents.emit('ip' , proxy);
                        return testIp();
                    }
                    else {
                        console.log('Connection was timed out');
                        return testIp();
                    }
                }
            });
        }
        else{
            if(untestedIndex == _max_ip_count ){
               console.log('All tested');
               return;
            }
            else{
                console.log('No ip yet retrying in 29 secs');
                setTimeout( function(){
                    return testIp();
                }, 30000);
            }
        }

	})();

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++//

	return moduleEvents;
};
