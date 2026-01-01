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
let currentZoom = 1;

// --- شروع ---
window.onload = async () => {
    // 1. کد بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) sessionStorage.setItem('nano_ref', urlParams.get('ref'));

    // 2. هشدار خروج
    window.onbeforeunload = () => "آیا خارج می‌شوید؟";

    // 3. دریافت داده‌ها
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseCSV(text);
        
        // بکاپ
        if(allData.length === 0 && typeof backupData !== 'undefined') allData = backupData;

        document.getElementById('loader-overlay').style.display = 'none';
        
        // راه‌اندازی
        initSlider();
        renderAlbums();
        applyFilters(); // جایگزین filterGrid ساده
        setupGestures();

        // 4. لاجیک تایمر کل سایت
        checkGlobalTimer();

    } catch (e) {
        console.warn("Error loading sheet, using backup", e);
        if(typeof backupData !== 'undefined') {
            allData = backupData;
            document.getElementById('loader-overlay').style.display = 'none';
            initSlider();
            renderAlbums();
            applyFilters();
        }
    }
};

// --- پردازش داده‌ها (19 ستون) ---
function parseCSV(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!row) continue;
        const c = row.map(x => x.replace(/^"|"$/g, '').trim());

        if(c[3] && c[3].startsWith('http')) { // Image Check
            // لاجیک قیمت
            let price = c[4];
            let off = c[7]; // تخفیف دستی
            let finalPrice = price;
            
            if(c[5]) { // درصد تخفیف دارد
                const percent = parseFloat(c[5]);
                const pVal = parseFloat(price);
                if(!isNaN(percent) && !isNaN(pVal)) {
                    finalPrice = pVal - (pVal * percent / 100);
                    off = Math.round(finalPrice).toString();
                }
            }

            // امتیاز و تاج
            let rate = parseFloat(c[14]) || 4.5;
            let crownsHtml = "";
            for(let j=1; j<=5; j++) {
                if(j <= rate) crownsHtml += '<i class="fas fa-crown"></i>';
                else if(j - 0.5 <= rate) crownsHtml += '<i class="fas fa-crown" style="opacity:0.5"></i>';
                else crownsHtml += '<i class="fas fa-crown" style="color:#444"></i>';
            }

            res.push({
                cat: c[0] || "عمومی",
                title: c[1] || `طرح ${i}`,
                style: c[2] || "",
                img: c[3],
                price: price || "0",
                off: off || "0",
                timerTitle: c[8],
                timerDate: c[9],
                globalTimerDate: c[10], // ستون K
                globalTimerTitle: c[11], // ستون L
                views: c[12] || Math.floor(Math.random()*1000)+100,
                likes: c[13] || Math.floor(Math.random()*200),
                score: rate,
                crowns: crownsHtml,
                priceRange: c[15],
                type: c[16],
                status: c[17],
                desc: c[18] || "",
                id: `NANO-${1000+i}`
            });
        }
    }
    return res;
}

// --- لاجیک تایمر ---
function checkGlobalTimer() {
    // پیدا کردن اولین آیتمی که تایمر کل سایت دارد
    const globalItem = allData.find(x => x.globalTimerDate && x.globalTimerDate.includes(":"));
    
    if(globalItem) {
        const endDate = new Date(globalItem.globalTimerDate).getTime();
        const title = globalItem.globalTimerTitle || "تخفیف سراسری";
        
        if(endDate > Date.now()) {
            document.getElementById('global-fomo-bar').style.display = 'flex';
            document.getElementById('global-timer-title').innerText = title;
            
            setInterval(() => {
                const now = new Date().getTime();
                const dist = endDate - now;
                if(dist < 0) {
                    document.getElementById('global-fomo-bar').style.display = 'none';
                    return;
                }
                const d = Math.floor(dist / (1000 * 60 * 60 * 24));
                const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((dist % (1000 * 60)) / 1000);
                document.getElementById('global-countdown').innerText = `${d}روز ${h}:${m}:${s}`;
            }, 1000);
            return; // تایمر سراسری فعال شد، تایمرهای تکی نمایش داده نمی‌شوند
        }
    }
}

