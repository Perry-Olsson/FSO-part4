const mongoose = require('mongoose');
const config = require('./utils/config');
const logger = require('./utils/logger');
const Blog = require('./models/blog');
const User = require('./models/user');
const helper = require('./tests/test_helper');
const bcrypt = require('bcrypt');

const args = process.argv.length;

if (args > 3) throw new Error('accepts only one argument');

const mongoUrl = config.MONGODB_URI;

mongoose
  .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('connected'))
  .catch(() => console.log('not connected'));
const main = async () => {
  if (process.argv[3] === 'reset') {
    await Blog.deleteMany({});
    await User.deleteMany({});

    for (let user of helper.initialUsers) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      delete user.password;
      let newUser = new User({
        ...user,
        passwordHash,
        likes: new Map(),
      });

      await newUser.save();
    }

    const loginTestUser = async () => {
      const response = await api
        .post('/api/login')
        .send({ username: 'testUsername', password: 'testPassword' });

      return response.body;
    };

    await api.post('/api/users').send({
      username: 'testUsername',
      name: 'testName',
      password: 'testPassword',
    });

    let userToken = await loginTestUser();
    for (let blog of helper.initialBlogs) {
      await api
        .post('/api/blogs')
        .set('Authorization', `bearer ${userToken.token}`)
        .send(blog);
    }
  }
};
main()
  .then(() => {
    mongoose.connection.close();
  })
  .catch(e => console.log(e.message));
