var ObjectId = require('mongodb').ObjectId;

//
var accessingDomains = [];
var max_tries = 0;

//generate a random 20 bits token that clearly identifies this process
var token = '';

function generateRandomBitToken(){
   if(token.length<20){
         token+=Math.ceil(Math.random()*1000)%2;
         generateRandomBitToken();
   }
   else{
    return;
   }   
}
generateRandomBitToken();
console.log(token);
  
//
module.exports = function(database){
    var Explorer = database.model('Explorer');
    var Buckets = database.model('Buckets');

    //
    var getBucket = function(cb){
         //
         function checkLock(){
               Explorer.find({}).toArray(function(err , results){
                  if(err){
                     throw new Error('DB connection error explorer check locked');
                  }
                  else if(!results[0]){
                      throw new Error('No Explorer Object found');
                  }
                  else {
                       if(results[0].locked){
                           console.log('DB locked by '+results[0].accessingDomain);
                           if(accessingDomains.indexOf(results[0].accessingDomain) < 0){
                               accessingDomains.push(results[0].accessingDomain);
                           }
                           max_tries++;
                           if(max_tries >= 5){
                               if(accessingDomains.length > 1){
                                   console.log('Database is not in a locked state.. retrying');
                                   accessingDomains = [];
                                   max_tries = 0;
                                   return checkLock();
                               }
                               else{
                                   console.log('Database is Jammed.. Trying to unlock...');
                                   Explorer.update({}, {
                                        "$set": {
                                            accessingDomain: '',
                                            locked:false
                                        }
                                    },
                                    function(err , result){
                                        if(err){
                                            throw new Error('DB connection error explorer Jammed lock');
                                        }
                                        else {
                                            console.log('Database is unjammed continuing .....');  
                                            //
                                            setTimeout(function(){
                                                accessingDomains = [];
                                                max_tries = 0;
                                                return checkLock();
                                            } , 10000);    
                                        }
                                    });
                               }
                           }
                           else{
                               //
                               setTimeout(function(){
                                   return checkLock();
                               } , 10000);
                           }
                       }
                       else{
                          console.log('Database lock is free No accessing domain...');
                          lockAccessToBuckets();  
                       }
                  }
             });

         };
         checkLock();

         ////
         function lockAccessToBuckets(){
             console.log('Locking access to urls...');
             Explorer.update(
                {},
                {
                   "$set": {
                       accessingDomain:token,
                       locked:true
                   }
                },
                function(err , result){
                    if(err){
                        stats=err;
                        throw new Error('DB connection error explorer locking error');
                    }
                    else {
                        console.log('process successfully locked database');
                        setTimeout(function(){
                           authenticateAccess();
                        } , 10000);
                    }
                }
             );
         }

         //
         function authenticateAccess(){
           console.log('Authenticating access');
           Explorer.find({locked: true , accessingDomain:token}).toArray(function(err , results){
                if(err){
                   throw new Error('DB connection error explorer authenticating');
                }
                else if(results[0] == undefined){
                    //
                    console.log('Unable to authenticate checking lock again in 29secs');
                    checkLock();
                }
                else {
                   console.log('Authentication completed...');
                   getAnyUrl(); 
                }
           });
         } 
        
         //
         function getAnyUrl(){ 
            console.log('getting url');
           
            Buckets.find(  
                 {"lastActive":{"$lte": (Date.now() - 60000*6)+''}}  
            ).toArray(function(err , results){//get url that have not been updated in the past 4mins
                  if(err){ 
                     throw new Error('DB connection error explorer getting any urls');
                  }
                  else if(results[0] == undefined){
                      releaseLock(results[0]);
                  }
                  else {     
                      releaseLock(results[0]);
                  } 
             });
         }

         //update url object before updating explorer object....THATS THE SOLUTION      
         function releaseLock(bucketObj){
              if(bucketObj){
                   bucketObj.lastActive = Date.now()+'';
                   Buckets.update({_id : ObjectId(bucketObj._id)},  bucketObj,
                   function(err , result){  
                       if(err){
                          throw new Error('DB connection error release lock');
                      }
                      else { 
                         release(); 
                      }
                   });

               }
               else{
                  release();
               }

              function release(){
                 console.log('Releasing lock on database');
                 
                 //release lock
                 Explorer.update({}, {
                     "$set": {
                         accessingDomain: '',
                         locked:false
                     }
                  },
                  function(err , result){
                      if(err){
                          throw new Error('DB connection error explorer lock releasing error 1');
                      }
                      else {
                          console.log('process successfully released lock on database');  
                          if(bucketObj){
                            bucketObj.serverToken = token;
                            cb(bucketObj);
                          } 
                          else{
                            cb();
                          }   
                      }
                  });
              }
        }
  };


  return{
    getBucket:getBucket
  }

};

