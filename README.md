# RunHer Web App

## Setup Instructions

### Prerequisites
- Node.js installed
- Git installed
- Access to MongoDB Atlas (ask repository owner for credentials)

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/lukegordos/RunHer.git
cd RunHer
```

2. Install dependencies:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd RunHerDatabase
npm install
cd ..
```

3. Create `.env` file:
- In the `RunHerDatabase` folder, create a file named `.env`
- Add the following content (ask repository owner for the actual values):
```
PORT=5000
MONGODB_URI=mongodb+srv://lukegordos30:Basketball3008@cluster.2r7xs.mongodb.net/runher_db
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
```

4. Whitelist your IP in MongoDB Atlas:
- Go to [MongoDB Atlas](https://cloud.mongodb.com)
- Log in with provided credentials
- Click on the cluster
- Click "Network Access"
- Click "Add IP Address"
- Click "Add Current IP Address"

5. Run the application:
```bash
npm run dev:all
```

The app should now be running at:
- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## Features
- User Registration
- User Authentication
- [Add other features here]

## Troubleshooting
If you get a MongoDB connection error:
1. Make sure your IP is whitelisted in MongoDB Atlas
2. Check that your `.env` file has the correct MongoDB URI
3. Ensure you've installed all dependencies with `npm install`
