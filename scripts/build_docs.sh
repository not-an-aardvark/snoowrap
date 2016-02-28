#!/bin/bash
set -e
LATEST_COMMIT="$(git rev-parse head)"
rm -rf doc/ || exit 0
mkdir doc/
npm run docs
cd doc/
git init
git config user.name "not-an-aardvark"
git config user.email "not-an-aardvark@users.noreply.github.com"
git add .
git commit -m "Docs for commit $LATEST_COMMIT"
git push -fq "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
