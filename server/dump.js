// This module manipulates the ip dump
const MongoClient  = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

module.exports = (database) => {
    const IpDump = database.model('IpDump');
    let ipList = [];
    let ipSourceIndex = 0;
    let visitingIndex = 0;

    // Fisher–Yates shuffle algorithm
    const shuffleList = (ipList) => {
        let i = 0;
        let j = 0;
        let temp = null;

        for (let i = ipList.length - 1; i > 0; i -= 1) {
            j = Math.floor(Math.random() * (i + 1));
            temp = ipList[i];
            ipList[i] = ipList[j];
            ipList[j] = temp;
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
				ipList = shuffleList(results[0].ips);
                return cb();
			}
		});
    }

    const cycleIp = (useCase) => {
        let ip;
        if(useCase === 'sourcing') {
            ip = ipList[(ipSourceIndex++) % ipList.length] || '';
        } else if(useCase === 'visiting') {
            ip = ipList[(visitingIndex++) % ipList.length] || '';
        }
        return ip;
    }

    const saveIp = (ip) => {
        if(ipList.indexOf(ip) < 0) {
            ipList.push(ip);
        }

        // Update to database
        IpDump.update({ name: 'dump' }, {"$addToSet":{ips:ip}}, (err , stats) => {
            if(err) {
                throw new Error('DB connection error IpDump 3');
            } else {
                console.log(`saved ${ip} to dump`);
            }
        });
    }

    return {
        init,
        cycleIp,
        saveIp
    };
}
