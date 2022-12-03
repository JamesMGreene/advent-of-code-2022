#!/usr/bin/env bash

# New exercises are released every day at midnight EST.
TODAY=$(TZ=America/New_York date +%d)
THIS_YEAR=$(TZ=America/New_York date +%Y)

DAY=${1:-$TODAY}
# Strip any leading zeroes; e.g. 00 -> 0, 0001 -> 1, 25 -> 25
[[ "$DAY" =~ ^0*([0-9]+)$ ]] && DAY=${BASH_REMATCH[1]}
# Add a leading zero, if needed; e.g. 1 -> 01, 25 -> 25
FORMATTED_DAY=$(printf "%02d" $DAY)

NEW_DIR="day${FORMATTED_DAY}"

# Stop immediately if the directory already exists
if [[ -d "${NEW_DIR}" ]]; then
  echo "ERROR: Directory ${NEW_DIR} already exists!" >&2
  exit 1
fi

# Create the new day's directory and copy the template files
mkdir -p "${NEW_DIR}"
touch "${NEW_DIR}/sample.txt"
touch "${NEW_DIR}/input.txt"
echo "console.log('hello, day ${DAY}!')"> "${NEW_DIR}/main.ts"

# Download the AoC input file for the day using a saved session cookie
AOC_SESSION=$(cat aoc_session_cookie.txt)
curl --silent -o "${NEW_DIR}/input.txt" "https://adventofcode.com/${THIS_YEAR}/day/${DAY}/input" --cookie "session=${AOC_SESSION}"
