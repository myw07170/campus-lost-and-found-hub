# Campus Lost & Found Hub

Illini Finders · CS 409 · Part B functional prototype

University of Illinois students can look up items found on campus, report a find, and verify ownership before arranging a return. All reports, accounts, and contact details in the starter data are fictional.

## Run locally

Use Node.js 24 LTS and npm. In Windows PowerShell, use `npm.cmd` if script execution is restricted.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. Use these commands to verify the production bundle.

```sh
npm test
npm run build
npm run preview
```

## Classroom walkthrough

Open the site in one browser tab and share mouse control. Select **Reset demo** if the browser has data from an earlier session. From the header, choose **Demo sign in** and select **Avery Chen** or **Jordan Lee**. Select the account name in the header to switch identities in the same tab. Use sample details and a non-sensitive photo. A sample photo is available at `src/assets/items/pouch.jpg`.

| Task | What to try |
| --- | --- |
| Browse for an item | Search for `water bottle`. Pick **Accessories**, **Grainger Engineering Library**, and **Last 7 days**. Switch from **Gallery** to **List** to **Map**. Open the item and return to the filtered results. Clear the filters to see the grouped Grainger marker. |
| Post a found item | As either user, select **I found an item**. Add a title, category, date, description, photo, and ownership question. Try **Choose a building** or **Drop a pin** and confirm a nearby building. Review, publish, then locate the new report in **Browse** or **My Reports**. Edit or close it from **My Reports**. |
| Claim, review, and return | As **Jordan Lee**, open **Blue metal water bottle** and submit a sample answer. Check **My Claims** for **Pending**. Switch to **Avery Chen**, find the bottle under **My Reports**, and approve the claim. Switch back to Jordan to see Avery’s demo contact details. As Avery, mark the report **Returned** after the simulated handoff. The seeded claim for **Red pocket notebook** can be used to try rejection. |

**Reset demo** in the footer restores the starter data and signs out. Reports, claims, and uploaded photos stay in IndexedDB on the current browser and site. Demo identity is stored in the current tab. The prototype models claim visibility in its interface. Real authentication, API, server-side authorization, and a shared database are Part C work.

### Heuristic evaluation

Give the evaluator a task from the table and let them try it before offering the walkthrough steps. Record where they hesitate, make an error, or ask what happened next. Capture a revision and a retest after evaluating peer feedback.

| Task and step | Observed behavior | Usability heuristic | Severity (0–4) | Proposed revision | Retest result |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Deploy to GitHub Pages

1. Create or select a GitHub repository for the prototype and connect it as `origin`. Commit the source, including `package-lock.json` and `.github/workflows/pages.yml`, and push `main`.
2. In the repository’s **Settings → Pages**, select **GitHub Actions** as the publishing source.
3. Run **Deploy prototype to GitHub Pages** from the **Actions** tab. The workflow runs tests, builds the app, and publishes `dist`. Later pushes to `main` trigger it automatically.
4. Open the deployment URL shown in the workflow. Smoke-test a direct detail link such as `/#/items/bottle` relative to the site’s repository path.

The project uses relative asset paths and hash routing so it can run at a repository subpath. The files in `docs/` are local project references and are excluded from Git.

## Assets

The browser draws the campus schematic from bundled building and street positions based on the [Illinois Facilities & Services campus map](https://docs.fs.illinois.edu/wp-content/uploads/2025/03/AP0001_M014-UI-Campus-Map-formerly-GIS_148.pdf).

The nine starter photos in `src/assets/items/` come from a single contact sheet made with built-in ImageGen.

<details>
<summary>ImageGen prompt</summary>

Use case: photorealistic-natural. Asset: a single edge-to-edge 3 by 3 contact sheet atlas for a UIUC campus lost-and-found web app, landscape overall aspect ratio 3:2. Exactly nine independent realistic candid product photographs, perfectly equal rectangular cells meeting at the exact thirds of the canvas, no gutters or borders. Each object is comfortably centered inside its cell, fully within that cell with plenty of margin and no crossing between cells. Left to right top row: cobalt blue reusable metal water bottle on a pale cool-gray library desk; black wireless earbuds in a small charging case on pale beige wooden tabletop; brass keys on a dark navy cloth lanyard on light gray stone. Middle row: red unbranded closed clothbound pocket notebook on a pale beige desk; olive green baseball cap on light sage-gray tabletop; ivory USB-C charging adapter and neatly coiled cable on a desaturated lilac gray desktop. Bottom row: black folding umbrella on a pale blue-gray table; compact tan fabric zip pencil pouch on a warm white desk; light gray knit gloves on an off-white library table. Campus student found-object photography, softly lit window daylight, realistic textures, quiet backgrounds, gently elevated camera close-ups, cohesive colors. No labels, words, handwriting, visible brands, hands, or people.

</details>
