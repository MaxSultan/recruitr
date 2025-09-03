const axios = require('axios');
const cheerio = require('cheerio');

class AuthFetcherHTTP {
  constructor(tournamentId) {
    this.tournamentId = tournamentId;
  }

  async call() {
    try {
      console.log('Fetching authentication via HTTP...');
      
      const url = `https://www.trackwrestling.com/predefinedtournaments/VerifyPassword.jsp?tournamentId=${this.tournamentId}`;
      console.log('Requesting URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'curl/8.7.1',
          'Accept': '*/*'
        },
        timeout: 30000,
        maxRedirects: 5,
        httpsAgent: new (require('https')).Agent({
          rejectUnauthorized: false
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers contain cookies:', !!response.headers['set-cookie']);
      
      // Parse HTML to find session ID
      const $ = cheerio.load(response.data);
      
      // Look for twSessionId in hidden input field
      let twSessionId = $('#twSessionId').attr('value');
      
      if (!twSessionId) {
        // Fallback: search in page content
        const sessionMatch = response.data.match(/twSessionId["\s]*[=:]["\s]*([^&\s"'<>]+)/);
        if (sessionMatch && sessionMatch[1]) {
          twSessionId = sessionMatch[1];
        }
      }
      
      if (!twSessionId) {
        console.log('HTML content preview:', response.data.substring(0, 1000));
        throw new Error('Failed to extract twSessionId from HTML content');
      }
      
      console.log('Found session ID:', twSessionId);
      
      // Extract cookies from response headers
      const cookies = response.headers['set-cookie'] || [];
      const cookieString = cookies.map(cookie => {
        // Extract just the name=value part before any semicolon
        return cookie.split(';')[0];
      }).join('; ');
      
      console.log('Extracted cookies:', cookieString);
      
      console.log('Auth Received via HTTP');
      return {
        twSessionId: twSessionId,
        cookie: cookieString
      };
      
    } catch (error) {
      console.error('Error in HTTP AuthFetcher:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw new Error(`HTTP Authentication failed: ${error.message}`);
    }
  }
}

module.exports = AuthFetcherHTTP;
