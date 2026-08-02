# Content, Asset, and Development Provenance

Last reviewed: 2026-08-02

Applies to: Work Day with God 1.2.2

## Purpose and scope

This document records how the content, visual assets, branding, and application code in Work Day with God were created or obtained. It is intended to make the project's use of original, AI-assisted, historical, and third-party material transparent.

This record reflects the project owner's account of the creation process together with the evidence currently preserved in the repository. It is not a transfer of rights, a warranty that every historical work is public domain in every country, or a substitute for release-specific legal review.

The word "free" in the README describes the price charged to users of the official application. It does not mean that the application, its source code, or every bundled component is in the public domain.

## Project creation process

Work Day with God was conceived, directed, reviewed, and approved by Kenneth Salmon. The project was developed through an iterative collaboration with OpenAI's ChatGPT and Codex tools.

That collaboration included:

- brainstorming the application's purpose, features, wording, and user experience;
- drafting and revising source code, tests, build scripts, and documentation;
- developing devotional themes, reflections, questions, and prayers;
- developing visual concepts, image-generation directions, branding, and asset-processing workflows; and
- troubleshooting, testing, packaging, and release preparation.

The project owner supplied the goals and creative direction, made product and faith-based decisions, requested revisions, tested the application, and accepted the material included in each release. AI assistance is therefore part of the project's creation history and is disclosed here rather than presenting the project as solely hand-written or traditionally commissioned work.

The installed application does not generate content with AI, connect to an AI service, or send users' devotional activity to an AI provider. The distributed devotionals and visual assets are static local files.

## Provenance summary

| Material | Repository location | Origin and development method | Evidence retained | Current classification |
| --- | --- | --- | --- | --- |
| Application code and interface | `src`, `electron`, `scripts` | Created specifically for Work Day with God through owner-directed, AI-assisted development | Git history, source files, tests, and build configuration | Project material, excluding third-party dependencies |
| Devotional writing | `public/content/devotionals.json` | Original-to-project, AI-assisted drafts and reusable text components selected and approved by the project owner | Generation script and generated JSON | Project material; AI assistance disclosed |
| Daily Scripture quotations | `public/content/devotionals.json` | Selected from the bundled KJV cache | Reference, translation label, and source cache | Historical third-party Scripture text; not claimed as original project writing |
| Full-chapter Scripture libraries | `public/content/*.json` | Normalized from historical translation caches in `data/electron_cache` | Translation files and application allowlist | Per-translation and per-country rights verification still required |
| Daily scenic artwork | `public/scenes` | Built from a project-specific library of AI-generated scenic sources, then cropped, resized, colour-adjusted, and optimized | Output manifest, source filename mapping, byte sizes, and SHA-256 hashes | AI-generated and project-processed material |
| Branding and application icon | `icon.png`, `build/icon.*` | Developed specifically for Work Day with God through the same owner-directed, AI-assisted process | Source image and deterministic branding script | Project branding; AI assistance disclosed |
| Software libraries and build tools | `package.json`, `package-lock.json` | Third-party open-source packages | Locked package names and versions | Governed by their respective licences |

"Project material" in this document identifies material developed specifically for this application. It does not assert exclusive copyright over public-domain text, third-party components, or purely AI-generated elements.

## Devotional content

The 366 daily entries in `public/content/devotionals.json` were developed specifically for Work Day with God. They were not deliberately copied or adapted from a third-party devotional book, website, sermon, or subscription service.

The devotional system uses a project-specific set of themes, titles, openings, reflections, closing thoughts, practical questions, and prayers. `scripts/generate-content.cjs` selects KJV anchor passages from an intentionally pastoral source pool and deterministically assembles those components into calendar entries. The selector requires affirmative, encouraging language; rejects isolated passages centred on judgment, violence, condemnation, or distress; and keeps roughly three quarters of the daily anchors in the New Testament. Every assembled devotional explicitly points the reader to Jesus or Christ in its reflection, question, or prayer. The project owner guided the desired tone and subject matter and reviewed the resulting experience.

The attribution `Original reflection by Work Day with God` means that the non-Scripture reflection was produced for this project rather than reproduced from a named third-party devotional publication. It should not be interpreted as a claim that the text was created without AI assistance.

The quoted Bible verse and its reference remain Scripture material and are not included in the claim of original devotional authorship.

