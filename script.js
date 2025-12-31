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
let bookIndex = 0;

// تایمر معکوس FOMO (تا 21:00 فردا)
function startTimer() {
    const end = new Date();
    end.setDate(end.getDate() + 1); // فردا
    end.setHours(21, 0, 0, 0); // ساعت 21
    
    setInterval(() => {
        const now = new Date();
        const diff = end - now;
        if(diff < 0) {
             // اگر زمان گذشت، دوباره 24 ساعت اضافه کن
             end.setDate(end.getDate() + 1);
             return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown').innerText = `${h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
    }, 1000);
}

// 1. شروع
window.onload = async () => {
    startTimer();
    
    // بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) sessionStorage.setItem('nano_ref', urlParams.get('ref'));

    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseData(text);
        
        document.getElementById('loader-overlay').style.display = 'none';
        
        initSlider();
        renderTags();
        filterGrid('همه');
        setupGestures();

    } catch (e) {
        console.error(e);
        document.getElementById('loader-text').innerText = "خطا در اتصال";
    }
};

function parseData(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!row) continue;
        const c = row.map(x => x.replace(/^"|"$/g, '').trim());
        
        if(c[1] && c[1].startsWith('http')) {
            const id = 1000 + i;
            // تولید آمار پایدار (بر اساس تاریخ و ID)
            const base = (id * 17) + new Date().getDate(); 
            const views = (base % 5000) + 300;
            const likes = Math.floor(views * 0.15);
            // تاج
            const score = (3.6 + (views % 14) / 10).toFixed(1);
            let crowns = "";
            for(let j=0; j<5; j++) crowns += j < Math.floor(score) ? "🌕" : "🌑";

            res.push({
                id: `NANO-${id}`, cat: c[0], img: c[1],
                price: c[2]||"0", off: c[3]||"0", title: c[4]||`طرح ${id}`, desc: c[5]||"",
                views, likes, crowns, score
            });
        }
    }
    return res;
}

// 2. اسلایدر (با کلیک روی اسلاید باز شود)
function initSlider() {
    const wrap = document.getElementById('slider-wrapper');
    const items = allData.slice(0, 20).sort(() => 0.5 - Math.random()); // 20 آیتم تصادفی
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'swiper-slide';
        div.innerHTML = `<img src="${item.img}"><div class="slide-cap">${item.title}</div>`;
        div.onclick = () => openModal(item.id);
        wrap.appendChild(div);
    });
    new Swiper(".mySwiper", { loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"} });
}

// 3. تگ‌ها
function renderTags() {
    const cats = ['همه', ...new Set(allData.map(d=>d.cat))];
    const con = document.getElementById('tags-container');
    cats.forEach(c => {
        const sample = c==='همه'?allData[0]:allData.find(x=>x.cat===c);
        con.innerHTML += `<div class="tag ${c==='همه'?'active':''}" onclick="filterGrid('${c}', this)"><img src="${sample.img}"> ${c}</div>`;
    });
}

function filterGrid(cat, el) {
    if(el) {
        document.querySelectorAll('.tag').forEach(t=>t.classList.remove('active'));
        el.classList.add('active');
    }
    const data = cat === 'همه' || !cat ? allData : allData.filter(x => x.cat===cat);
    
    const grid = document.getElementById('grid-view');
    grid.innerHTML = '';
    
    data.forEach(item => {
        const hasOff = item.off && item.off !== "0";
        const pShow = hasOff 
            ? `<span style="text-decoration:line-through; color:red; margin-left:5px">${fmt(item.price)}</span> ${fmt(item.off)}` 
            : (item.price==="0" ? "توافقی" : fmt(item.price));
            
        grid.innerHTML += `
            <div class="card" onclick="openModal('${item.id}')">
                <div class="card-img-box">
                    <img src="${item.img}" loading="lazy">
                    <span class="quick-badge">${hasOff ? 'تخفیف ویژه' : 'جدید'}</span>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${item.title}</h3>
                    <div class="card-stat">
                        <span><i class="fas fa-eye"></i> ${item.views}</span>
                        <span class="stat-crown">👑 ${item.score}</span>
                    </div>
                    <div style="color:var(--primary); font-weight:bold; font-size:0.9rem; margin-top:5px">${pShow} ت</div>
                </div>
            </div>`;
    });
    
    setupBook(data.slice(0, 30));
}

// 4. مودال
function openModal(id) {
    currentItem = allData.find(x => x.id === id);
    if(!currentItem) return;

    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc || "بدون توضیحات";
    document.getElementById('m-views').innerText = currentItem.views;
    document.getElementById('m-likes').innerText = currentItem.likes;
    document.getElementById('m-crown').innerText = currentItem.crowns;
    
    // قیمت با خط کشی قرمز
    const pb = document.getElementById('m-price');
    if(currentItem.off && currentItem.off!=="0") {
        pb.innerHTML = `<span class="old-p">${fmt(currentItem.price)}</span> ${fmt(currentItem.off)} تومان`;
    } else {
        pb.innerText = currentItem.price==="0" ? "توافقی" : fmt(currentItem.price) + " تومان";
    }

    // بررسی وضعیت در لیست
    updateListBtnState();

    // سوشال
    const sb = document.getElementById('social-grid');
    sb.innerHTML = '';
    ['wa','tg','ei','ba','ru','ig'].forEach(k => {
        sb.innerHTML += `<a href="${genLink(k)}" target="_blank" class="soc-btn ${k}"><img src="${CONFIG.logos[k]}"> ${k.toUpperCase()}</a>`;
    });

    document.getElementById('modal').style.display = 'block';
}

function updateListBtnState() {
    const btn = document.getElementById('btn-add-list');
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        btn.innerHTML = `<i class="fas fa-trash"></i> حذف از لیست سفارش`;
        btn.className = "action-btn remove";
    } else {
        btn.innerHTML = `<i class="fas fa-plus-circle"></i> افزودن به لیست`;
        btn.className = "action-btn add";
    }
}

