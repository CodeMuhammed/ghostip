const async = require('async');

/**
 * @class
 * this class takes in a couple of configuration objects and creates a queue
 * exposes a set of API methods for ease of use
 */
class PaymentQueue {
    constructor(role, database) {
        this.User = database.model('User');
        this.Stat = database.model('Stat');
        this.Transaction = database.model('Transaction');
        this.role = role;
    }

    //this method pair a user to someone they are to pay 
    //when they just signs up
    //the receiver id is optional in cases where we are trying
    //to pair a user with a defective receiver
    pair(donor, receiver, cb) {
       let transaction = {
            expiryDate: Date.now() + (1000 * 3600),
            proof: 'payment_image',
            donorId: donor._id,
            receiverId: receiver._id,
            confirmations: []
        }

        this.createTransaction(transaction, (err, transactionId) => {
            // update their references in the donor and receiver objects 
            donor.paymentInfo.payTo = transactionId;
            receiver.paymentInfo.receiveFrom.push(transactionId);

            // check completed fill on user
            if(receiver.paymentInfo.receiveFrom.length >= 2 
                && receiver.userInfo.role == 'user') {
                    receiver.paymentInfo.defective = false;
            }

            this.updateUsers([donor, receiver], () => {
                this.recordStat('pair', (err, stat) => {
                    cb(null, { donor, receiver });
                });
            });
        });
    }

    //this method creates a transactions
    createTransaction(transaction, cb) {
        this.Transaction.insertOne(transaction, (err, stat) => {
            if(err) {
                throw new Error('Error in DB layer in createTransaction');
            } else {
                return cb(null, stat.ops[0]._id);
            }
        });
    }

    //this method takes an array of users and update them in sequence
    updateUsers(users, cb) {
        let seriesArr = [];
        const that = this;
        for(let i = 0; i < users.length; i++) {
            seriesArr.push((function() {
                return (next) => {
                    that.updateUser(users[i], next);
                }
            }(i)));
        }

        async.series(seriesArr, (error, result) => {
            if(result) {
                return cb();
            } else {
                throw new Error('Users failed to update');
            }
        });
    }

    //this method updates a user
    updateUser(user, cb) {
        this.User.update(
            { _id: user._id },
            user,
            (err, stat) => {
                if(err) {
                    throw new Error('Error in DB layer in updateUser');
                } else {
                    return cb(null, `${user._id} user updated`);
                }
            }
        );
    }

    //this method confirms transactions and if the confirmations are complete,
    // returns the id of the donor to be added to the queue
    confirmTransaction(userId, transactionId, cb) {
        this.Transaction.findAndModify(
            {  
                _id: transactionId
            },
            { /* sort */ },
            { 
                $addToSet: {
                    confirmations: [userId]
                }
            },
            { new: true },
            (err, stat) => {
                if(err) {
                    throw new Error('Error in DB layer in confirmTransaction');
                } else {
                    if(stat.value) {
                        let toQueue = stat.value.confirmations.length >= 2 ? 
                                      stat.value.donorId : 
                                      undefined;

                        return cb(null, {
                            msg: 'Transaction confirmed',
                            toQueue
                        });
                    } else {
                        return cb({ msg:'donation could not be confirmed' }, null);
                    }
                }
            }
        );
    }

    //this method get a receiverId that is defective (ie, still has a receiver slot that
    //needs to be filled but somehow the cursor has passed him)
    getDefective(packageId, cb) {
        this.queryForDefectiveUser(packageId, (err, query) => {
            this.User.find(query).toArray((err, results) => {
                if(err) {
                    throw new Error('Error in DB layer in getDefective');
                } else {
                    if(results[0]) {
                        cb(null, results[0]);
                    } else {
                        cb(true);
                    }
                }
            });
        });
        
    }

    //this method adds a user to the queue
    addDonorToQueue(donorId, cb) {
        this.User.update(
            { _id: donorId },
            {
                $set: {
                    'paymentInfo.defective': true
                }
            },
            (err, stat) => {
                if(err) {
                    throw new Error('Error in DB layer in addDonorToQueue');
                } else {
                    cb(null, true);
                }
            }
        );
    }

    //this method returns the serial number of the admin to be 
    //paired with based on the number of admin pairs recorded
    queryForDefectiveUser(packageId, cb) {
        let query = {
            'paymentInfo.defective': true,
            'userInfo.role': this.role,
            'paymentInfo.package': packageId,
        };

        if(this.role == 'admin') {
            this.Stat.findOne({}, (err, result) => {
                if(err) {
                    throw new Error('Error in DB layer in getDefective');
                } else {
                    let serial = (result.pairedWithAdmin % result.adminSize) + 1;
                    query['paymentInfo.serialNum'] = parseInt(serial);
                    cb(null, query);
                }
            });
        } else {
            cb(null, query);
        }
    }

    //this method updates the stats and record metrics
    recordStat(action, cb) {
        let updateQuery = {}; 
        if(action == 'pair') {
            let key = this.role == 'admin'? 'pairedWithAdmin' : 'pairedWithUser';
            updateQuery = {
               $inc: { 
                   [key]: 1
                }
            }

            this.Stat.updateOne({ }, updateQuery, (err, stat) => {
                if(err) {
                    throw new Error('Error in DB layer in getDefective');
                } else {
                    cb(null, true);
                }
            });
        } else {
            cb(null, true);
        }
    }
}

module.exports = PaymentQueue;