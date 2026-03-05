const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Generate a random secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...');
  
  let envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecret()}

# Google OAuth (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Database (SQLite for dev - no need to set, Prisma uses file:./dev.db)
# For production with PostgreSQL/Supabase, uncomment and set:
# DATABASE_URL="postgresql://user:password@localhost:5432/school_scheduler"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('⚠️  Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET if you want to use Google OAuth');
} else {
  console.log('⚠️  .env file already exists. Skipping...');
}







