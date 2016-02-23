var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

//api routes
module.exports = function(database , urlExplorer){
  //models
   var Urls = database.model('Urls');
   var Explorer = database.model('Explorer');
 
   router.param('id' , function(req , res , next , id){
	  req.id  = id;
	  return next(); 
   });
	

	/*********************************************************************************
	 *********************************************************************************/
     router.route('/urls/:id')
       .get(function(req , res){
             var obj;
             if(req.id == 'all'){
                 obj = {};
             }
             else{
                 obj = {"_id":ObjectId(req.id)};  
             }

             Urls.find(obj).toArray(function(err , results){
                  if(err){
                     return res.status(500).send('urls Not ok');
                  }
                  else if(results[0] == undefined){
                     return res.status(500).send('No urls available');
                  }
                  else {
                    console.log('getall called here');
                    if(req.id == 'all'){
                         res.status(200).send(results); 
                     }
                     else{
                         res.status(200).send(results[0]); 
                     }
                  }
             });

        })

        .post(function(req , res){
             if(req.query.token=='12345'){
                 req.query.dateCreated = Date.now()+'';
                 req.query.lastVisited = (Date.now()-60000*4)+'';   
                 Urls.insertOne(req.query , function(err , result){
                     if(err){
                         return res.status(500).send('Not ok');
                     } 
                     else {
                      req.query._id = result.ops[0]._id.toString();
                      updateAvailable(req.query);
                     }
                 }); 

                 //
                 function updateAvailable(data){
                     //
                     console.log('====================updating availabilty in add url path');
                      Explorer.update(
                        {},
                        {
                           "$set": {  
                                urlsAvailable:true
                           }
                        },
                        function(err , result){
                            if(err){
                                throw new Error('DB connection error api 1');
                            }
                            else {
                                console.log('process successfully released lock on database');
                                res.status(200).send(data);
                            }
                        }
                     );
                    
                 };
             }
             else{
                return res.status(500).send('invalid bitcoin address');
             }
             
        }) 
        
        .put(function(req , res){
             if(req.id == '12345'){
                 req.query._id = ObjectId(req.query._id);
                 console.log(req.query);
                 Urls.update(
                    {_id : req.query._id},
                    req.query,
                    function(err , result){
                        if(err){
                            console.log(err);
                            res.status(500).send('Not ok Url was not updated');
                        }
                        else {
                           urlExplorer.updateGlobal(req.query , 'update');
                           res.status(200).send('update Url recieved on the server');
                        }  
                    }
                 );
             }
             else{
                    res.status(500).send('Cannot update url due to invalid token');
             }
             
        }) 

        .delete(function(req , res){
        	    //@TODO delete url
                if(req.query.token == '12345'){
                     Urls.remove({_id : ObjectId(req.id)} , function(err , result){
                         if(err){
                             res.status(500).send('Not ok url was not removed');
                         }
                         else{
                             urlExplorer.updateGlobal({_id : req.id} , 'delete');
                             res.status(200).send('url removed successfully');
                         }
                     });
                }
                else{
                    res.status(500).send('Cannot delete url due to invalid token');
                }
            	

        });

     /*********************************************************************************
     *********************************************************************************/
      router.route('/reset')
       .post(function(req , res){
             //
             if(req.query.token == '12345'){
                  Explorer.update(
                    {},
                    {
                       "$set": {
                           accessingDomain:'',
                           locked:false,
                       }
                    },
                    
                    function(err , result){
                        if(err){
                             throw new Error('Api reset error 2');
                        }
                        else { //
                            res.status(200).send('Server successfully reset');
                        }  
                    });
             }
             else{
                 res.status(500).send('Cannot reset server due to invalid token');
             }
 
        })
 
   
	return router;
};
