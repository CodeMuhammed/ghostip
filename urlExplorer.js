var ObjectId = require('mongodb').ObjectId;
var global;
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
                      stats = 'Another process is currently accessing database tying again in 5secs';
		                  console.log('Another process is currently accessing database tying again in 5secs');

		                  setTimeout(function(){
			                  checkLock();
			              } , 5000);
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
                       accessingDomain: token,
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
	                  console.log('Unable to authenticate checking lock again in 5');
                      checkLock();
	                 
	              }
	              else {
	              	 console.log('Authentication completed...');
	              	 checkAvailableUrl()
	              }
	         });
         } 

         // 
         function checkAvailableUrl(){
         	  console.log('checking availability of url');
         	  Explorer.find({urlsAvailable: true }).toArray(function(err , results){
	              if(err){
	                 throw new Error('DB connection error explorer checking available urls');
	              }
	              else if(results[0] == undefined){
	                  //
                    stats = 'No urls';
	                  console.log('No urls available');
	                  releaseLock();
	              }
	              else {
                   stats="Urls available";
	              	 console.log('Urls are available');
	              	 getAnyUrl();           
	              }
	         });
         }
              
         //      
         function releaseLock(){
               console.log('Releasing lock on database');
               //release lock and return url back to main process
               Explorer.update(
                {},
                {
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
                        cb(-1);
                    }
                }
             );
              
         }

         //
         function getAnyUrl(){ 
         	  console.log('getting url');
           
            Urls.find(  
                 {"lastVisited":{"$lte": (Date.now() - 60000*4)+''}}  
            ).toArray(function(err , results){//get url that have not been updated in the past 4mins
                  if(err){ 
                     throw new Error('DB connection error explorer getting any urls');
                  }
                  else if(results[0] == undefined){  
                     stats = 'Url available but last visited less than four mins ago ';
                      console.log('Url available but last visited less than four mins ago retrying in 59secs');
                      setTimeout(function(){
                           getAnyUrl(); 
                      } , 60000);
                  }
                  else {    
                      console.log(results);
                      updateAvailabilityStatus(results[0]);
                  }
             });
         }

         //
         function updateAvailabilityStatus(urlObj){
            //update this urls date, then check to see if another one has expired
             console.log('updating availabilty');
             Urls.update(
                {_id : ObjectId(urlObj._id)},
                {
                    "$set":{
                        lastVisited:Date.now()+''
                    }
                },
                function(err , result){
                    if(err){
                        console.log(err);
                        throw new Error('Not ok Update Availability status');
                    }
                    else {
                         Urls.find({"lastVisited":{"$lte": (Date.now() - 60000*4)+''}}).toArray(function(err , results){
                              if(err){
                                 throw new Error('DB connection error explorer updating availability');
                              }
                              else if(results[0] == undefined){
                                  setUrlAvailable(false , urlObj);
                              }
                              else {
                                  setUrlAvailable(true , urlObj);  
                              } 
                         });   
                    }
                }
             );


         	  
         	 
         } 

         // 
         function setUrlAvailable(status , urlObj){  
              if(status){
                   console.log('===================================Urls are still available');   
              }else{
                   console.log('===================================urls are all occupied by processes');
              }
              //release lock and return url back to main process
               Explorer.update(
                {},
                {
                   "$set": {
                       accessingDomain: '',
                       locked:false,
                       urlsAvailable:status
                   }
                },
                function(err , result){
                    if(err){
                        throw new Error('DB connection error explorer lock releasing error 2');
                    }
                    else {
                        console.log('process successfully released lock on database');
                        global=urlObj;
                        cb(urlObj);
                    }    
                } 
             );
         }
    	
    };

    var exitProcess = function(urlObj){
    	  console.log('Trying to exit process');

         //@TODO 
         //seek a lock
         function seekLock(){
         	 console.log('seeking lock....');
             Explorer.find({locked: false}).toArray(function(err , results){
	              if(err){
	                 throw new Error('DB connection error explorer seek locked');
	              }
	              else if(results[0] == undefined){
	                  //
	                  console.log('Another process is currently accessing database tying again in 2secs');

	                  setTimeout(function(){
		                  seekLock();
		              } , 2000);
	              }
	              else {
	              	 console.log('Lock free on urls...');
	              	 lockAccess();  
	              }
	         });
         };
         seekLock();

         //
         function lockAccess(){
             console.log('Locking access to urls...');
             Explorer.update(
                {},
                {
                   "$set": {
                       accessingDomain: token,
                       locked:true
                   }
                },
                function(err , result){
                    if(err){
                        throw new Error('DB connection error explorer seek locking error');
                    }
                    else {
                        console.log('process successfully locked database');
                        authenticate();
                    }
                }
             );
         }

         //
         function authenticate(){
         	 console.log('Authenticating access');
         	 Explorer.find({locked: true , accessingDomain:token}).toArray(function(err , results){
	              if(err){
	                 throw new Error('DB connection error explorer authenticating');
	              }
	              else if(results[0] == undefined){
	                  //
	                  console.log('Unable to authenticate seeking lock again..');
                      seekLock();
	                 
	              }
	              else {
	              	 console.log('Authentication completed...');
	              	 returnUrlToPool();
	              }
	         });
         }

         //
         function returnUrlToPool(){
         	console.log('returning url to pool');
         	Urls.update(
                {_id : ObjectId(urlObj._id)},
                {
                   "$set": {
                       status: 'inactive'
                   }
                },
                function(err , result){
                    if(err){
                        throw new Error('DB connection error explorer returning url to pool error');
                    }
                    else {
                        console.log('process successfully returned url to pool');
                        updateAvailability();
                    }
                }
             );
         }

          //          
         function updateAvailability(){
         	  console.log('updating availabilty');
         	  Explorer.update(
                {},
                {
                   "$set": {
                       accessingDomain: '',
                       locked:false,
                       urlsAvailable:true
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
    } 



    //Keep the url updated by updating its laast visted status every 3 mins
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
                          //@TODO check for and free urls that are dormant
                          freeDormantUrls();
                      }
                  }
            );

            //
            function freeDormantUrls(){
                 
                  Urls.find(  
                       {"lastVisited":{"$lte":(Date.now() - 60000*4)+''}}  
                  ).toArray(function(err , results){//get url that have not been updated in the past 4mins
                        if(err){ 
                           throw new Error('DB connection error explorer Free Domant Urls');
                        }
                        else if(results[0] == undefined){  
                            console.log('process did not find any expired urls retrying cron in 1min 59sec');
                        }
                        else {  
                             Explorer.update(
                              {},
                              {
                                 "$set": {
                                     accessingDomain:'',
                                     locked:false,
                                     urlsAvailable:true 
                                 }
                              },
                              function(err , result){
                                  if(err){
                                       throw new Error('Cron 2 error');
                                  }
                                  else {
                                      console.log('process successfully changed url status at cron job 2 update again in 1min 59sec');
                                  }  
                              }
                           );
                        }
                   });

            }
        }
           
         
    } , 60000*2);

  //
  function getStat(){
       return stats;
  }

	return{
		getUrl : getUrl,
    getStat: getStat,
		exitProcess : exitProcess
  }

};

