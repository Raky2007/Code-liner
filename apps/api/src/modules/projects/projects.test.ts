import request from 'supertest';
import app from '../../app';
import { connectDatabase, disconnectDatabase } from '../../config/db';

describe('Project and Auth Endpoints', () => {
  let authToken = '';
  let projectId = '';

  beforeAll(async () => {
    // Connects to in-memory db fallback
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('Authentication flow', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
      authToken = res.body.token;
    });

    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });
  });

  describe('Project CRUD flow', () => {
    it('should create a new project metadata model', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E-commerce Platform',
          description: 'A mock code-liner target project',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('E-commerce Platform');
      expect(res.body.status).toBe('UPLOADING');
      projectId = res.body._id;
    });

    it('should list projects of user', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].name).toBe('E-commerce Platform');
    });

    it('should fetch project details by ID', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('E-commerce Platform');
    });

    it('should poll project status', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UPLOADING');
    });
  });
});
