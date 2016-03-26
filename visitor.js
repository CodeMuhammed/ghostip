/* This module uses a give ip to visit the whole urls in the bucket assigned to it
*/
'use strict';

module.exports = function(bucketExplorer , database) {
	//
    var ObjectId = require('mongodb').ObjectId;
	var Spooky = require('spooky');
    var EventEmitter = require('events').EventEmitter;
    
	var bucket;
    var ipQueue = [];
    var ipQueueIndex = 0;
    
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

    //
    var getBucket = function(){
    	return bucket;
    };
    
    //
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
    
    //
    var notifyDelete = function(_id){
         console.log('Bucket with'+ _id +'deleted');
         if(bucket){
             if(bucket._id == _id){
                console.log('This bucket was deleted');
                setTimeout(function(){
                    process.exit(0);
                } , 10000);
             }
             else{
                 console.log('Not this one 1..');
             }
            
         }
         else{
            console.log('Not this one..');
         }
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
    var V_WORKER = function(){
        var workerEvents = new EventEmitter;
        
        var visit = function(ip , urlsArr){ 
            console.log('visit starting with '+ip+' and '+urlsArr.length+' urls');

            var spooky = new Spooky({
                child: {
                    transport: 'http',
                    proxy: ip
                },
                casper: {
                    logLevel: 'debug',
                    verbose: true,
                    options: {
                        pageSettings: {
                            webSecurityEnabled: false
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
                
                var worker = function(url , selector , index){
                    //
                    spooky.start(url);
                    spooky.then([{url:url , selector:selector , urlIndex:index} , function(){
                        //General case
                        this.done = function(err , status){
                            if(err){
                                this.emit('done', {status:this.getCurrentUrl() , index:urlIndex});
                                return phantom.clearCookies();
                            }
                            else{
                                this.emit('done', {status:this.getCurrentUrl() , index:urlIndex});
                                return phantom.clearCookies();
                            } 
                        }
                        
                        if(selector=='none'){
                            this.then(function(){
                                this.wait(15000 , function(){
                                    this.done(null , true);
                                });
                            });	 
                        }
                        
                        else{ 
                            this.then(function(){
                                this.waitForSelector(selector , function(){
                                    this.thenClick(selector , function() { 
                                       this.done();
                                    });
                                        
                                } , function(){
                                      this.done(true , null);
                                } , 20000);
                            });
                        }
                    }]);
                }
                
                //
                for(var i=0; i < urlsArr.length; i++){
                    worker(urlsArr[i].urlName , urlsArr[i].selector , i);
                }
                
                //
                spooky.run();	
            });
            
            //
            spooky.on('console', function (line) {
                console.log(line);
            });
            
            //
            spooky.on('error', function (e, stack) {
                console.error(stack||e);      
                workerEvents.emit('done' , {status:stack?stack:e , index:0});
            });

            //
            spooky.on('done', function (status) {
                workerEvents.emit('done' , status);
            });
            
            //self destruct this instance in 15 minutes
            setTimeout(function(){
                console.log('Instance destroyed');
                spooky.destroy();
            } , 15*60000);
        };
        
        return {
            visit:visit,
            status:workerEvents 
        }
    }
    //++++++++++++++++++++++++++++++++END++++++++++++++++++++++++++++++++++++++++++
    
    
    //updateBucket after every 120 secs of activity
    function startUpdateDaemon(){
        var timer = 0;
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
       let visiting = 0;
       let limit =  20;
       let v_worker = V_WORKER();
       
       setInterval(function(){
          if(ipQueueIndex < ipQueue.length){
               v_worker.visit(ipQueue[ipQueueIndex] , bucket.urls);   
               ipQueueIndex++;
               visiting+= bucket.urls.length;   
          }
          else{
              if(limit < visiting){
                  console.log('Visiting urls have exceeded the limit');
                  limit+=100;
              }
              else{
                  //console.log('Good ip shortage');
              }
              
            
          }
           
       } , 10000);
       
       //
       v_worker.status.on('done' , function(status){
            console.log(status);
            bucket.urls[status.index].statusText = status.status;
            bucket.urls[status.index].visited++;
            visiting--;
            limit--;
            
            if(exitFlag && ipQueueIndex >= ipQueue.length){
                console.log('All ips have been visited exiting process...');
                process.exit(0);
            }
        });
    }
    
	return {
	    visitWith:visitWith,
	    getBucket:getBucket,
	    setBucket:setBucket,
	    updateBucket:updateBucket,
        notifyDelete:notifyDelete,
	    exitWhenDone:exitWhenDone
	}
};