angular.module('customFactory' , [])
 
//======================================================FACTORY STARTS HERE
.factory('bucketFactory' , function($q , $http , $location , $timeout){
       //
       var domains = [
          'localhost:5004',
          'ghostip1.herokuapp.com', 
          'ghostip2.herokuapp.com',
          'ghostip3.herokuapp.com',
          'ghostip4.herokuapp.com',
          'ghostip5.herokuapp.com',
          'ghostip6.herokuapp.com',
          'ghostip7.herokuapp.com', 
          'ghostip8.herokuapp.com',
          'ghostip9.herokuapp.com',
          'ghostip10.herokuapp.com',
          'ghostip11.herokuapp.com',
          'ghostip12.herokuapp.com',
          'ghostip13.herokuapp.com',
          'ghostip14.herokuapp.com',
          'ghostip15.herokuapp.com',
          'ghostip16.herokuapp.com',
          'ghostip17.herokuapp.com',
          'ghostip18.herokuapp.com',
          'ghostip19.herokuapp.com',
          'ghostip20.herokuapp.com',
          'ghostip21.herokuapp.com',
          'ghostip22.herokuapp.com',
          'ghostip23.herokuapp.com',
          'ghostip24.herokuapp.com',
          'ghostip25.herokuapp.com',
          'ghostip26.herokuapp.com',
          'ghostip27.herokuapp.com',
          'ghostip28.herokuapp.com',
          'ghostip29.herokuapp.com',
          'ghostip30.herokuapp.com',
          'ghostip31.herokuapp.com',
          'ghostip32.herokuapp.com',
          'ghostip33.herokuapp.com',
          'ghostip34.herokuapp.com',
          'ghostip35.herokuapp.com',
          'ghostip36.herokuapp.com',
          'ghostip37.herokuapp.com',
          'ghostip38.herokuapp.com',
          'ghostip39.herokuapp.com',
          'ghostip40.herokuapp.com',
          'ghostip41.herokuapp.com',
          'ghostip42.herokuapp.com',
          'ghostip43.herokuapp.com',
          'ghostip44.herokuapp.com',
          'ghostip45.herokuapp.com',
          'ghostip46.herokuapp.com',
          'ghostip47.herokuapp.com',
          'ghostip48.herokuapp.com',
          'ghostip49.herokuapp.com',
          'ghostip50.herokuapp.com',
          'ghostip51.herokuapp.com',
          'ghostip52.herokuapp.com',
          'ghostip53.herokuapp.com',
          'ghostip54.herokuapp.com',
          'ghostip55.herokuapp.com',
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
                         getBucket(domains[++index]);
                    })
                    .error(function(err){
                         getBucket(domains[++index]);
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
           console.log(bucketObj);
       	   var promise = $q.defer();
       	   $http.post('/api/buckets/1',bucketObj)
           .success(function(data){
              console.log(data);
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
               prefix = 'http://'+bucketObj.processName;
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

       //
       var deleteBucket = function(bucketObj){
           var promise = $q.defer();

            $http.delete('/api/buckets/'+bucketObj._id+'?'+'token='+bucketObj.userToken)
             .success(function(status){
                promise.resolve(status);
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
           updateBucket:updateBucket,
           deleteBucket:deleteBucket
       };
})

//======================================================FACTORY ENDS HERE