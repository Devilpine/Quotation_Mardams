const peso = n => '₱' + (Number.isFinite(n) ? n : 0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
function recalculate(){
  const rate = Math.max(0, Number(document.getElementById('rate').value)||0);
  let subtotal=0;
  document.querySelectorAll('#items tr').forEach(row=>{
    const w=Math.max(0,Number(row.querySelector('.width').value)||0);
    const h=Math.max(0,Number(row.querySelector('.height').value)||0);
    const q=Math.max(0,Number(row.querySelector('.qty').value)||0);
    const unit=row.querySelector('.unit').value;
    const toFeet={ft:1,m:3.280839895,cm:0.032808399,in:1/12}[unit]||1;
    const area=(w*toFeet)*(h*toFeet)*q, amount=area*rate;
    row.querySelector('.area').textContent=area.toFixed(2);
    row.querySelector('.amount').textContent=peso(amount);
    subtotal+=amount;
  });
  const getMoney=id=>Math.max(0,Number(document.getElementById(id)?.value)||0);
  const layoutFee=getMoney('layoutFee'), installationFee=getMoney('installationFee'), deliveryFee=getMoney('deliveryFee');
  const discountRate=Math.min(100,getMoney('discount'));
  const gross=subtotal+layoutFee+installationFee+deliveryFee;
  const discountAmount=gross*discountRate/100;
  const beforeVat=Math.max(0,gross-discountAmount);
  const vat=beforeVat*0.12;
  document.getElementById('subtotal').textContent=peso(subtotal);
  document.getElementById('discountAmount').textContent=peso(discountAmount);
  document.getElementById('beforeVat').textContent=peso(beforeVat);
  document.getElementById('vat').textContent=peso(vat);
  document.getElementById('grandTotal').textContent=peso(beforeVat+vat);
}
function addRow(){
  const tr=document.createElement('tr');
  tr.innerHTML=`<td><input class="desc" placeholder="Tarpaulin / project description"></td>
  <td><input class="width" type="number" min="0" step="0.01" placeholder="0" oninput="recalculate()"></td>
  <td><input class="height" type="number" min="0" step="0.01" placeholder="0" oninput="recalculate()"></td>
  <td><select class="unit" onchange="recalculate()" style="width:100%;padding:8px 4px;border:1px solid var(--line);border-radius:5px;background:#fff"><option value="ft">Feet (ft)</option><option value="m">Meters (m)</option><option value="cm">Centimeters (cm)</option><option value="in">Inches (in)</option></select></td>
  <td><input class="qty" type="number" min="0" step="1" value="1" oninput="recalculate()"></td>
  <td class="calc area">0.00</td><td class="calc amount">₱0.00</td>
  <td class="remove-col"><button class="remove" type="button" onclick="removeRow(this)" aria-label="Remove item">×</button></td>`;
  document.getElementById('items').appendChild(tr);recalculate();
}
function removeRow(button){
  const rows=document.querySelectorAll('#items tr');
  if(rows.length===1){button.closest('tr').querySelectorAll('input').forEach(i=>i.value='');button.closest('tr').querySelector('.qty').value=1;}
  else button.closest('tr').remove();
  recalculate();
}
function resetForm(){
  if(!confirm('Clear all quotation details and line items?'))return;
  document.querySelectorAll('#quotation input, #quotation textarea').forEach(el=>{if(el.type==='date'||el.type==='number')el.value='';else el.value='';});
  document.getElementById('items').innerHTML='';
  addRow();recalculate();
}
document.getElementById('quoteDate').value=new Date().toISOString().slice(0,10);
recalculate();



const DB_KEY='mardamSignAdsManager_v1';
let records=JSON.parse(localStorage.getItem(DB_KEY)||'{"quotations":[],"customers":[]}');
let currentQuoteId=null;
function persistDB(){localStorage.setItem(DB_KEY,JSON.stringify(records));}
function showView(view){
 document.querySelectorAll('.view-panel').forEach(p=>p.hidden=true);
 const target=document.getElementById('view-'+view); if(target)target.hidden=false;
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 document.getElementById('quotationWorkspace').style.display=view==='create'?'block':'none';
 if(view==='dashboard')renderDashboard(); if(view==='history')renderHistory(); if(view==='customers')renderCustomers();
 window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
function startNewQuotation(){
 currentQuoteId=null; resetForm();
 document.getElementById('quoteStatus').value='Pending';
 showView('create');
}
function snapshotQuote(){
 const fields={};
 document.querySelectorAll('#quotation input,#quotation textarea,#quotation select').forEach((el,i)=>{
  if(el.id)fields[el.id]=el.value;
 });
 const items=[...document.querySelectorAll('#items tr')].map(row=>({
  desc:row.querySelector('.desc').value,width:row.querySelector('.width').value,
  height:row.querySelector('.height').value,unit:row.querySelector('.unit').value,
  qty:row.querySelector('.qty').value
 }));
 return {fields,items,status:document.getElementById('quoteStatus').value};
}
function saveQuotation(){
 const customer=(document.getElementById('customer').value||'').trim();
 if(!customer){alert('Please enter a customer or company name before saving.');document.getElementById('customer').focus();return;}
 const snap=snapshotQuote(), now=new Date().toISOString();
 let rec=records.quotations.find(q=>q.id===currentQuoteId);
 if(rec){Object.assign(rec,{...snap,updatedAt:now});}
 else {rec={id:'Q'+Date.now().toString(36).toUpperCase(),...snap,createdAt:now,updatedAt:now};records.quotations.unshift(rec);currentQuoteId=rec.id;}
 upsertCustomer(customer,document.getElementById('contact').value,document.getElementById('address').value);
 persistDB();renderDashboard();alert('Quotation saved on this device.');
}
function upsertCustomer(name,contact,address){
 let c=records.customers.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(c){c.contact=contact;c.address=address;c.updatedAt=new Date().toISOString();}
 else records.customers.push({name,contact,address,updatedAt:new Date().toISOString()});
}
function loadQuotation(id,duplicate=false){
 const q=records.quotations.find(x=>x.id===id);if(!q)return;
 resetForm();
 Object.entries(q.fields||{}).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=val;});
 document.getElementById('items').innerHTML='';
 (q.items||[]).forEach((it,index)=>{
  if(index>0)addRow();
  const row=document.querySelectorAll('#items tr')[index];
  row.querySelector('.desc').value=it.desc||'';row.querySelector('.width').value=it.width||'';
  row.querySelector('.height').value=it.height||'';row.querySelector('.unit').value=it.unit||'ft';
  row.querySelector('.qty').value=it.qty||1;
 });
 document.getElementById('quoteStatus').value=q.status||'Pending';
 currentQuoteId=duplicate?null:q.id;
 if(duplicate){document.getElementById('quoteDate').value=new Date().toISOString().slice(0,10);}
 recalculate();showView('create');
}
function setStatus(id,status){
 const q=records.quotations.find(x=>x.id===id);if(q){q.status=status;q.updatedAt=new Date().toISOString();persistDB();renderHistory();renderDashboard();}
}
function deleteQuotation(id){
 if(!confirm('Delete this saved quotation? This cannot be undone.'))return;
 records.quotations=records.quotations.filter(q=>q.id!==id);persistDB();renderHistory();renderDashboard();
}
function fmtDate(s){return s?new Date(s).toLocaleDateString('en-PH'):'—';}
function statusPill(s){return '<span class="status-pill status-'+(s||'Pending').toLowerCase()+'">'+(s||'Pending')+'</span>';}
function quotationTotal(q){
 const f=q.fields||{};let subtotal=0;const rate=Number(f.rate)||0;
 (q.items||[]).forEach(i=>{const conv={ft:1,m:3.280839895,cm:.032808399,in:1/12}[i.unit||'ft']||1;subtotal+=(Number(i.width)||0)*conv*(Number(i.height)||0)*conv*(Number(i.qty)||0)*rate;});
 const gross=subtotal+(Number(f.layoutFee)||0)+(Number(f.installationFee)||0)+(Number(f.deliveryFee)||0);
 return gross*(1-Math.min(100,Number(f.discount)||0)/100)*1.12;
}
function tableRows(list){
 if(!list.length)return '<div class="empty-state">No quotation records found.</div>';
 return '<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+list.map(q=>'<tr><td><b>'+esc(q.fields?.customer||'—')+'</b><br><small>'+esc(q.id)+'</small></td><td>'+fmtDate(q.fields?.quoteDate||q.createdAt)+'</td><td><b>'+peso(quotationTotal(q))+'</b></td><td>'+statusPill(q.status)+'</td><td><button class="light" onclick="loadQuotation('+JSON.stringify(q.id)+')">Edit</button><button class="light" onclick="loadQuotation('+JSON.stringify(q.id)+',true)">Duplicate</button><button class="light" onclick="deleteQuotation('+JSON.stringify(q.id)+')">Delete</button></td></tr>').join('')+'</tbody></table></div>';
}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderDashboard(){
 const qs=records.quotations;document.getElementById('statQuotes').textContent=qs.length;
 document.getElementById('statApproved').textContent=qs.filter(q=>q.status==='Approved').length;
 document.getElementById('statPending').textContent=qs.filter(q=>q.status==='Pending').length;
 document.getElementById('statCustomers').textContent=records.customers.length;
 document.getElementById('dashboardRecent').innerHTML=tableRows(qs.slice(0,5));
}
function renderHistory(){
 const term=(document.getElementById('historySearch')?.value||'').toLowerCase(),status=document.getElementById('historyStatus')?.value||'';
 const list=records.quotations.filter(q=>(!status||q.status===status)&&((q.fields?.customer||'').toLowerCase().includes(term)||(q.items||[]).some(i=>(i.desc||'').toLowerCase().includes(term))));
 document.getElementById('historyTable').innerHTML=tableRows(list);
}
function renderCustomers(){
 const el=document.getElementById('customerTable');if(!records.customers.length){el.innerHTML='<div class="empty-state">No customers saved yet. Save a quotation to add a customer.</div>';return;}
 el.innerHTML='<div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Customer</th><th>Contact</th><th>Address</th><th>Last updated</th></tr></thead><tbody>'+records.customers.map(c=>'<tr><td><b>'+esc(c.name)+'</b></td><td>'+esc(c.contact||'—')+'</td><td>'+esc(c.address||'—')+'</td><td>'+fmtDate(c.updatedAt)+'</td></tr>').join('')+'</tbody></table></div>';
}
renderDashboard();showView('dashboard');
