import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function basicAPITest() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/chat';
  
  console.log('🔧 Basic API Test');
  console.log('=' .repeat(30));
  console.log('Testing if chat API responds at all...\n');

  try {
    console.log('Sending request to:', apiUrl);
    
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'user',
            content: 'Hello, are you working?'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000
      }
    );

    console.log('✅ Response received');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Response data preview:', String(response.data).substring(0, 200));
    
    return true;

  } catch (error: any) {
    console.error('❌ API Test failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

basicAPITest();