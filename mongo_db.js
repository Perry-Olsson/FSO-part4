const mongoose = require('mongoose');
const config = require('./utils/config');
const logger = require('./utils/logger');

const args = process.argv.length

if (args !== 6 && args !== 2) {
    throw new Error('missing arguments')
} 
const mongoUrl = config.MONGODB_URI

mongoose.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true})

const blogSchema = mongoose.Schema({
    title: String,
    author: String,
    url: String,
    likes: Number
})

const Blog = mongoose.model('Blog', blogSchema)

const blog = new Blog({
    title: process.argv[2],
    author: process.argv[3],
    url: process.argv[4],
    likes: process.argv[5]
})

args === 6 ? blog
  .save()
  .then(result => {
      logger.info('saved: ', result)
      mongoose.connection.close();
  })
  :
  Blog.find({}).then(result => {
      logger.info(result)
      mongoose.connection.close();
  })


