# QA Playwright Framework

Playwright + TypeScript test automation framework for UI and API testing.

## Features
- Page Object Model (`pages/`)
- Custom fixtures (`tests/fixtures.ts`) with reusable logged-in state
- Test data separated from tests (`testdata/`)
- UI tests (SauceDemo) and API tests (JSONPlaceholder)
- Cross-browser: Chromium and Firefox
- Retries, screenshots, video and trace on failure
- CI with GitHub Actions + HTML report artifact

## Structure
pages/ | testdata/ | tests/ | playwright.config.ts

## Run
npm install
npx playwright install
npx playwright test
npx playwright show-report

## Author
Fahad - QA Lead