const MongoClient  = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

module.exports = (dbName , app) => {
	//This object will hold opened connections to the collections the app uses
	let openedColls = {};
	let DBOpened = false;
	let url;

	//Set db connection string based on the current environment being worked in...
	if(app.get('env') ==='development'){
       url = 'mongodb://127.0.0.1:27017/piveo';
	} else {
       url = 'mongodb://'+ process.env.dbuser+ ':'+process.env.dbpassword+'@ds051738.mongolab.com:51738/'+dbName.trim();
	}

	// This method initializes the explorer collection
	const initExplorer = (cb) => {
		openedColls.Explorer.find({}).toArray((err, results) => {
			if(err) {
				throw new Error(err);
			} else if(!results[0]){
				const explorerObj = {
					locked: false,
					accessingDomain: ''
				};
				openedColls.Explorer.insertOne(explorerObj, (err , result) => {
					if(err){
						throw new Error('DB connection error here 2');
					}
					return cb();
				});
			} else {
				console.log('Explorer already defined');
				return cb();
			}
		});
	}

	// This method initializes the ipDump collection
	const initIpDump = (cb) => {
		openedColls.IpDump.find({}).toArray((err , results) => {
			if(err) {
				throw new Error(err);
			} else if(!results[0]){
				const explorerObj = {
					name: 'dump',
					ips: []
				};
				openedColls.IpDump.insertOne(explorerObj, (err , result) => {
					if(err){
						throw new Error(err);
					}
					return cb();
				});
			} else {
				console.log('IpDump already defined');
				return cb();
			}
		});
	}

	//This functions accesses the database and creates a pool of opened
	//connections to the required collections needed by the app
	const initColls = (cb) => {
		if(!DBOpened){
			MongoClient.connect(url, (err , db) => {
				if(err) throw new Error('DB connection error here');

				console.log('Connected correcctly to the database');
				DBOpened = true;

				// Define collections
				openedColls.Buckets = db.collection('Buckets');
				openedColls.Explorer = db.collection('Explorer');
				openedColls.IpTrackers = db.collection('IpTrackers');
				openedColls.IpDump = db.collection('IpDump');

				//Initialize explorer object
				initExplorer(() => {
					return initIpDump(cb);
				});
			});
		}
        else {
			return cb();
		}
	};

    //This function returns the valid collection to the client module
	const model = (coll) => {
		if(!openedColls[coll]){
			throw new Error('The model or collection required does not exists');
		}
		return openedColls[coll];
	};

	return {
		initColls,
		model
	};
};
