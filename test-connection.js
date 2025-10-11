// Test script to check backend connectivity
// Run this in your backend directory to test if the server is working

import axios from 'axios';

const testBackendConnection = async () => {
  const baseURL = 'http://192.168.1.26:5000';
  
  console.log('Testing backend connection...');
  console.log('Base URL:', baseURL);
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server connectivity...');
    const healthResponse = await axios.get(`${baseURL}/api/users/getAllusers`, {
      timeout: 5000
    });
    console.log('✅ Server is running and accessible');
    console.log('Response status:', healthResponse.status);
    
    // Test 2: Test login endpoint specifically
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await axios.post(`${baseURL}/api/users/login`, {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    console.log('✅ Login endpoint is accessible');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server is not running or not accessible');
      console.log('Make sure your backend server is running on port 5000');
      console.log('Run: npm start or node server.js in your backend directory');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ Network error - cannot reach the server');
      console.log('Check if the IP address 192.168.1.26 is correct');
      console.log('Try using localhost:5000 instead');
    } else if (error.response?.status === 404) {
      console.log('❌ 404 Error - Endpoint not found');
      console.log('The server is running but the /api/users/login route is not available');
      console.log('Check your server routes configuration');
    } else if (error.response?.status === 401) {
      console.log('✅ Login endpoint is working (401 is expected for wrong credentials)');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
};

// Run the test
testBackendConnection();








