// --- تنظیمات اصلی ---
const SHEET_ID = '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// اطلاعات تماس
const CONTACT_INFO = {
    phone: "989304653535",
    whatsapp_id: "989304653535",
    telegram_id: "Official_iDirect", // آیدی برای لینک مستقیم
    eitaa_id: "Official_iDirect",
    bale_id: "Official_iDirect",
    rubika_id: "Official_iDirect",
    instagram_id: "nanometriclab"
};

// لوگوها
const LOGOS = {
    wa: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767115995/25-256308_whatsapp-social-media-icons-whatsapp_o9zkit.png",
    tg: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767113676/telgrampng.parspng.com__rzuqpw.png",
    ig: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767116766/050e6fb1-f306-4571-a198-61f15806718e_1_ln8bgv.png",
    ei: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767111952/Eitaa-vector-logo_1221133400_we5m5l.png",
    ba: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767112210/bale-color_a9gfhw.png",
    ru: "https://res.cloudinary.com/dsj7o7yld/image/upload/v1767112404/Rubika_Icon_zlc48h.png"
};

// متغیرها
let portfolioData = [];
let cart = [];
let marketerCode = "";

// 1. شروع برنامه
window.onload = async () => {
    // بررسی کد بازاریاب
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('ref')) {
        marketerCode = urlParams.get('ref');
        sessionStorage.setItem('nano_ref', marketerCode);
    } else {
        marketerCode = sessionStorage.getItem('nano_ref') || "";
    }

    try {
        const res = await fetch(SHEET_URL);
        const text = await res.text();
        portfolioData = parseCSV(text);
        
        // حذف لودینگ
        document.getElementById('loading-view').style.display = 'none';

        initSlider();
        renderFolderTabs();
        filterData('همه'); // نمایش پیش‌فرض
        
    } catch (e) {
        document.getElementById('loading-view').style.display = 'none';
        // خطای خاموش: چیزی نشان نمی‌دهیم
    }
};

// 2. پارسر پیشرفته (پشتیبانی از قیمت)
function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!row) continue;
        const clean = row.map(c => c.replace(/^"|"$/g, '').trim());

        if (clean.length >= 2) {
            const cat = clean[0];
            const img = clean[1];
            // ستون‌های جدید: C=قیمت، D=تخفیف، E=عنوان، F=توضیحات
            const price = clean[2] || "0";
            const discount = clean[3] || "";
            const title = clean[4] || `طرح ${cat}`;
            const desc = clean[5] || "";

            if(img && img.startsWith('http')) {
                result.push({
                    id: `NANO-${1000 + i}`,
                    cat, img, title, desc, price, discount
                });
            }
        }
    }
    return result;
}

