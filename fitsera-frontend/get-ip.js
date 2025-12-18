// Quick script to get your local IP address for mobile testing
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  console.log('\n📱 Mobile AR Setup - Network Information\n');
  console.log('='.repeat(50));
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`\n✅ ${name}`);
        console.log(`   IP Address: ${iface.address}`);
        console.log(`   Use this URL on your phone: http://${iface.address}:5173`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Instructions:');
  console.log('1. Make sure your phone is on the SAME WiFi network');
  console.log('2. Start dev server: npm run dev');
  console.log('3. Open the URL above on your phone');
  console.log('4. Navigate to a product page');
  console.log('5. Click "Try On with AR"');
  console.log('\n💡 Tip: Use Chrome browser on your phone for best results!\n');
}

getLocalIP();

