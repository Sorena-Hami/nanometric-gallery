const CONFIG = {
    sheetID: '103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI',
    refPhone: "989304653535"
};

let allData = [];
let cart = [];
let currentItem = null;

window.onload = async () => {
    // مدیریت دکمه Back گوشی برای بستن مودال
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
        if (document.getElementById('modal').style.display === 'block') {
            closeModal();
            window.history.pushState(null, null, window.location.href); // نگه داشتن استیت برای بک بعدی
        } else if (document.getElementById('cart-drawer').classList.contains('open')) {
            toggleCartPanel();
            window.history.pushState(null, null, window.location.href);
        } else {
            // اجازه خروج (یا نمایش پیام خروج در صورت نیاز)
            // history.back();
        }
    };

    // هشدار خروج (فقط اگر کاربر تعامل داشته باشد فعال می‌شود)
    window.onbeforeunload = () => "آیا خارج می‌شوید؟";

    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${CONFIG.sheetID}/gviz/tq?tqx=out:csv`);
        const text = await res.text();
        allData = parseCSV(text);
        document.getElementById('loader-overlay').style.display = 'none';
        initSlider();
        renderAlbums();
        filterGrid('همه');
    } catch (e) {
        console.warn(e);
        document.getElementById('loader-overlay').style.display = 'none';
        // دیتای تستی
    }
};

function parseCSV(csv) {
    const lines = csv.split('\n');
    const res = [];
    for(let i=1; i<lines.length; i++) {
        const r = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if(!r) continue;
        const c = r.map(x => x.replace(/^"|"$/g, '').trim());
        if(c[3] && c[3].startsWith('http')) {
            res.push({
                id: `NANO-${1000+i}`, cat: c[0]||"عمومی", title: c[1]||`طرح ${i}`, img: c[3],
                price: c[4]||"0", off: c[7]||"0",
                views: c[12]||900, likes: c[13]||150, score: c[14]||4.5, shares: c[19]||50, // ستون جدید Shares فرض شد
                desc: c[18]||""
            });
        }
    }
    return res;
}

function initSlider() {
    const w = document.getElementById('slider-wrapper');
    allData.slice(0,10).forEach(i => {
        w.innerHTML += `<div class="swiper-slide" onclick="openModal('${i.id}')"><img src="${i.img}"></div>`;
    });
    new Swiper(".mySwiper", {loop:true, autoplay:{delay:3000}, pagination:{el:".swiper-pagination"}});
}

function renderAlbums() {
    const cats = ['همه', ...new Set(allData.map(d=>d.cat))];
    const c = document.getElementById('tags-container');
    cats.forEach(k => {
        const s = k==='همه'?allData[0]:allData.find(x=>x.cat===k);
        c.innerHTML += `<div class="album-tag" onclick="filterGrid('${k}', this)"><img src="${s.img}"><span>${k}</span></div>`;
    });
}

function filterGrid(cat, el) {
    if(el) { document.querySelectorAll('.album-tag').forEach(t=>t.classList.remove('active')); el.classList.add('active'); }
    const d = cat==='همه' ? allData : allData.filter(x=>x.cat===cat);
    const g = document.getElementById('grid-view');
    g.innerHTML = '';
    d.forEach(i => {
        const hasOff = i.off && i.off!=="0";
        const priceHTML = hasOff ? `<span class="old-price">${fmt(i.price)}</span> ${fmt(i.off)}` : (i.price==="0"?"توافقی":fmt(i.price));
        
        g.innerHTML += `
            <div class="art-card" onclick="openModal('${i.id}')">
                <div class="card-thumb">
                    <img src="${i.img}" loading="lazy">
                    <button class="mini-add-btn" id="btn-${i.id}" onclick="event.stopPropagation(); quickToggle('${i.id}')">+</button>
                </div>
                <div class="card-body">
                    <div class="stats-grid">
                        <div class="stat-col"><i class="fas fa-eye"></i><span>${i.views}</span></div>
                        <div class="stat-col"><i class="fas fa-heart" style="color:red"></i><span>${i.likes}</span></div>
                        <div class="stat-col"><i class="fas fa-crown" style="color:gold"></i><span>${i.score}</span></div>
                        <div class="stat-col"><i class="fas fa-paper-plane" style="color:#00f2ff"></i><span>${i.shares}</span></div>
                    </div>
                    <div class="price-row">${priceHTML} ت</div>
                    <div class="code-tiny" onclick="event.stopPropagation(); copyText('${i.id}')"><i class="far fa-copy"></i> ${i.id}</div>
                </div>
            </div>`;
    });
}

// دکمه افزودن/حذف سریع در کارت
function quickToggle(id) {
    const btn = document.getElementById(`btn-${id}`);
    const item = allData.find(x=>x.id===id);
    const idx = cart.findIndex(c=>c.id===id);
    
    if(idx > -1) {
        cart.splice(idx, 1);
        btn.classList.remove('added');
        btn.innerHTML = "+";
        showToast("از لیست حذف شد");
    } else {
        cart.push(item);
        btn.classList.add('added');
        btn.innerHTML = "✓";
        showToast("به لیست اضافه شد");
    }
    updateCartUI();
}

function openModal(id) {
    currentItem = allData.find(x=>x.id===id);
    if(!currentItem) return;
    document.getElementById('m-img').src = currentItem.img;
    document.getElementById('m-title').innerText = currentItem.title;
    document.getElementById('m-code').innerText = currentItem.id;
    document.getElementById('m-desc').innerText = currentItem.desc;
    
    document.getElementById('m-views').innerText = currentItem.views;
    document.getElementById('m-likes').innerText = currentItem.likes;
    document.getElementById('m-score').innerText = currentItem.score;
    document.getElementById('m-shares').innerText = currentItem.shares;

    updateListBtn();
    document.getElementById('modal').style.display = 'block';
}

function toggleListState() {
    const idx = cart.findIndex(c=>c.id===currentItem.id);
    if(idx > -1) { cart.splice(idx, 1); showToast("حذف شد"); }
    else { cart.push(currentItem); showToast("اضافه شد"); }
    updateListBtn();
    updateCartUI();
    // بروزرسانی دکمه کوچک در گرید
    const miniBtn = document.getElementById(`btn-${currentItem.id}`);
    if(miniBtn) {
        if(idx > -1) { miniBtn.classList.remove('added'); miniBtn.innerHTML="+"; }
        else { miniBtn.classList.add('added'); miniBtn.innerHTML="✓"; }
    }
}

function updateListBtn() {
    const btn = document.getElementById('btn-add-list');
    const isIn = cart.find(c=>c.id===currentItem.id);
    if(isIn) { btn.innerText = "🗑 حذف از لیست"; btn.className = "glassy-add-btn remove-mode"; }
    else { btn.innerText = "+ افزودن به لیست"; btn.className = "glassy-add-btn add-mode"; }
}

function updateCartUI() {
    document.getElementById('cart-badge').innerText = cart.length;
    const l = document.getElementById('cart-list');
    l.innerHTML = '';
    let total = 0;
    cart.forEach(c => {
        const pr = (c.off && c.off!=="0") ? parseInt(c.off) : parseInt(c.price);
        total += pr;
        l.innerHTML += `<div style="display:flex;gap:10px;margin-bottom:10px;border-bottom:1px solid #333;padding:10px"><img src="${c.img}" style="width:50px;height:50px;border-radius:5px"><div style="flex:1"><b>${c.title}</b></div></div>`;
    });
    document.getElementById('cart-total').innerText = `جمع: ${fmt(total)} تومان`;
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }
function toggleCartPanel() { document.getElementById('cart-drawer').classList.toggle('open'); }
function showToast(txt) { const t=document.getElementById('toast-msg'); t.innerText=txt; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }
function copyText(txt) { navigator.clipboard.writeText(txt); showToast("کد کپی شد"); }
function copyCode() { copyText(currentItem.id); }
function fmt(n) { return parseInt(n).toLocaleString(); }
function toggleTheme() { document.body.setAttribute('data-theme', document.body.getAttribute('data-theme')==='dark'?'light':'dark'); }
