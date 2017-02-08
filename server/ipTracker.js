const MongoClient  = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

module.exports = (database) => {
   const IpTrackers = database.model('IpTrackers');
   const isUsable = (ip , urlObj , callback) => {
       if(urlObj.ensureUniqueIp) {
           console.log('Tracking required for this url');

           //Find a document tracking this url
           return IpTrackers.findOne({ url:urlObj.urlName },(err , result) => {
               if(err) {
                   throw new Error('DB connection error IpTrackers');
               }

               // when there is no document bearing the description create one
               else if(!result) { 
                     //Default track object
                     let trackObj = {
                        url: urlObj.urlName,
                        ipsVisited: [ip],
                        lastReset: Date.now()  //The last time the ips was reset usually every 24hours
                     };

                     // Create a new document to track this url
                     IpTrackers.insertOne(trackObj, (err , stats) => {
                         if(err) {
                             throw new Error('DB connection error IpTrackers 1');
                         }
                         else {
                             return callback(null , ip);
                         }
                     });
                 }

                 //The document tracking this urlObj has been created before
                 else { 
                     if(result.ipsVisited.indexOf(ip) >= 0) {
                         let hours = (Date.now() - result.lastReset) / (1000*3600);

                         if(hours >= 6){
                             IpTrackers.update({ url:urlObj.urlName } , { "set":{ ipsVisited:[] , lastReset: Date.now()} },(err , stats) => {
                                 if(err) {
                                     throw new Error('DB connection error IpTrackers 2');
                                 }
                                 else {
                                     console.log('IP reset');
                                     return callback(null , ip);
                                 }
                             });
                         }
                         else{
                            console.log('IP used less than 6 hours ago');
                            return callback('ip used' , null);
                         }
                     }
                     else {
                         IpTrackers.update({ url:urlObj.urlName }, {"$addToSet":{ipsVisited:ip}}, (err , stats) => {
                             if(err){
                                 throw new Error('DB connection error IpTrackers 3');
                             }
                             else{
                                 return callback(null , ip);
                             }
                         });
                     }
                 }
             });
        }
        
        return callback(null, ip);
    }

    //Returns public api methods
    return {
        isUsable:isUsable
    };
}
