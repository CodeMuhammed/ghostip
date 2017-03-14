/**
 * @class
 * this class takes in a couple of configuration objects and creates a queue
 * exposes a set of API methods for ease of use
 */
const async = require('async');

class PaymentQueue {
    constructor(role, database) {
        this.database = database;
        this.role = role;
    }

    //this method pair a user to someone they are to pay 
    //when they just signs up
    //the receiver id is optional in cases where we are trying
    //to pair a user with a defective receiver
    pair(donor, receiver, cb) {
        if(receiver) {
            this.createTransaction(donor, receiver, (stat) => {
                return cb(this.database);
            });
        } else {
            this.pairAtCursor(donor, (receiver) => {
                return this.pair(donor, receiver, cb);
            });
        }
    }

    //this gets the receiver at the cursor point and pair him with a donor
    pairAtCursor(donor, cb) {
       //query for receiver at cursor
       //then call pair method.
       const queue = this.database.Queues.filter((queue) => {
            return queue.role === this.role;
       })[0];

       const ticketNum = this.leftPad(queue.ticketCursor);

       const receiver = this.database.Users.filter((user) => {
           return user.userInfo.role === this.role
                  && user.paymentInfo.ticketNum === ticketNum;
       })[0];

       //update the cursor position then call the callback
       let cursor = parseInt(ticketNum);
       this.isEndOfQueue((status) => {
           if(status && this.role === 'admin') {
              cursor = 1;
              this.updateCursor(cursor, () => {
                  return cb(receiver);
              });
           } else {
               this.isCursorFilled((stat) => {
                   if(stat) {
                       cursor += 1;
                       this.updateCursor(cursor, () => {
                          return cb(receiver);
                       });
                   } else {
                       return cb(receiver);
                   }
               });
           }
       });
    }

    //this method updates the cursor
    updateCursor(cursor, cb) {
        this.database.Queues = this.database.Queues.map((queue) => {
            if(queue.role === this.role) {
                queue.ticketCursor = cursor;
            }
            return queue;
        });

        return cb();
    }

    createTransaction(donor, receiver, cb) {
        this.database.Users.push(donor); // simulates that the user is already in the db
        let transaction = {
            _id: 123456 + donor._id, //@TODO generate random ids
            expiryDate: Date.now() + (1000 * 3600),
            amount: 10000,
            proof: 'payment_image',
            donorId: donor._id,
            receiverId: receiver._id,
            confirmations: []
        }

        // update their references in the donor and receiver objects
        donor.paymentInfo.payTo = transaction._id;
        receiver.paymentInfo.receiveFrom.push(transaction._id);

        this.updateUsers([donor, receiver], () => {
            this.updateTransaction(transaction, (stat) => {
                cb(stat);
            });
        });
    }

    //this method updates the transactions
    updateTransaction(transaction, cb) {
        this.database.Transactions.push(transaction);
        return cb('transaction created successfully');
    }

    //this method confirms transactions and if the confirmations are complete,
    // returns the id of the donor to be added to the queue
    confirmTransaction(userId, transactionId, cb) {
        // Check to see that the user is actually involve with this transaction
        const transaction = this.database.Transactions.filter((trans) => {
            return trans._id === transactionId
                   && (trans.donorId === userId || trans.receiverId === userId)
        })[0];

        if(transaction) {
            if (!transaction.confirmations.indexOf(userId) >= 0) {
                transaction.confirmations.push(userId)
            }

            //update the transaction to the database
            this.database.Transactions = this.database.Transactions.map((trans) => {
                if(trans._id == transaction._id) {
                    return transaction;
                }
                return trans;
            });

            let toQueue = transaction.confirmations.length >= 2 ? 
                        transaction.donorId : 
                        undefined;

            return cb(null, {
                msg: 'Transaction confirmed',
                data: this.database,
                toQueue
            });
        }
        return cb({ msg:'donation could not be confirmed' }, null);
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

    //this method updates a user to the database
    updateUser(user, cb) {
        return cb(null, `${user._id} user updated`);
    }

    //
    isEndOfQueue(cb) {
        // check to see if the cursor is at the same point as the ticket size.
        const queue = this.database.Queues.filter((queue) => {
            return queue.role === this.role;
        })[0];

        //
        if(!queue) {
            return cb(true);
        }
        return cb(queue.ticketCursor >= queue.ticketSize -1);
    }

    //
    isCursorFilled(cb) {
        //check to see if the receiver at the cursor has been paired fully
        const queue = this.database.Queues.filter((queue) => {
            return queue.role === this.role;
        })[0];
        
        if(queue) {
            const ticketNum = this.leftPad(queue.ticketCursor);
            const receiver = this.database.Users.filter((user) => {
                    return user.userInfo.role === this.role
                        && user.paymentInfo.ticketNum === ticketNum;
            })[0];

            //
            if(!receiver) {
                return cb(true);
            }
            return cb(receiver.paymentInfo.receiveFrom.length == 2);
        }
        return cb(true);
    }

    //this method get a receiverId that is defective (ie, still has a receiver slot that
    //needs to be filled but somehow the cursor has passed him)
    getDefective(cb) {
        const defective = this.database.Users.filter((user) => {
            return user.paymentInfo.defective 
                   && user.userInfo.role === this.role;
        })[0];

        cb(defective);
    }

    //This method checks to see if new user can be paired with anyone on this queue
    canPair(cb) {
        this.getDefective((receiver) => {
            if(receiver) {
                cb(null, { receiver });
            } else {
                if(this.role === 'admin') {
                    cb(null, {});
                } else {
                    //we need to carry out extra checks for normal users
                    this.isEndOfQueue((status) => {
                        if(!status) {
                            cb(null, {});
                        } else {
                            this.isCursorFilled((status) => {
                                if(!status) {
                                   cb(null, {});
                                } else {
                                    cb(true);
                                }
                            });
                        }
                    });
                }
            }
        });
    }

    //this method adds a user to the queue
    addDonorToQueue(donorId, cb) {
        this.createTicket((err, ticket) => {
            if(err) {
                return cb(err);
            }
            this.database.Users = this.database.Users.map((user) => {
                if(user._id == donorId) {
                    user.paymentInfo.ticketNum = ticket;
                }
                return user;
            });

            cb(null, this.database);
        });
    }

    //This method creates a new ticket
    createTicket(cb) {
        console.log('create ticket called');
        // increment the current ticketSize by 1
        let ticketSize;

        //Do a find and update query
        this.database.Queues = this.database.Queues.map((queue) => {
            if(queue.role == 'user') {
                queue.ticketSize += 1;
                ticketSize = queue.ticketSize;
            }
            return queue;
        });

        cb(null, this.leftPad(ticketSize));
    }

    //this method leftpad a number string with zeros
    leftPad(num, offset = 6) {
        num = parseInt(num);
        const loop = offset - (num+'').length;
        let result = num;
        for(let i=0; i<loop; i++) {
            result = '0' + result;
        }
        return result;
    }
}

module.exports = PaymentQueue;