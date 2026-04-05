const express      = require('express')
const morgan       = require('morgan')
const cookieParser = require('cookie-parser')
const errorHandler = require('./utils/errorHandler.utils')

const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const transactionRoutes = require('./routes/transaction.routes')
const dashboardRoutes = require('./routes/dashboard.routes')
const roleRequestRoutes = require('./routes/roleRequest.routes')

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.json({ success: true, message: 'Welcome to the API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/role-requests', roleRequestRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// global error handler — must be last
app.use(errorHandler)

module.exports = app