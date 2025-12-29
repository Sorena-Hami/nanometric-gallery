const portfolioItems = [];  // لیست عکس‌ها و ویدیوها از گوگل شیت بارگذاری می‌شود
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

// بارگذاری لینک‌ها از گوگل شیت
fetch('https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/{RANGE}?key={API_KEY}')
    .then(response => response.json())
    .then(data => {
        // بر اساس داده‌های دریافت شده، portfolioItems را پر کنیم
        data.values.forEach(row => {
            portfolioItems.push({
                id: row[0],  // کد آلبوم
                type: row[1],  // نوع (تصویر/ویدیو)
                category: row[2],  // دسته‌بندی
                tags: row[3],  // تگ‌ها
                url: row[4],  // لینک تصویر/ویدیو
                desc: row[5]  // توضیحات
            });
        });
        renderGallery(portfolioItems);  // گالری را با داده‌ها پر کن
    })
    .catch(error => console.error('خطا در بارگذاری داده‌ها:', error));

// تابع ساخت گالری
function renderGallery(items) {
    gallery.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';

        let mediaContent = '';
        if(item.type === 'video') {
            mediaContent = `<video src="${item.url}" muted onmouseover="this.play()" onmouseout="this.pause()"></video>`;
        } else {
            mediaContent = `<img src="${item.url}" alt="${item.desc}" loading="lazy">`;
        }

        div.innerHTML = `
            <div class="media-wrapper" onclick="openLightbox('${item.id}')">
                ${mediaContent}
            </div>
            <div class="item-info">
                <span class="code-badge">${item.id}</span>
                <button class="copy-btn" onclick="copyCode('${item.id}')">کپی کد</button>
            </div>
        `;
        gallery.appendChild(div);
    });
}

function filterGallery(cat) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (cat === 'all') {
        renderGallery(portfolioItems);
    } else {
        const filtered = portfolioItems.filter(item => item.category === cat);
        renderGallery(filtered);
    }
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = portfolioItems.filter(item => 
        item.id.toLowerCase().includes(term) || 
        item.tags.includes(term) ||
        item.desc.includes(term)
    );
    renderGallery(filtered);
});

function copyCode(code) {
    navigator.clipboard.writeText(code);
    alert('کد ' + code + ' کپی شد!');
}

const lightbox = document.getElementById('lightbox');
const lbContent = document.getElementById('lightbox-content');
const lbCode = document.getElementById('lb-code');
const lbDesc = document.getElementById('lb-desc');

function openLightbox(id) {
    const item = portfolioItems.find(i => i.id === id);
    lbContent.innerHTML = '';
    
    if(item.type === 'video') {
        lbContent.innerHTML = `<video src="${item.url}" controls autoplay style="max-width:90%; max-height:80vh"></video>`;
    } else {
        lbContent.innerHTML = `<img src="${item.url}" style="max-width:90%; max-height:80vh">`;
    }

    lbCode.innerText = "کد سفارش: " + item.id;
    lbDesc.innerText = item.desc;
    lightbox.style.display = 'flex';
}

function closeLightbox() {
    lightbox.style.display = 'none';
    lbContent.innerHTML = '';  // توقف ویدیو
}

lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox) closeLightbox();
})
