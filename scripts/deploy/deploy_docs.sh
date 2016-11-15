#!/bin/bash

# Adapted from https://gist.github.com/domenic/ec8b0fc8ab45f39403dd

set -e

REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}

cd scripts/deploy
# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}
openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in ./deploy_key.enc -out ./deploy_key -d
chmod 600 deploy_key
eval `ssh-agent -s`
ssh-add ./deploy_key
cd ../..

rm -rf doc/ || true
git clone $REPO --branch gh-pages --single-branch --depth 1 doc
scripts/build_docs.sh

cd doc/
git config user.name "Travis CI"
git config user.email $DEPLOY_COMMIT_AUTHOR_EMAIL

git add -A
git commit -m "Docs for v$(npm info .. version)"

git push $SSH_REPO $TARGET_BRANCH
