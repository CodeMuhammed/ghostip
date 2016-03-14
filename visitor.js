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

    var updateBucket = function(bucketObj , action){
    	if(bucket){
            if(bucketObj._id+'' == bucket._id){
	           console.log('This process bucket was updated');
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