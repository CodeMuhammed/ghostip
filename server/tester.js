'use strict';
// @TODO figure out how to get unlimited ips
// @TODO create a small node app that does that before integrating into ghostip.
// Create a document IP_DUMP to save all good ips gotten
// Read that document and use them to make request to gimmeproxy to get more ips
// Shuffle the ips to make sure all the processes are not devouring the ips linearly

//Alternatives to gimmeproxy are//
//http://proxy.tekbreak.com/
//https://incloak.com/proxy-list/
//https://kingproxies.com/register

// =================================================================================
//  Email addresses (@outlook.com)  ||  Heroku app range (ghostip{n}.herokuapp.com)
// =================================================================================
//  ghostip                         ||     41 - 45                                                                                      
//  ghostip1                        ||     36 - 40                                         
//  ghostip2                        ||     21 - 25                                       
//  ghostip3                        ||      1 -  5                                     
//  ghostip4                        ||      6   10                               
//  ghostip5                        ||     11 - 15                                    
//  ghostip6                        ||     16 - 20                                        
//  ghostip7                        ||     26 - 30                                       
//  ghostip8                        ||     31 - 35                                       
//  ghostip9                        ||     46 - 50                                        
//  ghostip10                       ||     51 - 55                                  
// ==================================================================================

module.exports = (bucketObj) => {
    const request = require('request');
    const curl = require('curlrequest');
    const EventEmitter = require('events').EventEmitter;

    const moduleEvents = new EventEmitter;
    let untestedIps = [];
    let untestedIndex = 0;
    let searching = true;
    
    // @method recursive getIp
	(function getIp() {
        request.get('http://gimmeproxy.com/api/getProxy', (err, response, body) => {
            if(err){
                console.log(err);
                getIp();
            }
            else {
                try {
                    const raw = JSON.parse(body);
                    if(raw.curl){
                        untestedIps.push(raw.curl);
                        return getIp();
                    } else {
                        searching = false;
                        return;
                    }
                } 
                catch (err) {
                    setTimeout(() => {
                        getIp();
                    }, 1000)
                }
            }
        });
	})();

	// @method recursive getIp
	(function testIp() {
        if(untestedIndex < untestedIps.length) {
           let proxy = untestedIps[untestedIndex];
           let options = {
                url: 'http://google.com',
                retries: 1,
                headers: {
                    'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
                },
                timeout: 10,
                proxy: proxy
            };
            untestedIndex++;
            curl.request(options, (err, res) => {
                if(err) {
                    console.log('Proxy error: invalid');
                    return testIp();
                } else {
                    moduleEvents.emit('ip', proxy);
                    return testIp();
                }
            });
        } else {
            if(searching) {
               console.log('No ip yet retrying in 29 secs');
                setTimeout(() => {
                    return testIp();
                }, 30000);
            }
            return;
        }
	})();

	return moduleEvents;
};
