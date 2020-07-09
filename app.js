const express = require('express')
const config = require('./utils/config')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const blogsRouter = require('./controllers/blogs')

logger.info('connecting to MongoDB...')

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => logger.info('connected to MongoDB'))
  .catch(err => logger.error('error connecting to MongoDB: ', error.message))

app.use(cors())
app.use(express.json())

app.use('/api/blogs', blogsRouter)

module.exports = app
