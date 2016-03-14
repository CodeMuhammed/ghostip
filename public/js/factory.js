angular.module('customFactory' , [])
 
//======================================================FACTORY STARTS HERE
.factory('bucketFactory' , function($q , $http , $location , $timeout){
       //
       var domains = [
           'localhost:5004'
       ];

	     //
       var getActiveBucketsAsync = function(){
            var promise = $q.defer();
            var index = 0;
            function getBucket(domain){
                if(index < domains.length){
                    var prefix = '';
                    if($location.absUrl().indexOf(domain)<0 ){
                         prefix = 'http://'+domain;
                         console.log(prefix);
                    }

                    $http.get(prefix+'/api/buckets/1')
                    .success(function(data){
                         data.processName = domain;
                         data.active = true;
                         promise.notify(data);
                         getBucket(domains[index++]);
                    })
                    .error(function(err){
                         getBucket(domains[index++]);
                    });
                }
                else{
                  promise.resolve('All active Buckets gotten');
                  return;
                }
                
            };
            getBucket(domains[index]);

            return promise.promise;
       }

       //
       var getDormantBuckets =  function(activeIdArr){
            var promise = $q.defer();
            console.log(activeIdArr);
            $http.post('/api/getAll' , {ids:activeIdArr})
            .success(function(data){
                 promise.resolve(data);
            })
            .error(function(err){
                 promise.reject(err);
            });

            return promise.promise;
       };

       //
       var newBucket = function(bucketObj){
       	   var promise = $q.defer();
       	   $http.post('/api/buckets/1',bucketObj)
           .success(function(data){
              promise.resolve(data);
           })
           .error(function(err){
               promise.reject(err);
           });

       	   return promise.promise;
       }

       //When updating, url params 1 means updated url while 0 means deleted url
       var updateBucket = function(bucketObj , meta){
           console.log(meta);
       	   var promise = $q.defer();
           var prefix = '';
           if($location.absUrl().indexOf(bucketObj.processName)<0 && bucketObj.processName != 'No process'){
               prefix = 'http://'+processName;
               console.log(prefix);
           }

       	   $http.put(prefix+'/api/buckets/1?'+'action='+meta.action+'&'+'index='+meta.index , bucketObj)
           .success(function(data){
              promise.resolve(data);
           })
           .error(function(err){
               promise.reject(err);
           });

       	   return promise.promise;
       }
       
       return {
           getActiveBucketsAsync:getActiveBucketsAsync,
           getDormantBuckets:getDormantBuckets,
           newBucket : newBucket,
           updateBucket:updateBucket
       };
})

//======================================================FACTORY ENDS HERE