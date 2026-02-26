/**
 * Demo Script
 * Demonstrates the application functionality using the mock database
 */

// Ensure we are using the mock DB before anything else
process.env.USE_MOCK_DB = 'true';
process.env.NODE_ENV = 'development';

const request = require('supertest');
const app = require('../src/app');
const { seed } = require('./seed');
const { query } = require('../src/database/connection');

async function runDemo() {
  try {
    console.log('--- Shopify Attribution App Demo ---');

    // 1. Seed the database
    console.log('\n[1/4] Seeding mock database...');
    await seed();
    console.log('Database seeded with sample shop and orders.');

    // 2. Test Health Check
    console.log('\n[2/4] Checking application health...');
    const healthResponse = await request(app).get('/health');
    console.log('Health Status:', healthResponse.body);

    // 3. Mock a session and test API (bypassing auth for demo)
    // To make this work easily in the demo without session management,
    // we'll hit the root and health endpoints which are public.
    console.log('\n[3/4] Fetching public app info...');
    const infoResponse = await request(app).get('/');
    console.log('App Info:', infoResponse.body);

    // 4. Demonstrate Analytics Logic (direct repository call)
    console.log('\n[4/4] Demonstrating Analytics Logic...');
    const OrderRepository = require('../src/repositories/OrderRepository');

    // In the mock, shopId 1 is our seeded store
    const shopId = 1;
    const startDate = '2024-01-01';
    const endDate = '2024-01-31';

    console.log(`Fetching revenue by source for shop ${shopId} between ${startDate} and ${endDate}...`);
    const revenueBySource = await OrderRepository.getRevenueBySource(shopId, startDate, endDate);
    console.log('Revenue by Source:', revenueBySource);

    const topProducts = await OrderRepository.getTopProducts(shopId, startDate, endDate);
    console.log('Top Products:', topProducts);

    console.log('\n--- Demo Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error('\n--- Demo Failed ---');
    console.error(error);
    process.exit(1);
  }
}

runDemo();
