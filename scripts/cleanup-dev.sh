#!/bin/bash

# Cleanup script for development processes
# Kills orphaned Bun, Vite, and API processes

echo "🧹 Cleaning up development processes..."

# Kill Bun processes related to development
echo "Killing Bun development processes..."
pkill -f "bun.*vite" 2>/dev/null || true
pkill -f "bun.*api\.ts" 2>/dev/null || true
pkill -f "bun run.*watch" 2>/dev/null || true
pkill -f "concurrently" 2>/dev/null || true

# Kill any processes on development ports
echo "Checking common development ports..."
for port in 3000 3001 3002 3003 5173 5432 5433 5434; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
  fi
done

# Clean up any remaining orphaned processes
echo "Cleaning up orphaned Node.js processes..."
ps aux | grep -E "(vite|concurrently)" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

echo "✅ Cleanup complete!"
echo ""
echo "Now you can safely run: bun dev"