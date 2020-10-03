const usersRouter = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');

usersRouter.get('/likes/:id', async (request, response) => {
  const user = await User.findById(request.params.id);
  response.json({ likes: user.likes });
});

usersRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {
    author: 1,
    title: 1,
    url: 1,
    likes: 1,
  });
  response.json(users);
});

usersRouter.post('/like/:userId/:blogId', async (request, response) => {
  const blogId = request.params.blogId;
  const user = await User.findById(request.params.userId);
  if (user.likes.get(blogId))
    response
      .status(400)
      .json({ error: 'blog as been liked by this user already' });
  console.log(user.likes);
  user.likes.set(blogId, 'true');
  const userForResponse = await user.save();
  response.json(userForResponse);
});

usersRouter.post('/', async (request, response) => {
  const body = request.body;

  if (body.password.length < 3)
    return response.status(400).json({
      error: 'invalid password',
      message: 'password must be at least 3 characters',
    });

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  const user = new User({
    username: body.username,
    name: body.name,
    likes: new Map(),
    passwordHash,
  });

  const savedUser = await user.save();

  response.json(savedUser);
});

module.exports = usersRouter;
