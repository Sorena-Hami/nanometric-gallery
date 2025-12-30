const portfolioItems = [
    // اینجا لیست عکس‌ها و ویدیوها باید وارد بشه
    {
        id: "ART-101",
        type: "image",
        category: "portrait",
        tags: "زن, کلاسیک, سیاه سفید",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=60",
        desc: "پرتره کلاسیک سیاه و سفید"
    },
    {
        id: "VID-202",
        type: "video",
        category: "video",
        tags: "موشن, تبلیغاتی",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        desc: "نمونه موشن گرافیک تبلیغاتی"
    },
    {
        id: "ART-103",
        type: "image",
        category: "landscape",
        tags: "طبیعت, دریا, غروب",
        url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=500&q=60",
        desc: "عکاسی منظره غروب"
    },
    {
        id: "ART-104",
        type: "image",
        category: "square",
        tags: "لوگو, مینیمال",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=60",
        desc: "طراحی لوگو مینیمال"
    }
];

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

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

renderGallery(portfolioItems);

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
    lbContent.innerHTML = ''; // توقف ویدیو
}

lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox) closeLightbox();
})
