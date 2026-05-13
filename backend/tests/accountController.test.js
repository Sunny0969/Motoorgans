const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Account = require('../models/Account');

beforeAll(async () => {
  // Connect to test DB or mock DB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/testdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Account API Tests', () => {
  let createdAccountId;

  test('Create Account - POST /api/accounts', async () => {
    const newAccount = {
      accountId: 'test1234',
      code: 'TST1234',
      accountType: 'Debtors, Buyers, Customers, Clients',
      accountTitle: 'Test Account API',
      urduTitle: '',
      ledgerNo: '',
      discountPercent: 0,
      creditLimit: 100,
      creditDays: 30,
      priceList: 'Whole Sale',
      office: 'Home',
      contactPerson: 'John Doe',
      phoneNo: '123456789',
      cellNo: '',
      address: '123 Test Street',
      area: '',
      city: '',
      email: 'test@example.com',
      openingBalance: 0,
      balanceDate: '29-Mar-22',
      balanceType: 'Receivable',
      isActive: true,
    };

    const response = await request(app).post('/api/accounts').send(newAccount);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('_id');
    expect(response.body.accountTitle).toBe(newAccount.accountTitle);

    createdAccountId = response.body._id;
  });

  test('Get Accounts - GET /api/accounts', async () => {
    const response = await request(app).get('/api/accounts');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  test('Get Account by ID - GET /api/accounts/:id', async () => {
    const response = await request(app).get(`/api/accounts/${createdAccountId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('_id', createdAccountId);
  });

  test('Update Account - PUT /api/accounts/:id', async () => {
    const updatedData = {
      accountTitle: 'Updated Account Title',
      creditLimit: 200,
    };
    const response = await request(app).put(`/api/accounts/${createdAccountId}`).send(updatedData);
    expect(response.status).toBe(200);
    expect(response.body.accountTitle).toBe(updatedData.accountTitle);
    expect(response.body.creditLimit).toBe(updatedData.creditLimit);
  });

  test('Delete Account - DELETE /api/accounts/:id', async () => {
    const response = await request(app).delete(`/api/accounts/${createdAccountId}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Account deleted');
  });

  test('Get Deleted Account - GET /api/accounts/:id should 404', async () => {
    const response = await request(app).get(`/api/accounts/${createdAccountId}`);
    expect(response.status).toBe(404);
  });
});
