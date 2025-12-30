// داده‌های نمونه برای آلبوم‌ها
const albums = [
    { 
        title: "آلبوم 1", 
        image: "https://res.cloudinary.com/demo/image/upload/v1612552545/sample.jpg", 
        code: "ABC123" 
    },
    { 
        title: "آلبوم 2", 
        image: "https://res.cloudinary.com/demo/image/upload/v1612552545/sample2.jpg", 
        code: "XYZ456" 
    }
];

// بارگذاری آلبوم‌ها
function loadAlbums() {
    const albumsContainer = document.getElementById('albums');
    albums.forEach(album => {
        const albumElement = document.createElement('div');
        albumElement.classList.add('album');
        albumElement.onclick = () => openAlbum(album);

        albumElement.innerHTML = `
            <img src="${album.image}" class="thumbnail" alt="${album.title}">
            <p>${album.title}</p>
        `;
        albumsContainer.appendChild(albumElement);
    });
}

// نمایش آلبوم بزرگ
function openAlbum(album) {
    document.getElementById('album-title').textContent = album.title;
    document.getElementById('full-image').src = album.image;
    document.getElementById('album-code').textContent = `کد: ${album.code}`;
    document.getElementById('album-viewer').classList.add('show');
}

// بستن آلبوم بزرگ
function closeAlbum() {
    document.getElementById('album-viewer').classList.remove('show');
}

// کپی کد آلبوم
function copyCode() {
    const code = document.getElementById('album-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert('کد کپی شد!');
    });
}

// بارگذاری آلبوم‌ها هنگام بارگذاری صفحه
window.onload = loadAlbums;
