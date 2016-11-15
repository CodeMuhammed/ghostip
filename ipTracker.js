/* This module track service name and the ips that have visited in the past 24 hours*/
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
                     let trackObj = {
                        url: urlObj.urlName,
                        ipsVisited: [ip], //Array of ips used in the duratiion before reset time is reached // Usually 24hrs
                        lastReset: Date.now()  //The last time the ips was reset usually every 24hours
                     };

                     //
                     IpTrackers.insertOne(trackObj , function(err , stats){
                         if(err){
                             throw new Error('DB connection error IpTrackers 1');
                         }
                         else{
                             return callback(null , ip);
                         }
                     });
                 }
                 else{ //The document tracking this urlObj has been created before
                     if(result.ipsVisited.indexOf(ip) >= 0){ // ip already used, then check and update last reset
                         let hours = (Date.now() - result.lastReset)/(1000*3600);
                         console.log(hours , 'hours');
                         if(hours >=1){
                             IpTrackers.update({url:urlObj.urlName} , {"set":{ipsVisited:[] , lastReset: Date.now()}} , function(err , stats){
                                 if(err){
                                     throw new Error('DB connection error IpTrackers 2');
                                 }
                                 else{
                                     console.log('IP reset');
                                     return callback(null , ip);
                                 }
                             });
                         }
                         else{
                            console.log('IP used less than 2 hours ago');
                            return callback('ip used' , null);
                         }
                     }
                     else{ //ip not used before update ip to the list
                         IpTrackers.update({url:urlObj.urlName} , {"$addToSet":{ipsVisited:ip}} , function(err , stats){
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
        else{
           console.log('Tracking not required for this url');
           return callback(null , ip);//
        }
    }

    //Returns public api methods
    return {
        isUsable:isUsable
    };
}