// 3. اسلایدر بالای صفحه
function initSlider() {
    const wrapper = document.getElementById('slider-wrapper');
    // انتخاب 5 آیتم تصادفی یا اول برای اسلایدر
    const slides = portfolioData.slice(0, 5);
    
    slides.forEach(item => {
        const div = document.createElement('div');
        div.className = 'swiper-slide';
        div.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <div class="slide-caption">${item.title}</div>
        `;
        wrapper.appendChild(div);
    });

    new Swiper(".mySwiper", {
        loop: true,
        autoplay: { delay: 3000 },
        pagination: { el: ".swiper-pagination" },
    });
}

// 4. تب‌های پوشه‌ای (Folder Tabs)
function renderFolderTabs() {
    const cats = ['همه', ...new Set(portfolioData.map(p => p.cat))];
    const container = document.getElementById('tagContainer');
    
    cats.forEach(cat => {
        // پیدا کردن تصویر اول برای آیکون پوشه
        const sample = cat === 'همه' ? portfolioData[0] : portfolioData.find(p => p.cat === cat);
        const icon = sample ? sample.img : '';

        const div = document.createElement('div');
        div.className = `folder-tab ${cat === 'همه' ? 'active' : ''}`;
        div.innerHTML = `<img src="${icon}"> ${cat}`;
        div.onclick = () => {
            document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
            div.classList.add('active');
            filterData(cat === 'همه' ? '' : cat);
        }
        container.appendChild(div);
    });
}

// 5. رندر گالری
function renderGallery(data) {
    const grid = document.getElementById('gallery-view');
    grid.innerHTML = '';
    data.forEach(item => {
        const hasDiscount = item.discount && item.discount !== "0";
        const displayPrice = hasDiscount ? item.discount : item.price;
        const formattedPrice = displayPrice === "0" ? "توافقی" : parseInt(displayPrice).toLocaleString() + " ت";

        const card = document.createElement('div');
        card.className = 'art-card';
        card.innerHTML = `
            <div class="card-img-wrap">
                <img src="${item.img}" loading="lazy">
                <div class="card-badge-price">${formattedPrice}</div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${item.title}</h3>
                <small style="color:var(--text-muted)">${item.cat}</small>
            </div>
        `;
        card.onclick = () => openModal(item);
        grid.appendChild(card);
    });
}

// 6. مودال و جزئیات
let currentModalItem = null;
function openModal(item) {
    currentModalItem = item;
    const m = document.getElementById('detailModal');
    
    document.getElementById('m-img').src = item.img;
    document.getElementById('m-title').innerText = item.title;
    document.getElementById('m-code').innerText = item.id;
    document.getElementById('m-desc').innerText = item.desc;

    // قیمت
    const box = document.getElementById('m-price-box');
    if(item.discount && item.discount !== "0") {
        box.innerHTML = `${parseInt(item.discount).toLocaleString()} تومان <span class="old-price">${parseInt(item.price).toLocaleString()}</span>`;
    } else {
        box.innerHTML = item.price === "0" ? "قیمت: توافقی" : `${parseInt(item.price).toLocaleString()} تومان`;
    }

    // تولید دکمه‌های سوشال
    const socialDiv = document.getElementById('socialLinksContainer');
    socialDiv.innerHTML = `
        <a href="${generateLink('whatsapp', item)}" target="_blank" class="soc-btn wa"><img src="${LOGOS.wa}"> واتساپ</a>
        <a href="${generateLink('telegram', item)}" target="_blank" class="soc-btn tg"><img src="${LOGOS.tg}"> تلگرام</a>
        <a href="${generateLink('eitaa', item)}" target="_blank" class="soc-btn ei"><img src="${LOGOS.ei}"> ایتا</a>
        <a href="${generateLink('rubika', item)}" target="_blank" class="soc-btn ru"><img src="${LOGOS.ru}"> روبیکا</a>
        <a href="${generateLink('bale', item)}" target="_blank" class="soc-btn ba"><img src="${LOGOS.ba}"> بله</a>
        <a href="${generateLink('instagram', item)}" target="_blank" class="soc-btn ig"><img src="${LOGOS.ig}"> اینستاگرام</a>
    `;

    m.style.display = 'flex';
}

function generateLink(platform, itemOrList) {
    let msg = "";
    if(Array.isArray(itemOrList)) {
        // حالت سبد خرید
        msg = `سلام، درخواست سفارش/مشاوره برای لیست زیر را دارم:\n\n`;
        itemOrList.forEach((i, idx) => {
            msg += `${idx+1}. کد: ${i.id} | ${i.title}\n`;
        });
        msg += `\nتعداد کل: ${itemOrList.length} مورد`;
    } else {
        // حالت تکی
        msg = `سلام، در مورد طرح کد *${itemOrList.id}* (${itemOrList.title}) سوال/سفارش دارم.`;
    }

    // اضافه کردن کد بازاریاب
    if(marketerCode) msg += `\n\n(کد معرف: ${marketerCode})`;

    const encMsg = encodeURIComponent(msg);

    switch(platform) {
        case 'whatsapp': return `https://wa.me/${CONTACT_INFO.whatsapp_id}?text=${encMsg}`;
        case 'telegram': return `https://t.me/${CONTACT_INFO.telegram_id}?text=${encMsg}`;
        case 'eitaa': return `https://eitaa.com/${CONTACT_INFO.eitaa_id}`; // ایتا پیام مستقیم در لینک ساپورت نمیکند، می‌رود پروفایل
        case 'rubika': return `https://rubika.ir/${CONTACT_INFO.rubika_id}`;
        case 'bale': return `https://ble.ir/${CONTACT_INFO.bale_id}`;
        case 'instagram': return `https://ig.me/m/${CONTACT_INFO.instagram_id}`;
        default: return "#";
    }
}

// 7. سبد خرید
function addToCartFromModal() {
    if(!currentModalItem) return;
    if(!cart.find(i => i.id === currentModalItem.id)) {
        cart.push(currentModalItem);
        updateCartUI();
        alert('به لیست سفارش اضافه شد');
    } else {
        alert('این مورد قبلا اضافه شده است');
    }
}

function updateCartUI() {
    document.getElementById('cart-count').innerText = cart.length;
    const list = document.getElementById('cartItems');
    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const price = (item.discount && item.discount!=="0") ? parseInt(item.discount) : parseInt(item.price);
        total += isNaN(price) ? 0 : price;

        list.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}">
                <div style="flex-grow:1">
                    <div style="font-size:0.9rem; font-weight:bold">${item.title}</div>
                    <div style="font-size:0.8rem; color:#888">${item.id}</div>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red;">🗑</button>
            </div>
        `;
    });
    
    document.getElementById('cartTotal').innerText = `جمع حدودی: ${total.toLocaleString()} تومان`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCart() {
    document.getElementById('cartPanel').classList.toggle('open');
}

function checkout(platform) {
    if(cart.length === 0) return alert("لیست خالی است!");
    const link = generateLink(platform, cart);
    window.open(link, '_blank');
}

// 8. ابزارهای عمومی
function toggleTheme() {
    const body = document.body;
    if(body.getAttribute('data-theme') === 'dark') body.setAttribute('data-theme', 'light');
    else body.setAttribute('data-theme', 'dark');
}

function filterData(term) {
    if(term === '') {
        renderGallery(portfolioData);
        renderBook(portfolioData);
        return;
    }
    const filtered = portfolioData.filter(i => i.cat === term || i.title.includes(term) || i.id.includes(term));
    renderGallery(filtered);
    renderBook(filtered);
}

function toggleFullScreen() {
    const elem = document.getElementById('m-img');
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {});
    } else {
        document.exitFullscreen();
    }
}

function closeModal() { document.getElementById('detailModal').style.display = 'none'; }
function switchView(v) {
    document.getElementById('gallery-view').style.display = v === 'gallery' ? 'grid' : 'none';
    document.getElementById('book-view').style.display = v === 'book' ? 'flex' : 'none';
}

// 9. Flipbook ساده + صدا
function renderBook(data) {
    const container = document.getElementById('bookContainer');
    container.innerHTML = '';
    data.forEach((item, i) => {
        const div = document.createElement('div');
        div.className = 'book-page';
        div.style.zIndex = data.length - i;
        div.innerHTML = `<img src="${item.img}" style="max-width:100%; max-height:80%"><p>${item.title}</p>`;
        div.onclick = () => flipPage(div);
        container.appendChild(div);
    });
}
function flipPage(el) {
    el.classList.toggle('flipped');
    document.getElementById('page-flip-sound').play();
}
// (توابع next/prev برای دکمه‌های پایین کتاب هم باید اضافه شوند که مشابه flipPage عمل کنند)
