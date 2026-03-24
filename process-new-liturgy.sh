#!/bin/bash
# Watches ~/LiturgyInbox for new PDFs, moves them to the repo, commits and pushes.
# Run by launchd when files appear in ~/LiturgyInbox.

set -e

INBOX="/Users/timbarrow/LiturgyInbox"
REPO="/Users/timbarrow/thebushchapel"
LOG="$REPO/process-liturgy.log"

echo "$(date): Checking for new PDFs in $INBOX" >> "$LOG"

# Find the newest PDF in the inbox
NEWEST_PDF=$(ls -t "$INBOX"/*.pdf 2>/dev/null | head -n 1)

if [ -z "$NEWEST_PDF" ]; then
    echo "$(date): No PDFs found in inbox" >> "$LOG"
    exit 0
fi

FILENAME=$(basename "$NEWEST_PDF")
echo "$(date): Found new PDF: $FILENAME" >> "$LOG"

cd "$REPO"

# Pull latest changes first
git pull origin main >> "$LOG" 2>&1

# Move the PDF to the repo
mv "$NEWEST_PDF" "$REPO/$FILENAME"

# Move any other PDFs too (in case multiple were dropped)
for pdf in "$INBOX"/*.pdf; do
    [ -f "$pdf" ] || continue
    mv "$pdf" "$REPO/$(basename "$pdf")"
    git add "$REPO/$(basename "$pdf")"
done

# Stage and commit
git add "$REPO/$FILENAME"
git commit -m "Add new liturgy PDF: $FILENAME" >> "$LOG" 2>&1
git push >> "$LOG" 2>&1

echo "$(date): Successfully pushed $FILENAME" >> "$LOG"
