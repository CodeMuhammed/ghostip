//collections
//user
//transaction
//queue


const Users = [
   //At least an admin user must exist in the database
    {
        _id: 12345,
        userInfo: {
            firstname: 'Muhammed',
            lastname: 'Ali',
            email: 'codemuhammed@gmail.com',
            phone: '08101639251',
            role: 'admin',
            password: '12345#hashed'
        },
        accountInfo: {
            accountName: 'Muhammed Ali',
            accountNumber: '0116230622',
            bankName: 'Guarantee Trust Bank'
        },
        paymentInfo: {
            payTo: null,
            recieveFrom: [],
            ticketNum: '000001',
            defective: true
        }
    },
    //At least an admin user must exist in the database
    {
        _id: 23456,
        userInfo: {
            firstname: 'Eyiyere',
            lastname: 'Peter',
            email: 'Eyiyere@gmail.com',
            phone: '08101639251',
            role: 'admin',
            password: '12345#hashed'
        },
        accountInfo: {
            accountName: 'Muhammed Ali',
            accountNumber: '4962141121',
            bankName: 'Ecobank plc'
        },
        paymentInfo: {
            payTo: null,
            recieveFrom: [],
            ticketNum: '000002',
            defective: false
        }
    }
];

const Queues = [
    {
        role: 'admin',
        ticketCursor: 1, // default value starts from zero
        ticketSize: 2
    }
];

const Transactions = [
    
];


/**
 * transaction = {
    expiryDate,
    amount,
    proof: 'image',
    donorId,
    recieverId,
    confirmations: []
}
 */

module.exports = {
    Users,
    Queues,
    Transactions
};