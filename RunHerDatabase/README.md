# RunHer Database Server

Backend server for the RunHer web application. This server handles user authentication, data storage, and API endpoints.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env.example` to a new file named `.env`
   - Get the MongoDB connection details from your team lead
   - Update the `.env` file with the provided credentials

3. Start the server:
```bash
npm start
```

The server will run on http://localhost:5000 by default.

## MongoDB Access

The database is hosted on MongoDB Atlas. To access the database:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Sign in with the credentials provided by your team lead
3. Select the `runher_db` database

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/users/all` - Get all users (for testing)
- `GET /api/users/debug` - Get database status

## Important Notes

- Never commit the `.env` file to version control
- The frontend expects the backend to run on port 5000
- Make sure MongoDB connection string has the correct access permissions
