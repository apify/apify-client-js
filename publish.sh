#!/bin/bash

set -e

# Notes:
# - we need generate doc from build because JSDoc doesn't support ES6 (https://github.com/jsdoc3/jsdoc/issues/555)
# - develop branch gets published as beta package and master as the latest

RED='\033[0;31m'
NC='\033[0m' # No Color

PACKAGE_NAME=`node -pe "require('./package.json').name"`
PACKAGE_VERSION=`node -pe "require('./package.json').version"`
BRANCH=`git status | grep 'On branch' | cut -d ' ' -f 3`
BRANCH_UP_TO_DATE=`git status | grep 'nothing to commit' | tr -s \n ' '`;
GIT_TAG="v${PACKAGE_VERSION}"

# Credentials to upload doc to S3 configuration
DOC_DIR=${PWD}"/docs"
AWS_ACCESS_KEY=$(grep aws_access_key_id ~/.aws/credentials | awk '{split($0,a," "); print a[3]}')
AWS_SECRET_KEY=$(grep aws_secret_access_key ~/.aws/credentials | awk '{split($0,a," "); print a[3]}')
AWS_BUCKET="apify-client-js-doc"

if [ -z "$BRANCH_UP_TO_DATE" ]; then
    printf "${RED}You have uncommited changes!${NC}\n"
    exit 1
fi

echo "Generating documentation ..."
npm run build-doc

echo "Pushing to git ..."
git push

# Master gets published as LATEST if that version doesn't exists yet and retagged as LATEST otherwise.
if [ $BRANCH = "master" ]; then
    if [ -z `npm view apify-client versions | grep $PACKAGE_VERSION` ]; then
        echo "Publishing version ${PACKAGE_VERSION} with tag \"latest\" ..."
        RUNNING_FROM_SCRIPT=1 npm publish --tag latest
    else
        echo "Tagging version ${PACKAGE_VERSION} with tag \"latest\" ..."
        RUNNING_FROM_SCRIPT=1 dist-tag add ${PACKAGE_VERSION} latest
    fi

# Develop branch gets published as BETA and we don't allow to override tag of existing version.
elif [ $BRANCH = "develop" ]; then
    echo "Publishing version ${PACKAGE_VERSION} with tag \"beta\" ..."
    RUNNING_FROM_SCRIPT=1 npm publish --tag beta

# For other branch throw an error.
else
    printf "${RED}You can publish from develop and master branches only!${NC}\n"
    exit 1
fi

echo "Generating documentation ..."
npm run build-doc

echo "Pushing to git ..."
git push

echo "Publishing version ${PACKAGE_VERSION} with tag \"${NPM_TAG}\" ..."
RUNNING_FROM_SCRIPT=1 npm publish --tag $NPM_TAG

echo "Tagging git with ${GIT_TAG} ..."
git tag ${GIT_TAG}
git push origin ${GIT_TAG}
echo "Git tag: ${GIT_TAG} created."

echo "Uploading doc to s3 ..."
AWS_ACCESS_KEY=${AWS_ACCESS_KEY} AWS_SECRET_KEY=${AWS_SECRET_KEY} AWS_BUCKET=${AWS_BUCKET} AWS_BUCKET_FOLDER=${GIT_TAG} node ./node_modules/deploy-web-to-s3/bin/deploy-web-to-s3.js ${DOC_DIR}

echo "Done."
