//commit and push ghostip to github
//Google how to read to file lineby line
//google proxy-list.txt
//use proxy checker to filter out the http proxies 
//add them to proxies.txt
//checkout bubblews
//checkout ethereum

var curl = require('curlrequest');
var LineByLineReader = require('line-by-line');

var proxies = [];
var tested = [];
var count = 0;


var fs = require('fs');
fs.open('./my_file.txt', 'a', function opened(err, fd) {
if (err) { throw err; }
var writeBuffer = new Buffer('writing\n this\n string'),
bufferPosition = 0,
bufferLength = writeBuffer.length, filePosition = null;
fs.write( fd,
writeBuffer,
bufferPosition,
bufferLength,
filePosition,
function wrote(err, written) {
if (err) { throw err; }
console.log('wrote ' + written + ' bytes');
});
});


//Read lines of ip use them to make request before resulting to gimmeproxy
function getLocalProxy(){
	lr = new LineByLineReader('proxies.txt');
	lr.on('error', function (err) {
		console.log('error while reading file');
		Greeting = err;
	});

	lr.on('line', function (line) {
		proxies.push(line.toString());
	});

	lr.on('end', function () {
		console.log(proxies);  
		testProxies();
	});
}

function testProxies(){
	if(count<proxies.length){
		var options = {
			url: 'https://fg1.herokuapp.com',
			retries: 5,
			headers: {
				'User-Agent':'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36',
			},
			timeout: 15,
			proxy: proxies[count]
		 };
		
		 curl.request(options, function(err, res) {
			   if(err){
					 console.log('Cannot test proxy');
					 count++;
					 testProxies();
				 } 
				 else {
					 if(res){
						 console.log('test done');
						 tested.push(ip);
						 count++;
						 testProxies();
					 }
					 else {
						  console.log('invalid proxy');
						   count++;
						   testProxies();
					 }
					
				 }
		 });
	}
	else {
		console.log('test done '+tested.length+' proxies active of '+proxies.length);
		//@todo write file out to tested.txt
		return;
	}
 }