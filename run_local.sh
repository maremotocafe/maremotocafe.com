#!/bin/zsh
# Runs the menu editor locally (Mac/Linux). On Windows use "Editar carta.cmd".

set -e

# Load nvm (Finder/.command files don't source .zshrc)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Making sure it's running in the correct directory
cd "$(dirname "${0}")"

if [ ! -d node_modules ]; then
    echo ">> First run: installing dependencies..."
    npm ci
fi

echo ">> Starting the editor. The browser will open at http://localhost:4321"
npm run dev -- --open
