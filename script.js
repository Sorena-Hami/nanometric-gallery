const CONFIG = {
    sheetID: '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI',
    refPhone: "989304653535",
    logos: {
        wa: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767115995/25-256308_whatsapp-social-media-icons-whatsapp_o9zkit.png",
        tg: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767113676/telgrampng.parspng.com__rzuqpw.png",
        ei: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767111952/Eitaa-vector-logo_1221133400_we5m5l.png",
        ba: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767112210/bale-color_a9gfhw.png",
        ru: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767112404/Rubika_Icon_zlc48h.png",
        ig: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767116766/050e6fb1-f306-4571-a198-61f15806718e_1_ln8bgv.png"
    }
};

let allData = [];
let cart = [];
let currentItem = null;

// شروع
window.onload = async () => {
    // کد بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) sessionStorage.setItem('nano_ref', urlParams.get('ref'));

    // هشدار خروج
    window.onbeforeunload = () => "آیا خارج می‌شوید؟";

    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseCSV(text);
        
        // اگر خالی بود، بکاپ
        if(allData.length === 0) allData = getBackupData();

        document.getElementById('loader-overlay').style.display = 'none';
        
        initSlider();
        renderAlbums();
        applyFilters();
        checkGlobalTimer();

    } catch (e) {
        console.warn("Using Backup", e);
        allData = getBackupData();
        document.getElementById('loader-overlay').style.display = 'none';
        initSlider();
        renderAlbums();
        applyFilters();
    }
};

// پارسر
function parseCSV(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!row) continue;
        const c = row.map(x => x.replace(/^"|"$/g, '').trim());

        if(c[3] && c[3].startsWith('http')) {
            let price = c[4];
            let off = c[7];
            
            // محاسبه درصد
            if(c[5]) {
                const pVal = parseFloat(price);
                const perc = parseFloat(c[5]);
                if(!isNaN(pVal) && !isNaN(perc)) {
                    off = Math.round(pVal - (pVal * perc / 100)).toString();
                }
            }

            // تاج
            let rate = parseFloat(c[14]) || 4.5;
            let crowns = "";
            for(let j=1; j<=5; j++) crowns += (j <= rate) ? '👑' : (j-0.5<=rate ? '👑' : '');

            res.push({
                id: `NANO-${1000+i}`,
                cat: c[0] || "عمومی",
                title: c[1] || `طرح ${i}`,
                img: c[3],
                price: price || "0",
                off: off || "0",
                views: c[12] || 900,
                likes: c[13] || 150,
                crowns: crowns,
                desc: c[18] || "",
                globalDate: c[10],
                globalTitle: c[11]
            });
        }
    }
    return res;
}

function getBackupData() {
    return [
        { id: "NANO-1", cat: "ترمیم عکس", title: "نمونه ترمیم", img: "https://images.unsplash.com/photo-1548695602-5e49c7173b4d?auto=format&fit=crop&w=500&q=80", price: "200000", off: "150000", views: 1200, likes: 350, crowns: "👑👑👑👑" }
    ];
}

// تایمر سراسری
function checkGlobalTimer() {
    const gItem = allData.find(x => x.globalDate && x.globalDate.includes(":"));
    if(gItem) {
        const end = new Date(gItem.globalDate).getTime();
        if(end > Date.now()) {
            document.getElementById('global-fomo-bar').style.display = 'flex';
            document.getElementById('global-timer-title').innerText = gItem.globalTitle || "تخفیف ویژه:";
            setInterval(() => {
                const dist = end - Date.now();
                if(dist < 0) return;
                const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((dist % (1000 * 60)) / 1000);
                document.getElementById('global-countdown').innerText = `${h}:${m}:${s}`;
            }, 1000);
        }
    }
}

