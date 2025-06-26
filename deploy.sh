#!/bin/bash

echo "🚀 ClipsForge Pro - Deploy Script"
echo "=================================="

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "✅ Build completed!"
echo "📁 Files in dist/:"
ls -la dist/

echo "🌐 Ready for deployment!" 