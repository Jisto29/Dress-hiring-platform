// API Configuration
// Change this to your network IP when accessing from other devices
export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8080'
  : `http://${window.location.hostname}:8080`;

export default API_BASE_URL;

