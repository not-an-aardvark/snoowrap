#!/bin/bash

set -e

REPO=`git config remote.origin.url`
rm -rf doc/ || true
git clone $REPO --branch gh-pages --single-branch --depth 1 doc
scripts/build_docs.sh

cd doc/
git add -A
git commit -m "Docs for v$(npm info .. version)"

git push origin gh-pages
