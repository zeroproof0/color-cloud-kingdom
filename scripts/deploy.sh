#!/usr/bin/env bash
# Build and publish dist/ to the gh-pages branch (GitHub Pages).
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE=$(git remote get-url origin)

npm run build

# CNAME tells GitHub Pages which custom domain serves the site
if [ -f CNAME ]; then
  cp CNAME dist/CNAME
fi

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(git -C .. rev-parse --short HEAD)"
git push -f "$REMOTE" gh-pages
cd ..
rm -rf dist/.git

echo "Deployed."
