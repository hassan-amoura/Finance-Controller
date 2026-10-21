# Financial Freedom — mobile financial planner

A responsive, installable static web app. No build step, dependencies, accounts, or analytics.

## GitHub Pages deployment
1. Create a **public** repository named `financial-freedom`.
2. Upload the files in this folder to the **repository root** (not the zip itself).
3. In repository Settings → Pages, choose **Deploy from a branch**, `main`, `/ (root)` and save.
4. Open `https://YOUR-USERNAME.github.io/financial-freedom/` on your iPhone in Safari, then Share → Add to Home Screen.
5. In the app, open **Settings → Import backup** and select your private plan JSON.

## Privacy
Public GitHub Pages hosts only this app's code and a blank starter plan. **Never commit your private financial plan JSON or backups to GitHub.** Your imported figures are stored in localStorage on your device. They are not encrypted at rest, so use your device passcode and export a backup periodically. Local browser data does not automatically sync across devices. Avoid installing third-party scripts or analytics.

## Future banking integration
A later version can add private sign-in, secure database, Plaid Link and server-side tokens. Never put Plaid secrets in GitHub Pages client-side code.

## Model notes
Projections are illustrative, not financial advice. Bonuses, payroll, loan payoff, and tax estimates need confirmation. Expense overrides replace that month's total living costs; bonus income is added separately.
