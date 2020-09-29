const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

let loggedInUser = null

const loginTestUser = async () => {
  const response = await api
    .post('/api/login')
    .send({ username: 'testUsername', password: 'testPassword' })

  return response.body
}

beforeAll(async () => {
  await api
    .post('/api/users')
    .send({ username: 'testUsername', name: 'testName', password: 'testPassword' })

  loggedInUser = await loginTestUser()
})


beforeEach(async () => {
  await Blog.deleteMany({})
  for (let blog of helper.initialBlogs) {
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(blog)
  }
  const blogs = await helper.blogsInDb()
  for (let blog of blogs) {
    await api
      .put(`/api/blogs/${blog.id}/comments`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ comment: 'test comment', user: loggedInUser.username })
  }
})

describe('retrieval of blogs from database', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const titles = response.body.map(blog => blog.title)

    expect(titles).toContain(
      'Type wars'
    )
  })

  test('id property is converted from _id => id', async () => {
    const blogs = await helper.blogsInDb()
    const blogToTest = blogs[0]

    expect(blogToTest.id).toBeDefined()
  })
})

describe('viewing a specific blog', () => {
  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]
    blogToView.user = blogToView.user.toString()

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body).toEqual(blogToView)
  })
})


describe('addition of a new blog', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'America\'s best beaches',
      author: 'Guy Beach',
      url: 'www.you\'reabeach.com',
      likes: '1023'
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain(
      'America\'s best beaches'
    )
  })

  test('blog without content is not added', async () => {
    const newBlog = {
      author: 'Big James'
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('blog cannot be added without proper authorization', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const newBlog = {
      title: 'rgb is cool',
      author: 'rgb rachel',
      url: 'www.rgb.com',
      likes: 100
    }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', '')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const errorMessage = response.body.error

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(blogsAtStart.length)
    expect(errorMessage).toBe('invalid token')
  })

  test('likes value defaults to 0', async () => {
    const blogToAdd = new Blog({
      title: 'checking default values',
      author: 'Mr. Default',
      url: 'www.defaultlikesis0.com'
    })

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(blogToAdd)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const idOfAddedBlog = response.body.id

    const addedBlog = await api.get(`/api/blogs/${idOfAddedBlog}`)

    expect(addedBlog.body.likes).toBe(0)
  })
})

describe('updating blogs', () => {
  test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const update = { title: 'I have been updated' }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(update)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).toContain('I have been updated')
  })
})

describe('deletion of a blog', () => {
  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const title = blogsAtEnd.map(blog => blog.title)

    expect(title).not.toContain(blogToDelete.title)
  })
})

describe('blog comments', () => {
  test('a comment can be added', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogId = blogsAtStart[0].id
    const comment = { comment: 'add comment test', user: loggedInUser.username }
    const response = await api
      .put(`/api/blogs/${blogId}/comments`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(comment)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const blog = (blogsAtEnd.find(blog => blog.id === blogId))
    expect(blog.comments).toMatchObject(response.body.comments)
  })

  test('a comment can be deleted', async () => {
    const blogs = await helper.blogsInDb()
    const blog = blogs[0]
    const comment = blog.comments[0]

    await api
      .delete(`/api/blogs/${blog.id}/comments/${comment.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(204)

    const updatedBlog = await helper.getBlog(blog.id)
    expect(updatedBlog).not.toMatchObject(comment)
  })
})

afterAll(() => {
  mongoose.connection.close()
})

