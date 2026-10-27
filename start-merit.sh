#!/bin/bash
# Start Merit on Linux: installs what it needs the first time, then builds, starts and opens it.
# Run it from a terminal (./start-merit.sh); stop Merit with Ctrl+C.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Merit needs Node.js, which isn't installed on this computer."
  echo "Install it from https://nodejs.org or your package manager, then run this again."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Getting Merit ready the first time - this takes a minute or two..."
  npm install || { echo "Merit could not be installed. Check your internet connection, then try again."; exit 1; }
fi

echo "Starting Merit..."
MERIT_OPEN_BROWSER=1 npm start
