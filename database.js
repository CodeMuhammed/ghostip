var MongoClient  = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var assert = require('assert');
var DBOpened = false;

//This object will hold opened connections to the collections the app uses
var openedColls = {};
var url = '';

//import the language driver
module.exports = function(dbName , app){
   
	//This functions accesses the database and creates a pool of opened 
	//connections to the required collections needed by the app
	var initColls = function (cb) {
		if(!isDBOpened()){
			MongoClient.connect(url , function(err , db){
				if(err){
					throw new Error('DB connection error here');
				} 
                else { 
					assert.equal(null ,err);
					console.log('Connected correcctly to the database');
					openedColls.Buckets = db.collection('Buckets');
					openedColls.Explorer = db.collection('Explorer');
					DBOpened = true;
                    
                    //Initialize explorer object
                    openedColls.Explorer.find({}).toArray(function(err , results){
		                  if(err){
		                     throw new Error('DB connection error here 1');
		                  }
		                  else if(results[0] == undefined){
		                     console.log('coll not defined');
		                     var explorerObj = {
		                     	 locked: false,
		                     	 accessingDomain: ''
		                     };
		                      openedColls.Explorer.insertOne(explorerObj , function(err , result){
			                     if(err){
			                         throw new Error('DB connection error here 2');
			                     } 
			                     else {
			                     	console.log('coll defined');
			                     	console.log(result);
			                        return cb(); 
			                     }
			                 });
		                  }
		                  else {
		                  	 console.log('coll already defined');
		                     return cb();
		                  }
		            });
	           
				}
			});
		} 
        else {
			return cb();
		}
		
	};
	
    //This function returns the valid collection to the client module
	var model = function(coll){
		if(!openedColls[coll]){
			throw new Error('The model or collection required does not exists');
		}
		return openedColls[coll];
	};
	
	//
	var isDBOpened = function(){
		return DBOpened;
	}
	
	//Set db connection string based on the current environment being worked in...
	if(app.get('env') ==='development'){
       url = 'mongodb://127.0.0.1:27017/piveo';
	} else {
       url = 'mongodb://'+ process.env.dbuser+ ':'+process.env.dbpassword+'@ds051738.mongolab.com:51738/'+dbName.trim();
	}
	
	return {
		initColls : initColls,
		model : model
	};
};

