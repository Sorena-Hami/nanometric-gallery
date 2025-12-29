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
  const albumViewer = document.createElement('div');
  albumViewer.classList.add('album-viewer');
  albumViewer.innerHTML = `
    <div class="viewer-content">
      <button class="close" onclick="closeAlbum()">بستن</button>
      <h2>${albumTitle}</h2>
      <img src="${imageURL}" alt="${albumTitle}" class="full-image">
      <p>کد: ${albumTitle}</p>
      <button class="copy-code" onclick="copyCode('${albumTitle}')">کپی کد</button>
    </div>
  `;
  
  document.body.appendChild(albumViewer);
}

// بستن آلبوم
function closeAlbum() {
  const albumViewer = document.querySelector('.album-viewer');
  if (albumViewer) {
    albumViewer.remove();
  }
}

// کپی کد
function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert('کد کپی شد: ' + code);
  });
}
