'use strict';

//Alternatives to gimmeproxy are//
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

module.exports = (bucketObj) => {
    const request = require('request');
    const curl = require('curlrequest');
    const EventEmitter = require('events').EventEmitter;

    const moduleEvents = new EventEmitter;
    let untestedIps = [];
    let untestedIndex = 0;
    let _max_ip_count = 500;
    
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
                    if(raw.status == 429){
                        setTimeout(() => {
                            return getIp();
                        }, 1000)
                    } else {
                        if(untestedIps.length < _max_ip_count){
                            untestedIps.push(raw.curl);
                            return getIp();
                        }
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
                    /*if(res) {
                        moduleEvents.emit('ip' , proxy);
                        return testIp();
                    }
                    return testIp();*/
                    moduleEvents.emit('ip', proxy);
                    return testIp();
                }
            });
        } else {
            if(untestedIndex >= _max_ip_count ){
               console.log('All tested');
               return;
            }
            else{
                console.log('No ip yet retrying in 29 secs');
                setTimeout(() => {
                    return testIp();
                }, 30000);
            }
        }
	})();

	return moduleEvents;
};
