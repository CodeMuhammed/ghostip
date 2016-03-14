/* This module uses a give ip to visit the whole urls in the bucket assigned to it
*/
module.exports = function(bucketExplorer) {
	var bucket;
    
    //
    var setBucket =  function(bucketObj){
    	 console.log(bucketObj);
    	 bucket = bucketObj;
    	 console.log('bucket set in visitor');
    };

    var getBucket = function(){
    	return bucket;
    };

    var updateBucket = function(bucketObj , meta){
    	console.log(meta);
    	if(bucket){
            if(bucketObj._id+'' == bucket._id){
	           if(meta.action == 0){
	           	   console.log('Deleting url in this bucket');
                   bucket.urls.splice(meta.index , 1);
	           }
	           else if(meta.action == 1) {
                   console.log('Updating url in this bucket');
	           }
	    	}
	    	else{
	    	   console.log('Just passing by');
	    	}
    	}
    	else{
    		 console.log('Bucket empty here');
    	}
    }

	return {
	    //visitWith:visitWith,
	    //stats:stats
	    getBucket:getBucket,
	    setBucket:setBucket,
	    updateBucket:updateBucket
	}
	
};