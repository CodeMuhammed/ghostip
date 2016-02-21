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

.filter("myfilter", function ($filter) {
  return function (data, activeCategory, activeState) {
      //console.log('category:'+activeCategory+' activeState:'+activeState);
      var filtered = [];

      angular.forEach(data , function(item){
          var stateTest = item.status == activeState || activeState == '';
          var categoryTest = false;
          
          //Test for category
          if(activeState == 'Idle' || activeState == 'Dormant'){
              var categoryTest = true;
          }
          else{
              if(angular.isDefined(item.urlObj.selector)){
                   categoryTest = item.urlObj.selector==activeCategory || activeCategory == '';
              }
          }
          
          
          
          if(stateTest && categoryTest){
               filtered.push(item);
          }
      });
      return filtered;
  }
})

//======================================================FACTORY STARTS HERE
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
       function updateUrl(O , token){
           var promise = $q.defer();
        
           //
           if(token.length<5){
              promise.reject('token not defined');
           }
           else{

             var o = angular.copy(O);
             console.log(o);
              
             //
             $http({
                 method:'PUT',
                 url:'/api/urls/'+token,
                 params:o
             })
             .success(function(status){
                 promise.resolve(status);
             })
             .error(function(err){
                 promise.reject(err);
             });

           }
           
           return promise.promise;
       }

        //
       function removeUrl(domainMap , token){
           var promise = $q.defer();
           //
            if(token){
               if(!angular.isDefined(token)){
                  promise.reject('token not defined');
               }
               else{
                 var prefix = '';
                 if(domainMap.domain != 'no server'){
                     prefix = domainMap.domain;
                     console.log(prefix);
                 }
                 $http({
                     method:'DELETE',
                     url:prefix+'/api/urls/'+domainMap.urlObj._id , 
                     params:{token:token}
                 })
                 .success(function(status){
                     promise.resolve(status);
                 })
                 .error(function(err){
                     promise.reject(err);
                 });
                 
               }
             }
             else{
                promise.reject('token is undefined');
             }
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
       var domains = [
          'localhost:5003', 
          /*'ghostip.herokuapp.com' ,
          'ghostip1.herokuapp.com',
          'ghostip2.herokuapp.com',
          'ghostip3.herokuapp.com',
          'ghostip4.herokuapp.com',
          'ghostip5.herokuapp.com',
          'ghostip6.herokuapp.com',
          'ghostip7.herokuapp.com', 
          'ghostip8.herokuapp.com',
          'ghostip9.herokuapp.com',
          'ghostip10.herokuapp.com'*/
       ];

       function populateDomainMap(urlMapList){
             var domainMapArr = []; 
             var promise = $q.defer();
             var counter = 0;
             
             console.log(urlMapList);

             function checkExit(){
                  if(counter == domains.length-1){
                      return aggregateNonAllocated();
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
                         if(angular.isDefined(data.urlObj.url)){
                             domainMapArr.push({
                                domain:domain, 
                                stats:data.statsObj, 
                                urlObj:data.urlObj,
                                status:'Active'     //process is actively handling a url
                              });

                             //remove the confirmed domain from the urlMapList
                             console.log(data.urlObj.url);
                             urlMapList[data.urlObj.url].splice(0 , 1);   

                         }
                         else{
                             domainMapArr.push({
                                domain:domain, 
                                stats:data.statsObj, 
                                urlObj:data.urlObj,
                                status:'Idle'    //Process is waiting for a non occupied url 
                             });
                         }

                         //
                         checkExit();
                         
                    })
                    .error(function(err){
                         domainMapArr.push({
                            domain:domain , 
                            stats:{} , 
                            urlObj:{},
                            status:'Dormant'   //Process is offline due to error or change of protocol
                         });
                         checkExit();
                    });
             }
             //start the query process
             doQuery(domains[counter]);

             //This functions filters out UrlOBjects that are curently  not allocated to a process
             function aggregateNonAllocated() {
                  console.log('computing non allocated urls');
                  angular.forEach(Object.keys(urlMapList) , function(key){
                       if(urlMapList[key].length>0){
                           angular.forEach(urlMapList[key] , function(UMLObj){
                                  domainMapArr.push({
                                      domain:"no server", 
                                      stats:{}, 
                                      urlObj:UMLObj,
                                      status:'Non Allocated'    //url not being processed at the moment 
                                   });
                           });
                       }
                       
                  });

                  //
                  promise.resolve(domainMapArr);
             }


             return promise.promise;
       } 


       return {
           addUrl:addUrl,
           updateUrl:updateUrl,
           removeUrl:removeUrl,
           getAll:getAll,
           populateDomainMap:populateDomainMap
       };
})
//======================================================FACTORY ENDS HERE



