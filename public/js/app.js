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
                 
             });//
            
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
           _id:'123456789',
           bucketName:'New Test',
           processName:'No process',
           dateCreated:Date.now(),
           lastActive:Date.now(),
           lastModified:Date.now(),
           serverToken:'1010',
           userToken:'Your_token',
           urls:[]
       };

       $scope.buckets = [
          {
           _id:'123456789',
           bucketName:'Experimental Test',
           processName:'No process',
           dateCreated:Date.now(),
           lastActive:Date.now(),
           lastModified:Date.now(),
           serverToken:'10111110101001000',
           userToken:'',
           urls:[
              {
                 userName:'codemuhammed',
                 accountEmail:'codemuhammed@gmail.com',
                 serviceName:'credhot',
                 urlName:'https://crd.ht/qZ05',
                 selector:'div.unselectable',
                 dateCreated:Date.now(),
                 visited:'0',
                 statusText:'No status yet'
              },
           ]
       }
      ];

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
      $scope.visibleBucketIndex = 0;
      $scope.setBucketIndex = function(index){
          $scope.visibleBucketIndex  =index;
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
              $scope.showAlert('Error creating bucket' , 'warning' , true);
              $scope.processingNewBucket =false;
           });
      }

      //
      $scope.updateBucket = function(bucket , u_index){
           $scope.processingUpdateBucket =true;
           $scope.activeEditor.u_index = u_index;
           bucketFactory.updateBucket(bucket)
           .then(function(status){
               $scope.showAlert(status , 'success');
               $scope.processingUpdateBucket =false;
               $scope.setEditor(-1 , -1 , false);
           } , function(err){
              $scope.showAlert('Error creating bucket' , 'warning' , true);
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
                bucketFactory.updateBucket($scope.tempBucketObj)
                 .then(function(status){
                     $scope.buckets[index] = angular.copy($scope.tempBucketObj);
                     $scope.tempBucketObj = {};
                     $scope.showAlert('Url deleted from '+$scope.buckets[index].bucketName , 'success');
                     $scope.processingRemoveUrl =false;
                     $scope.setEditor(-1 , -1 , false);
                 } , function(err){
                    $scope.showAlert('Error removing bucket' , 'warning' , true);
                    $scope.processingRemoveUrl =false;
                 });
           };
      }

});