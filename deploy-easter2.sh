#!/bin/bash
# Deploy Easter 2 liturgy PDF to index and Easter pages
# Scheduled to run at 10 PM AEST on April 7, 2026

set -e

INBOX="$HOME/Library/Mobile Documents/com~apple~CloudDocs/Bush Chapel Liturgies"
REPO="/Users/timbarrow/thebushchapel"
LOG="$REPO/process-liturgy.log"
PDF_NAME="Easter 2.pdf"

echo "$(date): Starting Easter 2 deployment" >> "$LOG"

# Force iCloud to download if it's a placeholder
for icloud_file in "$INBOX"/.*.icloud; do
    [ -f "$icloud_file" ] || continue
    brctl download "$icloud_file" 2>/dev/null || true
    echo "$(date): Requested iCloud download for $(basename "$icloud_file")" >> "$LOG"
done

# Wait for iCloud downloads (up to 60 seconds)
WAIT_COUNT=0
while [ $WAIT_COUNT -lt 12 ]; do
    REMAINING=$(ls "$INBOX"/.*.icloud 2>/dev/null | wc -l | tr -d ' ')
    if [ "$REMAINING" = "0" ]; then
        break
    fi
    sleep 5
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

# Verify the PDF exists
if [ ! -f "$INBOX/$PDF_NAME" ]; then
    echo "$(date): ERROR - $PDF_NAME not found in iCloud inbox" >> "$LOG"
    exit 1
fi

cd "$REPO"

# Pull latest
git stash --quiet 2>/dev/null || true
git pull --rebase origin main >> "$LOG" 2>&1
git stash pop --quiet 2>/dev/null || true

# Copy the PDF
cp "$INBOX/$PDF_NAME" "$REPO/$PDF_NAME"
echo "$(date): Copied $PDF_NAME to repo" >> "$LOG"

# Update index.html - change Easter Sunday.pdf to Easter 2.pdf
sed -i '' 's|Easter%20Sunday\.pdf|Easter%202.pdf|g' index.html

# Show the download button, restore loading text, and enable PDF viewer on Easter page
sed -i '' 's|style="display:none"||' seasons/easter.html
sed -i '' 's|PDF coming|Loading liturgy...|' seasons/easter.html
sed -i '' 's|<!-- pdf-viewer.js added by deploy script when PDF is ready -->|<script type="module" src="../pdf-viewer.js"></script>|' seasons/easter.html

# Stage, commit, and push
git add "$PDF_NAME" index.html seasons/easter.html
git commit -m "Update liturgy to Easter 2 for index and Easter pages"
git push >> "$LOG" 2>&1

# Clean up
rm -f "$INBOX/$PDF_NAME"
echo "$(date): Easter 2 deployment complete" >> "$LOG"
