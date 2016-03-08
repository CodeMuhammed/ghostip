#!/usr/bin/env node

var Spooky = require('spooky');
var request = require('request');
var express = require('express');
var path = require('path');
var app = express();  
var methodOverride = require('method-override');   
    
//cors  
var cors  = require('cors');
app.use(cors({credentials: true, origin: true}));

var database = require('./database')('restapi' , app);

var port = process.env.PORT || 5003;
//
var Greeting = 'Hello ghost';
var counter = 0;
var herokuAppsUrls = [];
var visitedIps = [];

var urlExplorer;
var tester;


var runGhostProxy = function(ip , url , selector){ 
	console.log('starting ghost');
	
	if(visitedIps.indexOf(ip)<0){
		visitedIps.push(ip);
		continueT(ip);
	}
	else{
		console.log('this ip has been visited already');
		return ;
	}
	
	function continueT(ip){
	
		console.log('process starting '+ip+' '+url+' '+selector);
		
		var spooky = new Spooky({
				child: {
					transport: 'http',
					proxy: ip
				},
				casper: {
					logLevel: 'debug',
					verbose: true,
					options: {
					   clientScripts: ['http://ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js'],
					   pageSettings: {
					        Referer: 'https://www.google.com.ng'
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
			
				//start the main site visiting process
				console.log('here init =========================== '+url+' '+selector);

				//
				spooky.start(url);
				spooky.then([{url:url , selector:selector} , function(){
				  
                     this.viewport(1024, 768, function() {
						  console.log('Viewport size changed');
				       
				          //
	                      if(selector=='none'){
	                      	     
								 this.then(function(){
								 	  this.wait(30000 , function(){
									    this.emit('hi', 'Hello, from ' + this.getCurrentUrl());
									    phantom.clearCookies();
								 	  	this.clear();
								 	  });
								 	  
								 });
			                  
							}
							
							//General case
							else{ 
							   this.then(function(){
							   	   this.waitForSelector(selector , function(){
							   	   	  this.wait(15000 , function(){
							   	   	  	    this.thenClick(selector , function() {
												this.wait(10000 , function(){
												    this.emit('hi', 'Hello, from ' + this.getCurrentUrl());
												    phantom.clearCookies();
											 	  	this.clear();
											 	});
										    });
							   	   	  });
								   	   	  
							   	   } , function(){
							   	   	     this.emit('hi', 'The selector was not found');
									     phantom.clearCookies();
								 	  	 this.clear();
							   	   } , 20000);
							   });
							     
							}
					    });  

				}]);
                
                //
				spooky.run();	
			});
			
			//logs and listeners
			spooky.on('error', function (e, stack) {
				console.log('here');//
				console.error(e);
				Greeting = e;

				if (stack) {
					console.log(stack);
					Greeting = stack;
				}
				//spooky.destroy();
			});

			
			//
			spooky.on('console', function (line) {
				console.log(line);
			});
			
			//
			spooky.on('hi', function (greeting) {
				console.log(greeting);
				counter+=1;
				Greeting = greeting;
				//spooky.destroy();
			});

      }
};

//init database get the urls specific to this session then run testers
database.initColls(function(){
	 
	//initialize  url explorer
	urlExplorer  = require('./urlExplorer')(database);

	//api routes starts here
	app.use('/api' , require('./api')(database , urlExplorer));

	(function getUrlFn(){
		urlExplorer.getUrl(function(urlObj){

			if(urlObj == -1){
				Greeting = 'All urls are occupied by processes trying again in 10 secs';
                console.log(Greeting);
                setTimeout(function(){
                     getUrlFn();
                } , 10000 );
			}
			else{
				//start main process of testing then visiting
				Greeting = "UrlObj gotten successfully";
	            tester = require('./tester')(runGhostProxy , urlObj , function(){
	            	console.log('Done here next is to exit the process successfully');
	            	urlExplorer.exitProcess(urlObj);
	            });

	            //Register the tester module with urlExplorer
	            urlExplorer.setTesterFn(tester);
			}
	        
		});
	})();

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//=============================================================================
	//configure express static
	app.use(express.static(path.join(__dirname , 'public')));

	//
	app.get('/stats', function(req, res) {
		 var urlObj = urlExplorer.getUrlObj();
		 if(urlObj){
			 res.send({
		    	urlObj : urlObj,
		    	statsObj: {
		            explorer: urlExplorer.getStat(),
				    progress: "visited "+counter+" times ",
				    statusText: Greeting,
				    getFound: tester ? tester.getFound() : {},
				    serverTime: Date.now(),
				    browserTime: '',
				    token : urlExplorer.getToken()
		    	}
		     });
		   }
		   else{
		   	   res.status(500).send('Explorer still searching for url obj');
		   }
	});


	//stop searching for new ips after the first 10 minutes of app's uptime
	setTimeout(function(){
		tester.stopSearch(function(){
			 console.log('searching stopped');
		});
		  
	} , 60000*20);

	//Start the main Express server
	app.listen(port, function() {
	    console.log("Listening on " + port);
	});
	 
});


