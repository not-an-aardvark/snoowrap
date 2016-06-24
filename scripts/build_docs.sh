#!/bin/bash
set -e
rm -rf doc/ || exit 0
npm run docs
cd doc/
git init
git config user.name "not-an-aardvark"
git config user.email "not-an-aardvark@users.noreply.github.com"
git add .
git commit -qm "Docs for commit $TRAVIS_COMMIT"
git push -fq "https://${GH_TOKEN}@${GH_REF}" master:gh-pages > /dev/null 2>&1
