const curl = require('curlrequest');
const ipSource = require('./server/ipSource')();

ipSource.on('ip', (ip) => {
    console.log(ip);
});