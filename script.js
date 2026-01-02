const CONFIG = {
    sheetID: '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI',
    phone: "989304653535"
};

let allData = [];
let cart = [];
let currentItem = null;
let zoomLevel = 1;

// شروع
window.onload = async () => {
    // 1. کد بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) sessionStorage.setItem('nano_ref', urlParams.get('ref'));

    // 2. مدیریت دکمه بازگشت (History API)
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        if(document.getElementById('product-modal').style.display === 'block') {
            closeModal();
            window.history.pushState(null, null, window.location.href);
        } else if(document.getElementById('cart-drawer').classList.contains('open')) {
            toggleCart();
            window.history.pushState(null, null, window.location.href);
        }
    };

    // 3. دریافت داده
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseCSV(text);
        if(allData.length === 0 && typeof backupData !== 'undefined') allData = backupData;
        
        document.getElementById('loader-overlay').style.display = 'none';
        initApp();
    } catch (e) {
        console.warn("Sheet Error", e);
        if(typeof backupData !== 'undefined') allData = backupData;
        document.getElementById('loader-overlay').style.display = 'none';
        initApp();
    }
};

function initApp() {
    initSlider();
    renderAlbums();
    filterGrid('همه');
    checkGlobalTimer();
}

// پارسر 19 ستون
function parseCSV(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const r = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!r) continue;
        const c = r.map(x => x.replace(/^"|"$/g, '').trim());

        if(c[3] && c[3].startsWith('http')) {
            // محاسبات قیمت
            let price = c[4];
            let off = c[7];
            if(c[5]) { // درصد
                const p = parseFloat(price);
                const perc = parseFloat(c[5]);
                if(!isNaN(p) && !isNaN(perc)) off = Math.round(p - (p * perc / 100)).toString();
            }

            // محاسبات تاج
            let rate = parseFloat(c[14]) || 4.5;
            let crowns = "";
            for(let j=1; j<=5; j++) crowns += (j<=rate) ? "👑" : (j-0.5<=rate ? "👑" : "");

            // اشتراک (موشک) - اگر ستون S نبود، محاسبه کن
            let shares = Math.floor(Math.random()*50) + 5; 

            res.push({
                id: `NANO-${1000+i}`, cat: c[0]||"عمومی", title: c[1]||`طرح ${i}`, img: c[3],
                price: price||"0", off: off||"0",
                views: c[12]||900, likes: c[13]||150, score: rate, crowns: crowns, shares: shares,
                desc: c[18]||"",
                gDate: c[10], gTitle: c[11]
            });
        }
    }
    return res;
}

// تایمر
function checkGlobalTimer() {
    const gItem = allData.find(x => x.gDate && x.gDate.includes(":"));
    if(gItem) {
        const end = new Date(gItem.gDate).getTime();
        if(end > Date.now()) {
            document.getElementById('global-fomo').style.display = 'flex';
            document.getElementById('fomo-title').innerText = gItem.gTitle || "تخفیف ویژه:";
            setInterval(() => {
                const d = end - Date.now();
                if(d < 0) return;
                const h = Math.floor((d%(1000*60*60*24))/(1000*60*60));
                const m = Math.floor((d%(1000*60*60))/(1000*60));
                const s = Math.floor((d%(1000*60))/1000);
                document.getElementById('fomo-time').innerText = `${h}:${m}:${s}`;
            }, 1000);
        }
    }
}

