var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var ObjectId = require('mongodb').ObjectId;

//api routes
module.exports = function(database){
  //models
   var Urls = database.model('Urls');
 
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
                     return res.status(500).send('urls Not ok 1');
                  }
                  else {
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
             var my_token = '12345';
             if(req.query.token==my_token){
                 console.log(req.query);

                 Urls.insertOne(req.query , function(err , result){
                     if(err){
                         return res.status(500).send('Not ok');
                     } 
                     else {
                      req.query._id = result.ops[0]._id.toString();
                      res.status(200).send(req.query);
                     }
                 });
             }
             else{
                return res.status(500).send('invalid bitcoin address');
             }
             
        })
        
        .put(function(req , res){
            
            console.log(req.query.$$hashkey);
              
             req.query._id = ObjectId(req.query._id);
             Urls.update(
                {_id : req.query._id},
                req.query,
                function(err , result){
                    if(err){
                        console.log(err);
                        res.status(500).send('Not ok Url was not updated');
                    }
                    else {
                       res.status(200).send('update Url recieved on the server');
                    }
                }
             );
        })

        .delete(function(req , res){
        	    //@TODO delete url
                console.log('Delete called');
            	Urls.remove({_id : ObjectId(req.id)} , function(err , result){
                     if(err){
                         res.status(500).send('Not ok url was not removed');
                     }
                     else{
                         res.status(200).send('url removed successfully');
                     }
            	});

        });

   
	return router;
};