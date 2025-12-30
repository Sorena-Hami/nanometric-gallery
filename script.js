// *** تنظیمات ***

// لینک CSV گوگل شیت خود را در خط زیر جایگزین کنید

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI/edit?usp=sharing';

// متغیری برای ذخیره داده‌های دسته‌بندی شده

let albumsData = {};

document.addEventListener('DOMContentLoaded', () => {

    fetchData();

});

async function fetchData() {

    const container = document.getElementById('albums-container');

    

    try {

        const response = await fetch(SHEET_URL);

        const data = await response.text();

        

        // تبدیل CSV به آرایه

        const rows = parseCSV(data);

        

        // پردازش داده‌ها (ردیف اول معمولا هدر است، از ردیف دوم شروع می‌کنیم)

        // فرض: ستون 0 = نام دسته بندی | ستون 1 = لینک عکس

        rows.slice(1).forEach((row, index) => {

            const category = row[0] ? row[0].trim() : 'بدون دسته';

            const imageUrl = row[1] ? row[1].trim() : '';

            

            if (imageUrl) {

                if (!albumsData[category]) {

                    albumsData[category] = [];

                }

                // ساخت یک آبجکت برای هر عکس شامل لینک و یک شناسه تولیدی

                albumsData[category].push({

                    url: imageUrl,

                    id: `IMG-${1000 + index}` // تولید کد یکتا مثل IMG-1001

                });

            }

        });

        renderAlbums();

    } catch (error) {

        console.error('Error fetching data:', error);

        container.innerHTML = '<p>خطا در بارگذاری اطلاعات. لطفا لینک گوگل شیت را بررسی کنید.</p>';

    }

}

// تابع ساده برای تبدیل CSV به آرایه

function parseCSV(text) {

    return text.split('\n').map(row => row.split(','));

}

// نمایش آلبوم‌ها (دسته‌بندی‌ها) در صفحه اصلی

function renderAlbums() {

    const container = document.getElementById('albums-container');

    container.innerHTML = ''; // پاک کردن پیام لودینگ

    Object.keys(albumsData).forEach(category => {

        const images = albumsData[category];

        if (images.length === 0) return;

        // استفاده از اولین عکس به عنوان کاور آلبوم

        const coverImage = images[0].url;

        const albumDiv = document.createElement('div');

        albumDiv.className = 'album';

        albumDiv.onclick = () => openModal(category);

        albumDiv.innerHTML = `

            <img src="${coverImage}" alt="${category}" class="thumbnail">

            <p>${category}</p>

            <small style="color:#666">(${images.length} تصویر)</small>

        `;

        container.appendChild(albumDiv);

    });

}

// باز کردن مودال و نمایش تصاویر آن دسته

function openModal(category) {

    const modal = document.getElementById('gallery-modal');

    const title = document.getElementById('modal-title');

    const grid = document.getElementById('modal-images');

    

    title.innerText = category;

    grid.innerHTML = ''; // پاک کردن محتوای قبلی

    const images = albumsData[category];

    images.forEach(imgObj => {

        const itemDiv = document.createElement('div');

        itemDiv.className = 'gallery-item';

        itemDiv.innerHTML = `

            <img src="${imgObj.url}" loading="lazy" alt="Image">

            <p style="margin: 10px 0 5px; font-weight:bold;">کد: ${imgObj.id}</p>

            <button class="copy-code" onclick="copyToClipboard('${imgObj.id}')">کپی کد</button>

        `;

        

        grid.appendChild(itemDiv);

    });

    modal.style.display = 'flex';

}

function closeModal() {

    document.getElementById('gallery-modal').style.display = 'none';

}

function copyToClipboard(text) {

    navigator.clipboard.writeText(text).then(() => {

        alert("کد کپی شد: " + text);

    }).catch(err => {

        console.error('خطا در کپی:', err);

    });

}

// بستن مودال با کلیک بیرون از کادر

window.onclick = function(event) {

    const modal = document.getElementById('gallery-modal');

    if (event.target == modal) {

        closeModal();

    }

}

