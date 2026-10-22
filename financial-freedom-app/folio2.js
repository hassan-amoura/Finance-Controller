/* Folio 2.0 foundation: non-destructive enhancement to the original app. */
(function(){
const $f=id=>document.getElementById(id), money=n=>'$'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2}), today=()=>new Date().toISOString().slice(0,10);
const init=()=>{data.folio2??={allowance:null,allowanceSpent:0,rules:[],overrides:{},history:[],horizon:3,layout:['balance','free','buckets'],buckets:[],manualAuto:true};return data.folio2};
const f=init();
const dateKey=d=>d.toISOString().slice(0,10);
function dates(rule,start,end){
 let result=[],d=new Date(rule.start+'T12:00:00'),last=new Date(end+'T12:00:00');
 if(isNaN(d))return result;
 for(let i=0;i<1000&&d<=last;i++){
  let key=dateKey(d),day=d.getDate(),month=d.getMonth(),year=d.getFullYear();
  let due=false;
  if(rule.frequency==='weekly')due=i%7===0;
  if(rule.frequency==='biweekly')due=i%14===0;
  if(rule.frequency==='monthly')due=day===Math.min(Number(rule.day)||1,new Date(year,month+1,0).getDate());
  if(rule.frequency==='twice')due=day===Math.min(Number(rule.day)||15,new Date(year,month+1,0).getDate())||day===new Date(year,month+1,0).getDate();
  if(due&&key>=start&&(!rule.end||key<=rule.end))result.push({id:rule.id+'@'+key,ruleId:rule.id,date:key,name:rule.name,kind:rule.kind,amount:Number(rule.amount),accountId:rule.accountId,bucket:rule.bucket||'',scheduled:true});
  d.setDate(d.getDate()+1);
 }
 return result;
}
function schedule(start,end){
 return f.rules.flatMap(r=>dates(r,start,end)).map(t=>Object.prototype.hasOwnProperty.call(f.overrides,t.id)?Object.assign({},t,f.overrides[t.id]):t).filter(t=>!t.deleted).sort((a,b)=>a.date.localeCompare(b.date));
}
function entries(start,end){return [...schedule(start,end),...data.transactions.filter(t=>t.date>=start&&t.date<=end).map(t=>({...t,scheduled:false}))].sort((a,b)=>a.date.localeCompare(b.date))}
function effect(t){return t.kind==='income'?Number(t.amount):-Number(t.amount)}
function futureBalance(start,end){return cash()+entries(start,end).reduce((n,t)=>n+effect(t),0)}
function change(fn,label){const before=JSON.stringify(f);fn();f.history.push({before,label});if(f.history.length>20)f.history.shift();save();render();toast(label+' · Undo available')}
window.folioUndo=()=>{let h=f.history.pop();if(!h)return;let restored=JSON.parse(h.before);Object.keys(restored).forEach(k=>{if(k!=='history')f[k]=restored[k]});save();render();toast('Undone: '+h.label)};
window.folioAllowance=()=>{if(demoMode){welcome();return}let v=prompt('Free to Use starting allowance (your choice)',f.allowance===null?'':f.allowance);if(v===null)return;let n=Number(v);if(!Number.isFinite(n)||n<0)return alert('Enter a valid amount');change(()=>{f.allowance=n;f.allowanceSpent=0},'Allowance updated')};
window.folioRuleForm=id=>{
 if(demoMode){welcome();return}
 const r=f.rules.find(x=>x.id===id)||{id:'',name:'',kind:'expense',amount:0,frequency:'monthly',day:1,start:today(),end:'',accountId:'',bucket:''};
 modal(id?'Edit recurring rule':'New recurring transaction', '<form onsubmit="folioSaveRule(event,\''+(id||'')+'\')"><div class="form-grid">'+field('Name','name',r.name)+field('Amount','amount',r.amount,'number','min="0" step=".01"')+'<label class="field">Type<select name="kind"><option value="expense" '+(r.kind==='expense'?'selected':'')+'>Expense</option><option value="income" '+(r.kind==='income'?'selected':'')+'>Income</option></select></label><label class="field">Repeat<select name="frequency">'+[['weekly','Weekly'],['biweekly','Every two weeks'],['twice','Twice monthly (day + month end)'],['monthly','Monthly']].map(([v,l])=>'<option value="'+v+'" '+(r.frequency===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label>'+field('Day of month (monthly / twice monthly)','day',r.day,'number','min="1" max="31"')+field('Starts','start',r.start,'date')+field('Ends (optional)','end',r.end,'date')+'<label class="field">Account<select name="accountId"><option value="">General / unassigned</option>'+data.accounts.filter(a=>a.type==='cash').map(a=>'<option value="'+esc(a.id)+'" '+(r.accountId===a.id?'selected':'')+'>'+esc(a.name)+'</option>').join('')+'</select></label>'+field('Bucket (optional)','bucket',r.bucket)+'</div><button class="btn" style="margin-top:14px">Save schedule</button></form>');
};
window.folioSaveRule=(e,id)=>{e.preventDefault();let z=e.target.elements,r={id:id||uid(),name:z.name.value.trim(),amount:Number(z.amount.value),kind:z.kind.value,frequency:z.frequency.value,day:Number(z.day.value)||1,start:z.start.value,end:z.end.value,accountId:z.accountId.value,bucket:z.bucket.value.trim()};if(!r.name||!r.start||r.amount<0)return alert('Complete the required fields');change(()=>{if(id)f.rules=f.rules.map(x=>x.id===id?r:x);else f.rules.push(r)},'Schedule saved');closeModal()};
window.folioDeleteRule=id=>{if(!confirm('Delete this recurring schedule and its future occurrences?'))return;change(()=>{f.rules=f.rules.filter(r=>r.id!==id);Object.keys(f.overrides).filter(k=>k.startsWith(id+'@')).forEach(k=>delete f.overrides[k])},'Schedule deleted')};
window.folioEditOccurrence=id=>{let t=schedule('2000-01-01','2040-12-31').find(x=>x.id===id);if(!t)return;let v=prompt('Actual amount for '+t.name, t.amount);if(v===null)return;let n=Number(v);if(!Number.isFinite(n)||n<0)return alert('Invalid amount');change(()=>{f.overrides[id]={amount:n}},'Transaction corrected')};
window.folioDeleteOccurrence=id=>change(()=>{f.overrides[id]={deleted:true}},'Transaction removed');
window.folioEditTransaction=id=>{let t=data.transactions.find(x=>x.id===id);if(!t)return;let v=prompt('Correct transaction amount',t.amount);if(v===null)return;let n=Number(v);if(!Number.isFinite(n)||n<0)return alert('Invalid amount');change(()=>{t.amount=n},'Transaction corrected')};
window.folioDeleteTransaction=id=>change(()=>{data.transactions=data.transactions.filter(x=>x.id!==id)},'Transaction removed');
window.folioSpend=()=>{if(f.allowance===null)return folioAllowance();let v=prompt('Record spending from Free to Use','');if(v===null)return;let n=Number(v);if(!Number.isFinite(n)||n<=0)return alert('Enter an amount');change(()=>{f.allowanceSpent+=n},'Spending recorded')};
window.folioHorizon=n=>{f.horizon=n;save();render()};
window.folioMonth=offset=>{window._folioMonth=Math.max(0,Math.min(f.horizon-1,(window._folioMonth||0)+offset));render()};
function future(){
 const now=new Date(),start=dateKey(now),endDate=new Date(now.getFullYear(),now.getMonth()+f.horizon,0),end=dateKey(endDate);
 const offset=Math.min(window._folioMonth||0,f.horizon-1),view=new Date(now.getFullYear(),now.getMonth()+offset,1),ym=view.toISOString().slice(0,7),monthStart=offset===0?start:ym+'-01',monthEnd=dateKey(new Date(view.getFullYear(),view.getMonth()+1,0));
 const rows=entries(monthStart,monthEnd);let bal=cash()+entries(start,monthStart).filter(t=>t.date<monthStart).reduce((n,t)=>n+effect(t),0);
 let low=bal,lines=rows.map(t=>{bal+=effect(t);low=Math.min(low,bal);return '<div class="line"><div><strong>'+esc(t.name)+'</strong><div class="muted">'+esc(t.date)+(t.scheduled?' · Scheduled':' · Recorded')+' · Balance '+money(bal)+'</div></div><div style="text-align:right"><strong style="color:'+(effect(t)>=0?'#247c5c':'inherit')+'">'+(effect(t)>=0?'+':'−')+money(t.amount)+'</strong><div><button class="switch" onclick="'+(t.scheduled?'folioEditOccurrence':'folioEditTransaction')+'(\''+esc(t.id)+'\')">Edit</button><button class="switch" onclick="'+(t.scheduled?'folioDeleteOccurrence':'folioDeleteTransaction')+'(\''+esc(t.id)+'\')">Delete</button></div></div></div>'}).join('');
 return '<div class="section-head"><div><h1>Your future</h1><p class="muted">See what happens before you spend. Scheduled items are estimates, not bank-verified transactions.</p></div></div><div class="actions">'+[1,3,6,12].map(n=>'<button class="btn '+(f.horizon===n?'':'ghost')+'" onclick="folioHorizon('+n+')">'+n+'M</button>').join('')+'</div><div class="panel deep" style="margin-top:16px"><div class="eyebrow">Projected cash at '+esc(end)+'</div><div class="big">'+money(futureBalance(start,end))+'</div><div class="muted">Based on current cash and recorded/scheduled entries. Edit any event to recalculate.</div></div><div class="section-head"><h2>Monthly timeline</h2><div class="actions"><button class="btn ghost small" onclick="folioMonth(-1)">‹</button><strong>'+view.toLocaleDateString('en-US',{month:'long',year:'numeric'})+'</strong><button class="btn ghost small" onclick="folioMonth(1)">›</button></div></div><div class="panel"><div class="muted">Lowest projected balance this month: '+money(low)+'</div>'+(lines||'<div class="empty">No events for this month. Add a recurring paycheck or bill.</div>')+'</div><div class="section-head"><h2>Automatic money schedule</h2><button class="btn small" onclick="folioRuleForm()">+ Add recurring</button></div><div class="panel">'+(f.rules.map(r=>'<div class="line"><div><strong>'+esc(r.name)+'</strong><div class="muted">'+money(r.amount)+' · '+esc(r.frequency)+' · '+esc(r.start)+'</div></div><div class="actions"><button class="switch" onclick="folioRuleForm(\''+esc(r.id)+'\')">Edit</button><button class="switch" onclick="folioDeleteRule(\''+esc(r.id)+'\')">Delete</button></div></div>').join('')||'<div class="empty">Set up paychecks and bills once. They will appear automatically in your forecast.</div>')+'</div><details class="panel" style="margin-top:14px"><summary><strong>Existing plan and assumptions</strong></summary><div class="muted" style="margin:12px 0">Your original plan is preserved. Use Settings and existing tools to manage older assumptions.</div><button class="btn ghost" onclick="folioOldPlan()">View original Plan</button></details>';
}
window.folioOldPlan=()=>{window._folioOld=true;render()};
const originalNav=nav,originalRender=render;
nav=function(){originalNav();for(const id of ['nav','bottom']){let node=$f(id);if(!node)continue;node.querySelectorAll('button').forEach(b=>{if(b.textContent.trim()==='Plan')b.textContent='Future'})}};
render=function(){originalRender();if(tab==='plan'&&!window._folioOld){$f('plan').innerHTML=future()}if(tab==='home'){let home=$f('home'),available=f.allowance===null?null:f.allowance-f.allowanceSpent;home.insertAdjacentHTML('afterbegin','<div class="panel mint" style="margin-bottom:15px"><div class="eyebrow">Free to Use · Your chosen allowance</div><div class="number">'+(available===null?'Not set':money(available))+'</div><p class="muted">Your spending allowance is separate from your checking and savings balances.</p><div class="actions"><button class="btn small" onclick="folioAllowance()">Set amount</button><button class="btn ghost small" onclick="folioSpend()">Record spending</button>'+(f.history.length?'<button class="btn ghost small" onclick="folioUndo()">↶ Undo</button>':'')+'</div></div>')}if(f.history.length&&tab==='plan')$f('plan').insertAdjacentHTML('afterbegin','<button class="btn ghost small" style="margin-bottom:12px" onclick="folioUndo()">↶ Undo last change</button>')};
nav();render();
})();