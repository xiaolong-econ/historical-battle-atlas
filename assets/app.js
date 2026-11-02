/* Static, data-driven atlas. Edit data/battles.geojson to extend its coverage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const start = $('year-start'), end = $('year-end'), picker = $('event-picker'), view = $('map-view');
  let events = [], countries, filtered = [], selected = '', projection, path, width, height;
  let minYear, maxYear, transform, svg, layers, points, selection, zoom;
  const yearLabel = year => year < 0 ? `${Math.abs(year)} BCE` : String(year);
  const safeLink = url => { try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; } catch { return null; } };

  function setUrl() {
    const params = new URLSearchParams({from:start.value,to:end.value,view:view.value});
    if (selected) params.set('event',selected);
    history.replaceState(null,'',`${location.pathname}?${params.toString()}`);
  }
  function restoreUrl() {
    const params = new URLSearchParams(location.search), a = Number(params.get('from')), b = Number(params.get('to'));
    if (params.has('from') && params.has('to') && Number.isInteger(a) && Number.isInteger(b) && a >= minYear && b <= maxYear && a <= b) { start.value=a; end.value=b; }
    if (['world','europe','asia','africa','americas'].includes(params.get('view'))) view.value=params.get('view');
    selected=params.get('event') || events.find(e=>e.geometry)?.properties.id || events[0]?.properties.id || '';
  }
  function resizeMarks() {
    points.selectAll('circle').attr('r',4.5/transform.k);
    selection.selectAll('circle').attr('r',8/transform.k);
  }
  function drawSelection() {
    selection.selectAll('*').remove();
    const event=filtered.find(e=>e.properties.id===selected);
    if (!event?.geometry || !projection) return;
    const [x,y]=projection(event.geometry.coordinates);
    selection.append('circle').attr('class','selected-ring').attr('cx',x).attr('cy',y);resizeMarks();
  }
  function addFact(list,label,value,url) {
    const dt=document.createElement('dt');dt.textContent=label;
    const dd=document.createElement('dd');
    if(safeLink(url)){const a=document.createElement('a');a.href=safeLink(url);a.target='_blank';a.rel='noopener noreferrer';a.textContent=value;dd.append(a);}
    else dd.textContent=value;
    list.append(dt,dd);
  }
  function showDetail() {
    const target=$('event-detail');target.replaceChildren();
    const event=filtered.find(e=>e.properties.id===selected);
    if(!event){target.textContent='No entries recorded in the selected interval. This does not establish an absence of conflict.';drawSelection();return;}
    const p=event.properties;
    const year=document.createElement('div');year.className='event-year';year.textContent=p.book_date || `${yearLabel(p.year_start)}–${yearLabel(p.year_end)}`;
    const name=document.createElement('h2');name.textContent=p.name;
    const description=document.createElement('p');description.className='event-summary';description.textContent=p.summary;
    const facts=document.createElement('dl');facts.className='event-facts';
    addFact(facts,'Conflict',p.conflict || 'Not classified');
    addFact(facts,'Modern geographic reference',p.modern_country || 'Unresolved');
    addFact(facts,'Location',event.geometry ? p.geocode_status || 'Approximate reference point' : 'Unresolved · not plotted');
    addFact(facts,'Date status',p.date_status || 'Not independently validated');
    addFact(facts,'Source',p.source || 'Not recorded',p.source_url);
    if(p.pdf_page)addFact(facts,'Source locator',`PDF p. ${p.pdf_page}${p.printed_page ? ` · printed p. ${p.printed_page}` : ''}`);
    if(p.coordinate_source)addFact(facts,event.geometry ? 'Coordinate source' : 'Candidate coordinate source · unresolved',p.geocode_place || 'Source record',p.coordinate_source);
    addFact(facts,'Deaths','Unknown / not validated · equal dot size');
    target.append(year,name,description,facts);drawSelection();
  }
  function filter() {
    filtered=events.filter(e=>e.properties.year_start<=Number(end.value) && e.properties.year_end>=Number(start.value));
    filtered.sort((a,b)=>a.properties.year_start-b.properties.year_start || a.properties.name.localeCompare(b.properties.name));
    const mapped=filtered.filter(e=>e.geometry);
    $('start-label').textContent=yearLabel(Number(start.value));$('end-label').textContent=yearLabel(Number(end.value));
    start.setAttribute('aria-valuetext',yearLabel(Number(start.value)));end.setAttribute('aria-valuetext',yearLabel(Number(end.value)));
    $('record-count').textContent=`${mapped.length} mapped · ${filtered.length-mapped.length} unresolved`;
    picker.replaceChildren();
    for(const event of filtered){const p=event.properties,option=document.createElement('option');option.value=p.id;option.textContent=`${p.book_date || yearLabel(p.year_start)} · ${p.name}${event.geometry ? '' : ' · unresolved'}`;picker.append(option);}
    if(!filtered.some(e=>e.properties.id===selected))selected=filtered[0]?.properties.id || '';
    picker.value=selected;picker.disabled=filtered.length===0;
    points.selectAll('circle').data(mapped,e=>e.properties.id).join('circle').attr('class','battle-dot').attr('cx',e=>projection(e.geometry.coordinates)[0]).attr('cy',e=>projection(e.geometry.coordinates)[1]);
    resizeMarks();showDetail();
  }
  function preset() {
    let target=d3.zoomIdentity;
    const boxes={europe:[[-16,70],[45,24]],asia:[[40,65],[150,4]],africa:[[-24,40],[59,-38]],americas:[[-155,70],[-33,-57]]};
    const bounds=boxes[view.value];
    if(bounds){const a=projection(bounds[0]),b=projection(bounds[1]);const k=Math.max(1,Math.min((width-30)/Math.abs(b[0]-a[0]),(height-30)/Math.abs(b[1]-a[1])));target=d3.zoomIdentity.translate(width/2-k*(a[0]+b[0])/2,height/2-k*(a[1]+b[1])/2).scale(k);}
    svg.call(zoom.transform,target);
  }
  function render() {
    width=$('map-stage').clientWidth;height=Math.max(280,Math.min(560,width*.64));
    svg.attr('viewBox',`0 0 ${width} ${height}`).attr('height',height);
    projection=d3.geoNaturalEarth1().fitExtent([[10,12],[width-10,height-12]],countries);path=d3.geoPath(projection);
    layers.select('.countries').selectAll('path').data(countries.features).join('path').attr('class','country').attr('d',path);
    zoom.extent([[0,0],[width,height]]).translateExtent([[-width,-height],[width*2,height*2]]);filter();preset();
  }
  async function loadJson(url){const response=await fetch(url);if(!response.ok)throw new Error(`Could not load ${url} (${response.status})`);return response.json();}
  async function init() {
    if(!window.d3)throw new Error('The map library did not load.');
    const [data,geometry]=await Promise.all([loadJson('data/battles.geojson'),loadJson('data/countries.geojson')]);events=data.features;countries=geometry;
    if(!Array.isArray(events)||!events.length||!Array.isArray(countries.features))throw new Error('The dataset is empty or malformed.');
    minYear=Math.min(...events.map(e=>e.properties.year_start));maxYear=Math.max(...events.map(e=>e.properties.year_end));
    for(const el of [start,end]){el.min=minYear;el.max=maxYear;el.step=1;el.disabled=false;}
    start.value=minYear;end.value=maxYear;restoreUrl();
    $('dataset-range').textContent=`Data coverage: ${yearLabel(minYear)}–${yearLabel(maxYear)} · ${events.length} entries`;
    $('full-period').disabled=false;transform=d3.zoomIdentity;svg=d3.select($('map'));
    layers=svg.append('g');layers.append('g').attr('class','countries');points=layers.append('g');selection=layers.append('g');
    zoom=d3.zoom().scaleExtent([1,24]).on('zoom',event=>{transform=event.transform;layers.attr('transform',transform);resizeMarks();});svg.call(zoom).on('dblclick.zoom',null);
    svg.on('click.select',event=>{
      if(event.defaultPrevented)return;const [x,y]=d3.pointer(event,svg.node());
      const nearby=filtered.filter(e=>e.geometry).map(e=>{const p=transform.apply(projection(e.geometry.coordinates));return{e,distance:Math.hypot(p[0]-x,p[1]-y)};}).filter(p=>p.distance<22).sort((a,b)=>a.distance-b.distance);
      if(!nearby.length)return;let chosen=nearby[0].e;if(chosen.properties.id===selected&&nearby.length>1)chosen=nearby[1].e;
      selected=chosen.properties.id;picker.value=selected;showDetail();setUrl();
    });
    start.addEventListener('input',()=>{if(Number(start.value)>Number(end.value))end.value=start.value;filter();});
    end.addEventListener('input',()=>{if(Number(end.value)<Number(start.value))start.value=end.value;filter();});
    start.addEventListener('change',setUrl);end.addEventListener('change',setUrl);
    picker.addEventListener('change',()=>{selected=picker.value;showDetail();setUrl();});view.addEventListener('change',()=>{preset();setUrl();});
    $('full-period').addEventListener('click',()=>{start.value=minYear;end.value=maxYear;filter();setUrl();});
    $('zoom-in').addEventListener('click',()=>svg.call(zoom.scaleBy,1.6));$('zoom-out').addEventListener('click',()=>svg.call(zoom.scaleBy,1/1.6));
    render();let lastWidth=width;new ResizeObserver(()=>{if($('map-stage').clientWidth!==lastWidth){render();lastWidth=width;}}).observe($('map-stage'));
  }
  init().catch(error=>{$('error').hidden=false;$('error').textContent=`The atlas could not load. ${error.message} Try reloading, or download the dataset below.`;$('record-count').textContent='Map unavailable';console.error(error);});
})();