// اسلایدر
function initSlider() {
    const w = document.getElementById('slider-wrapper');
    allData.slice(0,10).forEach(i => {
        w.innerHTML += `<div class="swiper-slide" onclick="openModal('${i.id}')"><img src="${i.img}"><div class="slide-txt">${i.title}</div></div>`;
    });
    new Swiper(".mySwiper", {loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"}});
}

// آلبوم
function renderAlbums() {
    const cats = ['همه', ...new Set(allData.map(x=>x.cat))];
    const c = document.getElementById('tags-container');
    cats.forEach(k => {
        const s = k==='همه'?allData[0]:allData.find(x=>x.cat===k);
        c.innerHTML += `<div class="album" onclick="filterGrid('${k}', this)"><img src="${s.img}"><span>${k}</span></div>`;
    });
}

function filterGrid(cat, el) {
    if(el) { document.querySelectorAll('.album').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
    const d = cat==='همه' ? allData : allData.filter(x=>x.cat===cat);
    const g = document.getElementById('grid-view');
    g.innerHTML = '';
    
    d.forEach(i => {
        const hasOff = i.off && i.off!=="0";
        const pShow = hasOff ? `<span class="old">${fmt(i.price)}</span> ${fmt(i.off)}` : (i.price==="0"?"توافقی":fmt(i.price));
        
        g.innerHTML += `
            <div class="card" onclick="openModal('${i.id}')">
                <div class="card-img">
                    <img src="${i.img}" loading="lazy">
                    <div class="glass-btn" id="btn-${i.id}" onclick="event.stopPropagation(); quickToggle('${i.id}')">+ افزودن به لیست</div>
                    ${hasOff ? '<span style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 5px;border-radius:4px;font-size:0.7rem">تخفیف</span>' : ''}
                </div>
                <div class="card-info">
                    <div class="stats">
                        <span><i class="fas fa-eye"></i> ${i.views}</span>
                        <span><i class="fas fa-heart"></i> ${i.likes}</span>
                        <span><i class="fas fa-crown" style="color:gold"></i> ${i.score}</span>
                        <span><i class="fas fa-paper-plane" style="color:#00f2ff"></i> ${i.shares}</span>
                    </div>
                    <div class="price-row">${pShow} ت</div>
                    <div class="copy-code" onclick="event.stopPropagation(); copyText('${i.id}')"><i class="far fa-copy"></i> ${i.id}</div>
                </div>
            </div>`;
    });
}

// دکمه افزودن/حذف سریع
function quickToggle(id) {
    const btn = document.getElementById(`btn-${id}`);
    const item = allData.find(x=>x.id===id);
    const idx = cart.findIndex(c=>c.id===id);
    
    if(idx > -1) {
        cart.splice(idx, 1);
        btn.classList.remove('added');
        btn.innerHTML = "+ افزودن به لیست";
        btn.style.background = "rgba(255,255,255,0.2)";
        showToast("حذف شد");
    } else {
        cart.push(item);
        btn.classList.add('added');
        btn.innerHTML = "✓ در لیست";
        btn.style.background = "#00ff88";
        btn.style.color = "black";
        showToast("اضافه شد");
    }
    updateCartUI();
}

// مودال
function openModal(id) {
    currentItem = allData.find(x=>x.id===id);
    if(!currentItem) return;
    
    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc;
    document.getElementById('m-view').innerText = currentItem.views;
    document.getElementById('m-like').innerText = currentItem.likes;
    document.getElementById('m-crown').innerHTML = currentItem.crowns;
    document.getElementById('m-share').innerText = currentItem.shares;

    const pb = document.getElementById('m-price');
    if(currentItem.off && currentItem.off!=="0") pb.innerHTML = `<span class="old">${fmt(currentItem.price)}</span> ${fmt(currentItem.off)} تومان`;
    else pb.innerText = currentItem.price==="0" ? "توافقی" : fmt(currentItem.price) + " تومان";

    updateModalBtn();
    document.getElementById('product-modal').style.display = 'block';
}

function updateModalBtn() {
    const btn = document.getElementById('add-btn');
    const isIn = cart.find(c=>c.id===currentItem.id);
    if(isIn) {
        btn.innerText = "🗑 حذف از لیست";
        btn.style.background = "#ff3b30";
        btn.style.color = "white";
    } else {
        btn.innerText = "+ افزودن به لیست";
        btn.style.background = "var(--primary)";
        btn.style.color = "black";
    }
}

function toggleList() {
    const idx = cart.findIndex(c=>c.id===currentItem.id);
    if(idx > -1) { cart.splice(idx, 1); showToast("حذف شد"); }
    else { cart.push(currentItem); showToast("اضافه شد"); }
    updateModalBtn();
    updateCartUI();
    // سینک دکمه کوچک
    const mini = document.getElementById(`btn-${currentItem.id}`);
    if(mini) {
        if(idx > -1) { mini.classList.remove('added'); mini.innerHTML="+ افزودن به لیست"; mini.style.background="rgba(255,255,255,0.2)"; }
        else { mini.classList.add('added'); mini.innerHTML="✓ در لیست"; mini.style.background="#00ff88"; mini.style.color="black"; }
    }
}

// سبد
function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const l = document.getElementById('cart-items');
    l.innerHTML = '';
    let total = 0;
    cart.forEach((c, i) => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        l.innerHTML += `<div style="display:flex;gap:10px;margin-bottom:10px;border-bottom:1px solid #333;padding:5px"><img src="${c.img}" style="width:50px;height:50px;border-radius:5px"><div style="flex:1"><b>${c.title}</b><br><small>${c.id}</small></div><button onclick="cart.splice(${i},1);updateCartUI()" style="color:red;background:none;border:none">✕</button></div>`;
    });
    document.getElementById('cart-total').innerText = `جمع: ${fmt(total)} تومان`;
}

// ارسال
function openSendModal() {
    if(cart.length===0) return alert('لیست خالی است');
    document.getElementById('send-modal').style.display = 'flex';
}

function finalize(app) {
    let msg = "📋 سفارش:\n";
    cart.forEach(c => msg += `- ${c.title} (${c.id})\n`);
    const ref = sessionStorage.getItem('nano_ref');
    if(ref) msg += `\nRef: ${ref}`;
    
    navigator.clipboard.writeText(msg).then(() => {
        showToast("کپی شد! باز کردن برنامه...");
        const enc = encodeURIComponent(msg);
        let link = "";
        if(app==='wa') link = `https://wa.me/${CONFIG.phone}?text=${enc}`;
        if(app==='tg') link = `https://t.me/Official_iDirect?text=${enc}`;
        if(app==='ei') link = `https://eitaa.com/Official_iDirect`;
        if(app==='ru') link = `https://rubika.ir/Official_iDirect`;
        if(app==='ig') link = `https://ig.me/m/nanometriclab`;
        window.open(link, '_blank');
        document.getElementById('send-
