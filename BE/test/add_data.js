import mongoose from 'mongoose';
import faker from 'faker';

// Import your models
import User from '../models/User.js';
import Post from '../models/Post.js';
import Group from '../models/Group.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/test1';

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Clean existing data
  await User.deleteMany({});
  await Post.deleteMany({});
  await Group.deleteMany({});

  // 1. Create Users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = new User({
      username: faker.internet.userName() + faker.datatype.number(),
      password: 'Password1', // Will be hashed by pre-save hook
      email: faker.internet.email(),
      role: i === 0 ? 'admin' : 'user',
    });
    await user.save(); // Save individually to trigger pre-save hook
    users.push(user); // Add the saved user to the array
  }

  // 2. Create Groups
  const groups = [];
  for (let i = 0; i < 3; i++) {
    const admin = users[faker.datatype.number({ min: 0, max: users.length - 1 })];
    groups.push(new Group({
      name: faker.company.companyName() + faker.datatype.number(),
      description: faker.company.catchPhrase(),
      admin: admin._id,
      members: users.slice(0, faker.datatype.number({ min: 2, max: users.length })).map(u => u._id),
    }));
  }
  await Group.insertMany(groups);

  // 3. Create Posts
  const posts = [];
  for (let i = 0; i < 20; i++) {
    const author = users[faker.datatype.number({ min: 0, max: users.length - 1 })];
    const group = groups[faker.datatype.number({ min: 0, max: groups.length - 1 })];
    const type = faker.random.arrayElement(['text', 'media']);
    const files = type === 'media'
      ? [{
          url: faker.image.imageUrl(),
          fileType: faker.random.arrayElement(['image', 'video']),
        }]
      : [];
    posts.push(new Post({
      author: author._id,
      group: group._id,
      content: faker.lorem.paragraph(),
      type,
      files,
      likes: [author._id],
      comments: [{
        user: author._id,
        text: faker.lorem.sentence(),
        createdAt: new Date(),
      }],
    }));
  }
  await Post.insertMany(posts);

  // 4. Update Groups with posts and members
  for (const group of groups) {
    const groupPosts = posts.filter(p => p.group.toString() === group._id.toString());
    group.posts = groupPosts.map(p => p._id);
    await group.save();
  }

  // 5. Update Users with groups, friends, etc.
  for (const user of users) {
    user.groups = groups.filter(g => g.members.includes(user._id)).map(g => g._id);
    user.friends = users
      .filter(u => u._id.toString() !== user._id.toString())
      .slice(0, faker.datatype.number({ min: 0, max: 3 }))
      .map(u => u._id);
    await user.save();
  }

  console.log('Fake data seeded!');
  mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  mongoose.disconnect();
});