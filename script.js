// --- تنظیمات اختصاصی شما ---
// آیدی گوگل شیت (همان شیتی که دادید)
const SHEET_ID = '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI';

// شماره واتساپ برای دریافت سفارش (کد کشور + شماره بدون صفر)
const ADMIN_PHONE = '989123456789'; // مثال: 989121234567

// آیدی تلگرام (بدون @)
const TELEGRAM_ID = 'nanometric_admin'; 

// ---------------------------
// منطق برنامه (دست نزنید مگر اینکه بدانید چه می‌کنید)
// ---------------------------

const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
let portfolioData = [];
let currentData = [];
let currentBookPage = 0;

// اجرا هنگام لود صفحه
window.onload = async () => {
    try {
        const res = await fetch(SHEET_URL);
        const text = await res.text();
        
        portfolioData = parseCSV(text);
        currentData = [...portfolioData];

        // حذف لودینگ و نمایش گالری
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('gallery-view').style.display = 'grid';
        
        if(portfolioData.length === 0) {
            document.getElementById('gallery-view').innerHTML = '<p style="text-align:center;">هیچ طرحی یافت نشد!</p>';
            return;
        }

        renderGallery(currentData);
        generateTags();
        renderBook(currentData);
    } catch (e) {
        console.error(e);
        document.getElementById('loading-view').innerHTML = '<p style="color:red">خطا در اتصال به گوگل شیت</p>';
    }
};

// تبدیل CSV به JSON (پشتیبانی از 4 ستون)
function parseCSV(csv) {
    const lines = csv.split('\n');
    const result = [];
    
    // از ردیف 1 شروع می‌کنیم (فرض بر اینکه ردیف 0 هدر است)
    for (let i = 1; i < lines.length; i++) {
        // این regex مقادیر داخل کوتیشن را درست جدا می‌کند
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        
        if (!row) continue;

        // پاکسازی کوتیشن‌ها
        const cleanRow = row.map(cell => cell.replace(/^"|"$/g, '').trim());

        // انتظار داریم حداقل ستون A (دسته) و B (لینک) باشد
        if (cleanRow.length >= 2) { 
            const cat = cleanRow[0] || "عمومی";
            const img = cleanRow[1] || "";
            // اگر ستون C و D خالی بود، مقدار پیش‌فرض بگذار
            const title = (cleanRow[2] && cleanRow[2] !== "") ? cleanRow[2] : `طرح ${cat}`;
            const desc = (cleanRow[3] && cleanRow[3] !== "") ? cleanRow[3] : "قابلیت اجرا در سایزهای مختلف";
            
            if(img && img.startsWith('http')) {
                result.push({
                    id: `ART-${1000 + i}`, // تولید کد یکتا
                    cat, img, title, desc
                });
            }
        }
    }
    return result;
}

// تولید تگ‌های دسته‌بندی
function generateTags() {
    const tags = new Set(['همه']);
    portfolioData.forEach(p => tags.add(p.cat));
    const container = document.getElementById('tagContainer');
    container.innerHTML = '';

    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = tag === 'همه' ? 'tag-btn active' : 'tag-btn';
        btn.innerText = tag;
        btn.onclick = () => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterData(tag === 'همه' ? '' : tag);
        }
        container.appendChild(btn);
    });
}

// ساخت کارت‌های گالری
function renderGallery(data) {
    const grid = document.getElementById('gallery-view');
    grid.innerHTML = '';
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'art-card';
        card.innerHTML = `
            <div class="card-img-wrap">
                <div class="card-badge">${item.cat}</div>
                <img src="${item.img}" class="card-img" loading="lazy" alt="${item.title}">
            </div>
            <div class="card-content">
                <div class="card-title">${item.title}</div>
                <div class="card-desc">${item.desc}</div>
            </div>
        `;
        card.onclick = () => openModal(item);
        grid.appendChild(card);
    });
}

// فیلتر و جستجو
function filterData(query) {
    const term = query.toLowerCase();
    currentData = portfolioData.filter(item => 
        item.cat.toLowerCase().includes(term) || 
        item.title.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term)
    );
    renderGallery(currentData);
    currentBookPage = 0;
    renderBook(currentData);
}

document.getElementById('searchInput').addEventListener('input', (e) => filterData(e.target.value));

// سوئیچ بین گالری و کتاب
function switchView(view) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    if(view === 'gallery') {
        document.getElementById('gallery-view').style.display = 'grid';
        document.getElementById('book-view').style.display = 'none';
    } else {
        document.getElementById('gallery-view').style.display = 'none';
        document.getElementById('book-view').style.display = 'flex';
    }
}

// --- بخش مودال (نمایش جزئیات) ---
let currentItem = null;
const modal = document.getElementById('detailModal');

function openModal(item) {
    currentItem = item;
    document.getElementById('m-img').src = item.img;
    document.getElementById('m-code').innerText = item.id;
    document.getElementById('m-title').innerText = item.title;
    document.getElementById('m-desc').innerText = item.desc;
    
    // ساخت متن پیام آماده
    const msg = `سلام، من می‌خواهم طرح با کد *${item.id}* (${item.title}) را سفارش دهم.`;
    
    // تنظیم لینک دکمه‌ها
    document.getElementById('m-whatsapp').href = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`;
    document.getElementById('m-telegram').href = `https://t.me/${TELEGRAM_ID}?text=${encodeURIComponent(msg)}`;

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

function copyCode() {
    if(currentItem) {
        navigator.clipboard.writeText(currentItem.id);
        const btn = document.querySelector('.btn-copy');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> کپی شد';
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }
}

// بستن مودال با کلیک بیرون
modal.onclick = (e) => { if(e.target === modal) closeModal(); }

// --- بخش کتاب (Flipbook) ---
function renderBook(data) {
    const container = document.getElementById('bookContainer');
    container.innerHTML = '';
    
    // صفحه جلد
    container.appendChild(createPage(`
        <h2 style="color:var(--primary-color)">ژورنال آثار</h2>
        <p>${data.length} طرح موجود</p>
        <p style="font-size:0.8rem; color:#666; margin-top:20px;">برای ورق زدن کلیک کنید</p>
    `, 0));

    data.forEach((item, index) => {
        const html = `
            <img src="${item.img}" style="max-width:90%; max-height:50%; margin-bottom:10px; border-radius:5px; object-fit:contain;">
            <h3 style="font-size:1rem; margin:5px 0; text-align:center;">${item.title}</h3>
            <span style="color:var(--primary-color); font-family:monospace; background:rgba(0,0,0,0.5); padding:2px 5px; border-radius:3px;">${item.id}</span>
        `;
        container.appendChild(createPage(html, index + 1));
    });
    
    const pages = document.querySelectorAll('.book-page');
    pages.forEach((p, i) => p.style.zIndex = pages.length - i);
}

function createPage(content, idx) {
    const div = document.createElement('div');
    div.className = 'book-page';
    div.innerHTML = content;
    // قابلیت ورق زدن با کلیک روی خود صفحه
    div.onclick = () => {
        if(!div.classList.contains('flipped')) nextPage();
        else prevPage();
    };
    return div;
}

function nextPage() {
    const pages = document.querySelectorAll('.book-page');
    if(currentBookPage < pages.length) {
        pages[currentBookPage].classList.add('flipped');
        currentBookPage++;
    }
}
function prevPage() {
    if(currentBookPage > 0) {
        currentBookPage--;
        document.querySelectorAll('.book-page')[currentBookPage].classList.remove('flipped');
    }
}
