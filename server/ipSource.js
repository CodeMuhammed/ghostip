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

module.exports = () => {
    const request = require('request');
    const curl = require('curlrequest');
    const EventEmitter = require('events').EventEmitter;
    const moduleEvents = new EventEmitter;

    //The proxy to be used to get more proxies
    let proxy = "";

    // @method recursive getIp
	(function getIp() {
        let options = {
            url: 'http://gimmeproxy.com/api/getProxy',
            retries: 1,
            timeout: 10,
            headers: {
                'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
            },
            proxy: proxy
        };

        curl.request(options, (err, res) => {
            if(err) {
                console.log(err);
                // @TODO change proxy
                getIp();
            } else {
                 try {
                    const raw = JSON.parse(res);
                    if(raw.curl) {
                        moduleEvents.emit('ip', raw.curl);
                        return getIp();
                    } else {
                        return;
                    }
                } 
                catch (err) {
                    setTimeout(() => {
                        // @TODO change proxy
                        getIp();
                    }, 1000)
                }
            }
        });
	})();

	return moduleEvents;
};
