const mongoose = require('mongoose');
const superTest = require('supertest');
const helper = require('./test_helper');
const app = require('../app');
const api = superTest(app);

const bcrypt = require('bcrypt');
const User = require('../models/user');
const Blog = require('../models/blog');

describe('with initially one user in the database', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Blog.deleteMany({});

    const passwordHash = await bcrypt.hash('CherryPepsi', 10);
    const user = new User({
      username: 'root',
      name: 'superuser',
      likes: new Map(),
      passwordHash,
    });

    await user.save();
  });

  test('creation of a new user succeeds', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'pdog',
      name: 'pwinks',
      password: 'kitty',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('content-type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    const usernames = usersAtEnd.map(user => user.username);
    expect(usernames).toContain(newUser.username);
  });

  test('creation fails if username is already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'testing',
      password: 'passmetheword',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test("creation fails if password isn't long enough", async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'testUsername',
      name: 'testName',
      password: 'te',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toBe('invalid password');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

describe('with multiple users in the database', () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('blogAdderPass', 10);
    const blogAdder = new User({
      username: 'blogAdder',
      name: 'blogTheAdder',
      passwordHash,
    });
    const user = await blogAdder.save();
    const response = await api
      .post('/api/login')
      .send({ username: blogAdder.username, password: 'blogAdderPass' });
    const loggedUser = response.body;
    for (let blog of helper.initialBlogs) {
      const newBlog = new Blog({ ...blog, user: user._id });
      await newBlog.save();
    }
  });
  beforeEach(async () => {
    await User.deleteMany({});

    for (let user of helper.initialUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      const blogToLike = await Blog.findOne({ title: 'React patterns' });

      delete user.password;
      let newUser = new User({
        ...user,
        passwordHash,
        likes: new Map(),
      });

      newUser.likes.set(blogToLike._id.toString(), true);
      await newUser.save();
    }
  });

  test('users are returned from db in correct format', async () => {
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const users = response.body;

    expect(users).toHaveLength(helper.initialUsers.length);
    expect(users[0].id).toBeDefined();
    expect(users[0].passwordHash).not.toBeDefined();
    expect(users[0].blogs).toBeDefined();

    const likedBlog = await Blog.findOne({ title: 'React patterns' });
    expect(users[0].likes[likedBlog._id.toString()]).toBe('true');
  });
});

afterAll(async () => {
  mongoose.connection.close();
});
