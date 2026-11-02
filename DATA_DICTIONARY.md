# Data dictionary

`data/battles.geojson` is a WGS 84 GeoJSON FeatureCollection. Coordinates are ordered **longitude, latitude**. Geometry can be `null`; such entries remain in the event list but are not mapped.

| Field | Definition |
| --- | --- |
| `id` | Stable unique event identifier; do not change during a correction |
| `name` | Display name |
| `book_entry` | Heading in the initial book extraction, when applicable |
| `year_start`, `year_end` | Inclusive year bounds used by the time filter; not necessarily event duration |
| `book_date` | Original source date label, when applicable |
| `date_status` | How the dates have been verified, or what remains uncertain |
| `conflict` | War/campaign classification; initially follows the book |
| `modern_country` | Geographic reference, not a historical belligerent |
| `summary` | Brief paraphrase; distinguish source claims from validated findings |
| `source` | Human-readable historical source citation |
| `source_url` | Optional public source URL |
| `pdf_page`, `printed_page` | 1-based page locators for the initial PDF/book |
| `source_locator` | Optional alternative locator for other sources |
| `geocode_status` | Approximate reference point or unresolved status |
| `geocode_place` | Modern place/event name used for matching |
| `coordinate_source` | URL supporting the coordinates, including rejected candidates when clearly marked unresolved |
| `coordinate_retrieved` | Retrieval date |
| `location_note` | Matching limitations, disputed location, or rejection reason |
| `deaths_military_low/high` | Lower/upper military-death estimates, or null |
| `deaths_civilian_low/high` | Lower/upper civilian-death estimates, or null |
| `deaths_total_low/high` | Lower/upper total-death estimates, or null |
| `death_estimate_sources` | Required provenance if any validated death bounds are populated; proposed extension |
| `severity_status` | Validation status of death information |
| `validation_status` | Overall review status |

For an exact single year, use the same start and end. For uncertain dates, record the interval and explicitly explain uncertainty in `date_status`; never interpret interval width as fighting duration. The present filter uses overlap, so a broadly dated event may appear in multiple windows. BCE records require a documented dating convention before expansion across the era boundary; the pilot contains only CE dates.

The following is a template, not a real event. Replace placeholders and use a new stable ID. Do not paste it unchanged into the dataset.

```json
{
  "type": "Feature",
  "geometry": null,
  "properties": {
    "id": "NEW-UNIQUE-ID",
    "name": "Event name",
    "year_start": 1400,
    "year_end": 1400,
    "date_status": "Source date; needs verification",
    "summary": "A short sourced description.",
    "source": "Author, title, publication year",
    "source_locator": "Page or other locator",
    "conflict": "Campaign or war, if known",
    "modern_country": "Unresolved",
    "geocode_status": "Unresolved; not mapped",
    "coordinate_source": null,
    "location_note": "Location requires research.",
    "deaths_total_low": null,
    "deaths_total_high": null,
    "severity_status": "Unknown / not validated",
    "validation_status": "Needs review"
  }
}
```

Keep unvalidated death claims in a separate claims table. Multiple conflicting estimates should not overwrite one another. Casualties and troop strength are not interchangeable with deaths. A source reporting nine deaths on one side does not establish nine total deaths.
