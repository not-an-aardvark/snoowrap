#!/bin/bash
set -e
rm -rf doc/ || true

GH_REF='github.com/not-an-aardvark/snoowrap.git'

git clone "https://$GH_REF" --branch gh-pages --single-branch --depth 1 doc
scripts/build_docs.sh

cd doc/
git config user.name "not-an-aardvark"
git config user.email "not-an-aardvark@users.noreply.github.com"
git add -A
git commit -qm "Docs for v$(npm info .. version)"

# Pipe the output to /dev/null to prevent GH_TOKEN from appearing in the logs in the event that something bad happens
# GH_TOKEN should be a GitHub OAuth token. For travis-ci, it's encrypted in .travis.yml.
git push -q "https://${GH_TOKEN}@$GH_REF" gh-pages > /dev/null 2>&1
