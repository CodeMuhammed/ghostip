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

// cors configurations to enable consuming the rest api
.config([
    '$httpProvider' , 
    function($httpProvider){
       $httpProvider.defaults.useXDomain = true;
       $httpProvider.defaults.withCredentials = true;
       delete $httpProvider.defaults.headers.common['X-Requested-With'];
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
       
       //
       function resetServer(token){
            var promise = $q.defer();
            if(token.length > 4){ 
                $http({
                    method:'POST',
                    url:'/api/reset',
                    params : {token:token}
                })
                .success(function(status){
                   promise.resolve(status);
                })
                .error(function(err){
                   promise.reject(err);
                });
            }
            else{
                promise.reject('Invalid token');
            }
            

            return promise.promise;
            
       }

       //
       var domains = [
          'localhost:5003' , 
          'ghostip.herokuapp.com' ,
          'ghostip1.herokuapp.com' ,
          'ghostip2.herokuapp.com' ,
          'ghostip3.herokuapp.com'
       ];

       function populateUrlDomainMap(mapObj){
             console.log(mapObj);
             var promise = $q.defer();
             var counter = 0;

             function checkExit(){
                  if(counter == domains.length-1){
                      return promise.resolve(mapObj);
                  }
                  else{
                      counter++;
                      doQuery(domains[counter]);
                  }
             }

             function doQuery(domain){
                    $http({
                         method:'GET',
                         url:'http://'+domain+'/stats'
                    })
                    .success(function(data){
                         if(data.url!=''){
                            mapObj[data.url] = domain;
                            mapObj.urlObj = data;
                            checkExit();
                         }
                         else{
                             checkExit();
                         }
                         
                    })
                    .error(function(err){
                          checkExit();
                    });
             }
             //start the query process
             doQuery(domains[counter]);


             return promise.promise;
       }


       return {
           addUrl:addUrl,
           updateUrl:updateUrl,
           removeUrl:removeUrl,
           getAll:getAll,
           resetServer:resetServer,
           populateUrlDomainMap:populateUrlDomainMap
       };
})


//Controller controlling the logic of  the appication
.controller ('homeController' , function($rootScope , $scope , $timeout  , $http, Urlservice){
     //Stats for this particuar url to know if it is actively visiting a url or not
    $http({
         method:'GET',
         url:'/stats'
    })
    .success(function(data){
         $scope.statsObj = data;
         $scope.statsObj.browserTime =Date.now();
         //
         $scope.isRecent = function(time){
             return ($scope.statsObj.serverTime - time) <= 60000*2;
         }
    })
    .error(function(err){
          $scope.statsObj = err;
    });

    //
    $scope.urlDomainMap = {};

    Urlservice.getAll().then(function(data){
         $scope.Urls = data;
         console.log(Urls);
         angular.forEach($scope.Urls , function(urlObj){
             $scope.urlDomainMap[urlObj.url] = "none";
         });
         populateUrlDomainMap();
    } , function(err){
         alert(err);
    });
    
    //this function populates the map with the active domain currently
    //wworking on the urls
    function populateUrlDomainMap(){
         Urlservice.populateUrlDomainMap($scope.urlDomainMap).then(function(newUrlDomainMap){
              $scope.urlDomainMap = newUrlDomainMap;
              console.log($scope.urlDomainMap);
         });

         //
         $scope.getDomain = function(url){
             return $scope.urlDomainMap[url];
         }
    }

     //Functions to add a new url
     $scope.newUrl = {
         token:'',
         url:'http://www.yoururl.com',
         domain:'Server',   
         selector:'none',
         account:'account email', 
         username:'account name',
         dateCreated:'',
         lastVisited:'' 
     } //
   
     // 
      $scope.addUrl = function(){
         $scope.processingNew = true;
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
              console.log(status);
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
              //
              Urlservice.getAll().then(function(data){
                   $scope.Urls = data;
              } , function(err){
                   alert(err);
              });

         } , function(err){
            $scope.processingDel = false;
            alert(err);
         }); 
     }

     //
     $scope.resetServer = function(){
         Urlservice.resetServer($scope.newUrl.token).then(
             function(status){
                 alert(status);
             },
             function(err){
                 alert(err);
             }
         );
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
     $scope.categories = ['All selectors' ,'[value=cr]', 'a#skip' , '[value=skip]'];
     $scope.activeCategory = '';
     $scope.setCategory = function(category){
         category=category=='All selectors'?'':category;
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