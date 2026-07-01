#!/bin/bash
# Auto-test all 15 level solutions on the production build

set -e

# Read solutions from JSON
declare -a SOLUTIONS=(
  "dlUrrrdLullddrUluRuulDrddrruLdlUU"        # Level 1
  "rddLruulDuullddR"                          # Level 2
  "ruuLLLulDrrrrddlUruLLLddllluurRDrdLuuurDD" # Level 3
  "LuRllDrdRdrruuLLdlUddlluR"                 # Level 4
  "ullDDlddrruLuuurrdLulDDDullddrRuulD"       # Level 5
  "urrDulldRdRluurDrDDlUruLdlUruL"            # Level 6
  "ulllddddrrrruLUlDrdLLLuuuurrrDDDldllullddrUluRdrrrurrdLLLLUllddrUrrruuruullldD" # Level 7
  "uulllldddrrUlluurrrrddLLLrrruullDurrddlLdllURRuullD" # Level 8
  "ruuuulllddrRDrUUdllluuurrrrdLdddddlUUruuuLulldddrRdrUUdllluuurrdLurrrdL" # Level 9
  "ruulluRdrdddllUUdrruululldRddrruuruLLrdddlluuRurDDullluR" # Level 10
  "uluurDldddrrUruuLLulD"                     # Level 11
  "ulLrrddlLUdLuluurDldDrrrruulLLrddlluUrrdL" # Level 12
  "dllllllllllluurDldRRRRuLLdlluurDldRRurrdRRuLLLLdRRurrdRRuLLLLdRRlllllluurDldRRRRuLLdlluurDldRRurrrrrrdRRuLLLLLLLLdlluurDrrrdLurrrdLLurrrrdLLLurrrrrrrdLLLLLL" # Level 13
  "llulDDulldRRurrrrrdddlllllUURurrdLLuLDlluRRRdrrurrdddlllllUUruRRRldlllluRRRR" # Level 14
  "urrrrrrdddLLulldRRRllDDrddlUUUddLLdlluRRRllUUluurDDDuuuuurrrrrrddDDDuullulldRRRllddrddlUUUddlldlluRRRlluuuuuurrrrrrddDDullulldRRRllddrddlUUUddllluuuuuurrrrrrddDllulldRRR" # Level 15
)

# Unlock all levels first (we just want to test solutions, not progression)
agent-browser storage local set sokoban_progress_v2 '{"completed":[],"bestMoves":{},"unlocked":15}' >/dev/null 2>&1
agent-browser reload >/dev/null 2>&1
agent-browser wait 2500 >/dev/null 2>&1

PASS=0
FAIL=0

for i in "${!SOLUTIONS[@]}"; do
  LEVEL=$((i + 1))
  SOL="${SOLUTIONS[$i]}"

  echo -n "Level $LEVEL: "

  # Go to menu -> levels
  agent-browser snapshot -i >/dev/null 2>&1
  # Click "ادامه بازی" or "شروع بازی"
  PLAY_BTN=$(agent-browser snapshot -i 2>&1 | grep -E "ادامه|شروع" | grep -oE '@e[0-9]+' | head -1)
  agent-browser click "$PLAY_BTN" >/dev/null 2>&1
  agent-browser wait 600 >/dev/null 2>&1

  # Find the level button - it has text like "آسان 1", "متوسط 4", etc.
  # Use find with text matching the level number
  LEVEL_BTN=$(agent-browser snapshot -i 2>&1 | grep -E "(آسان|متوسط|سخت|دشوار) $LEVEL\$" | grep -oE '@e[0-9]+' | head -1)
  if [ -z "$LEVEL_BTN" ]; then
    echo "FAIL (could not find level button)"
    FAIL=$((FAIL + 1))
    continue
  fi
  agent-browser click "$LEVEL_BTN" >/dev/null 2>&1
  agent-browser wait 800 >/dev/null 2>&1

  # Apply solution
  for ((j=0; j<${#SOL}; j++)); do
    C="${SOL:$j:1}"
    case "$C" in
      u|U) agent-browser press ArrowUp >/dev/null 2>&1 ;;
      d|D) agent-browser press ArrowDown >/dev/null 2>&1 ;;
      l|L) agent-browser press ArrowLeft >/dev/null 2>&1 ;;
      r|R) agent-browser press ArrowRight >/dev/null 2>&1 ;;
    esac
    sleep 0.08
  done
  agent-browser wait 500 >/dev/null 2>&1

  # Check if win modal appeared
  WIN=$(agent-browser snapshot -i 2>&1 | grep -c "آفرین")
  if [ "$WIN" -ge 1 ]; then
    echo "PASS"
    PASS=$((PASS + 1))
  else
    echo "FAIL (no win modal)"
    FAIL=$((FAIL + 1))
  fi

  # Back to levels for next iteration
  # Close modal first by going to menu
  agent-browser find role button click --name "مراحل" >/dev/null 2>&1
  agent-browser wait 600 >/dev/null 2>&1
  # Click "مراحل" in the top bar to go back to levels list
  agent-browser find role button click --name "منو" >/dev/null 2>&1
  agent-browser wait 600 >/dev/null 2>&1
done

echo ""
echo "=== Results ==="
echo "Pass: $PASS / 15"
echo "Fail: $FAIL / 15"
