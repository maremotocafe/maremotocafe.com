#!/bin/bash
# Simple script to upload files to the repository.

set -ex

# Making sure it's running in the correct directory
cd "$(dirname "${BASH_SOURCE[0]}")"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
COMMIT_MSG="${1:-Update on $TIMESTAMP}"

echo ">> Uploading source files..."
git add . || echo "Skipping add"
git commit -m "$COMMIT_MSG" || echo "Skipping commit"
git push origin master
