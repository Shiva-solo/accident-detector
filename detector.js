/* thresholds */
const IMPACT_G   = 2.7;   // big jolt
const SPEED_DROP = 2.8;   //  ~10 km/h (2.8 m/s) within 1 s
const API_URL    = 'https://example.com/api/accidents'; // <-- change

/* elements */
const btn = document.getElementById('btnToggle');
const status = document.getElementById('status');
const overlay = document.getElementById('overlay');
const countSpan = document.getElementById('count');
const btnCancel = document.getElementById('btnCancel');

let monitoring=false, impact=false, lastSpeed=0, timer=null;

/* register service-worker (offline) */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

/* toggle start / stop */
btn.addEventListener('click', async ()=>{
  if (!monitoring){
    /* ask motion permission */
    if (typeof DeviceMotionEvent?.requestPermission === 'function'){
      if (await DeviceMotionEvent.requestPermission() !== 'granted'){
        alert('Motion permission denied'); return;
      }
    }
    monitoring=true; btn.textContent='Stop Monitoring'; status.textContent='Status: Monitoring…';
    window.addEventListener('devicemotion', onMotion);
  } else {
    monitoring=false; btn.textContent='Start Monitoring'; status.textContent='Status: Stopped';
    window.removeEventListener('devicemotion', onMotion);
  }
});

/* motion handler */
function onMotion(e){
  if (!monitoring) return;
  const {x=0,y=0,z=0}=e.accelerationIncludingGravity;
  const g=Math.hypot(x,y,z)/9.81;
  if (!impact && g>=IMPACT_G){
      impact=true;
      navigator.geolocation.getCurrentPosition(p1=>{
        lastSpeed=p1.coords.speed||0;
        setTimeout(()=>navigator.geolocation.getCurrentPosition(p2=>{
          if ((lastSpeed-(p2.coords.speed||0))>=SPEED_DROP){ showCountdown(p2.coords); }
          impact=false;
        }),1000);
      },()=>impact=false,{enableHighAccuracy:true});
  }
}

/* countdown */
function showCountdown(coords){
  overlay.style.display='block'; let s=10; countSpan.textContent=s;
  timer=setInterval(()=>{countSpan.textContent=--s;
    if(s===0){clearInterval(timer); sendAlert(coords);} },1000);
}

btnCancel.onclick=()=>{clearInterval(timer); overlay.style.display='none';
  status.textContent='Status: Cancelled';};

/* send alert */
function sendAlert(c){
  overlay.style.display='none'; monitoring=false; btn.textContent='Start Monitoring';
  status.textContent='Status: Sending alert…';
  fetch(API_URL,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({lat:c.latitude,lng:c.longitude,time:new Date().toISOString()})
  }).then(()=>status.textContent='Status: Alert sent ✔')
    .catch(()=>status.textContent='Status: Alert failed ✖');
}
