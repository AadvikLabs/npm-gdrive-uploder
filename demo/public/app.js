const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const activeUploads = document.getElementById('activeUploads');
const resultModal = document.getElementById('resultModal');
const closeModal = document.getElementById('closeModal');
const toast = document.getElementById('toast');

// Modal Elements
const viewBtn = document.getElementById('viewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const successFileName = document.getElementById('successFileName');

let currentPublicLink = '';

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
});

function handleFiles(files) {
    if (files.length === 0) return;
    
    Array.from(files).forEach(file => {
        uploadFile(file);
    });
}

async function uploadFile(file) {
    activeUploads.classList.remove('hidden');
    
    const item = document.createElement('div');
    item.className = 'upload-item';
    item.innerHTML = `
        <div class="spinner"></div>
        <div style="flex: 1; text-align: left;">
            <div style="font-weight: 600; font-size: 0.9rem;">${file.name}</div>
            <div style="color: #9ca3af; font-size: 0.8rem;">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;
    activeUploads.appendChild(item);

    const progressFill = item.querySelector('.progress-fill');
    
    // Simulate progress (since browser fetch doesn't natively support upload progress easily without XHR)
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) clearInterval(interval);
        progressFill.style.width = Math.min(progress, 90) + '%';
    }, 200);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        clearInterval(interval);
        progressFill.style.width = '100%';

        if (data.success) {
            item.innerHTML = `
                <div style="color: #34A853;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <div style="flex: 1; text-align: left;">
                    <div style="font-weight: 600; font-size: 0.9rem;">${file.name}</div>
                    <div style="color: #9ca3af; font-size: 0.8rem;">Uploaded successfully</div>
                </div>
                <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.8rem;" onclick="showResult('${data.fileName}', '${data.viewUrl}', '${data.downloadUrl}')">Details</button>
            `;
            
            // Auto show modal for the last file if only one was uploaded
            showResult(data.fileName, data.viewUrl, data.downloadUrl);
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        clearInterval(interval);
        item.innerHTML = `
            <div style="color: #ea4335;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <div style="flex: 1; text-align: left;">
                <div style="font-weight: 600; font-size: 0.9rem;">${file.name}</div>
                <div style="color: #ea4335; font-size: 0.8rem;">${error.message}</div>
            </div>
        `;
    }
}

function showResult(name, viewUrl, downloadUrl) {
    successFileName.innerText = `"${name}" is now safely stored on Google Drive.`;
    viewBtn.href = viewUrl;
    downloadBtn.href = downloadUrl;
    currentPublicLink = viewUrl;
    resultModal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => {
    resultModal.classList.add('hidden');
});

copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentPublicLink);
    showToast();
});

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Close modal on outside click
resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) resultModal.classList.add('hidden');
});