function getCardTimer(item) {
    if(document.getElementById('global-fomo-bar').style.display === 'flex') return ""; // اگر سراسری فعاله، تکی نشون نده
    
    if(item.timerDate && item.timerDate.includes(":")) {
        const end = new Date(item.timerDate).getTime();
        if(end > Date.now()) {
            // محاسبه استاتیک برای نمایش اولیه (داینامیک کردنش روی کارت سنگین میشه)
            return `<div class="card-timer">⏳ تخفیف ویژه: ${item.timerTitle || ""}</div>`;
        }
    }
    return "";
}

// --- رندرینگ ---
function initSlider() {
    const wrap = document.getElementById('slider-wrapper');
    const items = allData.slice(0, 20).sort(() => 0.5 - Math.random());
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'swiper-slide';
        div.innerHTML = `<img src="${item.img}"><div class="slide-title">${item.title}</div>`;
        div.onclick = () => openModal(item.id);
        wrap.appendChild(div);
    });
    new Swiper(".mySwiper", { loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"} });
}

function renderAlbums() {
    const cats = ['همه', ...new Set(allData.map(d=>d.cat))];
    const con = document.getElementById('tags-container');
    cats.forEach(c => {
        const sample = c==='همه'?allData[0]:allData.find(x=>x.cat===c);
        con.innerHTML += `
            <div class="album-tag ${c==='همه'?'active':''}" onclick="setCategory('${c}', this)">
                <img src="${sample.img}"><span>${c}</span>
            </div>`;
    });
}

let activeCat = 'همه';
function setCategory(cat, el) {
    activeCat = cat;
    document.querySelectorAll('.album-tag').forEach(t=>t.classList.remove('active'));
    el.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const sort = document.getElementById('sortSelect').value;
    const pFilter = document.getElementById('priceFilter').value;
    const tFilter = document.getElementById('typeFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();

    let data = activeCat === 'همه' ? allData : allData.filter(x => x.cat === activeCat);

    // جستجو
    if(search.length > 1) {
        data = data.filter(x => x.title.toLowerCase().includes(search) || x.id.toLowerCase().includes(search) || x.cat.includes(search));
    }

    // فیلتر قیمت (فرضی - چون داده قیمت رشته است باید تمیز شود)
    // اینجا ساده‌سازی شده. برای لاجیک دقیق باید ستون P اکسل را بخوانیم
    
    // فیلتر نوع (ستون Q)
    if(tFilter !== 'all') data = data.filter(x => x.type && x.type.includes(tFilter));

    // سورت
    if(sort === 'new') data.sort((a,b) => b.id.localeCompare(a.id));
    if(sort === 'pop') data.sort((a,b) => b.score - a.score);
    if(sort === 'cheap') data.sort((a,b) => parseFloat(a.price) - parseFloat(b.price));

    renderGrid(data);
}
document.getElementById('searchInput').addEventListener('input', applyFilters);

function renderGrid(data) {
    const grid = document.getElementById('grid-view');
    grid.innerHTML = '';
    
    data.forEach(item => {
        const hasOff = item.off && item.off !== "0";
        const priceDisplay = hasOff 
            ? `<span class="off-line">${fmt(item.price)}</span> ${fmt(item.off)}` 
            : (item.price === "0" ? "توافقی" : fmt(item.price));
            
        grid.innerHTML += `
            <div class="art-card" onclick="openModal('${item.id}')">
                <div class="card-thumb">
                    <img src="${item.img}" loading="lazy">
                    <button class="glass-add" onclick="event.stopPropagation(); quickAdd('${item.id}', this)">+ افزودن</button>
                    ${hasOff ? '<span class="badge">تخفیف</span>' : ''}
                    ${getCardTimer(item)}
                </div>
                <div class="card-body">
                    <div class="c-stats">
                        <span class="c-stat-item"><i class="fas fa-eye"></i> ${item.views}</span>
                        <span class="c-stat-item"><i class="fas fa-heart"></i> ${item.likes}</span>
                    </div>
                    <div class="c-crowns">${item.crowns} <span style="color:#666;font-size:0.7rem">${item.score}</span></div>
                    <div class="c-price">${priceDisplay} ت</div>
                    <div class="code-tiny" onclick="event.stopPropagation(); copyText('${item.id}')">${item.id}</div>
                </div>
            </div>`;
    });
    renderBook(data.slice(0, 40));
}

// --- مودال ---
function openModal(id) {
    currentItem = allData.find(x => x.id === id);
    if(!currentItem) return;

    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc || "توضیحات تکمیلی موجود نیست.";
    document.getElementById('m-views').innerText = currentItem.views;
    document.getElementById('m-likes').innerText = currentItem.likes;
    document.getElementById('m-crown').innerHTML = currentItem.crowns;

    const pb = document.getElementById('m-price');
    if(currentItem.off && currentItem.off!=="0") {
        pb.innerHTML = `<span style="text-decoration:line-through;color:#888;font-size:1rem">${fmt(currentItem.price)}</span> ${fmt(currentItem.off)} تومان`;
    } else {
        pb.innerText = currentItem.price==="0" ? "قیمت توافقی" : fmt(currentItem.price) + " تومان";
    }

    updateListBtnState();

    // سوشال مدیا (فقط دکمه‌های آیکونی ریز در مودال طبق درخواست قدیم، یا حذف طبق درخواست جدید؟)
    // درخواست جدید گفتید "دکمه‌های پیام‌رسان رو بردار و فقط کپی و ارسال بذار" -> این برای سبد بود
    // برای مودال تکی هنوز دکمه‌های آیکونی باشند؟ طبق دیزاین می‌ذاریم:
    const grid = document.getElementById('social-grid');
    grid.innerHTML = '';
    const apps = ['wa','tg','ei','ba','ru','ig'];
    apps.forEach(k => {
        grid.innerHTML += `<button class="s-btn ${k}" onclick="openMsgSelectorTaki('${k}')">
            <img src="${CONFIG.logos[k]}">
            ${k.toUpperCase()}
        </button>`;
    });

    document.getElementById('modal').style.display = 'block';
}

// --- عملیات لیست ---
function toggleListState() {
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        cart = cart.filter(c => c.id !== currentItem.id);
        showToast("از لیست حذف شد");
    } else {
        cart.push(currentItem);
        flyAnim();
        showToast("به لیست اضافه شد");
    }
    updateListBtnState();
    updateCartUI();
}

function updateListBtnState() {
    const btn = document.getElementById('btn-add-list');
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        btn.className = "glassy-add-btn remove-mode";
    } else {
        btn.className = "glassy-add-btn add-mode";
    }
}

