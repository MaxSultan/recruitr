const AuthFetcherHTTP = require('./auth-fetcher-http');

async function testHttpAuth() {
  try {
    console.log('Testing HTTP Auth Fetcher...');
    const authFetcher = new AuthFetcherHTTP('854866132');
    const result = await authFetcher.call();
    console.log('Success!', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHttpAuth();
