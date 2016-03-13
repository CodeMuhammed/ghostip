angular.module('customFactory' , [])
 
//======================================================FACTORY STARTS HERE
.factory('bucketFactory' , function($q , $http , $location , $timeout){
       //
       var newBucket = function(bucketObj){
       	   var promise = $q.defer();

       	   $timeout(function() {
               promise.resolve(bucketObj);
       	   }, 3000);
       	   return promise.promise;
       }

        //
       var updateBucket = function(bucketObj){
       	   var promise = $q.defer();

       	   $timeout(function() {
               promise.resolve('Bucket updated successfully');
       	   }, 3000);
       	   return promise.promise;
       }
       
       return {
           newBucket : newBucket,
           updateBucket:updateBucket
       };
})

//======================================================FACTORY ENDS HERE