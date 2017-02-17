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
// palingramblog@gmail.com
// Henry4jenkins@gmail.com
// codemuhammed@outlook.com
// palingram@outlook.com
// These are other heroku accounts.

// @TODO configure the dump to also cycle ips for visiting purposes

module.exports = (ipDump) => {
    console.log(ipDump);
    const request = require('request');
    const curl = require('curlrequest');
    const EventEmitter = require('events').EventEmitter;
    const moduleEvents = new EventEmitter;

    //The proxy to be used to get more proxies
    let proxy = "";

    // @method recursive getIp
	function getIp() {
        let options = {
            url: 'http://gimmeproxy.com/api/getProxy',
            retries: 1,
            timeout: 10,
            proxy: proxy
        };

        curl.request(options, (err, res) => {
            if(err) {
                console.log(err);
                proxy = ipDump.cycleIp();
            } else {
                 try {
                    const raw = JSON.parse(res);
                    if(raw.curl) {
                        moduleEvents.emit('ip', raw.curl);
                        ipDump.saveIp(raw.curl);
                    } else {
                        console.log(`${proxy} masked out`);
                        proxy = ipDump.cycleIp();
                    }
                } catch (err) {
                    console.log(res);
                    proxy = ipDump.cycleIp();
                }
            }

            return setTimeout(() => {
                return getIp();
            }, 10000);
        });
	};

    // initialize dump and start getting ips
    ipDump.init(() => {
        console.log('dump initialized');
        getIp();
    });

	return moduleEvents;
};
