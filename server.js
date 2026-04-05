const { connect } = require('mongoose');
const app = require('./src/app');
const connectDb = require('./src/config/db');

require('dotenv').config();

const PORT = process.env.PORT;

const start = async () => {
    try {
        await connectDb()
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (err) {
        console.error('Failed to start server:', err.message)
        process.exit(1)
    }
}


start()