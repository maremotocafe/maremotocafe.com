#!/bin/bash
# Simple script to upload files to the repository.

set -e

# Making sure it's running in the correct directory
cd "$(dirname "${BASH_SOURCE[0]}")"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
MSG="$1"

echo ">> Uploading source files..."
git add .
if [ -n "$MSG" ]; then
    git commit -m "$MSG"
else
    git commit -m "Update on $TIMESTAMP"
fi
git push origin master
