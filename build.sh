#!/bin/bash
# Railway Build Script

echo "Building backend..."
npm run build:backend

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete! Ready for Railway deployment."
