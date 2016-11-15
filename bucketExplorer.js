var ObjectId = require('mongodb').ObjectId;

//
var accessingDomains = [];
var max_tries = 0;

//generate a random 20 bits token that clearly identifies this process
var token = '';
(function generateRandomBitToken(){
   if(token.length<20){
      token+=Math.ceil(Math.random()*1000)%2;
      generateRandomBitToken();
   }
   else{
    return;
   }   
}());

//
module.exports = function(database){
    var Explorer = database.model('Explorer');
    var Buckets = database.model('Buckets');

    //
    var getBucket = function(cb){
         //
         (function checkLockAndModify(){
               Explorer.findAndModify({locked:false} , {/**/} , {"$set": {accessingDomain:token , locked:true}} , {/**/} , function(err , result){
                  console.log(result);
                  if(err){
                     throw new Error('DB connection error explorer check locked');
                  }
                  else if(!result.value){
                        Explorer.findOne({} , function(err , result){
                            if(err){
                                throw new Error('DB connection error explorer findOne 1');
                            }
                            else{
                                if(!result){
                                    throw new Error('DB connection error explorer findOne 2');
                                }
                                else{
                                    max_tries++;
                                    console.log('DB locked by '+result.accessingDomain);
                                    if(accessingDomains.indexOf(result.accessingDomain) < 0){
                                        accessingDomains.push(result.accessingDomain);
                                    }
                                    
                                    if(max_tries >= 5){
                                        console.log('Database is jammed trying to unlock');
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
                                              accessingDomains = [];
                                              max_tries = 0;
                                              return checkLockAndModify();  
                                            }
                                        });
                                    }
                                    else{
                                        console.log('Database is locked by '+result.accessingDomain);
                                        //
                                        setTimeout(function(){
                                            return checkLockAndModify();
                                        } , 5000);
                                    }  
                                }
                            }
                        });
                  }
                  else {
                      console.log('Database successfully locked');
                      getAnyBucket();
                  }
             });
         })();


         //
         function getAnyBucket(){ 
            console.log('getting url');
           
            Buckets.findOne({"lastActive":{"$lte": (Date.now() - 60000*6)+''}},
                function(err , result){//get bucket that have not been updated in the past 6mins
                    if(err){ 
                        throw new Error('DB connection error explorer getting any urls');
                    }
                    else if(!result){
                        releaseLock();
                    }
                    else {     
                        releaseLock(result);
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

