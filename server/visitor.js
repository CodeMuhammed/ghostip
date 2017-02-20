module.exports = function(agent , database , ipTracker) {
    const ObjectId = require('mongodb').ObjectId;
  	const Spooky = require('spooky');
    const EventEmitter = require('events').EventEmitter;
    const domain = require('domain');
    const Buckets = database.model('Buckets');

    let child_processes = 0;
    let ipQueue = [];
    let bucket;

    // @method getBucket
    const getBucket = () => bucket;

    // @method setBucket
    const setBucket =  (bucketObj) => {
        bucket = bucketObj;
        if(bucket.urls.length > 0) {
            for(let i=0; i < bucket.urls.length; i++){
                bucket.urls[i].visited = 0;
                bucket.urls[i].statusText = 'No status yet';
            };
         }
    	 console.log('bucket set in visitor');
    };

    // @method updateBucket
    const updateBucket = (bucketObj, meta) => {
    	if(bucket) {
            if(bucketObj._id+'' == bucket._id) {
	           if(meta.action == 0) {
	           	   console.log('Deleting url in this bucket');
                   bucket.urls.splice(meta.index , 1);
	           }
	           else if(meta.action == 1) {
                   console.log('Updating url in this bucket');
                   bucket = bucketObj;
	           }
	    	}
    	}
    }

    // @method notifyDelete
    const notifyDelete = (_id) => {
        if(bucket){
            if(bucket._id == _id){
                setTimeout(() => {
                    process.exit(0);
                } , 10000);
             }
         }
    }

    // @method visitWith
    const visitWith = (ip) => {
        console.log('Adding %s to queue' , ip);
        if(ipQueue.indexOf(ip) < 0){
            ipQueue.push(ip);
            if(ipQueue.length === 1){
                startUpdateDaemon();
                startVisitingDaemon();
            }
        }
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    const V_WORKER = () => {
        console.log('we got here V_WORKER');
        let workerEvents = new EventEmitter;

        let visit = (ip, urlObj, index, userAgent) => {
            console.log(`visit starting with ${ip} and ${urlObj.urlName}`);

            let spooky = Spooky.create({
                child: {
                    transport: 'http',
                    proxy: ip
                },

                casper: {
                    logLevel: 'debug',
                    verbose: true,
                    options: {
                        clientScripts: [],
                        pageSettings: {
                            webSecurityEnabled: false,
                            userAgent:userAgent
                        }
                    }
                }
            }, (err) => {
               if (err) {
                    e = new Error('Failed to initialize SpookyJS');
                    e.details = err;
                    throw e;
                }

                ((url, selector, index) => {
                    console.log(userAgent);
                    spooky.start();
                    spooky.then(function() {
                        this.page.customHeaders = {
                            "Referer": 'https://www.yahoo.com'
                        };
                    });
                    spooky.thenOpen(url);
                    spooky.then([{url:url, selector:selector, index:index}, function() {
                        this.done = function(err , status) {
                            if(err){
                                this.emit('done', {status: this.getCurrentUrl(), index:index});
                                return phantom.clearCookies();
                            } else {
                                this.emit('done', {status: this.getCurrentUrl(), index:index});
                                return phantom.clearCookies();
                            }
                        }

                       if(selector === 'none'){
                            this.then(function() {
                                this.wait(10000, function() {
                                    return this.done(null, true);
                                });
                            });
                        } else{
                            this.then(function() {
                                this.waitForSelector(selector, function() {
                                    this.thenClick(selector, function() {
                                        this.wait(10000, function() {
                                            return this.done(null, true);
                                        });
                                    });

                                }, function() {
                                    return this.done(true, null);
                                }, 10000);
                            });
                        }
                    }]);
                    
                })(urlObj.urlName , urlObj.selector , index);

                spooky.run();
            });

            spooky.on('console', (line) => {
                console.log(line);
            });

            //
            spooky.on('error', (e, stack) => {
                console.error(stack||e);
                workerEvents.emit('done' , {status:stack?stack:e , index:0});
            });

            //
            spooky.on('done', (status) => {
                workerEvents.emit('done' , status);
            });

            //self destruct this instance in 8 minutes
            setTimeout(() => {
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

    function startVisitingDaemon() {
       console.log('visiting daemon started');
       let v_worker = V_WORKER();

       (function fillVisiting(currentIp) {
            if(currentIp < ipQueue.length && child_processes < 20){
               child_processes+=bucket.urls.length;

               //spin all new workers for each urls
               (function validateUnique(urlIndex) {
                    if(urlIndex < 0){
                        console.log('ip round complete... starting next round in 10 secs');
                        return setTimeout(() => {
                             return fillVisiting(++currentIp);
                        } , 10000);
                    } else {
                       return ipTracker.isUsable(ipQueue[currentIp], bucket.urls[urlIndex], (ip) => {
                           if(ip) {
                               console.log('there is an ip', bucket.urls[urlIndex]);
                               console.log(urlIndex);
                               v_worker.visit(ip, bucket.urls[urlIndex], urlIndex, agent.getAgent());
                           }
                           return validateUnique(--urlIndex);
                       });
                    }
                })(bucket.urls.length-1);
            }
            else {
                console.log('Good ip shortage trying again in 10 secs');
                setTimeout(() => {
                     return fillVisiting(currentIp);
                } , 10000);
            }
       })(0);

       v_worker.status.on('done', (status) => {
            console.log(status);
            bucket.urls[status.index].statusText = status.status;
            bucket.urls[status.index].visited++;
       });
    }

    //updateBucket after every 120 secs of activity
    function startUpdateDaemon(){
        let timer = 0;
        console.log('Starting cron daemon');
        setInterval(() => {
            bucket.lastActive = Date.now()+'';
            Buckets.update({_id : ObjectId(bucket._id)}, bucket, (err , result) => {
                if(err){
                   console.log(err);
                }
                else {
                    timer += 2;
                    if(timer >= 120){
                        console.log('Maximum uptime of 2 hours exceeded exiting....');
                        process.exit(0);
                    }
                    console.log('bucket updated in cron job');
                }
            }
          );
        } , 120000);
    }
    return {
        visitWith,
        getBucket,
        setBucket,
        updateBucket,
        notifyDelete
    }
};