## Scripture translations

The application bundles the following nine historical translations for offline full-chapter reading:

| Application ID | Display name |
| --- | --- |
| `KJV` | King James Version |
| `ASV` | American Standard Version |
| `DBT` | Darby Bible Translation |
| `DRB` | Douay-Rheims Bible |
| `ERV` | English Revised Version |
| `JPS` | JPS 1917 |
| `WBT` | Webster Bible Translation |
| `YLT` | Young's Literal Translation |
| `GENEVA_BIBLE1560` | Geneva Bible 1560 |

The source repository contains other experimental translation caches, but the application allowlist in `src/scripture.js` and the generated files in `public/content` restrict the distributed reader to the translations above.

These Scripture texts are not represented as original Work Day with God writing. The repository currently preserves the normalized text caches, but it does not preserve a complete source URL, download date, edition record, or rights memorandum for every cache. Consequently, this document does not make a blanket claim that every digital file is public domain in every jurisdiction.

Before a release is treated as commercially cleared for a target country, the project owner should verify and retain, for each translation:

- the exact historical edition and electronic source;
- the rights status of both the underlying translation and the particular digital transcription;
- any attribution, notice, or redistribution conditions;
- whether editorial additions, formatting, or database rights apply; and
- the countries covered by the review.

Normalizing historical text into the application's JSON structure does not create ownership of the underlying Scripture translation.

## Scenic artwork

The 366 daily Verse Card scenes under `public/scenes` were created for Work Day with God from a project-specific scenic image library produced through the project's AI-assisted visual-development process. According to the project owner's creation record, the library was not assembled from downloaded stock-photo collections or copied third-party artwork.

The visual direction requested natural scenic imagery without people, readable text, logos, watermarks, buildings, or explicit religious symbols. The final application files were selected and processed locally into 1920 x 1080 WebP assets for offline use.

`scripts/build-scenes-from-library.cjs` records each final scene's project-local source filename, category, byte size, and SHA-256 hash in `public/scenes/manifest.json`. The hash identifies the exact output file and helps detect later changes; it does not, by itself, prove copyright ownership or licensing rights.

The original AI generation sessions, model identifiers, and dated provider-terms snapshots are not currently preserved in this public repository. Future source generation should retain that information in a private release-evidence archive when practical. Credentials, account tokens, and personal billing information must not be committed.

## Branding and interface

The Work Day with God name, application concept, interface direction, wording, colour choices, logo treatment, and icon were developed specifically for this project through owner-directed brainstorming and AI-assisted implementation.

`icon.png` is the source used by `scripts/generate-branding.cjs` to produce the installer and desktop icon formats. The generated `build/icon.png` and `build/icon.ico` files are format variants and do not have an independent origin.

This provenance statement is not a trademark clearance search and does not establish trademark registration.

## Application code and third-party software

The application-specific source code was produced through the collaborative process described above. It also relies on third-party open-source software. Those packages are not owned by Work Day with God and remain governed by their respective licences.

The direct development dependencies recorded for version 1.2.2 are:

| Package | Locked version | Licence reported by the installed package |
| --- | ---: | --- |
| `@vitejs/plugin-react` | 4.7.0 | MIT |
| `vite` | 6.4.3 | MIT |
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `lucide-react` | 0.511.0 | ISC |
| `concurrently` | 9.2.4 | MIT |
| `electron` | 43.2.0 | MIT |
| `sharp` | 0.35.3 | Apache-2.0 |
| `wait-on` | 8.0.5 | MIT |

`package-lock.json` is the authoritative inventory of exact direct and transitive package versions for this release. Package licence files and notices supplied with those dependencies remain applicable. This summary does not replace them.

## Release record expectations

For future public releases, this file should be reviewed when content sources, Scripture libraries, image-generation methods, branding, or direct dependencies change. A release evidence record should preserve, where applicable:

- the application version and review date;
- original source URLs and acquisition dates;
- licence names and required attribution text;
- relevant provider terms or dated snapshots;
- source-to-output filenames and hashes;
- a dependency licence report; and
- any unresolved rights questions or geographic restrictions.

Material with an unknown source or unclear redistribution permission should be recorded as `review required` and replaced or cleared before it is represented as approved for commercial redistribution.

Questions about project permissions may be directed to `kenneth.salmon87@outlook.com`.
