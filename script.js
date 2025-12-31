// تنظیمات پروژه
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

// متغیرهای سراسری
let allData = [];
let cart = [];
let currentItem = null;
let currentOrderApp = '';

// شروع برنامه
window.onload = async () => {
    // 1. تایمر معکوس
    startFomoTimer();
    
    // 2. کد بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) sessionStorage.setItem('nano_ref', urlParams.get('ref'));

    // 3. هشدار خروج
    window.onbeforeunload = () => "آیا مطمئن هستید؟";

    // 4. دریافت داده‌ها
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseCSV(text);
        
        // اگر شیت خالی بود یا خطا داد، از فایل بکاپ بخوان
        if(allData.length === 0 && typeof backupData !== 'undefined') {
            console.warn("Using Backup Data");
            allData = backupData;
        }

        document.getElementById('loader-overlay').style.display = 'none';
        
        // راه‌اندازی بخش‌ها
        initSlider();
        renderAlbums();
        filterGrid('همه');
        setupSwipe(); // ژست‌های حرکتی

    } catch (e) {
        console.error("Sheet Error, falling back...", e);
        if(typeof backupData !== 'undefined') {
            allData = backupData;
            document.getElementById('loader-overlay').style.display = 'none';
            initSlider();
            renderAlbums();
            filterGrid('همه');
        }
    }

    // بستن مودال با کلیک بیرون
    window.onclick = (e) => {
        if(e.target == document.getElementById('modal')) closeModal();
        if(e.target == document.getElementById('order-modal')) closeOrderModal();
    }
};

// --- منطق داده‌ها ---
function parseCSV(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!row) continue;
        const c = row.map(x => x.replace(/^"|"$/g, '').trim());
        
        // بررسی لینک معتبر
        if(c[1] && c[1].startsWith('http')) {
            // تاج طلایی (سیستم 0.5)
            let rate = parseFloat(c[8]) || 4.5;
            let crownsHtml = "";
            for(let j=1; j<=5; j++) {
                if(j <= rate) crownsHtml += '<i class="fas fa-crown"></i>';
                else if(j - 0.5 <= rate) crownsHtml += '<i class="fas fa-crown" style="opacity:0.5"></i>';
                else crownsHtml += '<i class="fas fa-crown" style="color:#444"></i>';
            }

            res.push({
                id: `NANO-${1000+i}`,
                cat: c[0] || "عمومی",
                img: c[1],
                price: c[2] || "0",
                off: c[3] || "0",
                title: c[4] || `طرح شماره ${1000+i}`,
                desc: c[5] || "",
                views: c[6] || Math.floor(Math.random()*2000)+100,
                likes: c[7] || Math.floor(Math.random()*500)+20,
                rate: rate,
                crowns: crownsHtml
            });
        }
    }
    return res;
}

// --- اسلایدر ---
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

// --- آلبوم‌ها (تگ‌ها) ---
function renderAlbums() {
    const cats = ['همه', ...new Set(allData.map(d=>d.cat))];
    const con = document.getElementById('tags-container');
    cats.forEach(c => {
        const sample = c==='همه'?allData[0]:allData.find(x=>x.cat===c);
        con.innerHTML += `
            <div class="album-tag ${c==='همه'?'active':''}" onclick="filterGrid('${c}', this)">
                <img src="${sample.img}">
                <span>${c}</span>
            </div>`;
    });
}

// --- گالری ---
function filterGrid(cat, el) {
    if(el) {
        document.querySelectorAll('.album-tag').forEach(t=>t.classList.remove('active'));
        el.classList.add('active');
    }
    const data = cat === 'همه' || !cat ? allData : allData.filter(x => x.cat===cat);
    
    const grid = document.getElementById('grid-view');
    grid.innerHTML = '';
    
    data.forEach(item => {
        const hasOff = item.off && item.off !== "0";
        const pShow = hasOff 
            ? `<span class="off-line">${fmt(item.price)}</span> ${fmt(item.off)}` 
            : (item.price==="0" ? "توافقی" : fmt(item.price));
            
        grid.innerHTML += `
            <div class="art-card" onclick="openModal('${item.id}')">
                <div class="card-thumb">
                    <img src="${item.img}" loading="lazy">
                    <button class="glass-add" onclick="event.stopPropagation(); quickAdd('${item.id}', this)">+</button>
                    ${hasOff ? '<span class="badge">تخفیف</span>' : ''}
                </div>
                <div class="card-body">
                    <div class="c-stats">
                        <span><i class="fas fa-eye"></i> ${item.views}</span>
                        <span><i class="fas fa-heart"></i> ${item.likes}</span>
                    </div>
                    <div class="c-crowns">${item.crowns}</div>
                    <div class="c-price">${pShow} ت</div>
                </div>
            </div>`;
    });

    // رندر کتاب (ساده شده برای پرفورمنس)
    renderBook(data.slice(0, 40));
}

