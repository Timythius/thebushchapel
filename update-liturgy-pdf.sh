#!/bin/bash
# Scheduled script to update liturgy PDF from Lent 5 to Passion Sunday
# Scheduled to run at 10 PM AEDT on March 25, 2026

set -e

cd /Users/timbarrow/thebushchapel

# Copy the new PDF with a consistent naming convention
cp "Passion Sunday.pdf" "passion sunday liturgy.pdf"

# Update index.html - iframe src and download link
sed -i '' 's|lent%205%20liturgy\.pdf|passion%20sunday%20liturgy.pdf|g' index.html

# Update seasons/lent.html - iframe src and download link
sed -i '' 's|lent%205%20liturgy\.pdf|passion%20sunday%20liturgy.pdf|g' seasons/lent.html

# Git add, commit, and push
git add "passion sunday liturgy.pdf" index.html seasons/lent.html
git commit -m "Update liturgy PDF to Passion Sunday"
git push

# Clean up this script
rm -- "$0"
