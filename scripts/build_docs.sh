#!/bin/bash
set -e

if [[ -n "$TRAVIS_TAG" ]]; then
  FULL_VERSION=$TRAVIS_TAG
else
  FULL_VERSION="v$(npm info . version)"
fi

MAJOR_VERSION=$(echo $FULL_VERSION | grep -Eo '^v[0-9]+')

# example FULL_VERSION: 'v1.2.3'
# example MAJOR_VERSION: 'v1'

mkdir -p doc
npm run compile

# List all the files explicitly rather than globbing to ensure that the classes appear in the right order in the docs
node_modules/.bin/jsdoc -c jsdoc.conf.json dist/snoowrap.js dist/request_handler.js dist/objects/RedditContent.js dist/objects/ReplyableContent.js dist/objects/VoteableContent.js dist/objects/Comment.js dist/objects/RedditUser.js dist/objects/Submission.js dist/objects/LiveThread.js dist/objects/PrivateMessage.js dist/objects/Subreddit.js dist/objects/MultiReddit.js dist/objects/WikiPage.js dist/objects/Listing.js
# Create the bundle files, e.g. 'snoowrap-v1.2.3.js' and 'snoowrap-v1.2.3.min.js'
node_modules/.bin/browserify dist/snoowrap.js -o "doc/snoowrap-$FULL_VERSION.js"
# Exclude snoowrap's class names from mangling.
# This is necessary due to a bug in Safari with ES6 classes and variable scoping.
# https://gist.github.com/not-an-aardvark/657578882bb1e68ef3458193228d9fe7
node_modules/.bin/uglifyjs "doc/snoowrap-$FULL_VERSION.js" -o "doc/snoowrap-$FULL_VERSION.min.js" -m --screw-ie8 -c warnings=false -r snoowrap,RedditContent,ReplyableContent,VoteableContent,Comment,RedditUser,Submission,LiveThread,PrivateMessage,Subreddit,MultiReddit,WikiPage,Listing,More

# Create aliases with only the major version number, e.g. 'snoowrap-v1.js' and 'snoowrap-v1.min.js'
cp "doc/snoowrap-$FULL_VERSION.js" "doc/snoowrap-$MAJOR_VERSION.js"
cp "doc/snoowrap-$FULL_VERSION.min.js" "doc/snoowrap-$MAJOR_VERSION.min.js"
