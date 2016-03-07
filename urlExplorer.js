var ObjectId = require('mongodb').ObjectId;
var global;
var tester;
var stats= 'nothing yet from explorer';

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
	  var Urls = database.model('Urls');

    //
    var getUrl = function(cb){
         //
         function checkLock(){
               Explorer.find({locked: false}).toArray(function(err , results){
		              if(err){
                    stats = err;
		                 throw new Error('DB connection error explorer check locked');
		              }
		              else if(results[0] == undefined){
		                  //
                      stats = 'Another process is currently accessing database tying again in 29secs';
		                  console.log('Another process is currently accessing database tying again in 29secs');

		                  setTimeout(function(){
			                  checkLock();
			              } , 30000);
		              }
		              else {
		              	 console.log('Lock free on urls...');
		              	 lockAccessToUrls();  
		              }
		         });

         };
         checkLock();

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
                        authenticateAccess();
                    }
                }
             );
         }

         //
         function authenticateAccess(){
         	 console.log('Authenticating access');
         	 Explorer.find({locked: true , accessingDomain:token}).toArray(function(err , results){
	              if(err){
                  stats= err;
	                 throw new Error('DB connection error explorer authenticating');
	              }
	              else if(results[0] == undefined){
	                  //
	                  console.log('Unable to authenticate checking lock again in 29secs');
                    setTimeout(function(){
                       checkLock();
                    } , 30000); 
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
           
            Urls.find(  
                 {"lastVisited":{"$lte": (Date.now() - 60000*6)+''}}  
            ).toArray(function(err , results){//get url that have not been updated in the past 4mins
                  if(err){ 
                     throw new Error('DB connection error explorer getting any urls');
                  }
                  else if(results[0] == undefined){  
                      stats = 'Url available but last visited less than four mins ago ';
                      console.log('Url available but last visited less than four mins ago retrying in 10secs');
                      releaseLock(results[0]);
                  }
                  else {     
                      console.log(results);
                      releaseLock(results[0]); 
                  } 
             });
         }

         //      
         function releaseLock(urlObj){
              
               console.log('Releasing lock on database');
                 //release lock and return url back to main process
                 Explorer.update(
                  {},
                  {
                     "$set": {
                         accessingDomain: '',
                         locked:false,
                         urlsAvailable:null
                     }
                  },
                  function(err , result){
                      if(err){
                          throw new Error('DB connection error explorer lock releasing error 1');
                      }
                      else {
                          stats = "Url object gotten";
                          console.log('process successfully released lock on database');
                          if(urlObj){
                               global=urlObj;
                               urlObj.lastVisited = Date.now()+'';
                               Urls.update(
                                      {_id : ObjectId(urlObj._id)},  
                                      urlObj,
                                      function(err , result){  
                                          if(err){
                                              throw new Error('DB connection error release lock');
                                          }
                                          else { 
                                             stats="url gotten successfullly";
                                             cb(urlObj);
                                          }
                                      }
                                ); //

                              
                          }
                          else{
                              stats = "No url ";
                              cb(-1);
                          }
                          
                      }
                  });

              
         }
    	
    };

    var exitProcess = function(urlObj){
    	  console.log('Trying to exit process');

          //          
         function updateAvailability(){
         	  console.log('updating availabilty');
         	  Explorer.update(
                {},
                {
                   "$set": {
                       accessingDomain: '',
                       locked:false,
                   }
                },
                function(err , result){
                    if(err){
                        throw new Error('DB connection error explorer updateAvailability');
                    }
                    else {
                        console.log('process successfully updated availability exiting app');
                        process.exit(0);
                    }
                }
             );
         }
         updateAvailability();
    } 

  //
  function getStat(){
       return stats;
  }

  //
  function updateGlobal(newGlobalObj , action){
       //console.log('this is '+newGlobalObj._id+' '+action);
       if(global){
            if(newGlobalObj._id.toString() == ObjectId(global._id).toString()){
                
                if(action == 'update'){
                    console.log('This one updated');
                    global = newGlobalObj;
                    tester.updateUrlObj(global);
                }
                else if(action == 'delete'){
                    console.log('This one was deleted');
                    global = undefined;
                }
                
            }
            else{
              console.log('not this one');
            }
       }
       else{
           console.log('just passing'); 
       }
  }

  ////
  function getToken(){
      return token;
  }

  //
  function setTesterFn(testerModule) {//
      tester = testerModule;
      console.log('tester module registered in url explorer');
  }


  //Keep the url updated by updating its last visted status every 2 mins
  setInterval(function(){
 
        if(!global){ 
            console.log('No urls for cron job yet');
        }
        else{ 
            console.log('Updating visited in cron');
            global.lastVisited = Date.now()+'';
            Urls.update(
                  {_id : ObjectId(global._id)},  
                  global,
                  function(err , result){  
                      if(err){
                          throw new Error('DB connection error explorer changing url status at cron job');
                      }
                      else { 
                           console.log('process successfully changed url status at cron job 2 update again in 1min 59sec');
                      }
                  }
            ); 
        }
           
  } , 60000*2);


	return{
		getUrl : getUrl,
    getStat: getStat,
    getToken : getToken,
    updateGlobal:updateGlobal,
    setTesterFn : setTesterFn,
		exitProcess : exitProcess
  }

};

