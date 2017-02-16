// @TODO figure out how to get unlimited ips
// @TODO create a small node app that does that before integrating into ghostip.
// Create a document IP_DUMP to save all good ips gotten
// Read that document and use them to make request to gimmeproxy to get more ips
// Shuffle the ips to make sure all the processes are not devouring the ips linearly
const MongoClient  = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

module.exports = (database) => {
    const IpDump = database.model('IpDump');
    let ipList = [];

    let cycleIndex = 0;

    const shuffleList = (ipList) => {
        let i = 0;
        let j = 0;
        let temp = null;

        for (let i = ipList.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1))
            temp = ipList[i]
            ipList[i] = ipList[j]
            ipList[j] = temp
        }
        
        return ipList;
    }

    const init = (cb) => {
        IpDump.find({}).toArray((err , results) => {
			if(err) {
				throw new Error(err);
			} else if(!results[0]){
				throw new Error('Could not read dump data');
			} else {
				//ipList = shuffleList(results[0].ips);
                return cb();
			}
		});
    }

    const cycleIp = () => {
        const ip = ipList[(cycleIndex++) % ipList.length] || '';
        console.log(`${ip} cycled`);
        return ip;
    }

    const saveIp = (ip) => {
        if(ipList.indexOf(ip) < 0) {
            ipList.push(ip);
        }

        //@TODO update to database
        console.log(`saving ${ip} to dump`);
    }

    return {
        init,
        cycleIp,
        saveIp
    };
}
