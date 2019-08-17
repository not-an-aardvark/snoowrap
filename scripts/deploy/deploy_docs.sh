#!/bin/bash

set -e

REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}

rm -rf doc/ || true
git clone $REPO --branch gh-pages --single-branch --depth 1 doc
scripts/build_docs.sh

cd doc/
git add -A
git commit -m "Docs for v$(npm info .. version)"

git push $SSH_REPO $TARGET_BRANCH
