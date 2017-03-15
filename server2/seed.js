const async = require('async');
const bCrypt = require('bcrypt-nodejs');
const user_data = require('./user_data');

let normalUsers = Object.keys(user_data).map((key) => {
    user_data[key].userInfo.password = bCrypt.hashSync('12345' , null , null);
    return user_data[key];
});

// 5k, 10k, 20k, 50k, 100k, 150k, 200k, 250k , 500k, 1m
const packages = [
    { amount:    '5000', status: 'active' },
    { amount:   '10000', status: 'active' },
    { amount:   '20000', status: 'active' },
    { amount:   '50000', status: 'active' },
    { amount:  '100000', status: 'active' },
    { amount:  '200000', status: 'active' },
    { amount:  '250000', status: 'active' },
    { amount:  '500000', status: 'pending' },
    { amount: '1000000', status: 'pending' },
];

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
            serialNum: 1,
            package: 'all',
            defective: true
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
            serialNum: 2,
            package: 'all',
            defective: true
        }
    }
]);

const stats = [
    {
        transactionVolume: 0,
        pairedWithAdmin: 0,
        pairedWithUser: 0,
        adminSize: 2
    }
];

module.exports = function(database) {
    const User = database.model('User');
    const Stat = database.model('Stat');
    const Package = database.model('Package');

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

    const seedPackages = (cb) => {
        // check that no admin users exists before seeding
        Package.find({ }).toArray((err, results) => {
            if(err) {
                return cb(err);
            } else {
                if(!results[0]) {
                    Package.insertMany(packages, (err, stat) => {
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

    const seedStat = (cb) => {
        // check that no admin users exists before seeding
        Stat.find({ }).toArray((err, results) => {
            if(err) {
                return cb(err);
            } else {
                if(!results[0]) {
                    Stat.insertMany(stats, (err, stat) => {
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
        let seriesArr = [];
        seriesArr.push((function() {
            return (next) => {
                seedUsers(next)
            }
        }()))
         seriesArr.push((function() {
            return (next) => {
                seedStat(next)
            }
        }()))
         seriesArr.push((function() {
            return (next) => {
                seedPackages(next);
            }
        }()))

        async.series(seriesArr, (error, result) => {
            if(result) {
                return cb(null, 'seeded database');
            } else {
                throw new Error('Users failed to update');
            }
        });
    }
    
    // public facing API
    return { run };
}