// --- مودال ---
function openModal(id) {
    currentItem = allData.find(x => x.id === id);
    if(!currentItem) return;

    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc || "بدون توضیحات";
    document.getElementById('m-views').innerText = currentItem.views;
    document.getElementById('m-likes').innerText = currentItem.likes;
    document.getElementById('m-crown').innerHTML = currentItem.crowns;
    
    const pb = document.getElementById('m-price');
    if(currentItem.off && currentItem.off!=="0") {
        pb.innerHTML = `<span style="text-decoration:line-through;color:#777;font-size:1rem">${fmt(currentItem.price)}</span> ${fmt(currentItem.off)} تومان`;
    } else {
        pb.innerText = currentItem.price==="0" ? "توافقی" : fmt(currentItem.price) + " تومان";
    }

    updateListBtnState();
    
    // ساخت دکمه‌های پیام رسان
    const grid = document.getElementById('social-grid');
    grid.innerHTML = '';
    const apps = ['wa','tg','ei','ba','ru','ig'];
    apps.forEach(app => {
        grid.innerHTML += `<button class="s-btn ${app}" onclick="openOrderForm('${app}')">
            <img src="${CONFIG.logos[app]}"> ${app.toUpperCase()}
        </button>`;
    });

    document.getElementById('modal').style.display = 'block';
}

// --- عملیات لیست ---
function toggleListState() {
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        cart = cart.filter(c => c.id !== currentItem.id);
    } else {
        cart.push(currentItem);
        flyAnim();
    }
    updateListBtnState();
    updateCartUI();
}

function updateListBtnState() {
    const btn = document.getElementById('btn-add-list');
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        btn.innerHTML = `<i class="fas fa-trash"></i> حذف از لیست سفارش`;
        btn.className = "main-action-btn remove-mode";
    } else {
        btn.innerHTML = `<i class="fas fa-plus-circle"></i> افزودن به لیست`;
        btn.className = "main-action-btn add-mode";
    }
}

