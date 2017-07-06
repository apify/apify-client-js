#!/bin/bash
# TODO
# export AWS_ACCESS_KEY=<access key>
# export AWS_SECRET_KEY=<secret key>

set -e

RED='\033[0;31m'
NC='\033[0m' # No Color

PACKAGE_VERSION=`node -pe "require('./package.json').version"`
BRANCH=`git status | grep 'On branch' | cut -d ' ' -f 3`
BRANCH_UP_TO_DATE=`git status | grep 'nothing to commit' | tr -s \n ' '`;
DOC_DIR=${PWD}"/.docs"

if [ -z "$BRANCH_UP_TO_DATE" ]; then
    printf "${RED}You have uncommited changes!${NC}\n"
    exit 1
fi

if [ $BRANCH = "master" ]; then
    NPM_TAG='latest'
    GIT_TAG="v${PACKAGE_VERSION}"
else
    NPM_TAG='beta'
    GIT_TAG="v${PACKAGE_VERSION}-beta"
fi

echo "Generating documentation ..."
node_modules/jsdoc/jsdoc.js -c jsdoc-conf.json -d ${DOC_DIR}

echo "Pushing to git ..."
git push

echo "Publishing version ${PACKAGE_VERSION} with tag \"${NPM_TAG}\" ..."
RUNNING_FROM_SCRIPT=1 npm publish --tag $NPM_TAG

echo "Tagging git with ${GIT_TAG} ..."
git tag ${GIT_TAG}
git push origin ${GIT_TAG}

echo "Uploading doumentation to s3 ..."
export AWS_BUCKET="apify-client-js-doc"
export AWS_BUCKET_FOLDER=GIT_TAG
node_modules/deploy-web-to-s3/bin/deploy-web-to-s3.js ${DOC_DIR}
rm -rf ${DOC_DIR}


echo "Done."
