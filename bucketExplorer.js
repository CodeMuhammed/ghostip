var ObjectId = require('mongodb').ObjectId;

//generate a random 30 bits token that clearly identifies this process
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
               Explorer.find({locked: false}).toArray(function(err , results){
                  if(err){
                     throw new Error('DB connection error explorer check locked');
                  }
                  else if(results[0] == undefined){
                      //
                      console.log('Another process is currently accessing database tying again in 10secs');
                      setTimeout(function(){
                         checkLock();
                      } , 10000);
                      
                  }
                  else {
                     console.log('Lock free on urls...');
                     lockAccessToUrls();  
                  }
             });

         };
        // checkLock();

         //
         function lockAccessToUrls(){
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
                     //release lock and return url back to main process
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