function quickAdd(id, btn) {
    const item = allData.find(x => x.id === id);
    if(!cart.find(c => c.id === id)) {
        cart.push(item);
        flyAnim();
        updateCartUI();
        btn.style.background = "var(--success)";
        btn.innerHTML = "✓";
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
    
    const soc = document.getElementById('cart-socials');
    soc.innerHTML = '';
    ['wa','tg','ei','ba','ru'].forEach(k => soc.innerHTML += `<button onclick="openOrderForm('${k}', true)" style="border:none;background:none;cursor:pointer"><img src="${CONFIG.logos[k]}" width="35"></button>`);
}

// --- فرم سفارش پیشرفته (New) ---
function openOrderForm(app, fromCart = false) {
    currentOrderApp = app;
    const modal = document.getElementById('order-modal');
    document.getElementById('order-logo').src = CONFIG.logos[app];
    document.getElementById('order-app-name').innerText = app.toUpperCase();
    
    const summary = document.getElementById('order-summary-text');
    if(fromCart) {
        if(cart.length === 0) return alert("سبد خالی است");
        summary.innerHTML = cart.map(c => `▪️ ${c.title} (${c.id})`).join('<br>');
    } else {
        summary.innerHTML = `▪️ ${currentItem.title} (${currentItem.id})`;
    }
    
    modal.style.display = 'block';
}

function finalizeOrder() {
    const name = document.getElementById('user-name').value;
    const phone = document.getElementById('user-phone').value;
    
    if(!name || !phone) return alert("لطفا نام و شماره تماس را وارد کنید");
    
    const summary = document.getElementById('order-summary-text').innerText;
    const ref = sessionStorage.getItem('nano_ref') || "";
    
    // ساخت متن سفارش
    let msg = `📋 *سفارش جدید*\n👤 نام: ${name}\n📞 تلفن: ${phone}\n\n🛒 لیست سفارش:\n${summary}`;
    
    // کد مخفی
    if(ref) msg += `\n\n\n\n\n\n\nRefID: ${ref}`;
    
    // کپی در کلیپ بورد
    navigator.clipboard.writeText(msg).then(() => {
        alert("سفارش کپی شد! در حال انتقال به برنامه...");
        
        // باز کردن برنامه
        const enc = encodeURIComponent(msg);
        let link = "";
        switch(currentOrderApp) {
            case 'wa': link = `https://wa.me/${CONFIG.refPhone}?text=${enc}`; break;
            case 'tg': link = `https://t.me/Official_iDirect?text=${enc}`; break;
            case 'ei': link = `https://eitaa.com/Official_iDirect`; break; // ایتا متن نمیگیرد
            case 'ba': link = `https://ble.ir/Official_iDirect`; break;
            case 'ru': link = `https://rubika.ir/Official_iDirect`; break;
            case 'ig': link = `https://ig.me/m/nanometriclab`; break;
        }
        window.open(link, '_blank');
        closeOrderModal();
    });
}

// --- ابزارهای کمکی ---
function startFomoTimer() {
    const end = new Date();
    end.setHours(21,0,0,0);
    if(new Date() > end) end.setDate(end.getDate()+1);
    
    setInterval(() => {
        const diff = end - new Date();
        const h = Math.floor(diff/3600000);
        const m = Math.floor((diff%3600000)/60000);
        const s = Math.floor((diff%60000)/1000);
        document.getElementById('countdown').innerText = `${h}:${m}:${s}`;
    }, 1000);
}

function setupSwipe() {
    let x = 0;
    document.body.addEventListener('touchstart', e => x = e.touches[0].screenX);
    document.body.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].screenX - x;
        if(diff > 100) toggleCartPanel(); // راست به چپ (باز شدن منو)
        if(diff < -100) toggleContactMenu(); // چپ به راست
    });
}

function flyAnim() {
    const el = document.getElementById('fly-el');
    el.style.display = 'block';
    el.style.top = '50%'; el.style.left = '50%';
    setTimeout(() => { el.style.top = '90%'; el.style.left = '5%'; el.style.opacity = '0'; }, 50);
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 600);
}

// توابع ساده
function toggleTheme() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme')==='dark'?'light':'dark'); }
function fmt(n) { return parseInt(n).toLocaleString(); }
function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }
function toggleContactMenu() { document.getElementById('contact-opts').classList.toggle('show'); }
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function closeOrderModal() { document.getElementById('order-modal').style.display = 'none'; }
function clearCart() { if(confirm('لیست پاک شود؟')){ cart=[]; updateCartUI(); } }
function shareProduct() {
    if(navigator.share) navigator.share({title:currentItem.title, text:`طرح ${currentItem.title}`, url:window.location.href});
    else { navigator.clipboard.writeText(window.location.href); alert('لینک کپی شد'); }
}
function copyCode() { navigator.clipboard.writeText(currentItem.id); alert('کد کپی شد'); }
function openFullscreen() { document.getElementById('fs-img').src=currentItem.img; document.getElementById('fs-viewer').style.display='flex'; }
function closeFullscreen() { document.getElementById('fs-viewer').style.display='none'; }
function setView(v) { 
    document.getElementById('grid-view').style.display = v==='grid'?'grid':'none'; 
    document.getElementById('book-view').style.display = v==='book'?'flex':'none'; 
}

// کتاب (ساده)
function renderBook(data) {
    const s = document.getElementById('book-pages');
    s.innerHTML = '';
    // گرید داخلی برای آلبوم
    let html = `<div class="book-page"><h3>آلبوم ژورنال</h3><p>برای ورق زدن کلیک کنید</p></div>`;
    // هر 4 عکس در یک صفحه
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
