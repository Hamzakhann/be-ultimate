const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/fintech_audit?replicaSet=rs0&readPreference=primary&directConnection=false';

console.log('Attempting to connect to MongoDB...');
mongoose.connect(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000,
  family: 4
})
.then(() => {
  console.log('✅ Connection successful!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