function quickAdd(id, btn) {
    const item = allData.find(x => x.id === id);
    if(!cart.find(c => c.id === id)) {
        cart.push(item);
        flyAnim();
        updateCartUI();
        btn.innerHTML = "✓";
        btn.style.background = "#00ff88";
        showToast("به لیست اضافه شد");
    }
}

// --- سبد خرید ---
function updateCartUI() {
    document.getElementById('cart-badge').innerText = cart.length;
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    let total = 0;
    
    cart.forEach((c, i) => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        list.innerHTML += `
            <div class="d-item">
                <img src="${c.img}">
                <div style="flex:1"><b>${c.title}</b><br><small>${c.id}</small></div>
                <button onclick="cart.splice(${i},1);updateCartUI()" style="color:red;border:none;background:none">✕</button>
            </div>`;
    });
    document.getElementById('cart-total').innerText = `جمع: ${fmt(total)} تومان`;
}

// --- ارسال نهایی (Logic جدید) ---
function openMsgSelector() {
    if(cart.length === 0) return alert("لیست خالی است!");
    document.getElementById('msg-selector-modal').style.display = 'flex';
}

function closeMsgSelector() {
    document.getElementById('msg-selector-modal').style.display = 'none';
}

function finalizeOrder(app) {
    // تولید متن سفارش
    let msg = "📋 *سفارش جدید*\n\n";
    cart.forEach(c => {
        msg += `▪️ ${c.title} (کد: ${c.id})\n`;
    });
    
    const ref = sessionStorage.getItem('nano_ref') || "";
    if(ref) msg += `\n\nRef: ${ref}`; // فاصله زیاد با نامرئی؟ اینجا ساده گذاشتیم
    
    // کپی
    navigator.clipboard.writeText(msg).then(() => {
        showToast("متن سفارش کپی شد! باز شدن برنامه...");
        
        const enc = encodeURIComponent(msg);
        let link = "";
        switch(app) {
            case 'wa': link = `https://wa.me/${CONFIG.refPhone}?text=${enc}`; break;
            case 'tg': link = `https://t.me/Official_iDirect?text=${enc}`; break;
            case 'ei': link = `https://eitaa.com/Official_iDirect`; break;
            case 'ba': link = `https://ble.ir/Official_iDirect`; break;
            case 'ru': link = `https://rubika.ir/Official_iDirect`; break;
            case 'ig': link = `https://ig.me/m/nanometriclab`; break;
        }
        window.open(link, '_blank');
        closeMsgSelector();
    });
}