//Controller controlling the logic of  the appication
.controller ('homeController' , function($rootScope , $scope , $timeout  , $http, Urlservice){

    //
    function startApp(){
      Urlservice.getAll().then(function(data){
           $scope.domainDone = false;
           $scope.Urls = data;
           computeCategories();
           
          //
          computeUrlMapList();

      } , function(err){
           alert(err);
      });
    }

    startApp();
   /////////////////////////////
    //
    function computeUrlMapList(){
         var urlMapList = {};
         console.log($scope.Urls.length);
         angular.forEach($scope.Urls , function(urlObj){
              if(angular.isArray(urlMapList[urlObj.url])){
                 urlMapList[urlObj.url].push(urlObj);
              }
              else {
                urlMapList[urlObj.url] = [];
                urlMapList[urlObj.url].push(urlObj);  
              }

         });

         Urlservice.populateDomainMap(urlMapList).then(function(domainMapArr){
             $scope.domainMapArr = domainMapArr;
             console.log(domainMapArr);
             $scope.domainDone = true;
         });
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
             $scope.processingNew = false;
             startApp();
         } , function(err){
            $scope.processingNew = false; 
            alert(err); 
         });    
     };     

     //
     $scope.saveUrl = function(urlObj){

         $scope.processing= true;
         urlObj.url = $scope.editorObj.url;
         urlObj.selector = $scope.editorObj.selector;
         Urlservice.updateUrl(urlObj , $scope.newUrl.token).then(function(status){
              $scope.processing = false;
              $scope.resetEditorSettings(-1);
              $scope.editorObj = {};
              startApp();
         },
         function(err){
              $scope.processing = false;
              console.log(err);  
         });
     };

     //
     $scope.deleteUrl = function(domainMap){
         $scope.processingDel = true;
         Urlservice.removeUrl(domainMap , $scope.newUrl.token).then(function(status){
            $scope.processingDel = false;
            startApp();

         } , function(err){
            console.log(err);
            $scope.processingDel = false;  
            
         });
     }

     
     //
     $scope.editorIndex = -1;
     $scope.editorObj = {url:'' , selector:''}
       
     $scope.resetEditorSettings = function(index , url , selector){
         $scope.editorObj.url = url;
         $scope.editorObj.selector = selector
         $scope.editorIndex = index;
     };


     
     function computeCategories(){
         //
         console.log($scope.Urls);
         $scope.categories = ['All'];
         angular.forEach($scope.Urls , function(url){
             if($scope.categories.indexOf(url.selector)<0){
                 $scope.categories.push(url.selector);
             }
         });
     }

     $scope.activeCategory = '';
     $scope.setCategory = function(category){
         category=category=='All'?'':category;
         $scope.activeCategory = category;
     };

     //
     $scope.states = ['All' , 'Active' , 'Idle' , 'Dormant' , 'Non Allocated'];
     $scope.activeState = '';
     $scope.setState = function(state){
         state=state=='All'?'':state;
         $scope.activeState = state;
     };
    
     //
     $scope.activeHover = -1;
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