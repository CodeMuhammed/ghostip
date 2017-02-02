var LineByLineReader = require('line-by-line');
var currentAgent = 0;
var agentloaded = false;
var lines = [];


	lr = new LineByLineReader('agents.txt');

	lr.on('error', function (err) {
		console.log(err);
	});

	lr.on('line', function (line) {
		line = line.trim();
		if(line[0] == '"'){
			 line = line.substr(1 , line.length-2);
		};
		if(line.length>10){
			lines.push(line);
		}

	});

	lr.on('end', function () {
		console.log(lines.length , 'user agents gotten');
		agentloaded = true;
	});

//
function getAgent(){

	if(agentloaded ){
		currentAgent++;
		return lines[(currentAgent-1) % lines.length];
	}
	else{
		return 'Mozilla/5.0 (Linux; Android 4.0.4; i-mobile IQ 5A Build/IMM76D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.111 Mobile Safari/537.36';
	}
}


module.exports = {
	getAgent : getAgent
}
