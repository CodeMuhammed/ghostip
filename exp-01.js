const curl = require('curlrequest');

// http://144.217.207.183:8080
// http://77.73.65.42:8080

let proxy = "http://77.73.65.42:8080";
let options = {
    url: 'fg20.herokuapp.com',
    retries: 1,
    headers: {
        'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
    },
    timeout: 10,
    proxy: proxy
};

curl.request(options, (err, res) => {
    if(err) {
        console.log('Proxy error: invalid');
    } else {
        console.log(res);
    }
});