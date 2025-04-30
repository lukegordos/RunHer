#!/bin/bash

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd RunHerDatabase
npm install
cd ..

# Build the frontend
echo "Building frontend..."
npm run build

# Copy backend files to functions
echo "Setting up serverless functions..."
mkdir -p netlify/functions
cp -r RunHerDatabase/routes netlify/functions/
cp -r RunHerDatabase/models netlify/functions/
cp -r RunHerDatabase/middleware netlify/functions/
