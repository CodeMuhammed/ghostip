const Database = require('./server2/database');
const seed = require('./server2/seed');

const paymentQueue = require('./server2/payment_queue');
const mock_data = require('./server2/mock_db');
const user_data = require('./server2/user_data');


// test connection to database
function initDatabase(cb) {
    const dbName = 'softworkco';
    const collections = [
        'User',
        'Transaction',
        'Queue'
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
    const adminQueue = new paymentQueue('admin', mock_data, database);
    const userQueue = new paymentQueue('user', mock_data, database);

    console.log('we could start our app here');
}


//Pair this user up in a cascading mode first try with normal user then admin
function testpairing(newUser, cb) {
    userQueue.canPair((err, stat) => {
        let receiver;
        if(err) {
            console.log('cannot pair with user trying admin');
            adminQueue.canPair((err, stat) => {
                receiver = stat.receiver;
                adminQueue.pair(newUser, receiver, (stat) => {
                    cb(null, stat);
                });
            });
        } else {
            console.log('trying to pair with user');
            receiver = stat.receiver;
            userQueue.pair(newUser, receiver, (stat) => {
                cb(null, stat);
            });
        }
    });
}

function testConfirmations(donor, receiver, cb) {
    adminQueue.confirmTransaction(donor._id, donor.paymentInfo.payTo, (err, status) => {
        if(status.toQueue) {
            console.log('receiver just confirmed a transaction');
            cb(null, status.toQueue);
        } else {
            console.log('donor just confirmed');
        }
       adminQueue.confirmTransaction(receiver._id, receiver.paymentInfo.receiveFrom[0], (err, status) => {
           if(status.toQueue) {
               console.log('receiver just confirmed a transaction');
               cb(null, status.toQueue);
           } else {
               console.log('donor just confirmed');
           }
       });
    });
}

function testAddingUserToQueue(donorId, cb) {
    adminQueue.addDonorToQueue(donorId, (err, stat) => {
        cb(null, stat);
    });
}


/*testpairing(user_data.user1, (err, stat) => {
    console.log('test1 start test pairing confirmations of payments and queueing confirmed user');
    if(stat) {
        //console.log(JSON.stringify((err || stat), undefined, 2));
        testConfirmations(stat.donor, stat.receiver, (err, donorId) => {
            if(stat) {
                testAddingUserToQueue(donorId, (err, stat) => {
                    //console.log(JSON.stringify((err || stat), undefined, 2));
                    console.log('test1 completed');
                    
                    console.log('test2 start bring in two new users and see if they fill this confirmed user instead');
                    testpairing(user_data.user2, (err, stat) => {
                        if(stat) {
                            testpairing(user_data.user3, (err, stat) => {
                                if(stat) {
                                    //console.log(JSON.stringify((err || stat), undefined, 2));
                                    console.log('test2 completed');

                                    console.log('test3 add user4 and see if he pairs with an admin instead');
                                    testpairing(user_data.user4, (err, stat) => {
                                        if(stat) {
                                            //console.log(JSON.stringify((err || stat), undefined, 2));
                                            console.log('test3 completed');
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });
    }
});*/

