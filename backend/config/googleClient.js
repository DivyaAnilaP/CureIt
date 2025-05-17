const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // make sure this is loaded early

const TOKEN_PATH = path.join(__dirname, 'token.json');

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.REDIRECT_URI) {
  console.error("Missing environment variables for Google OAuth (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)");
  process.exit(1); // Exit if they're not set
}

const oauth2client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

function loadTokens() {
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const token = fs.readFileSync(TOKEN_PATH);
      oauth2client.setCredentials(JSON.parse(token));
    } catch (e) {
      console.error("Error reading token:", e);
    }
  } else {
    console.log("Token file not found.");
  }
}

async function refreshAccessToken() {
  try {
    const tokens = await oauth2client.getAccessToken();
    if (!tokens.token) {
      console.error("No access token returned.");
      return;
    }
    console.log("Access token refreshed.");
  } catch (error) {
    console.error('Error refreshing access token:', error.message);
  }
}

// Save tokens when new ones are received
oauth2client.on('tokens', (tokens) => {
  if (tokens.refresh_token || tokens.access_token) {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('Tokens saved to file');
  }
});

loadTokens();

module.exports = { oauth2client, loadTokens, refreshAccessToken };
