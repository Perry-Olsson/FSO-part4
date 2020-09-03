// const listOfBlogs = [
//   { _id: '5a422a851b54a676234d17f7', title: 'React patterns', author: 'Michael Chan', url: 'https://reactpatterns.com/', likes: 7, __v: 0 },
//   { _id: '5a422aa71b54a676234d17f8', title: 'Go To Statement Considered Harmful', author: 'Edsger W. Dijkstra', url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html', likes: 5, __v: 0 },
//   { _id: '5a422b3a1b54a676234d17f9', title: 'Canonical string reduction', author: 'Edsger W. Dijkstra', url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html', likes: 12, __v: 0 },
//   { _id: '5a422b891b54a676234d17fa', title: 'First class tests', author: 'Robert C. Martin', url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll', likes: 10, __v: 0 },
//   { _id: '5a422ba71b54a676234d17fb', title: 'TDD harms architecture', author: 'Robert C. Martin', url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html', likes: 0, __v: 0 },
//   { _id: '5a422bc61b54a676234d17fc', title: 'Type wars', author: 'Robert C. Martin', url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html', likes: 2, __v: 0 }
// ]

const getTopAuthor = (blogs, metric='blogs') => {
  if (!blogs.length)
    return 'No Blogs'
  const blogTracker = {}
  let topAuthor = ''
  let max = 0
  blogs.forEach(blog => {
    if (!blogTracker[blog.author])
      blogTracker[blog.author] = blog[metric] || 1
    else
      blogTracker[blog.author] += blog[metric] || 1
    if (blogTracker[blog.author] > max) {
      topAuthor = blog.author
      max = blogTracker[blog.author]
    }
  })
  const returnObject = {
    'author': topAuthor
  }
  returnObject[metric] = max
  return returnObject
}

const dummy = () => {
  return 1
}

const totalLikes = blogs => {
  const reducer = (sum, blog) => sum + blog.likes
  return blogs.reduce(reducer, 0)
}

const favoriteBlog = blogs => {
  let indexOfFavoriteBlog= 0
  let mostLikes = 0
  blogs.forEach((blog, index) => {
    if (blog.likes > mostLikes) {
      indexOfFavoriteBlog = index
      mostLikes = blog.likes
    }
  })
  return {
    title: blogs[indexOfFavoriteBlog].title,
    author: blogs[indexOfFavoriteBlog].author,
    likes: mostLikes
  }
}

const mostBlogs = blogs => {
  return getTopAuthor(blogs)
}

const mostLikes = blogs => {
  return getTopAuthor(blogs, 'likes')
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}