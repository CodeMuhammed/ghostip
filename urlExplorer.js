var ObjectId = require('mongodb').ObjectId;

//generate a random 30 bits token that clearly identifies this system
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
     /*
     locked: false,
 	 urlsAvailable: true,
 	 accessingDomain: ''
 	 */
    //
    var getUrl = function(cb){
         //
         function checkLock(){
               Explorer.find({locked: false}).toArray(function(err , results){
		              if(err){
		                 throw new Error('DB connection error explorer check locked');
		              }
		              else if(results[0] == undefined){
		                  //
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
	                  console.log('No urls available');
	                  releaseLock();
	              }
	              else {
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
         	  Urls.find({status : 'inactive'}).toArray(function(err , results){
                  if(err){
                     throw new Error('DB connection error explorer getting any urls');
                  }
                  else if(results[0] == undefined){
                     throw new Error('DB connection error explorer getting any urls 2');
                  }
                  else {
                      updateUrlStatus(results[0]);
                  }
             });
         }

         //
         function updateUrlStatus(urlObj){
         	console.log('updating url status');
         	urlObj.status = 'active';
         	Urls.update(
                {_id : ObjectId(urlObj._id)},
                {
                   "$set": {
                       status: 'active'
                   }
                },
                function(err , result){
                    if(err){
                        throw new Error('DB connection error explorer changing url status');
                    }
                    else {
                        console.log('process successfully changed url status');
                        updateAvailabilityStatus(urlObj);
                    }
                }
             );
         }

         //
         function updateAvailabilityStatus(urlObj){
         	  console.log('updating availabilty');
         	  Urls.find({status : 'inactive'}).toArray(function(err , results){
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

         //
         function setUrlAvailable(status , urlObj){
              if(status){
                   console.log('Urls are still available');   
              }else{
                   console.log('urls are all occupied by processes');
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


         //broadcast the availability of the url across the network
    } 

	return{
		getUrl : getUrl,
		exitProcess : exitProcess
    }

};

