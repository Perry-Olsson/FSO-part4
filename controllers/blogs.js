const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  blog
    ? response.json(blog)
    : response.status(404).json({ message: 'blog not found' });
});

blogsRouter.post('/', async (request, response) => {
  const body = request.body;
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const user = await User.findById(decodedToken.id);
  const formattedUser = {
    username: user.username,
    name: user.name,
    id: user._id,
  };

  const blog = new Blog({ ...body, user: user.id });
  const savedBlog = await blog.save();
  savedBlog._doc.user = formattedUser;

  user.blogs = user.blogs.concat(savedBlog.id);
  await user.save();

  response.json(savedBlog);
});
blogsRouter.put('/:id', async (request, response) => {
  const blog = { ...request.body };
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, {
    runValidators: true,
    context: 'query',
    new: true,
  });
  updatedBlog
    ? response.json(updatedBlog)
    : response
        .status(404)
        .json({ type: 'not found', error: 'The blog was not found' });
});

blogsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!request.token || !decodedToken.id)
    return response
      .status(401)
      .json({ error: 'Must be logged in to delete posts' });
  const user = await User.findById(decodedToken.id);
  const blog = await Blog.findById(request.params.id);

  if (user.id.toString() !== blog.user.toString())
    return response
      .status(401)
      .json({ error: "Cannot remove blogs that weren't posted by you" });
  user.blogs = user.blogs.filter(b => blog.id !== b.toString());
  await User.findOneAndUpdate({ username: user.username }, user);
  await Blog.findByIdAndRemove(request.params.id);
  return response.status(204).end();
});

blogsRouter.put('/:id/comments', async (request, response) => {
  const comment = request.body;
  const commentedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    { $push: { comments: comment } },
    { new: true }
  );
  commentedBlog
    ? response.json(commentedBlog)
    : response
        .status(404)
        .json({ type: 'not fount', error: 'The blog was not found' });
});

blogsRouter.delete(
  '/:blogId/comments/:commentId',
  async (request, response) => {
    const decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!request.token || !decodedToken.id)
      return response
        .status(401)
        .json({ error: 'Must be loggin in to delete posts' });
    const user = await User.findById(decodedToken.id);
    const blog = await Blog.findById(request.params.blogId);
    const comment = await blog.comments.id(request.params.commentId);

    if (user.username !== comment.user)
      return response
        .status(401)
        .json({ error: "Cannot remove comments that weren't posted by you" });

    comment.remove();
    await blog.save();
    return response.status(204).end();
  }
);

module.exports = blogsRouter;
