#!/bin/bash

HERE=$(dirname $0)

pushd "${HERE}/.."
yarn
yarn next build
yarn next export

pushd out
git init
cp ../.git/config .git/config
git branch -m gh-pages
git add .
git config user.email "noreply@indiaultimate.org"
git config user.name "India Ultimate GitHub Bot"
git commit -m "New website build"
git push --force origin gh-pages:gh-pages
popd

popd
