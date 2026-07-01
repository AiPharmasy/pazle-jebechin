#!/bin/bash
# Test all 15 levels sequentially

LEVELS_SOL=(
  '1:dlUrrrdLullddrUluRuulDrddrruLdlUU'
  '2:rddLruulDuullddR'
  '3:ruuLLLulDrrrrddlUruLLLddllluurRDrdLuuurDD'
  '4:LuRllDrdRdrruuLLdlUddlluR'
  '5:ullDDlddrruLuuurrdLulDDDullddrRuulD'
  '6:urrDulldRdRluurDrDDlUruLdlUruL'
  '7:ulllddddrrrruLUlDrdLLLuuuurrrDDDldllullddrUluRdrrrurrdLLLLUllddrUrrruuruullldD'
  '8:uulllldddrrUlluurrrrddLLLrrruullDurrddlLdllURRuullD'
  '9:ruuuulllddrRDrUUdllluuurrrrdLdddddlUUruuuLulldddrRdrUUdllluuurrdLurrrdL'
  '10:ruulluRdrdddllUUdrruululldRddrruuruLLrdddlluuRurDDullluR'
  '11:uluurDldddrrUruuLLulD'
  '12:ulLrrddlLUdLuluurDldDrrrruulLLrddlluUrrdL'
  '13:dllllllllllluurDldRRRRuLLdlluurDldRRurrdRRuLLLLdRRurrdRRuLLLLdRRlllllluurDldRRRRuLLdlluurDldRRurrrrrrdRRuLLLLLLLLdlluurDrrrdLurrrdLLurrrrdLLLurrrrrrrdLLLLLL'
  '14:llulDDulldRRurrrrrdddlllllUURurrdLLuLDlluRRRdrrurrdddlllllUUruRRRldlllluRRRR'
  '15:urrrrrrdddLLulldRRRllDDrddlUUUddLLdlluRRRllUUluurDDDuuuuurrrrrrddDDDuullulldRRRllddrddlUUUddlldlluRRRlluuuuuurrrrrrddDDullulldRRRllddrddlUUUddllluuuuuurrrrrrddDllulldRRR'
)

PASS=0
FAIL=0
FAILED_LEVELS=()

for entry in "${LEVELS_SOL[@]}"; do
  LVL="${entry%%:*}"
  SOL="${entry#*:}"
  
  RESULT=$(bash /home/z/my-project/scripts/test-level.sh "$LVL" "$SOL" 2>&1 | tail -1)
  echo "$RESULT"
  
  if echo "$RESULT" | grep -q "PASS"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    FAILED_LEVELS+=("$LVL")
  fi
  
  sleep 0.5
done

echo ""
echo "========================"
echo "Total: PASS=$PASS/15, FAIL=$FAIL/15"
if [ $FAIL -gt 0 ]; then
  echo "Failed levels: ${FAILED_LEVELS[*]}"
fi