// --- ابزارها ---
function showToast(txt) {
    const t = document.getElementById('toast-msg');
    t.innerText = txt;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 2000);
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
    else { navigator.clipboard.writeText(window.location.href); showToast("لینک محصول کپی شد"); }
}

function toggleTheme() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme')==='dark'?'light':'dark'); }
function fmt(n) { return parseInt(n).toLocaleString(); }
function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }
function toggleContactMenu() { document.getElementById('contact-opts').classList.toggle('show'); }
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function clearCart() { if(confirm('لیست پاک شود؟')){ cart=[]; updateCartUI(); } }
function setView(v) { 
    document.getElementById('grid-view').style.display = v==='grid'?'grid':'none'; 
    document.getElementById('book-view').style.display = v==='book'?'flex':'none'; 
}

// --- زوم ---
function zoomStep(step) {
    const img = document.getElementById('m-img');
    currentZoom += step * 0.2;
    if(currentZoom < 1) currentZoom = 1;
    img.style.transform = `scale(${currentZoom})`;
}
function openFullscreen() {
    document.getElementById('fs-img').src = currentItem.img;
    document.getElementById('fs-viewer').style.display = 'flex';
}
function closeFullscreen() { document.getElementById('fs-viewer').style.display = 'none'; }
let fsZ = 1;
function fsZoom(s) { fsZ += s*0.5; if(fsZ<1) fsZ=1; document.getElementById('fs-img').style.transform=`scale(${fsZ})`; }

function setupGestures() {
    let x = 0;
    document.body.addEventListener('touchstart', e => x = e.touches[0].screenX);
    document.body.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].screenX - x;
        if(diff > 100) toggleCartPanel(); 
        if(diff < -100) toggleContactMenu();
    });
}

// کتاب ساده
function renderBook(data) {
    const s = document.getElementById('book-pages');
    s.innerHTML = '';
    let html = `<div class="book-page"><h3>آلبوم</h3><p>ورق بزنید</p></div>`;
    for(let i=0; i<data.length; i+=4) {
        let imgs = "";
        for(let j=0; j<4 && i+j<data.length; j++) imgs += `<img src="${data[i+j].img}">`;
        html += `<div class="book-page">${imgs}</div>`;
    }
    s.innerHTML = html;
}
let bIdx = 0;
function nextPage() { 
    const p = document.querySelectorAll('.book-page');
    if(bIdx < p.length-1) { p[bIdx].style.transform="rotateY(-180deg)"; bIdx++; document.getElementById('flip-sound').play(); }
}
function prevPage() {
    const p = document.querySelectorAll('.book-page');
    if(bIdx > 0) { bIdx--; p[bIdx].style.transform="rotateY(0deg)"; document.getElementById('flip-sound').play(); }
}