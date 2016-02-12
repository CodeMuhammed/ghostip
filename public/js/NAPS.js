angular.module('uniben' , ['ui.router' ,'mgcrea.ngStrap'])

//state configuration and routing setup
.config([
    '$stateProvider' , '$urlRouterProvider'  , '$locationProvider',
    function($stateProvider , $urlRouterProvider  , $locationProvider){
          //enabling HTML5 mode
          $locationProvider.html5Mode(false).hashPrefix('!');
        
            //Logged in state
            $stateProvider
             
             .state('home' , {
                 url : '/home',
                 templateUrl : 'views/in.home.tpl.html',
                 controller : 'homeController',
                 data :{}
                 
             });
            
             $urlRouterProvider.otherwise('/home');
        }
])

.factory('Urlservice' , function($q , $http){
       
       //
       function addUrl(UrlObj){
           var promise = $q.defer();

           //
           $http({
               method:'POST',
               url:'/api/urls/1',
               params:UrlObj
           })
           .success(function(data){
               promise.resolve(data);
           })
           .error(function(err){
               promise.reject(err);
           });
           
           return promise.promise;
       }

        //
       function updateUrl(O){
            var promise = $q.defer();
            var o = angular.copy(O);
            console.log(o);
            
           //
           $http({
               method:'PUT',
               url:'/api/urls/'+o._id,
               params:o
           })
           .success(function(status){
               promise.resolve(status);
           })
           .error(function(err){
               promise.reject(err);
           });
           
           return promise.promise;
       }

        //
       function removeUrl(UrlObj){
           var promise = $q.defer();
           //
           $http({
               method:'DELETE',
               url:'/api/urls/'+UrlObj._id,
           })
           .success(function(status){
               promise.resolve(status);
           })
           .error(function(err){
               promise.reject(err);
           });
           
           return promise.promise;
       }
       
       //
       function getAll(){
            var promise = $q.defer();

            $http({
                method:'GET',
                url:'/api/urls/all',
            })
            .success(function(data){
               promise.resolve(data);
            })
            .error(function(err){
               promise.reject(err);
            });;

            return promise.promise;
            
       }

       return {
           addUrl:addUrl,
           updateUrl:updateUrl,
           removeUrl:removeUrl,
           getAll:getAll
       };
})

.controller ('homeController' , function($rootScope , $scope , $timeout , Urlservice){
   //
  Urlservice.getAll().then(function(data){
       $scope.Urls = data;
  } , function(err){
       alert(err);
  });

   //Functions to add a new url
   $scope.newUrl = {
       token:'',
       url:'http://www.yoururl.com',
       domain:'Server',   
       service:'All services',
       account:'account email',
       username:'account name',
       status:'inactive'
   }

   //
    $scope.addUrl = function(){
       $scope.processingNew = true;
       $scope.newUrl.date = Date.now();
       Urlservice.addUrl($scope.newUrl).then(function(data){
           $scope.Urls.push(data);
           $scope.processingNew = false;
       } , function(err){
          $scope.processingNew = false;
          alert(err);
       }); 
   };

   //
   $scope.saveUrl = function(urlObj , index){
       $scope.processing= true;
       Urlservice.updateUrl(urlObj).then(function(status){
            $scope.processing = false;
            $scope.resetEditorSettings(false , index);
            alert(status);
       },
       function(err){
            $scope.processing = false;
            alert(err);
       });
   };

   //
   $scope.deleteUrl = function(urlObj){
       $scope.processingDel = true;
       Urlservice.removeUrl(urlObj).then(function(status){
           $scope.processingDel = false;
       } , function(err){
          $scope.processingDel = false;
          alert(err);
       }); 
   }

   //
   $scope.editorSettings = {
       status:false,
       index:0
   };

   $scope.resetEditorSettings = function(status , index){
        $scope.editorSettings = {
             status:false,
             index:0
         };
       console.log(status+' '+index);
       $scope.editorSettings.status = status;
       $scope.editorSettings.index = index; 
   };


   //
   $scope.categories = ['All Services' ,'credhot', 'adfoc.us' , 'adf.ly'];
   $scope.activeCategory = '';
   $scope.setCategory = function(category){
       category=category=='All Services'?'':category;
       $scope.activeCategory = category;
   };
    
   //Scroll spy 
   $scope.fixed = false;
  
   $rootScope.$on('my:fixed' , function(e, a){
        $timeout(function(){
            $scope.fixed = true;
        });
        
   });

    $rootScope.$on('my:unfixed' , function(e, a){
        $timeout(function(){
            $scope.fixed = false;
        });
   });
});