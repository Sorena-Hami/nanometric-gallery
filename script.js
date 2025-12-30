const CONFIG = {
    sheetID: '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI',
    contacts: {
        wa: "989304653535", tg: "Official_iDirect", ei: "Official_iDirect",
        ba: "Official_iDirect", ru: "Official_iDirect", ig: "nanometriclab"
    },
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
let marketerCode = "";
let currentPage = 0;

// تایمر نجات لودینگ (اگر بعد از 10 ثانیه لود نشد)
setTimeout(() => {
    const loader = document.getElementById('loader-overlay');
    if(loader && loader.style.display !== 'none') {
        document.getElementById('loader-text').innerText = "اتصال کند است...";
        document.getElementById('retry-btn').style.display = "block";
    }
}, 10000);

window.onload = async () => {
    // 1. بررسی بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) {
        marketerCode = urlParams.get('ref');
        sessionStorage.setItem('nano_ref', marketerCode);
    } else {
        marketerCode = sessionStorage.getItem('nano_ref') || "";
    }

    // 2. هشدار خروج
    window.onbeforeunload = () => "آیا می‌خواهید خارج شوید؟";

    // 3. دریافت اطلاعات
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`;
        const res = await fetch(url);
        const text = await res.text();
        
        allData = parseData(text);
        
        // حذف لودینگ
        document.getElementById('loader-overlay').style.display = 'none';

        initSlider();
        renderTags();
        filterGrid('همه');

    } catch (err) {
        console.error(err);
        document.getElementById('loader-text').innerText = "خطا در دریافت اطلاعات.";
        document.getElementById('retry-btn').style.display = "block";
    }
};

function parseData(csv) {
    const rows = csv.split('\n');
    const output = [];
    // رد کردن هدر (index 1 شروع میشه)
    for(let i=1; i<rows.length; i++) {
        // Regex برای جدا کردن کاما هایی که داخل کوتیشن نیستند
        const cols = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!cols) continue;
        
        const clean = cols.map(c => c.replace(/^"|"$/g, '').trim());
        
        if(clean.length >= 2 && clean[1].startsWith('http')) {
            const id = 1000 + i;
            // تولید آمار تصادفی ثابت
            const views = Math.floor((id * 7) % 3000) + 200;
            
            output.push({
                id: `NANO-${id}`,
                cat: clean[0],
                img: clean[1],
                price: clean[2] || "0",
                off: clean[3] || "0",
                title: clean[4] || `طرح هنری ${id}`,
                desc: clean[5] || "",
                stats: { view: views, like: Math.floor(views * 0.2) }
            });
        }
    }
    return output;
}

// --- رندرینگ ---

function initSlider() {
    // 5 آیتم تصادفی
    const slides = [...allData].sort(() => 0.5 - Math.random()).slice(0, 5);
    const wrap = document.getElementById('slider-wrapper');
    slides.forEach(s => {
        wrap.innerHTML += `
            <div class="swiper-slide">
                <img src="${s.img}">
                <div class="slide-text">${s.title}</div>
            </div>`;
    });
    new Swiper(".mySwiper", { loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"} });
}

function renderTags() {
    const cats = ['همه', ...new Set(allData.map(d => d.cat))];
    const con = document.getElementById('tags-container');
    cats.forEach(c => {
        const img = c === 'همه' ? allData[0].img : allData.find(x => x.cat === c).img;
        con.innerHTML += `
            <div class="tag ${c==='همه'?'active':''}" onclick="filterGrid('${c}', this)">
                <img src="${img}"> ${c}
            </div>`;
    });
}

function filterGrid(cat, el) {
    if(el) {
        document.querySelectorAll('.tag').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }
    
    const data = cat === 'همه' || !cat 
        ? allData 
        : allData.filter(d => d.cat === cat || d.title.includes(cat) || d.id.includes(cat));

    const grid = document.getElementById('grid-view');
    grid.innerHTML = '';
    
    data.forEach(item => {
        const hasOff = item.off && item.off !== "0";
        const priceTxt = hasOff ? parseInt(item.off).toLocaleString() : (item.price === "0" ? "توافقی" : parseInt(item.price).toLocaleString());
        
        grid.innerHTML += `
            <div class="art-card" onclick="openModal('${item.id}')">
                <div class="art-img-box">
                    <img src="${item.img}" loading="lazy">
                    <button class="add-fast" onclick="event.stopPropagation(); addToCart('${item.id}')">+ لیست</button>
                </div>
                <div class="card-meta">
                    <span class="card-price">${priceTxt} ت</span>
                    <h4 class="card-h">${item.title}</h4>
                </div>
            </div>`;
    });

    // آماده سازی کتاب برای همین دسته
    setupBook(data.slice(0, 40)); // محدودیت برای پرفورمنس
}

document.getElementById('searchInput').addEventListener('input', (e) => filterGrid(e.target.value));

// --- مودال ---
let currentItem = null;
function openModal(id) {
    currentItem = allData.find(x => x.id === id);
    const m = document.getElementById('modal');
    
    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc || "بدون توضیحات اضافی";
    document.getElementById('m-view').innerText = currentItem.stats.view;
    document.getElementById('m-like').innerText = currentItem.stats.like;

    // قیمت
    const pBox = document.getElementById('m-price');
    if(currentItem.off && currentItem.off !== "0") {
        pBox.innerHTML = `<span style="text-decoration:line-through; color:#777; font-size:1rem">${parseInt(currentItem.price).toLocaleString()}</span> ${parseInt(currentItem.off).toLocaleString()} تومان`;
    } else {
        pBox.innerText = currentItem.price === "0" ? "قیمت توافقی" : `${parseInt(currentItem.price).toLocaleString()} تومان`;
    }

    // دکمه‌های سوشال
    const sBox = document.getElementById('modal-socials');
    sBox.innerHTML = '';
    ['wa','tg','ei','ba','ru','ig'].forEach(key => {
        sBox.innerHTML += `<button class="s-btn ${key}" onclick="sendMsg('${key}')"><img src="${CONFIG.logos[key]}"> ${key.toUpperCase()}</button>`;
    });

    m.style.display = 'block';
}
function closeModal() { document.getElementById('modal').style.display = 'none'; }

// --- کتاب (CSS Logic) ---
let bookPages = [];
let bookIndex = 0;

function setupBook(data) {
    const stage = document.getElementById('book-pages');
    stage.innerHTML = '';
    bookPages = [];
    
    // صفحه اول (جلد)
    const cover = document.createElement('div');
    cover.className = 'book-page';
    cover.style.zIndex = data.length + 1;
    cover.innerHTML = `<h2>ژورنال هنری</h2><p>${data.length} اثر</p>`;
    cover.onclick = () => nextPage();
    stage.appendChild(cover);
    bookPages.push(cover);

    data.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'book-page';
        div.style.zIndex = data.length - i;
        div.innerHTML = `<img src="${item.img}"><p>${item.title}</p><small>${item.id}</small>`;
        div.onclick = () => nextPage(); // کلیک روی صفحه برای ورق زدن
        stage.appendChild(div);
        bookPages.push(div);
    });
    bookIndex = 0;
    updateBookUI();
}

function nextPage() {
    if(bookIndex < bookPages.length) {
        bookPages[bookIndex].classList.add('flipped');
        document.getElementById('flip-sound').play();
        bookIndex++;
        updateBookUI();
    }
}
function prevPage() {
    if(bookIndex > 0) {
        bookIndex--;
        bookPages[bookIndex].classList.remove('flipped');
        document.getElementById('flip-sound').play();
        updateBookUI();
    }
}
function updateBookUI() {
    document.getElementById('page-num').innerText = bookIndex === 0 ? "جلد" : `${bookIndex} / ${bookPages.length-1}`;
}

function setView(mode) {
    document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.getElementById('grid-view').style.display = mode === 'grid' ? 'grid' : 'none';
    document.getElementById('book-view').style.display = mode === 'book' ? 'flex' : 'none';
}

// --- سبد خرید و پیام ---
function addToCart(id) {
    const item = allData.find(x => x.id === id);
    if(cart.find(c => c.id === id)) return alert("این آیتم در سبد هست");
    cart.push(item);
    updateCartUI();
    
    // انیمیشن
    const b = document.getElementById('cart-badge');
    b.style.transform = "scale(1.4)";
    setTimeout(()=>b.style.transform="scale(1)", 200);
}
function addToCartModal() { addToCart(currentItem.id); }

function updateCartUI() {
    document.getElementById('cart-badge').innerText = cart.length;
    const list = document.getElementById('cart-list');
    list.innerHTML = '';
    let total = 0;
    
    cart.forEach((c, idx) => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        list.innerHTML += `
            <div class="cart-row">
                <img src="${c.img}">
                <div style="flex:1"><b>${c.title}</b><br><small>${c.id}</small></div>
                <button onclick="cart.splice(${idx},1); updateCartUI()" style="color:red; background:none; border:none">🗑</button>
            </div>`;
    });
    
    document.getElementById('cart-total').innerText = `جمع: ${total.toLocaleString()} ت`;
    
    // دکمه‌های سبد
    const soc = document.getElementById('cart-socials');
    soc.innerHTML = '';
    ['wa','tg','ei','ba','ru'].forEach(k => {
        soc.innerHTML += `<button class="mini-btn ${k}" onclick="sendMsg('${k}', true)"><img src="${CONFIG.logos[k]}"></button>`;
    });
}
function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }

// ارسال پیام (با کد مخفی)
function sendMsg(app, isCart = false) {
    if(isCart && cart.length === 0) return alert("سبد خالی است");
    
    let text = "";
    if(isCart) {
        text = "سلام، سفارش لیست زیر را دارم:\n" + cart.map(c => `▪️ ${c.title} (${c.id})`).join('\n');
    } else {
        text = `سلام، طرح *${currentItem.title}* با کد ${currentItem.id} را می‌خواهم.`;
    }

    // تکنیک کد مخفی با Zero Width Space
    if(marketerCode) {
        // اضافه کردن فاصله زیاد و سپس کد با کاراکترهای نامرئی (نمادین)
        // اینجا ما فقط آن را پایین می‌فرستیم که دیده نشود
        text += "\n\n\n\n\n\n\n________________\nRef: " + marketerCode;
    }

    const enc = encodeURIComponent(text);
    let link = "";
    
    if(app === 'wa') link = `https://wa.me/${CONFIG.contacts.wa}?text=${enc}`;
    else if(app === 'tg') link = `https://t.me/${CONFIG.contacts.tg}?text=${enc}`;
    else if(app === 'ei') link = `https://eitaa.com/${CONFIG.contacts.ei}`;
    else if(app === 'ba') link = `https://ble.ir/${CONFIG.contacts.ba}`;
    else if(app === 'ru') link = `https://rubika.ir/${CONFIG.contacts.ru}`;
    else if(app === 'ig') link = `https://ig.me/m/${CONFIG.contacts.ig}`;

    window.open(link, '_blank');
}

// کپی کد
function copyCode() {
    navigator.clipboard.writeText(currentItem.id);
    alert("کد کپی شد!");
}

// زوم فول اسکرین
function toggleZoom() {
    const fs = document.getElementById('fs-viewer');
    const img = document.getElementById('fs-img');
    if(fs.style.display === 'flex') {
        fs.style.display = 'none';
        img.style.transform = "scale(1)";
    } else {
        document.getElementById('fs-img').src = currentItem ? currentItem.img : document.getElementById('m-img').src;
        fs.style.display = 'flex';
    }
}
// زوم ساده با کلیک روی عکس فول اسکرین
document.getElementById('fs-img').onclick = (e) => {
    e.stopPropagation();
    const el = e.target;
    el.style.transform = el.style.transform === "scale(2.5)" ? "scale(1)" : "scale(2.5)";
};

// تم
function toggleTheme() {
    const b = document.body;
    b.setAttribute('data-theme', b.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}
