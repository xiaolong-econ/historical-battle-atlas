#!/usr/bin/env python3
"""Validate the atlas's editable source data using the Python standard library."""
import json
import math
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data/battles.geojson'
errors = []

def valid_url(value):
    p = urlparse(value or '')
    return p.scheme in ('http', 'https') and bool(p.netloc)

try:
    data = json.loads(path.read_text())
except (OSError, ValueError) as exc:
    sys.exit(f'Cannot read dataset: {exc}')
if data.get('type') != 'FeatureCollection' or not isinstance(data.get('features'), list):
    sys.exit('Expected a GeoJSON FeatureCollection with a features array.')
if not data['features']:
    errors.append('The dataset must contain at least one event.')
seen = set()
mapped = 0
for index, feature in enumerate(data['features'], 1):
    p = feature.get('properties') or {}
    key = p.get('id', f'row {index}')
    if feature.get('type') != 'Feature': errors.append(f'{key}: expected Feature.')
    for field in ['id', 'name', 'source', 'summary', 'date_status', 'geocode_status']:
        if not isinstance(p.get(field), str) or not p[field].strip(): errors.append(f'{key}: missing {field}.')
    if key in seen: errors.append(f'{key}: duplicate ID.')
    seen.add(key)
    a, b = p.get('year_start'), p.get('year_end')
    if type(a) is not int or type(b) is not int: errors.append(f'{key}: year bounds must be integers.')
    elif a > b: errors.append(f'{key}: start year exceeds end year.')
    if not (p.get('pdf_page') or p.get('source_url') or p.get('source_locator')):
        errors.append(f'{key}: add a source page, URL, or other locator.')
    for field in ['source_url', 'coordinate_source']:
        if p.get(field) and not valid_url(p[field]): errors.append(f'{key}: invalid {field}.')
    geometry = feature.get('geometry')
    if geometry is not None:
        mapped += 1
        coords = geometry.get('coordinates')
        if geometry.get('type') != 'Point' or not isinstance(coords, list) or len(coords) != 2:
            errors.append(f'{key}: expected a 2D Point or null geometry.')
        elif not all(type(v) in (int, float) and math.isfinite(v) for v in coords):
            errors.append(f'{key}: invalid numeric coordinates.')
        elif not (-180 <= coords[0] <= 180 and -90 <= coords[1] <= 90):
            errors.append(f'{key}: coordinates must be [longitude, latitude] within valid bounds.')
        if not valid_url(p.get('coordinate_source')): errors.append(f'{key}: mapped points need a coordinate source.')
        if 'unresolved' in p.get('geocode_status','').lower(): errors.append(f'{key}: unresolved point must have null geometry.')
    for kind in ['military', 'civilian', 'total']:
        low, high = p.get(f'deaths_{kind}_low'), p.get(f'deaths_{kind}_high')
        for value in [low, high]:
            if value is not None and (type(value) is not int or value < 0): errors.append(f'{key}: deaths must be nonnegative integers or null.')
        if type(low) is int and type(high) is int and low > high: errors.append(f'{key}: reversed deaths_{kind} bounds.')
        if low is not None or high is not None:
            if not p.get('death_estimate_sources'): errors.append(f'{key}: populated death estimates need death_estimate_sources.')
if errors:
    print('\n'.join(errors), file=sys.stderr)
    sys.exit(1)
print(f'Valid: {len(data["features"])} entries, {mapped} mapped, {len(data["features"])-mapped} unresolved.')
