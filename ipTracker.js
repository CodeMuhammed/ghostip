/* This module track service name and the ips that have visited in the past 24 hours
*/
'use strict';

var MongoClient  = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

module.exports = function(database){
   //
   var IpTrackers = database.model('IpTrackers');
   //
   var trackObj = {
      url: '@url',
      ipsVisited: [], //Array of ips used in the duratiion before reset time is reached // Usually 24hrs
      lastReset: '' //The last time the ips was reset usually every 24hours
   };

   //HINT: use find and update.
    var isUsable = function(ip , urlObj , callback){
        if(urlObj.ensureUniqueIp){
             //@TODO when unique ip is require do the database dance
        }
        else{
           callback(null , ip);
        }
    }

    //Setup a daemon that runs continuously to check for trackObjects that were last reset more than 24hours ago and reset them

    //Returns public api methods
    return {
        isUsable:isUsable
    };
}
