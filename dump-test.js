const paymentQueue = require('./server2/payment_queue');
const mock_data = require('./server2/mock_db');

const adminQueue = new paymentQueue('admin', mock_data);
const userQueue = new paymentQueue('user', mock_data);

const newUser = {
    _id: 45890,
    userInfo: {
        firstname: 'Merron',
        lastname: 'jones',
        email: 'merron@gmail.com',
        phone: '08101639251',
        role: 'user',
        password: '12345#hashed'
    },
    accountInfo: {
        accountName: 'merron jones',
        accountNumber: '0116230622',
        bankName: 'Guarantee Trust Bank'
    },
    paymentInfo: {
        payTo: null,
        receiveFrom: [],
        ticketNUm: '',
        defective: false
    }
};

//Pair this user up in a cascading mode first try with normal user then admin
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

                testConfirmations(donor, receiver);
            });
        });
    } else {
        receiver = stat.receiver;
        userQueue.pair(newUser, receiver, (stat) => {
            let donor = stat.Users.filter((user) => {
                return user._id == newUser._id;
            })[0];

            receiver = receiver || stat.Users.filter((user) => {
                return user.paymentInfo.receiveFrom.indexOf(donor.paymentInfo.payTo) >= 0;
            })[0];

            testConfirmations(donor, receiver);
        });
    }
});

function testConfirmations(donor, receiver) {
    adminQueue.confirmTransaction(donor._id, donor.paymentInfo.payTo, (err, status) => {
        if(status.toQueue) {
            console.log('receiver just confirmed a transaction');
        } else {
            console.log('donor just confirmed');
        }
       adminQueue.confirmTransaction(receiver._id, receiver.paymentInfo.receiveFrom[0], (err, status) => {
           if(status.toQueue) {
               console.log('receiver just confirmed a transaction');
           } else {
               console.log('donor just confirmed');
           }
       });
    });
}

function testAddingUserToQueue(donorId) {
    //@TODO add the donor to payment queue after confirmation has been made
}

//@TODO when a user is added to queue, test the pairing all over again with yet
//another new user
//@TODO write a module that does this on app startup
//Seed database with default data state
//Admin users
//payment queues for the 2 different categories
