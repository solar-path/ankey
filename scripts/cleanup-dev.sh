#!/bin/bash

# Cleanup script for development processes
# Kills orphaned Bun, Vite, and API processes

echo "🧹 Cleaning up development processes..."

# Kill all Bun development processes more comprehensively
echo "Killing Bun development processes..."
pkill -f "bun run dev" 2>/dev/null || true
pkill -f "bun.*vite" 2>/dev/null || true
pkill -f "bun.*api\.ts" 2>/dev/null || true
pkill -f "bun run.*watch" 2>/dev/null || true
pkill -f "bun vite.*port 3000" 2>/dev/null || true

# Kill Node.js processes related to development
echo "Killing Node.js development processes..."
pkill -f "concurrently.*bun vite" 2>/dev/null || true
pkill -f "node.*concurrently" 2>/dev/null || true
pkill -f "node.*vite.*port 3000" 2>/dev/null || true

# Kill any processes on development ports (expanded list)
echo "Checking development ports..."
for port in 3000 3001 3002 3003 5173 8025 8080; do
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$pids" ]; then
    echo "Killing processes on port $port (PIDs: $pids)"
    for pid in $pids; do
      kill -9 $pid 2>/dev/null || true
    done
  fi
done

# Clean up any remaining orphaned processes
echo "Cleaning up orphaned processes..."
ps aux | grep -E "(vite.*port 3000|api\.ts|concurrently.*bun)" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true

# Wait a moment for processes to terminate
echo "Waiting for processes to terminate..."
sleep 2

# Final verification
echo "Verifying ports are free..."
busy_ports=()
for port in 3000 3001; do
  if lsof -ti :$port >/dev/null 2>&1; then
    busy_ports+=($port)
  fi
done

if [ ${#busy_ports[@]} -eq 0 ]; then
  echo "✅ All development ports are free!"
else
  echo "⚠️  Warning: Ports still in use: ${busy_ports[*]}"
  echo "You may need to manually kill remaining processes"
fi

echo "✅ Cleanup complete!"
echo ""
echo "Now you can safely run: bun run dev"