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
            receiveFrom: [],
            ticketNum: '000001',
            defective: false
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
            receiveFrom: [],
            ticketNum: '000002',
            defective: false
        }
    }
];

const Queues = [
    {
        role: 'admin',
        ticketCursor: 1, // default value starts from 1
        ticketSize: 2
    },
    {
        role: 'user',
        ticketCursor: 1,
        ticketSize: 0
    }
];

const Transactions = [
    
];

module.exports = {
    Users,
    Queues,
    Transactions
};