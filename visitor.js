/* This module uses a give ip to visit the whole urls in the bucket assigned to it
*/
module.exports = function(bucketExplorer , database) {
	//
    var ObjectId = require('mongodb').ObjectId;
	var Spooky = require('spooky');
	var ipQueue = [];
	var ipQueueIndex = 0;
	var bucket;
	var daemonStarted = false;
	var exitFlag = false;
    
    //
    var Buckets = database.model('Buckets');
    
    //
    var setBucket =  function(bucketObj){
    	 console.log(bucketObj);
    	 bucket = bucketObj;
         if(bucket.urls.length>0){
            for(var i=0; i<bucket.urls.length; i++){
                bucket.urls[i].visited = 0;
                bucket.urls[i].statusText = 'No status yet';
            };
         }
    	 
    	 console.log(bucket);
    	 console.log('bucket set in visitor');
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

    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	var runGhostProxy = function(ip , urlsArr , index , cb){ 
		console.log('starting ghost');
		console.log('process starting '+ip+' '+urlsArr[index].urlName+' '+urlsArr[index].selector);
	
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
				        Referer: 'https://www.google.com.ng'
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
			spooky.start(urlsArr[index].urlName);
			spooky.then([{url:urlsArr[index].urlName , selector:urlsArr[index].selector} , function(){
			  
                 this.viewport(1024, 768, function() {
					  console.log('Viewport size changed');
			       
			          //
                      if(selector=='none'){
							 this.then(function(){
							 	  this.wait(10000 , function(){
								    this.emit('done', 'Hello, from ' + this.getCurrentUrl());
								    phantom.clearCookies();
							 	  	this.clear();
							 	  });
							 	  
							 });
						}
						
						//General case
						else{ 
						   this.then(function(){
						   	   this.waitForSelector(selector , function(){
						   	   	  this.wait(15000 , function(){
					   	   	  	    this.thenClick(selector , function() {
										this.wait(5000 , function(){
										    this.emit('done', 'Hello, from ' + this.getCurrentUrl());
										    phantom.clearCookies();
									 	  	this.clear();
									 	});
								    });
						   	   	  });
							   	   	  
						   	   } , function(){
						   	   	     this.emit('done', 'The selector was not found');
								     phantom.clearCookies();
							 	  	 this.clear();
						   	   } , 20000);
						   });
						}

				    });  

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
		});

		
		//
		spooky.on('console', function (line) {
			console.log(line);
		});
		
		////
		spooky.on('done', function (greeting) {
			console.log(greeting);
			bucket.urls[index].statusText = greeting;
            bucket.urls[index].visited++;
			if(index >= urlsArr.length){
               runGhostProxy(ip , urlsArr , index++ , cb);
			}
            else{
                console.log('This round done visiting');
                cb();
            }
			
		});
	};

	//
	var startVisitingDeamon = function(){
		if(ipQueueIndex < ipQueue.length && bucket.urls.length > 0){
            runGhostProxy(ipQueue[ipQueueIndex] , bucket.urls , 0 , function(){
            	 startVisitingDeamon();
            });
		}
		else{
           console.log('No ips in queue yet retrying in 14 secs');
           setTimeout(function(){
           	  if(!exitFlag){
                    startVisitingDeamon();
               }
               else{
                   console.log('Visiting All Done. Exiting......');
                   process.exit(0);
               }
           } ,15000);
		}
	};
    
    //updateBucket after every two minutes of activity
    var startUpdateDaemon = function(){
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
                        console.log('bucket updated in cron job');
                    }  
                }
          );
        } , 1000*120);
    }

    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    var visitWith = function(ip){
        if(ipQueue.indexOf(ip) < 0){
        	console.log('Adding '+ip+' to visiting ip queue');
            ipQueue.push(ip);
        }
        else{
        	console.log('ip already exists in queue');
        }
        
        if(!daemonStarted){
        	console.log('Starting visiting daemon');
            startVisitingDeamon();
            startUpdateDaemon();
        }
    }

    //
    var exitWhenDone = function(){
         exitFlag = true;
    }

	return {
	    visitWith:visitWith,
	    getBucket:getBucket,
	    setBucket:setBucket,
	    updateBucket:updateBucket,
	    exitWhenDone:exitWhenDone
	}
	
};