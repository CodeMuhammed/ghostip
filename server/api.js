const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ObjectId = require('mongodb').ObjectId;

module.exports = (database, visitor) => {
   const Buckets = database.model('Buckets');
   const Explorer = database.model('Explorer');
 
   router.param('id', (req, res, next, id) => {
	  req.id  = id;
	  return next(); 
   });
	
	/*********************************************************************************
	 *********************************************************************************/
     router.route('/buckets/:id')
       .get((req, res) => {
            const bucket = visitor.getBucket();
            if(bucket){
                return res.status(200).send(bucket);
            }
            return res.status(500).send('No active bucket');
        })

        .post((req, res) => {
             if(req.body.userToken == 'paper'){
                 req.body.userToken = '';
                 req.body.dateCreated = Date.now() + '';
                 req.body.lastActive = (Date.now() - 60000 * 4) + '';   
                 req.body.lastModified = (Date.now() - 60000 * 4) + ''; 

                 return Buckets.insertOne(req.body, (err , result) => {
                     if(err){
                         return res.status(500).send('Not ok');
                     } 
                     else {
                         return res.status(200).send(result.ops[0]);
                     }
                 }); 
             }
             return res.status(500).send('invalid user token');
        }) 
        
        .put((req, res) => {
             if(req.body.userToken == 'paper'){
                 req.body.userToken = '';
                 req.body.lastModified = Date.now()+''; 
                 req.body._id = ObjectId(req.body._id);
                 console.log(req.body);

                 return Buckets.update({_id : req.body._id}, req.body, (err , result) => {
                     if(err){
                        return res.status(500).send('Database error during update');
                     }
                     visitor.updateBucket(req.body , req.query);
                     return res.status(200).send('Bucket updated on the server'); 
                });
             }
             return res.status(500).send('Cannot update Bucket due to invalid token'); 
        }) 

        .delete((req , res) => {
            if(req.query.token == 'paper'){
                return Buckets.remove({_id : ObjectId(req.id)}, (err , result) => {
                    if(err){
                        return res.status(500).send('DB error while deleting bucket');
                    }
                    visitor.notifyDelete(req.id);
                    return res.status(200).send('Bucket removed successfully');
                });
            }
            return res.status(500).send('Cannot delete bucket due to invalid token');
        });

     /*********************************************************************************
     *********************************************************************************/
     router.route('/getAll')
       .post((req, res) => {
            let query = {};
            if(req.body.ids.length > 0) {
               req.body.ids = req.body.ids.map(id => ObjectId(id));
            }
            
            Buckets.find({"_id":{"$nin": req.body.ids}}).toArray((err , results) => {
                if(err) {
                    return res.status(500).send('Database error during getAll');
                } else if(results[0] == undefined){
                    return res.status(500).send('No Dormant Buckets available');
                }
                return res.status(200).send(results);
            });
        });
 
	return router;
};
