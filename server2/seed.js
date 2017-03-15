const bCrypt = require('bcrypt-nodejs');
const user_data = require('./user_data');

let normalUsers = Object.keys(user_data).map((key) => {
    user_data[key].userInfo.password = bCrypt.hashSync('12345' , null , null);
    return user_data[key];
});

const users = normalUsers.concat([
    {
        userInfo: {
            firstname: 'Muhammed',
            lastname: 'Ali',
            email: 'codemuhammed@gmail.com',
            phone: '08101639251',
            role: 'admin',
            password: bCrypt.hashSync('12345' , null , null)
        },
        accountInfo: {
            accountName: 'Muhammed Ali',
            accountNumber: '0116230622',
            bankName: 'Guarantee Trust Bank'
        },
        paymentInfo: {
            payTo: null,
            receiveFrom: [],
            ticketNum: '000001',
            defective: false
        }
    },
    {
        userInfo: {
            firstname: 'Eyiyere',
            lastname: 'Peter',
            email: 'Eyiyere@gmail.com',
            phone: '08101639251',
            role: 'admin',
            password: bCrypt.hashSync('12345' , null , null)
        },
        accountInfo: {
            accountName: 'Muhammed Ali',
            accountNumber: '4962141121',
            bankName: 'Ecobank plc'
        },
        paymentInfo: {
            payTo: null,
            receiveFrom: [],
            ticketNum: '000002',
            defective: false
        }
    }
]);

const queues = [
    {
        role: 'admin',
        ticketCursor: 1,
        ticketSize: 2
    },
    {
        role: 'user',
        ticketCursor: 1,
        ticketSize: 0
    }
];

module.exports = function(database) {
    const User = database.model('User');
    const Queue = database.model('Queue');

    const seedUsers = (cb) => {
        // check that no admin users exists before seeding
        User.find({ }).toArray((err, results) => {
            if(err) {
                return cb(err);
            } else {
                if(!results[0]) {
                    User.insertMany(users, (err, stat) => {
                        if(err) {
                            return cb(err);
                        } else {
                            cb(null, true);
                        }
                    });
                } else {
                    cb(null, true);
                }
            }
        });
    }

    const seedQueues = (cb) => {
        // check that no admin users exists before seeding
        Queue.find({ }).toArray((err, results) => {
            if(err) {
                return cb(err);
            } else {
                if(!results[0]) {
                    Queue.insertMany(queues, (err, stat) => {
                        if(err) {
                            return cb(err);
                        } else {
                            cb(null, true);
                        }
                    });
                } else {
                    cb(null, true);
                }
            }
        });
    }

    const run = (cb) => {
        console.log('seeding database');
        seedUsers((err, stat) => {
            if(stat) {
                seedQueues((err, stat) => {
                    if(stat) {
                        return cb(null, 'seeded database');
                    }
                    return cb(err);
                });
            } else {
                return cb(err);
            }
        });
    }
    
    // public facing API
    return { run };
}