/* This module track service name and the ips that have visited in the past 24 hours
*/
'use strict';

var MongoClient  = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

module.exports = function(database){
   //
   var IpTrackers = database.model('IpTrackers');

   //
    var isUsable = function(ip , urlObj , callback){
        if(urlObj.ensureUniqueIp){
             console.log('Tracking required for this url');

             //Find a document tracking this url
             IpTrackers.findOne({url:urlObj.urlName} , function(err , result){
                 if(err){
                      throw new Error('DB connection error IpTrackers');
                 }
                 else if(!result){ // when there is no document bearing the description create one
                     //Default track object
                     var trackObj = {
                        url: urlObj.urlName,
                        ipsVisited: [ip], //Array of ips used in the duratiion before reset time is reached // Usually 24hrs
                        lastReset: Date.now()  //The last time the ips was reset usually every 24hours
                     };

                     //
                     IpTrackers.insertOne(trackObj , function(err , stats){
                         //
                         if(err){
                             throw new Error('DB connection error IpTrackers 1');
                         }
                         else{
                             return callback(null , ip);
                         }
                     });
                 }
                 else{
                     //check ipsVisited to see if this ip has been visited in the last 24hours
                     //if it has, return err
                     //else save ip to set of ips in the trackerObj then return true
                 }
             });
        }
        else{
           console.log('Tracking not required for this url');
           return callback(null , ip);
        }
    }

    //Setup a daemon that runs continuously to check for trackObjects that were last reset more than 24hours ago and reset them

    //Returns public api methods
    return {
        isUsable:isUsable
    };
}
