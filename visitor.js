/* This module uses a give ip to visit the whole urls in the bucket assigned to it
*/
module.exports = function(bucketExplorer , database) {
	//
    var ObjectId = require('mongodb').ObjectId;
	var Spooky = require('spooky');
	var bucket;
    var ipQueue = [];
    var visited = 0;
    
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
                        console.log('bucket updated in cron job');
                    }  
                }
          );
        } , 100000);
    }
   
    //
    var exitWhenDone = function(){
         exitFlag = true;
    }
    
   //
    var visitWith = function(ip){
        if(ipQueue.indexOf(ip)<0){
            ipQueue.push(ip);
            runGhostProxy (ip , bucket.urls , 0 , function(){
                if(exitFlag && visited >= ipQueue.length){
                    console.log('All ips have been visited exiting process...');
                    process.exit(0);
                }
            });
        }
        else{
            console.log('ip alredy used or currently in use');
        }
    }
    
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	function runGhostProxy (ip , urls , index , callback){ 
		console.log('starting ghost');
		console.log('process starting '+ip+' '+urls[index].urlName+' '+urls[index].selector);
	
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
			spooky.start(urls[index].urlName);
			spooky.then([{url:urls[index].urlName , selector:urls[index].selector} , function(){
			     if (!this.waitForUrlChange) {
                    this.waitForUrlChange = function(){
                        var oldUrl;
                        // add the check function to the beginning of the arguments...
                        Array.prototype.unshift.call(arguments, function check(){
                            return oldUrl === this.getCurrentUrl();
                        });
                        this.then(function(){
                            oldUrl = this.getCurrentUrl();
                        });
                        this.waitFor.apply(this, arguments);
                        return this;
                    };
                 }
                 this.viewport(1024, 768, function() {//
					  console.log('Viewport size changed');
			          var allUrls = /[\s\S]*/;
                      
			          ////General case
                      if(selector=='none'){
                            this.waitForPopup(allUrls, function() {
                                this.then(function(){
                                    this.wait(10000 , function(){
                                        this.emit('done', 'Hello, from ' + this.getCurrentUrl());
                                        phantom.clearCookies();
                                    });
                                });
                            } , function(){
                                 console.log('No popups found');
                                 this.emit('done', 'Hello, from ' + this.getCurrentUrl());
                                 phantom.clearCookies();
                            } , 10000);
							 
						}
						
						
						else{ 
						   this.then(function(){
						   	   this.waitForSelector(selector , function(){
						   	   	  this.thenClick(selector , function() {
                                        phantom.clearCookies();
                                        this.emit('done', 'Hello, from ' + this.getCurrentUrl());
								    });
							   	   	  
						   	   } , function(){
						   	   	     this.emit('done', 'The selector was not found');
								     phantom.clearCookies();
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
            
            //
            if(index < urls.length - 1){
               index++;
               spooky.destroy();
               return runGhostProxy(ip , urls , index , callback);
			}
            else{
                console.log('This round done visiting with '+ip);
                spooky.destroy();
                visited ++;
                return callback();
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
            
			if(index < urls.length - 1){
               index++;
               spooky.destroy();
               return runGhostProxy(ip , urls , index , callback);
			}
            else{
                console.log('This round done visiting with '+ip);
                visited++;
                spooky.destroy();
                return callback();
            }
			
		});
	};
    
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	return {
	    visitWith:visitWith,
	    getBucket:getBucket,
	    setBucket:setBucket,
	    updateBucket:updateBucket,
	    exitWhenDone:exitWhenDone
	}
	
};