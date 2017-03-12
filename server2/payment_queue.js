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
    //the reciever id is optional in cases where we are trying
    //to pair a user with a defected reciever
    pair(donor, reciever, cb) {
        if(reciever) {
            this.createTransaction(donor, reciever, (stat) => {
                console.log(JSON.stringify(this.database, undefined, 2));
                return cb(stat);
            });
        } else {
            this.pairAtCursor(donor, (reciever) => {
                return this.pair(donor, reciever, cb);
            });
        }
    }

    //this gets the reciever at the cursor point and pair him with a donor
    pairAtCursor(donor, cb) {
       //query for reciever at cursor
       //then call pair method.
       const queue = this.database.Queues.filter((queue) => {
            return queue.role === this.role;
       })[0];

       const ticketNum = this.leftPad(queue.ticketCursor);

       const reciever = this.database.Users.filter((user) => {
           return user.userInfo.role === this.role
                  && user.paymentInfo.ticketNum === ticketNum;
       })[0];
       
       //update the cursor position then call the callback
       let cursor = parseInt(ticketNum);
       this.isEndOfQueue((status) => {
           if(status && this.role === 'admin') {
              cursor = 0;
              this.updateCursor(cursor, () => {
                  return cb(reciever);
              });
           } else {
               this.isCursorFilled((stat) => {
                   if(stat) {
                       cursor += 1;
                       this.updateCursor(cursor, () => {
                          return cb(reciever);
                       });
                   }
               });
           }
       });
    }

    createTransaction(donor, reciever, cb) {
        // @TODO create a transaction
        // update their references in the donor and receiver objects
        this.database.Users.push(donor); // simulates that the user is already in the db
        let transaction = {
            _id: 123456,
            expiryDate: Date.now() + (1000 * 3600),
            amount: 10000,
            proof: 'image',
            donorId: donor._id,
            recieverId: reciever._id,
            confirmations: []
        }

        // update their references in the donor and receiver objects
        donor.paymentInfo.payTo = reciever._id;
        reciever.paymentInfo.recieveFrom.push(donor._id);

        this.updateUsers([donor, reciever], () => {
            this.updateTransaction(transaction, (stat) => {
                cb(stat);
            });
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

    //this method updates a user to the database
    updateUser(user, cb) {
        return cb(null, `${user._id} user updated`);
    }

    //this method updates the transactions
    updateTransaction(transaction, cb) {
        this.database.Transactions.push(transaction);
        return cb('transaction created successfully');
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
        //check to see if the reciever at the cursor has been paired fully
        const queue = this.database.Queues.filter((queue) => {
            return queue.role === this.role;
        })[0];
        
        if(queue) {
            const ticketNum = this.leftPad(queue.ticketCursor);
            const reciever = this.database.Users.filter((user) => {
            return user.userInfo.role === this.role
                    && user.paymentInfo.ticketNum === ticketNum;
            })[0];

            cb(reciever.paymentInfo.recieveFrom.length == 2);
        } else {
            cb(true);
        }
    }

    //this method get a recieverId that is defective (ie, still has a reciever slot that
    //needs to be filled but somehow the cursor has passed him)
    getDefective(cb) {
        const defective = this.database.Users.filter((user) => {
            return user.paymentInfo.defective 
                   && user.userInfo.role === this.role;
        })[0];

        cb(defective);
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