angular.module('paperfaucet' , ['ui.router' ,'mgcrea.ngStrap' , 'customFactory'])

//state configuration and routing setup
.config([
    '$stateProvider' , '$urlRouterProvider'  , '$locationProvider',
    function($stateProvider , $urlRouterProvider  , $locationProvider){
          //enabling HTML5 mode
          $locationProvider.html5Mode(false).hashPrefix('!');
        
           $stateProvider
             
             .state('new' , {
                 url : '/v2_home',
                 templateUrl : 'views/in.home2.tpl.html',
                 controller : 'home2Controller',
                 data :{}
                 
             });
            
             $urlRouterProvider.otherwise('v2_home');
        }
])

// cors configurations to enable consuming the rest api
.config([
    '$httpProvider' , 
    function($httpProvider){
       $httpProvider.defaults.useXDomain = true;
       $httpProvider.defaults.withCredentials = true;
       delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
])


//====================v2 implementation ============================
.controller('home2Controller' , function($scope , $timeout , bucketFactory){
       $scope.alert = {msg:'' , show:false , type:''};
       $scope.showAlert  = function(msg , type , err){
           $scope.alert.msg = msg;
           $scope.alert.type = type;
           $scope.alert.show = true;
           $timeout(function(){
               if(!err){
                  $scope.alert.show = false;
               }
           } , 3000);
       };

        $scope.closeAlert  = function(){
           $scope.alert.show = false;
       };


       $scope.defaultUrlObj = {
         userName:'Default user1',
         accountEmail:'example@gmail.com',
         serviceName:'service',
         urlName:'https://sh.rt/url',
         selector:'div.selector',
         dateCreated:Date.now(),
         visited:'0',
         statusText:'No status yet'
       };

       $scope.tempBucketObj = {};

       $scope.defaultBucketObj =  {
           bucketName:'New Test',
           processName:'No process',
           dateCreated:Date.now(),
           lastActive:Date.now(),
           lastModified:Date.now(),
           serverToken:'1010',
           userToken:'',
           urls:[]
       };
      
      //
      $scope.buckets = [];
      bucketFactory.getActiveBucketsAsync().then(
           function(done){
               $scope.showAlert(done , 'success');
               var idsArr = [];
               for(var i=0; i<$scope.buckets.length; i++){

                   idsArr.push($scope.buckets[i]._id);
               }

               bucketFactory.getDormantBuckets(idsArr).then(
                   function(data){
                        for(var i=0; i<data.length; i++){
                            data[i].active = '';
                            $scope.buckets.push(data[i]);
                        }
                        $scope.showAlert(data.length+' dormant buckets gotten' , 'success');
                   },
                   function(err){
                        $scope.showAlert(err , 'warning'  , true);
                   }
               );
           },
           function(err){
           },
           function(data){
               $scope.buckets.push(data);
           }
      );

      //Editor controls
      $scope.activeEditor = {
         b_id:-1,
         u_index:-1,
         e:false
      };

      //
      $scope.setEditor = function(bucket_id , url_index , status){
    
            //if editor mode is on, store the bucketObj in the tempBucket
            if(status){
                angular.forEach($scope.buckets , function(bucket){
                     if(bucket_id == bucket._id){
                          $scope.tempBucketObj = angular.copy(bucket);
                          $scope.showAlert('bucket stored in temp' , 'info');
                     }
                });
            }
            else {
                for(var i=0; i<$scope.buckets.length; i++){
                      console.log($scope.buckets[i]._id+' '+bucket_id);
                      if($scope.buckets[i]._id === bucket_id){
                          $scope.buckets[i] = angular.copy($scope.tempBucketObj);
                          console.log($scope.tempBucketObj);
                          $scope.tempBucketObj  = {};
                          $scope.showAlert('bucket data reverted back' , 'info');
                     }

                }
                
            }

           //
           console.log(bucket_id+' '+url_index);
           $scope.activeEditor = {
               e:status,
               b_id:url_index==-1? -1 : bucket_id,
               u_index:url_index
            };
      };

      //
      $scope.visibleBucketId = -1;
      $scope.setBucketId = function(b_id){
          $scope.visibleBucketId  =b_id;
      }
      

      //
      $scope.createNewBucket = function(){
           $scope.processingNewBucket =true;
           bucketFactory.newBucket(angular.copy($scope.defaultBucketObj))
           .then(function(result){
               $scope.buckets.push(result);
               $scope.showAlert('Bucket successfully created' , 'success');
               $scope.processingNewBucket =false;
           } , function(err){
              $scope.showAlert(err , 'warning' , true);
              $scope.processingNewBucket =false;
           });
      }

      //
      $scope.updateBucket = function(bucket , u_index){
           bucket.userToken = $scope.defaultBucketObj.userToken;
           $scope.processingUpdateBucket =true;
           $scope.activeEditor.u_index = u_index;
           bucketFactory.updateBucket(bucket , 1)
           .then(function(status){
               $scope.showAlert(status , 'success');
               $scope.processingUpdateBucket =false;
               $scope.setEditor(-1 , -1 , false);
           } , function(err){
              $scope.showAlert(err , 'warning' , true);
              $scope.processingUpdateBucket =false;
           });
      }

       //
      $scope.removeBucket = function(){
           /*$scope.processingRemoveBucket =true;
           bucketFactory.newBucket(angular.copy($scope.defaultBucketObj))
           .then(function(result){
               $scope.showAlert(status , 'success');
               $scope.processingRemoveBucket =false;
           } , function(err){
              $scope.showAlert('Error creating bucket' , 'warning' , true);
              $scope.processingRemoveBucket =false;
           });*/
      }

      //
      $scope.pushNewUrl = function(bucket){
          $scope.setEditor(-1 , -1 , false);
          $scope.defaultUrlObj.userName+='1';
          bucket.urls.push(angular.copy($scope.defaultUrlObj));
      };

      //
      $scope.removeUrl = function(bucket_id , u_index){
           $scope.processingRemoveUrl =true;
           $scope.activeEditor.u_index = u_index;
           $scope.activeEditor.b_id = bucket_id;
           for(var i=0; i<$scope.buckets.length; i++){
                if($scope.buckets[i]._id === bucket_id){
                   $scope.tempBucketObj = angular.copy($scope.buckets[i]);
                   $scope.tempBucketObj.urls.splice(u_index , 1);
                   update(i);
                   break;
               }
           }

           //
           function update(index){
                $scope.tempBucketObj.userToken = $scope.defaultBucketObj.userToken;
                bucketFactory.updateBucket($scope.tempBucketObj , 0)
                 .then(function(status){
                     $scope.buckets[index] = angular.copy($scope.tempBucketObj);
                     $scope.tempBucketObj = {};
                     $scope.showAlert('Url deleted from '+$scope.buckets[index].bucketName , 'success');
                     $scope.processingRemoveUrl =false;
                     $scope.setEditor(-1 , -1 , false);
                 } , function(err){
                    $scope.showAlert(err , 'warning' , true);
                    $scope.processingRemoveUrl =false;
                 });
           };
      }

});