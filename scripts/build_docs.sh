#!/bin/bash
set -e
rm -rf doc/ || exit 0
git clone "https://$GH_REF" --branch gh-pages --single-branch doc
npm run docs
browserify dist/snoowrap.js -o "doc/snoowrap-$TRAVIS_TAG.js"
uglifyjs "doc/snoowrap-$TRAVIS_TAG.js" -o "doc/snoowrap-$TRAVIS_TAG.min.js" -m --screw-ie8
cd doc/
git config user.name "not-an-aardvark"
git config user.email "not-an-aardvark@users.noreply.github.com"
git add -A
git commit -qm "Docs for commit $TRAVIS_COMMIT"
git push -q "https://${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null 2>&1