function toggleListState() {
    const isIn = cart.find(c => c.id === currentItem.id);
    if(isIn) {
        cart = cart.filter(c => c.id !== currentItem.id);
    } else {
        cart.push(currentItem);
        // افکت پرواز
        animateFly();
    }
    updateListBtnState();
    updateCartUI();
}

// 5. سبد خرید
function updateCartUI() {
    document.getElementById('cart-badge').innerText = cart.length;
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    let total = 0;
    
    cart.forEach((c, i) => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        list.innerHTML += `
            <div class="cart-item">
                <img src="${c.img}">
                <div style="flex:1"><b>${c.title}</b><br><small>${c.id}</small></div>
                <button onclick="cart.splice(${i},1);updateCartUI()" style="color:red;background:none;border:none">✕</button>
            </div>`;
    });
    document.getElementById('cart-total').innerText = `جمع: ${fmt(total)} تومان`;
    
    // دکمه‌های سبد
    const soc = document.getElementById('cart-socials');
    soc.innerHTML = '';
    ['wa','tg','ei','ba','ru'].forEach(k => soc.innerHTML += `<button onclick="sendCart('${k}')" style="border:none;background:none;cursor:pointer"><img src="${CONFIG.logos[k]}" width="30"></button>`);
}

function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }
function clearCart() { if(confirm("لیست پاک شود؟")) { cart=[]; updateCartUI(); } }

// 6. ژست‌های لمسی (Swipe)
function setupGestures() {
    let startX = 0;
    const main = document.getElementById('main-area');
    
    main.addEventListener('touchstart', e => startX = e.changedTouches[0].screenX);
    main.addEventListener('touchend', e => {
        const endX = e.changedTouches[0].screenX;
        const diff = endX - startX;
        
        if(diff > 100) { // کشیدن به راست (باز شدن سبد)
            document.getElementById('cart-drawer').classList.add('open');
        } else if(diff < -100) { // کشیدن به چپ (تماس)
            window.location.href = "tel:" + CONFIG.refPhone;
        }
    });
}

// 7. کتاب
function setupBook(data) {
    const stage = document.getElementById('book-pages');
    stage.innerHTML = `<div class="b-page" style="z-index:99" onclick="nextPage()"><h2>ژورنال</h2><p>ورق بزنید</p></div>`;
    data.forEach((d,i) => {
        stage.innerHTML += `<div class="b-page" id="bp-${i}" style="z-index:${50-i}" onclick="nextPage()"><img src="${d.img}"><p>${d.title}</p></div>`;
    });
}
function nextPage() { /* Simplified Turn Logic */ document.getElementById('flip-sound').play(); } // نیاز به لاجیک کامل‌تر در صورت درخواست

// ابزارها
function fmt(n) { return parseInt(n).toLocaleString(); }
function closeModal() { document.getElementById('modal').style.display = 'none'; }
function openFullscreen() { 
    document.getElementById('fs-img').src = currentItem.img;
    document.getElementById('fs-viewer').style.display = 'flex';
}
function closeFullscreen() { document.getElementById('fs-viewer').style.display = 'none'; }
function toggleContactMenu() { 
    document.getElementById('contact-opts').classList.toggle('show');
}
function toggleTheme() {
    const b = document.body;
    b.setAttribute('data-theme', b.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}
function copyCode() { navigator.clipboard.writeText(currentItem.id); alert('کد کپی شد'); }
function animateFly() {
    const el = document.getElementById('fly-item');
    el.style.display = 'block';
    el.style.top = '50%'; el.style.left = '50%';
    setTimeout(() => { el.style.top = '90%'; el.style.left = '10%'; el.style.opacity = '0'; }, 10);
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; }, 600);
}
function sortGrid(type) {
    if(type==='pop') allData.sort((a,b)=>b.likes - a.likes);
    if(type==='view') allData.sort((a,b)=>b.views - a.views);
    if(type==='new') allData.sort((a,b)=> parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]));
    filterGrid();
}
function genLink(k) {
    // تولید لینک تکی
    const ref = sessionStorage.getItem('nano_ref') || "";
    const msg = encodeURIComponent(`سلام، طرح ${currentItem.title} (کد: ${currentItem.id}) را می‌خواهم.` + (ref ? `\n\n\nRef:${ref}` : ''));
    if(k==='wa') return `https://wa.me/${CONFIG.refPhone}?text=${msg}`;
    if(k==='tg') return `https://t.me/Official_iDirect?text=${msg}`;
    // ... سایر لینک‌ها مشابه قبل
    return "#";
}
function sendCart(k) {
    if(cart.length===0) return alert('خالی');
    const msg = encodeURIComponent("سفارش لیست:\n" + cart.map(c=>c.id).join('\n'));
    if(k==='wa') window.open(`https://wa.me/${CONFIG.refPhone}?text=${msg}`);
    // ...
}
