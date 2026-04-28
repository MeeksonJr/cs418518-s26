const request = require('supertest');
const app = require('../index');

describe('API Endpoints', () => {
    it('GET /api/health should return 200 and server running status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'Server is running');
    });

    it('POST /api/notify should fail with 400 if email, status, or recordId is missing', async () => {
        const res = await request(app)
            .post('/api/notify')
            .send({
                message: 'Good job!'
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'recordId, email, and status are required');
    });

    it('POST /api/notify should return 500 if database update fails (invalid record ID)', async () => {
        // We supply an invalid UUID to test that the database update fails gracefully
        const res = await request(app)
            .post('/api/notify')
            .send({
                recordId: 'invalid-id-for-testing',
                email: 'teststudent@example.com',
                status: 'Approved',
                message: 'Looks great!'
            });
        
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Failed to update record in database');
    }, 10000);
});
