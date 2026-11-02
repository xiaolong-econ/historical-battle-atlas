# Historical Battle Atlas

An evolving, source-based map of historical battles and sieges. The initial pilot contains **68 entries dated 1340–1370**, with **64 approximate reference locations and 4 unresolved entries**. This is a research prototype, not a complete record of historical conflict.

The map supports year filtering, regional views, pan/zoom, event details, and shareable URLs. Its original data can also be opened in QGIS.

## Continuing the project

**The main file to edit is [`data/battles.geojson`](data/battles.geojson).** The website reads this file directly. The timeline limits and counts automatically expand when new records are added.

1. Add or revise an event in `features`. Keep its `id` stable and unique. Add a new ID for a genuinely new event; aliases should not become duplicate events.
2. Record the source, page or URL, date bounds, and uncertainty. Preserve disputed source dates instead of silently replacing them.
3. Use `[longitude, latitude]` for geometry. Use `null` when the location is unresolved. Do not invent a point to fill a blank region.
4. Leave unknown death fields `null`. Keep killed, wounded, prisoners, missing, and army strength separate. Record source-specific estimates before choosing a display value.
5. Run `python3 scripts/validate_data.py` and preview the map.
6. Commit the changes to `main`. Once GitHub Pages is enabled, the site republishes from that branch.

The data validator checks structure, IDs, date ordering, coordinate bounds, source locators, and death-estimate ranges. It cannot verify historical truth or whether a gazetteer match is correct.

## Local preview

No package installation, API keys, or build step is required. From this folder:

```sh
python3 scripts/validate_data.py
python3 -m http.server 8000
```

Open <http://localhost:8000>. Use a local server because the map loads its data files with `fetch`; double-clicking `index.html` is not a supported preview.

## GitHub Pages

In this repository's **Settings → Pages**, choose **Deploy from a branch**, **main**, and **/(root)**. The `.nojekyll` file lets GitHub serve the static files directly. No backend is used.

Official instructions: [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and visible methodology |
| `assets/app.js` | Map, filtering, details, and URL state |
| `assets/styles.css` | Responsive light/dark styling |
| `assets/vendor/` | Pinned D3 library and license |
| `data/battles.geojson` | Editable event dataset |
| `data/countries.geojson` | Modern reference geometry |
| `data/unverified-death-claims.json` | Illustrative source claims, not validated totals |
| `data/excluded-cross-references.json` | Alias headings excluded from the pilot count |
| `data/provenance.json` | Initial extraction provenance |
| `DATA_DICTIONARY.md` | Field definitions and a new-event template |
| `scripts/validate_data.py` | Data validation without external dependencies |

## Research priorities

- Resolve Kauthal, Maritza, Nesbit, and Stefaniana without asserting false precision.
- Check entry identities and dates against independent scholarship.
- Broaden African and American coverage with regional histories and archaeological evidence. Blank regions are not evidence of peace.
- Separate discrete battles from campaigns and other types of political violence.
- Add date precision and location uncertainty, preserving each source's claims.
- Build a separate source-claims table for death estimates, including side, population, measure, range, and provenance.
- Implement severity sizing only after specifying and validating the measure. The current UI always uses equal dots and labels deaths unvalidated; simply filling a death field will not change the display.
- Update the pilot description, provenance, and notices as coverage or source terms change.

The initial book is Tony Jaques, *Dictionary of Battles and Sieges* (2007). Its preface requires written documentation and generally excludes oral-history-only accounts. Initial geocodes are provisional Wikipedia/Wikidata reference points. The book PDF and full entry prose are not part of this repository.

## Reuse

No blanket license is assigned to this research dataset at this stage. Source-specific terms need review before a formal open-data release. Third-party software and geographic data retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
