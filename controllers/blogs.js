const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const logger = require('../utils/logger')

blogsRouter.get('/', (request, response) => {
    Blog.find({})
      .then(blogs => response.json(blogs))
})

blogsRouter.post('/', (request, response, next) => {
    const blog = new Blog(request.body)

    blog.save()
      .then(result => response.json(result))
      .catch(err => next(err))
})

blogsRouter.delete('/:id', (request, response, next) => {
    Blog.findByIdAndRemove(request.params.id)
      .then(() => response.status(204).end())
      .catch(err => next(err))
})

module.exports = blogsRouter