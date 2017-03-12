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
        recieveFrom: [],
        ticketNUm: '',
        defective: false
    }
};

//@TODO pair this user up in a saga of methods
userQueue.getDefective((reciever) => {
    if(reciever) {
        userQueue.pair(newUser, reciever, (stat) => {
            console.log(stat);
        });
    } else {
        userQueue.isEndOfQueue((status) => {
            if(!status) {
                userQueue.pair(newUser, undefined, (stat) => {
                    console.log(stat);
                });
            } else {
                userQueue.isCursorFilled((status) => {
                    if(!status) {
                        userQueue.pair(newUser, undefined, (stat) => {
                            console.log(stat);
                        });
                    } else {
                        checkAdminQueue();
                    }
                });
            }
        });
    } 
});

function checkAdminQueue() {
    adminQueue.getDefective((reciever) => {
        if(reciever) {
            adminQueue.pair(newUser, reciever, (stat) => {
                console.log(stat);
            });
        } else {
                adminQueue.pair(newUser, undefined, (stat) => {
                console.log(stat);
            });
        }
    });
}

//@TODO show that user has paid his peer
//@TODO show that peer has recieved the payment and the action that follows
//when a user is added to the queue for the first time, the queue object is added
