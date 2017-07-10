#!/bin/bash

set -e

RED='\033[0;31m'
NC='\033[0m' # No Color

PACKAGE_VERSION=`node -pe "require('./package.json').version"`
BRANCH=`git status | grep 'On branch' | cut -d ' ' -f 3`
BRANCH_UP_TO_DATE=`git status | grep 'nothing to commit' | tr -s \n ' '`;

# Upload doc to S3 configuration
TEMP_DOC_DIR=${PWD}"/.docs"
AWS_ACCESS_KEY=$(grep aws_access_key_id ~/.aws/credentials | awk '{split($0,a," "); print a[3]}')
AWS_SECRET_KEY=$(grep aws_secret_access_key ~/.aws/credentials | awk '{split($0,a," "); print a[3]}')
AWS_BUCKET="apify-client-js-doc"

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
npm run-script build # we need generate doc from build because https://github.com/jsdoc3/jsdoc/issues/555
node_modules/jsdoc/jsdoc.js -c jsdoc-conf.json -d ${TEMP_DOC_DIR}

echo "Pushing to git ..."
git push

echo "Publishing version ${PACKAGE_VERSION} with tag \"${NPM_TAG}\" ..."
RUNNING_FROM_SCRIPT=1 npm publish --tag $NPM_TAG

echo "Tagging git with ${GIT_TAG} ..."
git tag ${GIT_TAG}
git push origin ${GIT_TAG}

echo "Git tag: ${GIT_TAG} created."

echo "Uploading doc to s3 ..."
AWS_ACCESS_KEY=${AWS_ACCESS_KEY} AWS_SECRET_KEY=${AWS_SECRET_KEY} AWS_BUCKET=${AWS_BUCKET} AWS_BUCKET_FOLDER=${GIT_TAG} node_modules/deploy-web-to-s3/bin/deploy-web-to-s3.js ${TEMP_DOC_DIR}
rm -rf ${TEMP_DOC_DIR}

echo "Done."