// اسلایدر
function initSlider() {
    const w = document.getElementById('slider-wrapper');
    allData.slice(0, 15).sort(()=>0.5-Math.random()).forEach(i => {
        w.innerHTML += `<div class="swiper-slide" onclick="openModal('${i.id}')"><img src="${i.img}"><div class="slide-title">${i.title}</div></div>`;
    });
    new Swiper(".mySwiper", {loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"}});
}

// آلبوم‌ها
function renderAlbums() {
    const cats = ['همه', ...new Set(allData.map(d=>d.cat))];
    const c = document.getElementById('tags-container');
    cats.forEach(k => {
        const s = k==='همه' ? allData[0] : allData.find(x=>x.cat===k);
        c.innerHTML += `<div class="album-tag" onclick="filterGrid('${k}', this)"><img src="${s.img}"><span>${k}</span></div>`;
    });
}

let activeCat = 'همه';
function filterGrid(cat, el) {
    if(el) {
        document.querySelectorAll('.album-tag').forEach(t=>t.classList.remove('active'));
        el.classList.add('active');
    }
    activeCat = cat;
    applyFilters();
}

function applyFilters() {
    const sort = document.getElementById('sortSelect').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let data = activeCat === 'همه' ? allData : allData.filter(x => x.cat === activeCat);
    
    if(search.length > 1) {
        data = data.filter(x => x.title.toLowerCase().includes(search) || x.id.toLowerCase().includes(search));
    }

    if(sort === 'new') data.sort((a,b) => b.id.localeCompare(a.id));
    if(sort === 'pop') data.sort((a,b) => b.likes - a.likes);
    if(sort === 'cheap') data.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));

    renderGrid(data);
}
document.getElementById('searchInput').addEventListener('input', applyFilters);

function renderGrid(data) {
    const grid = document.getElementById('grid-view');
    grid.innerHTML = '';
    data.forEach(i => {
        const hasOff = i.off && i.off !== "0";
        const pShow = hasOff ? `<span class="off-line">${fmt(i.price)}</span> ${fmt(i.off)}` : (i.price==="0"?"توافقی":fmt(i.price));
        grid.innerHTML += `
            <div class="art-card" onclick="openModal('${i.id}')">
                <div class="card-thumb">
                    <img src="${i.img}" loading="lazy">
                    <button class="glass-add" onclick="event.stopPropagation(); quickAdd('${i.id}', this)">+ افزودن به لیست</button>
                    ${hasOff ? '<span style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 6px;border-radius:4px;font-size:0.7rem;font-weight:bold">تخفیف</span>' : ''}
                </div>
                <div class="card-body">
                    <div class="c-stats">
                        <span>👁 ${i.views}</span> <span>❤️ ${i.likes}</span> <span>${i.crowns}</span>
                    </div>
                    <div class="c-price">${pShow} ت</div>
                    <div class="copy-code-tiny" onclick="event.stopPropagation(); copyText('${i.id}')">${i.id}</div>
                </div>
            </div>`;
    });
}

// مودال
function openModal(id) {
    currentItem = allData.find(x=>x.id===id);
    if(!currentItem) return;
    
    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc;
    document.getElementById('m-views').innerText = currentItem.views;
    document.getElementById('m-likes').innerText = currentItem.likes;
    document.getElementById('m-crown').innerHTML = currentItem.crowns;
    
    const pb = document.getElementById('m-price');
    if(currentItem.off && currentItem.off!=="0") pb.innerHTML = `<span style="text-decoration:line-through;color:#888;font-size:1rem">${fmt(currentItem.price)}</span> ${fmt(currentItem.off)} تومان`;
    else pb.innerText = currentItem.price==="0" ? "توافقی" : fmt(currentItem.price) + " تومان";

    updateListBtn();
    
    const sg = document.getElementById('social-grid');
    sg.innerHTML = '';
    ['wa','tg','ei','ba','ru','ig'].forEach(k => {
        sg.innerHTML += `<button class="s-btn" onclick="openMsgSelector()"><img src="${CONFIG.logos[k]}"></button>`;
    });

    document.getElementById('modal').style.display = 'block';
}

function updateListBtn() {
    const btn = document.getElementById('btn-add-list');
    const isIn = cart.find(c=>c.id===currentItem.id);
    if(isIn) {
        btn.innerHTML = "🗑 حذف از لیست سفارشات";
        btn.className = "glassy-add-btn remove-mode";
        btn.nextElementSibling && (btn.nextElementSibling.innerText = "این مورد در لیست موجود است");
    } else {
        btn.innerHTML = "+ افزودن به لیست سفارشات";
        btn.className = "glassy-add-btn add-mode";
    }
}

