#!/bin/bash

set -euxo pipefail

PUSH=${1:-}
date
python scripts/download-data.py
python scripts/parse-data.py
if [ "${PUSH}" = "push" ]; then
    git config user.email "noreply@indiaultimate.org"
    git config user.name "India Ultimate GitHub Bot"
    git add data/
    git add public/data/
    git commit -m "Auto update data for the website" || echo "Nothing to commit"
    git push origin main
fi
