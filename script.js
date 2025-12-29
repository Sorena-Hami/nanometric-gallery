function openAlbum(albumId) {
    var albumViewer = document.getElementById(albumId);
    albumViewer.style.display = "flex";
}

function closeAlbum(albumId) {
    var albumViewer = document.getElementById(albumId);
    albumViewer.style.display = "none";
}

function copyCode(code) {
    var tempInput = document.createElement("input");
    tempInput.value = code;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    alert("کد کپی شد: " + code);
}
