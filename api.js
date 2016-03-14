var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

//api routes
module.exports = function(database , visitor){
  //models
   var Buckets = database.model('Buckets');
   var Explorer = database.model('Explorer');
 
   router.param('id' , function(req , res , next , id){
	  req.id  = id;
	  return next(); 
   });
	

	/*********************************************************************************
	 *********************************************************************************/
     router.route('/buckets/:id')
       .get(function(req , res){
            var bucket = visitor.getBucket();

            if(bucket){
                res.status(200).send(bucket);
            }
            else{
                res.status(500).send('No active bucket on '+req.hostname);
            }
        })

        .post(function(req , res){
             if(req.body.userToken=='nature'){
                 req.body.userToken = '';
                 req.body.dateCreated = Date.now()+'';
                 req.body.lastActive = (Date.now()-60000*4)+'';   
                 req.body.lastModified = (Date.now()-60000*4)+''; 
                 Buckets.insertOne(req.body , function(err , result){
                     if(err){
                         return res.status(500).send('Not ok');
                     } 
                     else {
                      req.body._id = result.ops[0]._id.toString();
                      res.status(200).send(result.ops[0]);
                     }
                 }); 
             }
             else{
                return res.status(500).send('invalid user token');
             }
        }) 
        
        .put(function(req , res){
             if(req.body.userToken == 'nature'){
                 req.body.userToken = '';
                 req.body.lastModified = Date.now()+''; 
                 req.body._id = ObjectId(req.body._id);
                 //console.log(req.query);
                 Buckets.update(
                    {_id : req.body._id},
                    req.body,
                    function(err , result){
                        if(err){
                            console.log(err);
                            res.status(500).send('Database error during update');
                        }
                        else {
                           visitor.updateBucket(req.body , req.query);
                           res.status(200).send('Bucket updated on the server');
                        }  
                    }
                 );
             }
             else{
                    res.status(500).send('Cannot update Bucket due to invalid token');
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
     router.route('/getAll')
       .post(function(req , res){
            console.log(req.body);
            var query = {};
            if(req.body.ids.length > 0){
               for(var i=0; i<req.body.ids.length; i++){
                    req.body.ids[i] = ObjectId( req.body.ids[i]);
               }
            }
            
            Buckets.find({"_id":{"$nin": req.body.ids}}).toArray(function(err , results){
                  if(err){
                     return res.status(500).send('Database error during getAll');
                  }
                  else if(results[0] == undefined){
                     return res.status(500).send('No Dormant Buckets available');
                  }
                  else {
                   res.status(200).send(results); 
                  }
             });
        })
 
   
	return router;
};
