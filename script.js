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
  const layoutFee=Math.max(0,Number(document.getElementById('layoutFee').value)||0);
  const beforeVat=subtotal+layoutFee;
  const vat=beforeVat*0.12;
  document.getElementById('subtotal').textContent=peso(subtotal);
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