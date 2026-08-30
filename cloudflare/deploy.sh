#!/bin/bash
set -e

echo "Deploying H5 Casino Cloudflare Workers..."

echo "Creating D1 database if not exists..."
wrangler d1 create zyg-h5game-db

echo "Running migrations..."
wrangler d1 execute zyg-h5game-db --file=cloudflare/migrations/001_initial.sql
wrangler d1 execute zyg-h5game-db --file=cloudflare/migrations/seed.sql

echo "Deploying to Cloudflare Workers..."
wrangler deploy

echo "Deployment complete!"