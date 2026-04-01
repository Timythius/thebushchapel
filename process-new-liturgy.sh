#!/bin/bash
# Watches iCloud Drive "Bush Chapel Liturgies" folder for new PDFs,
# copies them to the repo, commits and pushes.
# Run by launchd when files appear in the iCloud folder.

set -e

INBOX="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Bush Chapel Liturgies"
REPO="/Users/timbarrow/thebushchapel"
LOG="$REPO/process-liturgy.log"

echo "$(date): Checking for new PDFs in $INBOX" >> "$LOG"

# Force iCloud to download any placeholder (.icloud) files
for icloud_file in "$INBOX"/.*.icloud; do
    [ -f "$icloud_file" ] || continue
    # brctl download triggers iCloud to fetch the actual file
    brctl download "$icloud_file" 2>/dev/null || true
    echo "$(date): Requested iCloud download for $(basename "$icloud_file")" >> "$LOG"
done

# Wait for iCloud downloads to complete (up to 60 seconds)
WAIT_COUNT=0
while [ $WAIT_COUNT -lt 12 ]; do
    # Check if any .icloud placeholders remain
    REMAINING=$(ls "$INBOX"/.*.icloud 2>/dev/null | wc -l | tr -d ' ')
    if [ "$REMAINING" = "0" ]; then
        break
    fi
    echo "$(date): Waiting for $REMAINING iCloud download(s)..." >> "$LOG"
    sleep 5
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

# Find the newest PDF in the inbox
NEWEST_PDF=$(ls -t "$INBOX"/*.pdf 2>/dev/null | head -n 1)

if [ -z "$NEWEST_PDF" ]; then
    echo "$(date): No PDFs found in inbox" >> "$LOG"
    exit 0
fi

FILENAME=$(basename "$NEWEST_PDF")
echo "$(date): Found new PDF: $FILENAME" >> "$LOG"

cd "$REPO"

# Stash any local changes so pull can proceed cleanly
git stash --quiet 2>/dev/null || true

# Pull latest changes first (rebase to avoid merge conflicts with CI commits)
git pull --rebase origin main >> "$LOG" 2>&1

# Restore any stashed changes
git stash pop --quiet 2>/dev/null || true

# Copy the newest PDF to the repo
cp "$NEWEST_PDF" "$REPO/$FILENAME"
git add "$REPO/$FILENAME"

# Copy any other PDFs too (in case multiple were dropped)
for pdf in "$INBOX"/*.pdf; do
    [ -f "$pdf" ] || continue
    [ "$pdf" = "$NEWEST_PDF" ] && continue
    cp "$pdf" "$REPO/$(basename "$pdf")"
    git add "$REPO/$(basename "$pdf")"
done

# Stage and commit
git commit -m "Add new liturgy PDF: $FILENAME" >> "$LOG" 2>&1
git push >> "$LOG" 2>&1

# Clean up inbox after successful push
rm -f "$INBOX"/*.pdf
echo "$(date): Successfully pushed $FILENAME and cleaned inbox" >> "$LOG"
