const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const keys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log('=====================');
console.log('');

// Log character by character to avoid truncation
console.log('Public Key (copy this):');
console.log(keys.publicKey);
console.log('');
console.log('Private Key (copy this):');
console.log(keys.privateKey);
console.log('');
console.log('Length check: Public=' + keys.publicKey.length + ', Private=' + keys.privateKey.length);

// Update .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the VAPID keys
envContent = envContent.replace(
    /NEXT_PUBLIC_VAPID_PUBLIC_KEY="[^"]*"/,
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY="' + keys.publicKey + '"'
);
envContent = envContent.replace(
    /VAPID_PRIVATE_KEY="[^"]*"/,
    'VAPID_PRIVATE_KEY="' + keys.privateKey + '"'
);

fs.writeFileSync(envPath, envContent);
console.log('');
console.log('.env file updated successfully!');
