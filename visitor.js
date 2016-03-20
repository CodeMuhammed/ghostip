/* This module uses a give ip to visit the whole urls in the bucket assigned to it
*/
module.exports = function(bucketExplorer , database) {
	//
    var ObjectId = require('mongodb').ObjectId;
	var Spooky = require('spooky');
	var bucket;
    var ipQueue = [];
    var timer = 0;
    var ipQueueIndex = 0;
    var visiting = 0;
    var limit =  20;
    
    var exitFlag = false;
    
    //
    var Buckets = database.model('Buckets');
    
    //
    var setBucket =  function(bucketObj){
    	 bucket = bucketObj;
         if(bucket.urls.length>0){
            for(var i=0; i<bucket.urls.length; i++){
                bucket.urls[i].visited = 0;
                bucket.urls[i].statusText = 'No status yet';
            };
         }
         
    	 console.log(bucket);
    	 console.log('bucket set in visitor');
         startUpdateDaemon();
    };

    var getBucket = function(){
    	return bucket;
    };

    var updateBucket = function(bucketObj , meta){
    	console.log(meta);
    	if(bucket){
            if(bucketObj._id+'' == bucket._id){
	           if(meta.action == 0){
	           	   console.log('Deleting url in this bucket');
                   bucket.urls.splice(meta.index , 1);
	           }
	           else if(meta.action == 1) {
                   console.log('Updating url in this bucket');
                   bucket = bucketObj;
	           }
	    	}
	    	else{
	    	   console.log('Just passing by');
	    	}
    	}
    	else{
    		 console.log('Bucket empty here');
    	}
    }

    var notifyDelete = function(_id){
         console.log('Bucket with'+ _id +'deleted');
         if(bucket && bucket._id == _id){
             console.log('This bucket was deleted');
             setTimeout(function(){
                 process.exit(0);
             } , 10000);
            
         }
         else{
            console.log('Not this one..');
         }
    }
    
    //updateBucket after every 100 secs of activity
    function startUpdateDaemon(){
        console.log('Starting cron daemon');
        setInterval(function(){
            bucket.lastActive = Date.now()+'';
            Buckets.update(
                {_id : ObjectId(bucket._id)},
                bucket,
                function(err , result){
                    if(err){
                        console.log(err);
                        res.status(500).send('Database error during cron update in visitor');
                    }
                    else {
                        timer+=2;
                        if(timer >= 162){
                            console.log('Maximum uptime of two hours exceeded exiting....');
                            process.exit(0);
                        }
                        console.log('bucket updated in cron job');
                    }  
                }
          );
        } , 120000);
    }
   
    //
    function startVisitingDaemon(){
       var interval = 20000;
       setInterval(function(){
           if(visiting<limit && ipQueueIndex < ipQueue.length){
               for(var i=0; i<bucket.urls.length; i++){
                    runGhostProxy (ipQueue[ipQueueIndex] , bucket.urls[i] , i , function(){
                        visiting--;
                        if(limit > 20){
                            limit--;
                        }
                        
                        console.log('visiting complete '+(visiting)+' currently running');
                        if(exitFlag && visiting == 0){
                            console.log('All ips have been visited exiting process...');
                            process.exit(0);
                        }
                    });
                    visiting++;
              }
              ipQueueIndex++;  
           }
           else{
               if(visiting>=limit){
                   console.log('Maximum limit of '+visiting+' reached');
                    limit+=10;
               }
               else{
                   //console.log('No more ip in queue yet');
               }
           }
           
       } , interval);
       
    }
    
    //
    var visitWith = function(ip){
        console.log('Adding ip to queue');
        if(ipQueue.indexOf(ip)<0){
            ipQueue.push(ip);
        }
        else{
            console.log('ip alredy used or currently in use');
        }
        
        if(ipQueue.length == 1){
            startVisitingDaemon();
        }
    }
    
    //
    var exitWhenDone = function(){
         exitFlag = true;
    }
    
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	function runGhostProxy (ip , url , index , callback){ 
		console.log('starting ghost');
		console.log('process starting '+ip+' '+url.urlName+' '+url.selector);
	
	    var spooky = new Spooky({
			child: {
				transport: 'http',
				proxy: ip
			},
			casper: {
				logLevel: 'debug',
				verbose: true,
				options: {
				   clientScripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js'],
				   pageSettings: {
				        //Referer: 'http://www.palingram.com'
				    }
				}
			}
		 },
		 function(err){
		   if (err) {
				e = new Error('Failed to initialize SpookyJS');
				e.details = err;
				throw e;
			}

			//
			spooky.start(url.urlName);
			spooky.then([{url:url.urlName , selector:url.selector} , function(){
                 //General case
                if(selector=='none'){
                    this.then(function(){
                        this.wait(15000 , function(){
                            this.emit('done', 'Hello, from ' + this.getCurrentUrl());
                            phantom.clearCookies();
                        });
                    });	 
                }
                
                else{ 
                    this.then(function(){
                        this.waitForSelector(selector , function(){
                            this.thenClick(selector , function() { 
                                this.emit('done', 'Hello, from ' + this.getCurrentUrl());
                                phantom.clearCookies();
                            });
                                
                        } , function(){
                                this.emit('done', 'The selector was not found');
                                phantom.clearCookies();
                        } , 20000);
                    });
                }
			}]);
            
            //
			spooky.run();	
		});
		
		//logs and listeners
		spooky.on('error', function (e, stack) {
			console.log('here');//
			console.error(e);
			Greeting = e;

			if (stack) {
				console.log(stack);
				Greeting = stack;
			}
            
            console.log('This round done visiting with '+ip);
            bucket.urls[index].statusText = e;
            bucket.urls[index].visited++;
            spooky.destroy();
            return callback();
            
		});

		
		//
		spooky.on('console', function (line) {
			console.log(line);
		});
		
		//
		spooky.on('done', function (greeting) {
			bucket.urls[index].statusText = greeting;
            bucket.urls[index].visited++;
            
			console.log('This round done visiting with '+ip);
            spooky.destroy();
            return callback();
			
		});
	};
    
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	return {
	    visitWith:visitWith,
	    getBucket:getBucket,
	    setBucket:setBucket,
	    updateBucket:updateBucket,
        notifyDelete:notifyDelete,
	    exitWhenDone:exitWhenDone
	}
	
};