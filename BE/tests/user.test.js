const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app.js');

let server;

describe('User Auth', () => {
  beforeAll(async () => {
    server = app.listen(4000);
    await mongoose.connect('mongodb://localhost:27017/test1test', { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
    server.close();
  });

  it('should register a new user', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'testpass', email: 'test@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
  });

  it('should login the user', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe('testuser');
  });
}); 