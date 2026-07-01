#!/bin/bash
# Test a single level solution
# Usage: test-level.sh LEVEL_NUMBER SOLUTION

LEVEL=$1
SOL=$2

# Wait for levels screen to be ready
agent-browser wait 500 >/dev/null 2>&1

# Verify we're on levels screen
ON_LEVELS=$(agent-browser snapshot -i 2>&1 | grep -c "انتخاب مرحله")
if [ "$ON_LEVELS" -eq 0 ]; then
  echo "Level $LEVEL: FAIL (not on levels screen)"
  exit 1
fi

# Find level button - match exact " N" pattern
SNAPSHOT=$(agent-browser snapshot -i 2>&1)
LEVEL_BTN=$(echo "$SNAPSHOT" | grep " $LEVEL\"" | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e/e/')

if [ -z "$LEVEL_BTN" ]; then
  echo "Level $LEVEL: FAIL (button not found)"
  exit 1
fi

agent-browser click "@$LEVEL_BTN" >/dev/null 2>&1
agent-browser wait 1000 >/dev/null 2>&1

# Apply solution
for ((j=0; j<${#SOL}; j++)); do
  C="${SOL:$j:1}"
  case "$C" in
    u|U) agent-browser press ArrowUp >/dev/null 2>&1 ;;
    d|D) agent-browser press ArrowDown >/dev/null 2>&1 ;;
    l|L) agent-browser press ArrowLeft >/dev/null 2>&1 ;;
    r|R) agent-browser press ArrowRight >/dev/null 2>&1 ;;
  esac
  sleep 0.07
done
agent-browser wait 800 >/dev/null 2>&1

# Check win
WIN=$(agent-browser snapshot -i 2>&1 | grep -c "آفرین")
if [ "$WIN" -ge 1 ]; then
  RESULT="PASS"
else
  RESULT="FAIL (no win modal)"
fi
echo "Level $LEVEL: $RESULT"

# Close modal - find "مراحل" button in modal
# First try via JS click on text
agent-browser eval "Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'مراحل')?.click()" >/dev/null 2>&1
agent-browser wait 1500 >/dev/null 2>&1

# Verify we're back on levels screen
ON_LEVELS2=$(agent-browser snapshot -i 2>&1 | grep -c "انتخاب مرحله")
if [ "$ON_LEVELS2" -eq 0 ]; then
  # Try clicking "مراحل" via ref
  MODAL_BTN=$(agent-browser snapshot -i 2>&1 | grep "مراحل" | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e/e/')
  if [ -n "$MODAL_BTN" ]; then
    agent-browser click "@$MODAL_BTN" >/dev/null 2>&1
    agent-browser wait 1500 >/dev/null 2>&1
  fi
fi
