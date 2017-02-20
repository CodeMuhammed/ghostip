module.exports = (database) => {
   const MongoClient  = require('mongodb').MongoClient;
   const ObjectId = require('mongodb').ObjectId;
   const IpTrackers = database.model('IpTrackers');
   
   //@method
   const checkIpStatus = (ip, urlObj, trackerObj, cb) => {
       let ipObj;
       for(let i=0; i < trackerObj.ipsVisited.length; i++) {
           if(trackerObj.ipsVisited[i].ip == ip) {
               ipObj = trackerObj.ipsVisited[i];
               break;
           }
       }

       if(ipObj) {
           const hours = (Date.now() - ipObj.visited) / (1000*3600);
           
           if(hours >= 6) {
               IpTrackers.update(
                    { url:urlObj.urlName },
                    { "$pull": { ipsVisited: { ip: ip} } },
                    (err , result) => {
                      return cb(true);
                });
           } else {
                return cb(false);
           }
       } else {
           IpTrackers.update(
               { url:urlObj.urlName },
               { "$addToSet": { ipsVisited: { ip: ip, visited: Date.now() } } },
               (err , result) => {
                 return cb(true);
            });
       }
   }
   
   //@method
   const isUsable = (ip, urlObj, callback) => {
       if(urlObj.ensureUniqueIp) {
           console.log('Tracking required for this url');
           IpTrackers.findOne({ url:urlObj.urlName },(err, result) => {
               if(err) {
                  throw new Error('DB connection error IpTrackers');
                } else if(!result) {
                    let ipObj = {
                        ip: ip,
                        visited: Date.now(),
                    };

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
                    return checkIpStatus(ip, urlObj, result, (status) => {
                        return status ? callback(ip) : callback(null);
                    });
               }
           });
       }
       return callback(ip);
    }

    // @returns public api methods
    return {
        isUsable:isUsable
    };
}
