// لینک به فایل گوگل شیت که داده‌ها در آن ذخیره شده‌اند
const sheetURL = 'https://docs.google.com/spreadsheets/d/103cZAMY3lFK797NZ3-BforE30EZWXydOpGewxrlP4FI/gviz/tq?tqx=out:json';

// درخواست برای دریافت داده‌ها از شیت
fetch(sheetURL)
  .then(response => response.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2)); // استخراج داده‌ها از شیت
    const rows = json.table.rows;

    // شناسایی بخش آلبوم‌ها
    const albumsContainer = document.getElementById('albums');
    
    rows.forEach(row => {
      const albumTitle = row.c[0].v;  // عنوان آلبوم
      const imageURL = row.c[1].v;    // لینک تصویر

      // ساخت ساختار HTML برای هر آلبوم
      const albumDiv = document.createElement('div');
      albumDiv.classList.add('album');
      albumDiv.onclick = () => openAlbum(albumTitle, imageURL);

      albumDiv.innerHTML = `
        <img src="${imageURL}" alt="${albumTitle}" class="thumbnail">
        <p>${albumTitle}</p>
      `;
      
      // اضافه کردن آلبوم به بخش آلبوم‌ها
      albumsContainer.appendChild(albumDiv);
    });
  })
  .catch(error => console.error('Error fetching data:', error));

// نمایش آلبوم بزرگ
function openAlbum(albumTitle, imageURL) {
  document.getElementById('album-title').textContent = albumTitle;
  document.getElementById('full-image').src = imageURL;
  document.getElementById('album-code').textContent = `کد: ${albumTitle}`;
  const albumViewer = document.getElementById('album-viewer');
  albumViewer.classList.add('show');
}

// بستن آلبوم
function closeAlbum() {
  const albumViewer = document.getElementById('album-viewer');
  albumViewer.classList.remove('show');
}

// کپی کد
function copyCode() {
  const code = document.getElementById('album-title').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('کد کپی شد: ' + code);
  });
}
