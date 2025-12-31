// تغییر تم (Dark/Light)
function toggleTheme() {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
}

// جستجو
document.getElementById('searchInput').addEventListener('input', function () {
    const query = this.value;
    console.log(`جستجو: ${query}`);
    // پیاده‌سازی جستجو و فیلتر آثار
});

// افزودن به لیست
function toggleListState() {
    const button = document.getElementById('btn-add-list');
    button.classList.toggle('active');
    button.textContent = button.classList.contains('active') ? 'حذف از لیست' : 'افزودن به لیست';
}

// نمایش مودال
function openModal(id) {
    const modal = document.getElementById('modal');
    modal.style.display = 'block';
    // بارگذاری اطلاعات اثر در مودال
}

// بستن مودال
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// کپی کد
function copyCode() {
    const code = document.getElementById('m-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert("کد کپی شد.");
    });
}

// اشتراک‌گذاری
function share() {
    if (navigator.share) {
        navigator.share({
            title: 'عنوان اثر',
            url: window.location.href
        }).catch(console.error);
    }
}

// تغییر نما
function setView(view) {
    if (view === 'grid') {
        document.getElementById('book-view').style.display = 'none';
        document.getElementById('grid-view').style.display = 'grid';
    } else {
        document.getElementById('grid-view').style.display = 'none';
        document.getElementById('book-view').style.display = 'flex';
    }
}
