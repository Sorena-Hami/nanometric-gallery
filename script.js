// بازکردن آلبوم
function openAlbum(albumId) {
    document.getElementById(albumId).style.display = 'flex';
}

// بستن آلبوم
function closeAlbum(albumId) {
    document.getElementById(albumId).style.display = 'none';
}

// کپی کردن کد
function copyCode(code) {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('کد کپی شد!');
}
