module.exports = (database) => {
   const MongoClient  = require('mongodb').MongoClient;
   const ObjectId = require('mongodb').ObjectId;
   const IpTrackers = database.model('IpTrackers');

   // Do a find and modify query
   // where you seach the document to see if this ip has been recorded in the ipsVisited list
   // If it has, check the visit time
   // if it has not add it to the list
   // if the visit time is greater than the expiration time of 6hrs, remove it from the ipsVisited list.
   const checkIpStatus = (ip, urlObj, cb) => {
       console.log(`${ip} good to go`);
       cb(true);
   }

   const isUsable = (ip , urlObj , callback) => {
       if(urlObj.ensureUniqueIp) {
           console.log('Tracking required for this url');
           let ipObj = {
               ip: ip,
               visited: Date.now(),
           };

           IpTrackers.findOne({ url:urlObj.urlName },(err, result) => {
               if(err) {
                    throw new Error('DB connection error IpTrackers');
                } else if(!result) { 
                    let trackObj = {
                        url: urlObj.urlName,
                        ipsVisited: [ipObj],
                    };

                    // Create a new document to track this url
                    IpTrackers.insertOne(trackObj, (err , stats) => {
                        if(err) {
                            throw new Error('DB connection error IpTrackers 1');
                        }
                        else {
                            return callback(ip);
                        }
                    });
                } else {
                    checkIpStatus(ip, urlObj, (status) => {
                        return status ? callback(ip) : callback(null);
                    });
               }
           });
       }
       return callback(ip);
    }

    //Returns public api methods
    return {
        isUsable:isUsable
    };
}
