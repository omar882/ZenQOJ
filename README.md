# ZenQOJ

ZenQOJ is a small Chrome extension that gives QOJ a calmer, comparison-free interface.

## What it changes

- Neutralizes rating-based username colors.
- Hides ratings, rating changes, contribution values, ranking tables, and rating graphs.
- Hides problem ratings, solve statistics, and homepage leaderboards.
- Keeps aggregate contest information (rank, username, solved/score, and penalty) visible while hiding per-problem standings cells.
- Shortens verdicts and removes testcase numbers from live judging details.
- Handles QOJ's dynamically-rendered submission and standings tables.

## Install locally

1. Open `chrome://extensions/` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this `ZenQOJ` folder.
5. Refresh QOJ.

The extension runs on `qoj.ac` and its subdomains. It does not transmit data or make network requests.
