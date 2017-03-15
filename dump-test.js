const Database = require('./server2/database');
const seed = require('./server2/seed');
const paymentQueue = require('./server2/payment_queue');

let softworkDB;
let adminQueue;
let userQueue;



// test connection to database
function initDatabase(cb) {
    const dbName = 'softworkco';
    const collections = [
        'User',
        'Transaction',
        'Stat',
        'Package',
        'Test'
    ];

    let url;
    if(!process.env.NODE_ENV || process.env.NODE_ENV == 'development'){
       url = `mongodb://127.0.0.1:27017/${dbName}`;
	} else {
       url = `mongodb://${process.env.dbuser}:${process.env.dbpassword}@ds051738.mongolab.com:51738/${dbName}`;
	}

    (new Database({ collections, url })).connect((err, database) => {
       seed(database).run((err, status) => {
            if(err) {
                cb(err);
            } else {
                cb(null, database);
            }
       });
    });
}

initDatabase((err, database) => {
    if(err) {
        console.log('could not initialize db');
    } else {
        bootstrap(database);
    }
});

//This setsup the app
function bootstrap(database) {
    softworkDB = database;
    adminQueue = new paymentQueue('admin', database);
    userQueue = new paymentQueue('user', database);
    // @TODO start designing the API endpoints
    // @TODO make this an independent repo on github
} 
