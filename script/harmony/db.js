var MongoClient = require('mongodb').MongoClient;
require('dotenv').config({path: '../.env'});

function connectDb(){
    return new Promise(async function (resolve, reject) {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect()
        console.log('Connected successfully to database.')
        const db = client.db(process.env.HARMONY_DB_NAME_HPAD)

        resolve(db);
    })
}

module.exports = connectDb;