function toggleListState() {
    const idx = cart.findIndex(c=>c.id===currentItem.id);
    if(idx > -1) { cart.splice(idx, 1); showToast("حذف شد"); }
    else { cart.push(currentItem); showToast("اضافه شد"); flyAnim(); }
    updateListBtn();
    updateCartUI();
}

function quickAdd(id, btn) {
    const item = allData.find(x=>x.id===id);
    if(!cart.find(c=>c.id===id)) {
        cart.push(item);
        flyAnim();
        updateCartUI();
        btn.style.background = "#00ff88";
        btn.innerText = "✓";
        showToast("اضافه شد");
    }
}

function updateCartUI() {
    document.getElementById('cart-badge').innerText = cart.length;
    const l = document.getElementById('cart-list');
    l.innerHTML = '';
    let total = 0;
    cart.forEach((c, i) => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        l.innerHTML += `<div class="d-item"><img src="${c.img}"><div style="flex:1"><b>${c.title}</b><br><small>${c.id}</small></div><button onclick="cart.splice(${i},1);updateCartUI()" style="color:red;background:none;border:none">✕</button></div>`;
    });
    document.getElementById('cart-total').innerText = `جمع: ${fmt(total)} تومان`;
}

// پیام‌رسان
function openMsgSelector() {
    if(cart.length===0) return alert("لیست خالی است!");
    document.getElementById('msg-selector-modal').style.display = 'flex';
}
function closeMsgSelector() { document.getElementById('msg-selector-modal').style.display = 'none'; }

function finalizeOrder(app) {
    let msg = "📋 *سفارش جدید*\n\n";
    cart.forEach(c => msg += `▪️ ${c.title} (${c.id})\n`);
    
    const ref = sessionStorage.getItem('nano_ref') || "";
    if(ref) msg += `\n\nRef: ${ref}`;

    navigator.clipboard.writeText(msg).then(() => {
        showToast("کپی شد! باز کردن برنامه...");
        const enc = encodeURIComponent(msg);
        let link = "";
        if(app==='wa') link = `https://wa.me/${CONFIG.refPhone}?text=${enc}`;
        if(app==='tg') link = `https://t.me/Official_iDirect?text=${enc}`;
        if(app==='ei') link = `https://eitaa.com/Official_iDirect`;
        if(app==='ru') link = `https://rubika.ir/Official_iDirect`;
        if(app==='ig') link = `https://ig.me/m/nanometriclab`;
        
        window.open(link, '_blank');
        closeMsgSelector();
    });
}

// ابزارها
function showToast(txt) {
    const t = document.getElementById('toast-msg');
    t.innerText = txt;
    t.style.display = 'block';
    setTimeout(()=>t.style.display='none', 2000);
}
function flyAnim() {
    const el = document.getElementById('fly-el');
    el.style.display = 'block';
    el.style.top = '50%'; el.style.left = '50%';
    setTimeout(() => { el.style.top = '90%'; el.style.left = '5%'; el.style.opacity = '0'; }, 50);
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 600);
}
function copyText(txt) { navigator.clipboard.writeText(txt); showToast("کد کپی شد"); }
function copyCode() { copyText(currentItem.id); }
function copyDesc() { navigator.clipboard.writeText(currentItem.desc); showToast("توضیحات کپی شد"); }
function shareProduct() {
    if(navigator.share) navigator.share({title:currentItem.title, text:`طرح ${currentItem.title}`, url:window.location.href});
    else { navigator.clipboard.writeText(window.location.href); showToast("لینک کپی شد"); }
}
function fmt(n) { return parseInt(n).toLocaleString(); }
function toggleTheme() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme')==='dark'?'light':'dark'); }
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }
function toggleContactMenu() { document.getElementById('contact-opts').classList.toggle('show'); }
function clearCart() { if(confirm('پاک شود؟')){cart=[]; updateCartUI();} }
function openFullscreen() { document.getElementById('fs-img').src=currentItem.img; document.getElementById('fs-viewer').style.display='flex'; }
function closeFullscreen() { document.getElementById('fs-viewer').style.display='none'; }
function setView(v) { 
    document.getElementById('grid-view').style.display = v==='grid'?'grid':'none'; 
    document.getElementById('book-view').style.display = v==='book'?'flex':'none'; 
}
function prevPage() { /* Book logic simplified */ }
function nextPage() { /* Book logic simplified */ }
