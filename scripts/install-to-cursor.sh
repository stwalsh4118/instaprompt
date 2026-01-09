#!/bin/bash
# Build and install extension to Cursor without affecting dev environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "📦 Building extension for production..."

# Backup the current main entry
ORIGINAL_MAIN=$(node -p "require('./package.json').main")

# Temporarily update package.json to use dist/
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = './dist/extension.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Build with esbuild
pnpm run build

# Package the extension
echo "📦 Packaging extension..."
pnpm exec vsce package --no-dependencies

# Find the generated .vsix file
VSIX_FILE=$(ls -t *.vsix 2>/dev/null | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ No .vsix file found!"
    # Restore package.json before exiting
    node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = '$ORIGINAL_MAIN';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
    exit 1
fi

echo "📦 Installing $VSIX_FILE to Cursor..."

# Install to Cursor (cursor CLI)
if command -v cursor &> /dev/null; then
    cursor --install-extension "$VSIX_FILE"
    echo "✅ Extension installed to Cursor!"
elif command -v code &> /dev/null; then
    # Fallback to VS Code if cursor CLI not available
    code --install-extension "$VSIX_FILE"
    echo "✅ Extension installed to VS Code!"
else
    echo "⚠️  Neither 'cursor' nor 'code' CLI found. Please install manually:"
    echo "   $PROJECT_DIR/$VSIX_FILE"
fi

# Restore package.json to dev configuration
echo "🔧 Restoring dev configuration..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.main = '$ORIGINAL_MAIN';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Done! Dev environment unchanged (main: $ORIGINAL_MAIN)"

