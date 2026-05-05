(function(){
'use strict';
var $=function(id){return document.getElementById(id);};
var workerId='',lastSavedId='';
var SHEETS_WEB_APP_URL='https://script.google.com/macros/s/AKfycbzhmbogSOzDk89eiRkRhA8rSMetbWTDiRUojequJ7tXs10E4X1kxGLHfRScZpvnO7U/exec';

var defaultCountries=['South Africa','United Kingdom','United States','Netherlands','Germany','France','Spain','Portugal','Italy','Norway','Denmark','Sweden','Namibia','Angola','Mozambique','Nigeria','Ghana','Kenya','India','Philippines','Indonesia','Australia','New Zealand','Brazil','Other'];
var defaultJobs=['Rigger','Welder','Boilermaker','Fitter','Electrician','Mechanic','Crane Operator','Deckhand','AB / Able Seaman','Oiler','Painter / Blaster','Rope Access Technician','Diver','Medic','HSE Officer','Supervisor','Engineer','Galley / Catering','Other'];
var defaultCertificates=['BOSIET','FOET','HUET','CA-EBS','EBS','MIST','OEUK / OGUK Offshore Medical','Fit to Train','ENG1 Medical','STCW Basic Safety Training','Seafarer Medical','H2S / Hydrogen Sulphide Awareness','Confined Space Entry','Working at Heights','Rope Access IRATA Level 1','Rope Access IRATA Level 2','Rope Access IRATA Level 3','Banksman / Slinger','Rigger Stage 1','Rigger Stage 2','Rigger Stage 3','Crane Operator','Forklift / Telehandler','MEWP / Cherry Picker','First Aid','Fire Fighting','Permit to Work','LOTO / Isolation','Welding Coding / Qualification','NDT / Inspection','Diving Medical','DP / Dynamic Positioning','GWO Basic Safety Training','Sea Survival'];

function toast(msg){var t=$('toast');t.textContent=msg;t.style.display='block';setTimeout(function(){t.style.display='none';},2500);}

function syncStatus(msg,type){
  var s=$('syncStatus');
  if(!s)return;
  s.textContent=msg;
  s.classList.remove('ok','warn','bad');
  if(type)s.classList.add(type);
}
function sheetToRecord(row){
  var jobText=row['Job Types']||row['Job Type']||row['Job Type / Trade']||'';
  var certText=row['Certificates / Tickets']||'';
  return {
    workerId: row['Worker ID'] || '',
    savedAt: row['Saved At'] || '',
    firstName: row['First Name'] || '',
    lastName: row['Last Name'] || '',
    phone: row['Phone'] || '',
    email: row['Email'] || '',
    country: row['Country'] || '',
    nationality: row['Nationality'] || '',
    jobTypes: String(jobText).split('|').map(function(x){return x.trim();}).filter(Boolean),
    jobType: String(jobText).replace(/\s*\|\s*/g, ', '),
    experience: row['Experience'] || '',
    availability: row['Availability'] || '',
    location: row['Location'] || '',
    certificationTickets: String(certText).split('|').map(function(x){return x.trim();}).filter(Boolean),
    certificates: row['Other Certificates'] || '',
    notes: row['Notes'] || ''
  };
}
function localRecords(){
  try{return JSON.parse(localStorage.getItem('ow_records')||'[]');}catch(e){return [];}
}
function setLocalRecords(records){
  localStorage.setItem('ow_records',JSON.stringify(records||[]));
}
function mergeRecords(a,b){
  var map={};
  (a||[]).concat(b||[]).forEach(function(r){
    if(r&&r.workerId)map[r.workerId]=r;
  });
  return Object.keys(map).map(function(k){return map[k];}).sort(function(x,y){
    return String(y.savedAt||'').localeCompare(String(x.savedAt||''));
  });
}
async function loadFromSheets(){
  if(!SHEETS_WEB_APP_URL)return localRecords();
  try{
    syncStatus('Loading Google Sheet records...','warn');
    var res=await fetch(SHEETS_WEB_APP_URL,{method:'GET',cache:'no-store'});
    var json=await res.json();
    var sheetRows=(json.records||[]).map(sheetToRecord).filter(function(r){return r.workerId;});
    var merged=mergeRecords(localRecords(),sheetRows);
    setLocalRecords(merged);
    syncStatus('Loaded from Google Sheets','ok');
    return merged;
  }catch(err){
    console.warn('Google Sheets load failed',err);
    syncStatus('Google Sheets unavailable — using local records','bad');
    return localRecords();
  }
}
async function saveToSheets(data){
  if(!SHEETS_WEB_APP_URL)return false;
  try{
    syncStatus('Saving to Google Sheets...','warn');
    await fetch(SHEETS_WEB_APP_URL,{
      method:'POST',
      mode:'no-cors',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(data)
    });
    syncStatus('Saved to Google Sheets','ok');
    return true;
  }catch(err){
    console.warn('Google Sheets save failed',err);
    syncStatus('Google Sheets save failed — saved locally','bad');
    return false;
  }
}

function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lines(id){return ($(id).value||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);}
function opts(key,def){try{var v=JSON.parse(localStorage.getItem(key)||'[]');return v.length?v:def;}catch(e){return def;}}
function fillSelect(id,arr,placeholder){var s=$(id);s.innerHTML='<option value="">'+escapeHtml(placeholder)+'</option>'+arr.map(function(x){return '<option>'+escapeHtml(x)+'</option>';}).join('');}

function renderChecks(containerId,arr,className){
  var box=$(containerId);
  if(!box)return;
  box.innerHTML=arr.map(function(x){
    return '<label class="check-item"><input type="checkbox" class="'+className+'" value="'+escapeHtml(x)+'"> '+escapeHtml(x)+'</label>';
  }).join('');
}
function checkedValues(className){
  return Array.prototype.slice.call(document.querySelectorAll('.'+className+':checked')).map(function(x){return x.value;});
}
function setCheckedValues(className,values){
  values=Array.isArray(values)?values:[];
  document.querySelectorAll('.'+className).forEach(function(x){x.checked=values.indexOf(x.value)>-1;});
}


function defaults(){
  if(!localStorage.getItem('ow_countries'))localStorage.setItem('ow_countries',JSON.stringify(defaultCountries));
  if(!localStorage.getItem('ow_jobs'))localStorage.setItem('ow_jobs',JSON.stringify(defaultJobs));
  if(!localStorage.getItem('ow_certificates'))localStorage.setItem('ow_certificates',JSON.stringify(defaultCertificates));
  if(!localStorage.getItem('ow_whatsapp_template'))localStorage.setItem('ow_whatsapp_template','Hi {firstName}, this is regarding possible offshore work opportunities. Your worker reference is {workerId}. Are you currently available for {jobType} work?');
}
function populate(){
  var countries=opts('ow_countries',defaultCountries);
  fillSelect('country',countries,'Select country');
  fillSelect('nationality',countries,'Select nationality');
  renderChecks('jobTypeChecks',opts('ow_jobs',defaultJobs),'job-check');
  renderChecks('certificateChecks',opts('ow_certificates',defaultCertificates),'cert-check');
}
function settingsFields(){
  $('jobOptions').value=opts('ow_jobs',defaultJobs).join('\n');
  $('countryOptions').value=opts('ow_countries',defaultCountries).join('\n');
  $('certificateOptions').value=opts('ow_certificates',defaultCertificates).join('\n');
  $('whatsappTemplate').value=localStorage.getItem('ow_whatsapp_template')||'';
}
function newId(){
  var d=new Date(), y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  var key='ow_counter_'+y+m+day;
  var n=Number(localStorage.getItem(key)||'0')+1;
  workerId='OW-'+y+m+day+'-'+String(n).padStart(4,'0');
  $('workerId').textContent=workerId;
}
function collect(){
  var data={workerId:workerId,savedAt:new Date().toISOString(),jobTypes:checkedValues('job-check'),certificationTickets:checkedValues('cert-check')};
  ['firstName','lastName','phone','email','country','nationality','experience','availability','location','certificates','notes'].forEach(function(id){data[id]=$(id).value;});
  data.jobType=data.jobTypes.join(', ');
  return data;
}
function valid(d){
  if(!d.firstName||!d.lastName||!d.phone||!d.country||!d.jobTypes.length){toast('Please complete first name, last name, phone, country and at least one job type.');return false;}
  return true;
}
async function save(){
  var d=collect();
  if(!valid(d))return;
  var dateKey=d.workerId.split('-')[1];
  localStorage.setItem('ow_counter_'+dateKey,String(Number(d.workerId.split('-')[2])));
  var records=localRecords();
  records.unshift(d);
  setLocalRecords(mergeRecords(records,[]));
  await saveToSheets(d);
  lastSavedId=d.workerId;
  $('savedId').textContent=d.workerId;
  reset(false);
  renderRecords();
  showSuccess();
}
function reset(makeNew){
  ['firstName','lastName','phone','email','country','nationality','experience','availability','location','certificates','notes'].forEach(function(id){$(id).value='';});
  document.querySelectorAll('.job-check,.cert-check').forEach(function(x){x.checked=false;});
  if(makeNew!==false)newId();
}
function clearForm(){
  if(confirm('Clear this worker form and start again?')){reset(true);toast('Form cleared.');window.scrollTo({top:0,behavior:'smooth'});}
}
function findRecord(id){return localRecords().find(function(x){return x.workerId===id;});}
function normalPhone(phone){
  var p=String(phone||'').replace(/[^\d+]/g,'');
  if(p.charAt(0)==='+')p=p.substring(1);
  if(p.charAt(0)==='0')p='27'+p.substring(1);
  return p;
}
function message(r){
  var tmpl=localStorage.getItem('ow_whatsapp_template')||'Hi {firstName}, this is regarding possible offshore work opportunities.';
  return tmpl.split('{firstName}').join(r.firstName||'').split('{lastName}').join(r.lastName||'').split('{jobType}').join(r.jobType||'').split('{workerId}').join(r.workerId||'');
}
function whatsapp(id){
  var r=findRecord(id||lastSavedId);
  if(!r){toast('No worker selected.');return;}
  var phone=normalPhone(r.phone);
  window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(message(r)),'_blank');
}

function csvEscape(v){
  v=String(v==null?'':v);
  if(/[",\n]/.test(v))return '"'+v.replace(/"/g,'""')+'"';
  return v;
}
function selectedWorkerIds(){
  return Array.prototype.slice.call(document.querySelectorAll('.select-worker:checked')).map(function(x){return x.value;});
}
function exportSelectedCsv(){
  var ids=selectedWorkerIds();
  if(!ids.length){toast('Please tick at least one worker first.');return;}
  var all=JSON.parse(localStorage.getItem('ow_records')||'[]');
  var rows=all.filter(function(r){return ids.indexOf(r.workerId)>-1;});
  var headers=['Worker ID','First Name','Last Name','Phone','Email','Country','Nationality','Job Types','Experience','Availability','Location','Certificates / Tickets','Other Certificates','Notes','Saved At'];
  var csv=[headers.join(',')].concat(rows.map(function(r){
    return [r.workerId,r.firstName,r.lastName,r.phone,r.email,r.country,r.nationality,(r.jobTypes||String(r.jobType||'').split(', ')).join(' | '),r.experience,r.availability,r.location,(r.certificationTickets||[]).join(' | '),r.certificates,r.notes,r.savedAt].map(csvEscape).join(',');
  })).join('\n');
  var a=document.createElement('a');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  a.href=URL.createObjectURL(blob);
  a.download='selected-offshore-workers.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
function clearSelectedWorkers(){
  document.querySelectorAll('.select-worker:checked').forEach(function(x){x.checked=false;});
}
function pf(label,value){
  return '<div class="print-field"><b>'+escapeHtml(label)+'</b><span>'+escapeHtml(value||'')+'</span></div>';
}
function printWorker(id){
  var r=findRecord(id);
  if(!r){toast('Worker not found.');return;}
  var name=((r.firstName||'')+' '+(r.lastName||'')).trim();
  $('printArea').innerHTML='<main class="print-page"><header class="print-header"><div class="print-title"><h1>Offshore Worker Profile</h1><div>Candidate record for future offshore work opportunities</div></div><div class="print-id">WORKER ID<br>'+escapeHtml(r.workerId)+'</div></header><section><h2>Worker Information</h2><div class="print-grid">'+pf('Full Name',name)+pf('Phone / WhatsApp',r.phone)+pf('Email',r.email)+pf('Country',r.country)+pf('Nationality',r.nationality)+pf('Job Types / Trades',(r.jobTypes||String(r.jobType||'').split(', ')).join(', '))+pf('Experience',r.experience)+pf('Availability',r.availability)+pf('Current Location',r.location)+pf('Saved At',new Date(r.savedAt).toLocaleString())+'</div></section><section><h2>Certificates / Tickets</h2><div class="print-field print-notes">'+escapeHtml((r.certificationTickets||[]).join(', '))+'</div></section><section><h2>Other Certificates / Tickets</h2><div class="print-field print-notes">'+escapeHtml(r.certificates||'')+'</div></section><section><h2>Notes</h2><div class="print-field print-notes">'+escapeHtml(r.notes||'')+'</div></section></main>';
  window.print();
}

function renderRecords(){
  var q=($('searchInput').value||'').toLowerCase();
  var list=$('recordList');
  var records=localRecords().filter(function(r){
    return [r.workerId,r.firstName,r.lastName,r.phone,r.email,r.country,r.nationality,r.jobType,(r.jobTypes||[]).join(' '),r.experience,r.availability,r.location,(r.certificationTickets||[]).join(' '),r.certificates,r.notes].join(' ').toLowerCase().indexOf(q)>-1;
  });
  list.innerHTML=records.length?records.map(function(r){
    var name=((r.firstName||'')+' '+(r.lastName||'')).trim();
    return '<div class="record"><div class="record-select"><input class="select-worker" type="checkbox" value="'+escapeHtml(r.workerId)+'"><div><strong>'+escapeHtml(r.workerId)+' · '+escapeHtml(name)+' <span class="tag">'+escapeHtml(r.jobType||'')+'</span></strong><br><small>'+escapeHtml(r.country||'')+' · '+escapeHtml(r.phone||'')+' · '+escapeHtml(r.availability||'')+'</small></div></div><div class="record-actions"><button class="whatsapp whatsapp-record" data-id="'+escapeHtml(r.workerId)+'">WhatsApp</button><button class="outline print-record" data-id="'+escapeHtml(r.workerId)+'">Print / PDF</button><button class="outline edit-record" data-id="'+escapeHtml(r.workerId)+'">Load</button></div></div>';
  }).join(''):'<p>No workers saved yet.</p>';
  list.querySelectorAll('.whatsapp-record').forEach(function(b){b.onclick=function(){whatsapp(b.dataset.id);};});
  list.querySelectorAll('.print-record').forEach(function(b){b.onclick=function(){printWorker(b.dataset.id);};});
  list.querySelectorAll('.edit-record').forEach(function(b){b.onclick=function(){loadRecord(b.dataset.id);};});
}
function loadRecord(id){
  var r=findRecord(id);if(!r)return;
  showForm();
  ['firstName','lastName','phone','email','country','nationality','experience','availability','location','certificates','notes'].forEach(function(k){if($(k))$(k).value=r[k]||'';});
  setCheckedValues('job-check',r.jobTypes||String(r.jobType||'').split(', ').filter(Boolean));
  setCheckedValues('cert-check',r.certificationTickets||[]);
  workerId=r.workerId;$('workerId').textContent=workerId;
  toast('Worker loaded. You can update details and save as a new record if needed.');
}
function exportData(){
  var a=document.createElement('a');
  var blob=new Blob([JSON.stringify(localRecords())],{type:'application/json'});
  a.href=URL.createObjectURL(blob);
  a.download='offshore-worker-records.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function saveOptions(){
  localStorage.setItem('ow_jobs',JSON.stringify(lines('jobOptions')));
  localStorage.setItem('ow_countries',JSON.stringify(lines('countryOptions')));
  localStorage.setItem('ow_certificates',JSON.stringify(lines('certificateOptions')));
  populate();
  toast('Dropdown options saved.');
}
function saveTemplate(){
  localStorage.setItem('ow_whatsapp_template',$('whatsappTemplate').value.trim());
  toast('WhatsApp template saved.');
}
function nav(id){['navForm','navRecords','navSettings'].forEach(function(n){$(n).classList.remove('active');});$(id).classList.add('active');}
function hideAll(){$('formScreen').style.display='none';$('hero').style.display='none';$('records').classList.remove('show');$('settings').classList.remove('show');$('success').classList.remove('show');}
function showForm(){hideAll();$('formScreen').style.display='block';$('hero').style.display='flex';nav('navForm');}
function showRecords(){hideAll();$('records').classList.add('show');nav('navRecords');renderRecords();}
function showSettings(){hideAll();$('settings').classList.add('show');nav('navSettings');settingsFields();}
function showSuccess(){hideAll();$('success').classList.add('show');nav('navForm');window.scrollTo({top:0,behavior:'smooth'});}

function bind(){
  $('navForm').onclick=function(){reset(true);showForm();};
  $('navRecords').onclick=showRecords;
  $('navSettings').onclick=showSettings;
  $('saveWorker').onclick=save;
  $('clearForm').onclick=clearForm;
  $('startNew').onclick=function(){reset(true);showForm();};
  $('whatsappLast').onclick=function(){whatsapp(lastSavedId);};
  $('searchInput').oninput=renderRecords;
  $('refreshSheets').onclick=async function(){await loadFromSheets();renderRecords();};
  $('exportBtn').onclick=exportData;
  $('exportSelectedCsv').onclick=exportSelectedCsv;
  $('clearSelected').onclick=clearSelectedWorkers;
  $('saveOptions').onclick=saveOptions;
  $('saveTemplate').onclick=saveTemplate;
}
async function init(){defaults();populate();settingsFields();newId();bind();await loadFromSheets();renderRecords();}
document.addEventListener('DOMContentLoaded',init);
})();