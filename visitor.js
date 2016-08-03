// This module uses a give ip to visit the whole urls in the bucket assigned to it
'use strict';

module.exports = function(agent , database , ipTracker) {
  	//
    var ObjectId = require('mongodb').ObjectId;
  	var Spooky = require('spooky');
    var EventEmitter = require('events').EventEmitter;
    var domain = require('domain');

  	var bucket;
    var ipQueue = [];
    var child_processes = 0;

    //
    var Buckets = database.model('Buckets');

    //
    var setBucket =  function(bucketObj){
    	   bucket = bucketObj;
         if(bucket.urls.length>0){
            for(let i=0; i < bucket.urls.length; i++){
                bucket.urls[i].visited = 0;
                bucket.urls[i].statusText = 'No status yet';
            };
         }
    	   console.log('bucket set in visitor');
    };

    //
    var getBucket = function(){
    	 return bucket;
    };

    //
    var updateBucket = function(bucketObj , meta){
    	console.log(meta);
    	if(bucket){
            //
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
    }

    //
    function visitWith(ip){
        console.log('Adding %s to queue' , ip);
        if(ipQueue.indexOf(ip)<0){
            ipQueue.push(ip);
            if(ipQueue.length == 1){
                startUpdateDaemon();
                startVisitingDaemon();
            }
        }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function V_WORKER(){
        let workerEvents = new EventEmitter;

        let visit = function(ip , urlObj , index , userAgent){
            console.log('visit starting with '+ip+' and '+urlObj.urlName);

            let spooky = Spooky.create({
                child: {
                    transport: 'http',
                    proxy: ip
                },

                casper: {
                    logLevel: 'debug',
                    verbose: true,
                    options: {
                        clientScripts: ['public/js/vendors/jquery.min.js'],
                        pageSettings: {
                            //webSecurityEnabled: false,
                            userAgent:userAgent
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
                (function(url , selector , index){
                    //
                    console.log(userAgent);
                    spooky.start();
                    spooky.then(function () {
                        this.page.customHeaders = {
                            "Referer": 'https://taskcoin-demo.herokupp.com'
                        };
                    });
                    spooky.thenOpen(url);
                    spooky.then([{url:url , selector:selector , index:index} , function(){
                        //
                        this.done = function(err , status){
                            if(err){
                                this.emit('done', {status:this.getCurrentUrl() , index:index});
                                return phantom.clearCookies();
                            }
                            else{
                                this.emit('done', {status:this.getCurrentUrl() , index:index});
                                return phantom.clearCookies();
                            }
                        }

                       if(selector=='none'){
                            this.then(function(){
                                this.wait(10000 , function(){
                                    return this.done(null , true);
                                });
                            });
                        }

                        else{
                            this.then(function(){
                                this.waitForSelector(selector , function(){
                                    this.thenClick(selector , function() {
                                        return this.done(null , true);
                                    });

                                } , function(){
                                    return this.done(true , null);
                                } , 10000);
                            });
                        }
                    }]);
                })(urlObj.urlName , urlObj.selector , index);

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

            //self destruct this instance in 8 minutes
            setTimeout(function(){
                console.log('Instance destroyed');
                spooky.destroy();
                child_processes--;
                return;
            } , 8*60000);
        };

        return {
            visit:visit,
            status:workerEvents
        }
    }
    //++++++++++++++++++++++++++++++++END++++++++++++++++++++++++++++++++++++++++++

    //
    function startVisitingDaemon(){
       let v_worker = V_WORKER();

       //@TODO rewrite this function
       (function fillVisiting(currentIp){
            if(currentIp < ipQueue.length && child_processes<20){
               child_processes+=bucket.urls.length;
               console.log(child_processes+' child processes currently running');

               //spin all new workers for each urls
               (function validateUnique(urlIndex){
                    if(urlIndex<0){
                        console.log('ip round complete.. starting next round in 10 secs');
                        setTimeout(function(){
                             return fillVisiting(++currentIp);
                        } , 10000);
                    }
                    else{
                       ipTracker.isUsable(ipQueue[currentIp] , bucket.urls[urlIndex] , function(err , ip){
                           if(ip){
                               v_worker.visit(ip , bucket.urls[urlIndex] , urlIndex , agent.getAgent());
                           }
                           return validateUnique(--urlIndex);
                       });
                    }
               })(bucket.urls.length-1);
            }
            else{
                console.log('Good ip shortage trying again in 15 secs');
                setTimeout(function(){
                     return fillVisiting(currentIp);
                } , 10000);
            }
       })(0);

      //
      v_worker.status.on('done' , function(status){
            console.log(status);
            bucket.urls[status.index].statusText = status.status;
            bucket.urls[status.index].visited++;
      });
    }

    //updateBucket after every 120 secs of activity
    function startUpdateDaemon(){
        let timer = 0;
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
                        if(timer >= 120){
                            console.log('Maximum uptime of three hours exceeded exiting....');
                            process.exit(0);
                        }
                        console.log('bucket updated in cron job');
                    }
                }
          );
        } , 120000);
    }

	  return {
	     visitWith:visitWith,
	     getBucket:getBucket,
	     setBucket:setBucket,
	     updateBucket:updateBucket,
       notifyDelete:notifyDelete
	  }
};
