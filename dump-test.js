const paymentQueue = require('./server2/payment_queue');
const mock_data = require('./server2/mock_db');
const user_data = require('./server2/user_data');

const adminQueue = new paymentQueue('admin', mock_data);
const userQueue = new paymentQueue('user', mock_data);

//Pair this user up in a cascading mode first try with normal user then admin
function testpairing(newUser, cb) {
    userQueue.canPair((err, stat) => {
        let receiver;
        if(err) {
            console.log('cannot pair with user trying admin');
            adminQueue.canPair((err, stat) => {
                receiver = stat.receiver;
                adminQueue.pair(newUser, receiver, (stat) => {
                    let donor = stat.Users.filter((user) => {
                        return user._id == newUser._id;
                    })[0];

                    receiver = receiver || stat.Users.filter((user) => {
                        return user.paymentInfo.receiveFrom.indexOf(donor.paymentInfo.payTo) >= 0;
                    })[0];
                    cb(null, { donor, receiver });
                });
            });
        } else {
            console.log('trying to pair with user');
            receiver = stat.receiver;
            userQueue.pair(newUser, receiver, (stat) => {
                receiver = stat.receiver;
                let donor = stat.Users.filter((user) => {
                    return user._id == newUser._id;
                })[0];

                receiver = receiver || stat.Users.filter((user) => {
                    return user.paymentInfo.receiveFrom.indexOf(donor.paymentInfo.payTo) >= 0;
                })[0];

                cb(null, { donor, receiver });
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

function testmatchWithManyUsers() {
    // @TODO bring in a fourth user to see if it pairs with admin this time around
}

// call the pairing method
testpairing(user_data.user1, (err, stat) => {
    console.log('test1 start test pairing confirmations of payments and queueing confirmed user');
    if(stat) {
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
                                }
                            });
                        }
                    });
                });
            }
        });
    }
});

// @TODO add user4 and see if he pairs with an admin instead
// @TODO inspect the state of the database to see if pairings are done correctly

// @TODO convert to a real life database
// @TODO Seed database with default data state Admin users, payment queues for the 2 different categories
