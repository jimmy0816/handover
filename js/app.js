document.addEventListener('DOMContentLoaded', function() {
    // 設定當前日期
    document.getElementById('date').valueAsDate = new Date();
    
    // 初始化簽名板並設定校準
    const inspectorCanvas = document.getElementById('inspectorSignature');
    const confirmCanvas = document.getElementById('confirmSignature');
    
    // 調整畫布大小以匹配顯示大小，解決筆觸偏移問題
    function resizeCanvas(canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
    }
    
    // 調整兩個畫布的大小
    resizeCanvas(inspectorCanvas);
    resizeCanvas(confirmCanvas);
    
    // 初始化簽名板
    const inspectorSignaturePad = new SignaturePad(inspectorCanvas, {
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 16, // 增加更新頻率，減少延遲
        velocityFilterWeight: 0.6 // 調整筆觸平滑度
    });
    
    const confirmSignaturePad = new SignaturePad(confirmCanvas, {
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 16,
        velocityFilterWeight: 0.6
    });
    
    // 監聽視窗大小變化，重新調整畫布
    window.addEventListener('resize', function() {
        resizeCanvas(inspectorCanvas);
        resizeCanvas(confirmCanvas);
        
        // 保存當前簽名數據
        const inspectorData = inspectorSignaturePad.toData();
        const confirmData = confirmSignaturePad.toData();
        
        // 清除並重新繪製
        inspectorSignaturePad.clear();
        confirmSignaturePad.clear();
        
        if (inspectorData.length) {
            inspectorSignaturePad.fromData(inspectorData);
        }
        
        if (confirmData.length) {
            confirmSignaturePad.fromData(confirmData);
        }
    });
    
    // 清除簽名按鈕
    document.getElementById('clearInspectorSignature').addEventListener('click', function() {
        inspectorSignaturePad.clear();
    });
    
    document.getElementById('clearConfirmSignature').addEventListener('click', function() {
        confirmSignaturePad.clear();
    });
    
    // 初始化 Bootstrap 模態框
    const photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
    let currentRow; // 用於追蹤當前編輯的行
    let currentPhotoData; // 用於存儲當前照片數據
    
    // 新增物品按鈕
    document.getElementById('addItemBtn').addEventListener('click', function() {
        addNewItemRow();
    });
    
    // 表單提交處理
    document.getElementById('checklistForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveFormData();
        alert('資料已儲存！');
    });
    
    // 生成 PDF 按鈕
    document.getElementById('generatePdfBtn').addEventListener('click', function() {
        generatePDF();
    });
    
    // 照片上傳預覽
    document.getElementById('photoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('photoPreview');
                preview.src = e.target.result;
                preview.classList.remove('d-none');
                currentPhotoData = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 儲存照片按鈕
    document.getElementById('savePhotoBtn').addEventListener('click', function() {
        if (currentRow && currentPhotoData) {
            const photoCell = currentRow.querySelector('.photo-cell');
            
            // 清除現有內容
            photoCell.innerHTML = '';
            
            // 創建縮略圖
            const img = document.createElement('img');
            img.src = currentPhotoData;
            img.className = 'photo-thumbnail';
            img.dataset.fullImage = currentPhotoData;
            
            // 點擊縮略圖查看大圖
            img.addEventListener('click', function() {
                const preview = document.getElementById('photoPreview');
                preview.src = this.dataset.fullImage;
                preview.classList.remove('d-none');
                photoModal.show();
            });
            
            photoCell.appendChild(img);
            photoModal.hide();
        }
    });
    
    // 添加新物品行
    function addNewItemRow() {
        const tbody = document.querySelector('#itemsTable tbody');
        const newRow = document.createElement('tr');
        
        newRow.innerHTML = `
            <td><input type="text" class="form-control" placeholder="物品名稱" required></td>
            <td><input type="number" class="form-control" placeholder="數量" min="1" required></td>
            <td>
                <select class="form-control">
                    <option value="良好">良好</option>
                    <option value="輕微損壞">輕微損壞</option>
                    <option value="嚴重損壞">嚴重損壞</option>
                    <option value="不可用">不可用</option>
                </select>
            </td>
            <td><textarea class="form-control" rows="2"></textarea></td>
            <td class="photo-cell">
                <button type="button" class="btn btn-outline-primary btn-sm upload-photo-btn">上傳照片</button>
            </td>
            <td>
                <button type="button" class="btn btn-danger btn-sm delete-row-btn">刪除</button>
            </td>
        `;
        
        tbody.appendChild(newRow);
        
        // 為新行添加事件監聽器
        const uploadBtn = newRow.querySelector('.upload-photo-btn');
        uploadBtn.addEventListener('click', function() {
            currentRow = this.closest('tr');
            document.getElementById('photoUpload').value = '';
            document.getElementById('photoPreview').classList.add('d-none');
            currentPhotoData = null;
            photoModal.show();
        });
        
        const deleteBtn = newRow.querySelector('.delete-row-btn');
        deleteBtn.addEventListener('click', function() {
            this.closest('tr').remove();
        });
    }
    
    // 儲存表單數據
    function saveFormData() {
        const formData = {
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            items: [],
            additionalNotes: document.getElementById('additionalNotes').value,
            inspectorSignature: inspectorSignaturePad.isEmpty() ? null : inspectorSignaturePad.toDataURL(),
            confirmSignature: confirmSignaturePad.isEmpty() ? null : confirmSignaturePad.toDataURL()
        };
        
        // 收集物品數據
        document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
            const inputs = row.querySelectorAll('input, select, textarea');
            const photoCell = row.querySelector('.photo-cell');
            const photoImg = photoCell.querySelector('img');
            
            formData.items.push({
                name: inputs[0].value,
                quantity: inputs[1].value,
                condition: inputs[2].value,
                notes: inputs[3].value,
                photo: photoImg ? photoImg.dataset.fullImage : null
            });
        });
        
        // 將數據保存到 localStorage
        localStorage.setItem('checklistData', JSON.stringify(formData));
        return formData;
    }
    
    // 加載已保存的數據
    function loadSavedData() {
        const savedData = localStorage.getItem('checklistData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            // 填充基本信息
            document.getElementById('date').value = formData.date;
            document.getElementById('location').value = formData.location;
            document.getElementById('additionalNotes').value = formData.additionalNotes;
            
            // 填充簽名
            if (formData.inspectorSignature) {
                inspectorSignaturePad.fromDataURL(formData.inspectorSignature);
            }
            if (formData.confirmSignature) {
                confirmSignaturePad.fromDataURL(formData.confirmSignature);
            }
            
            // 填充物品數據
            const tbody = document.querySelector('#itemsTable tbody');
            tbody.innerHTML = ''; // 清空現有行
            
            formData.items.forEach(item => {
                addNewItemRow();
                const row = tbody.lastElementChild;
                const inputs = row.querySelectorAll('input, select, textarea');
                
                inputs[0].value = item.name;
                inputs[1].value = item.quantity;
                inputs[2].value = item.condition;
                inputs[3].value = item.notes;
                
                if (item.photo) {
                    const photoCell = row.querySelector('.photo-cell');
                    photoCell.innerHTML = '';
                    
                    const img = document.createElement('img');
                    img.src = item.photo;
                    img.className = 'photo-thumbnail';
                    img.dataset.fullImage = item.photo;
                    
                    img.addEventListener('click', function() {
                        const preview = document.getElementById('photoPreview');
                        preview.src = this.dataset.fullImage;
                        preview.classList.remove('d-none');
                        photoModal.show();
                    });
                    
                    photoCell.appendChild(img);
                }
            });
        }
    }
    
    // 生成 PDF
    function generatePDF() {
        // 先保存當前數據
        const formData = saveFormData();
        
        // 檢查是否有簽名
        if (!formData.inspectorSignature || !formData.confirmSignature) {
            alert('請確保雙方都已完成簽名！');
            return;
        }
        
        // 創建 PDF 內容的 HTML
        const pdfContent = document.createElement('div');
        pdfContent.className = 'container mt-4';
        pdfContent.innerHTML = `
            <h1 class="text-center mb-4">物品檢查表</h1>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h4>基本資訊</h4>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>日期：</strong> ${formData.date}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>地點：</strong> ${formData.location}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h4>物品資料</h4>
                </div>
                <div class="card-body">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>物品名稱</th>
                                <th>數量</th>
                                <th>狀況</th>
                                <th>備註</th>
                                <th>照片</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${formData.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.condition}</td>
                                    <td>${item.notes}</td>
                                    <td>${item.photo ? `<img src="${item.photo}" style="max-width: 100px; max-height: 100px;">` : ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${formData.additionalNotes ? `
                <div class="card mb-4">
                    <div class="card-header">
                        <h4>其他備註</h4>
                    </div>
                    <div class="card-body">
                        <p>${formData.additionalNotes}</p>
                    </div>
                </div>
            ` : ''}
            
            <div class="card mb-4">
                <div class="card-header">
                    <h4>雙方簽名</h4>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <p><strong>檢查人簽名：</strong></p>
                            <img src="${formData.inspectorSignature}" style="max-width: 100%; max-height: 200px;">
                        </div>
                        <div class="col-md-6 mb-3">
                            <p><strong>確認人簽名：</strong></p>
                            <img src="${formData.confirmSignature}" style="max-width: 100%; max-height: 200px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 將 pdfContent 添加到 body 中以便 html2canvas 可以捕獲
        document.body.appendChild(pdfContent);
        pdfContent.style.position = 'absolute';
        pdfContent.style.top = '-9999px';
        
        // 使用 html2canvas 和 jsPDF 生成 PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        html2canvas(pdfContent, {
            scale: 2, // 提高清晰度
            useCORS: true, // 允許加載跨域圖片
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const imgWidth = 210; // A4 寬度 (mm)
            const pageHeight = 297; // A4 高度 (mm)
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;
            
            doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            
            // 如果內容超過一頁，添加新頁面
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // 下載 PDF
            doc.save(`物品檢查表_${formData.date}.pdf`);
            
            // 移除臨時 DOM 元素
            document.body.removeChild(pdfContent);
        });
    }
    
    // 添加一個初始行
    addNewItemRow();
    
    // 嘗試加載已保存的數據
    loadSavedData();
});
