document.addEventListener('DOMContentLoaded', function() {
    // 設定當前日期
    document.getElementById('date').valueAsDate = new Date();
    
    // 實現簽名功能
    function setupSignature(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with id ${canvasId} not found`);
            return null;
        }
        
        // 設置畫布尺寸
        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            console.log(`Canvas ${canvasId} size set to ${canvas.width}x${canvas.height}`);
        }
        
        // 初始化
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';
        
        let drawing = false;
        let lastX = 0;
        let lastY = 0;
        
        // 滑鼠事件
        function startPosition(e) {
            drawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
            console.log(`Start at ${lastX}, ${lastY}`);
            
            // 畫一個點
            ctx.beginPath();
            ctx.arc(lastX, lastY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        function endPosition() {
            drawing = false;
        }
        
        function draw(e) {
            if (!drawing) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            
            lastX = x;
            lastY = y;
        }
        
        // 觸控事件
        function touchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                lastX = touch.clientX - rect.left;
                lastY = touch.clientY - rect.top;
                drawing = true;
                
                // 畫一個點
                ctx.beginPath();
                ctx.arc(lastX, lastY, 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                console.log(`Touch start at ${lastX}, ${lastY}`);
            }
        }
        
        function touchMove(e) {
            e.preventDefault();
            if (drawing && e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                
                lastX = x;
                lastY = y;
            }
        }
        
        function touchEnd(e) {
            e.preventDefault();
            drawing = false;
        }
        
        // 添加事件監聽器
        canvas.addEventListener('mousedown', startPosition);
        canvas.addEventListener('mouseup', endPosition);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseout', endPosition);
        
        canvas.addEventListener('touchstart', touchStart);
        canvas.addEventListener('touchmove', touchMove);
        canvas.addEventListener('touchend', touchEnd);
        
        // 返回簽名板 API
        return {
            clear: function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            },
            isEmpty: function() {
                // 簡單判斷空白畫布
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] !== 0) return false;
                }
                return true;
            },
            toDataURL: function() {
                return canvas.toDataURL();
            },
            fromDataURL: function(dataUrl) {
                const img = new Image();
                img.onload = function() {
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataUrl;
            }
        };
    }
    
    // 延遲初始化簽名板，確保容器已經渲染
    setTimeout(() => {
        // 初始化簽名板
        window.inspectorSignaturePad = setupSignature('inspectorSignature');
        window.confirmSignaturePad = setupSignature('confirmSignature');
        
        // 清除簽名按鈕
        document.getElementById('clearInspectorSignature').addEventListener('click', function() {
            if (window.inspectorSignaturePad) {
                window.inspectorSignaturePad.clear();
            }
        });
        
        document.getElementById('clearConfirmSignature').addEventListener('click', function() {
            if (window.confirmSignaturePad) {
                window.confirmSignaturePad.clear();
            }
        });
    }, 500);
    
    // 初始化 Bootstrap 模態框
    const photoModal = new bootstrap.Modal(document.getElementById('photoModal'));
    let currentItemId; // 用於追蹤當前編輯的物品ID
    let currentPhotoData; // 用於存儲當前照片數據
    let itemCounter = 0; // 用於生成唯一的物品ID
    
    // 標籤頁導航
    document.getElementById('nextToSignatures').addEventListener('click', function() {
        const signaturesTab = new bootstrap.Tab(document.getElementById('signatures-tab'));
        signaturesTab.show();
    });
    
    document.getElementById('backToInventory').addEventListener('click', function() {
        const inventoryTab = new bootstrap.Tab(document.getElementById('inventory-tab'));
        inventoryTab.show();
    });
    
    document.getElementById('nextToReview').addEventListener('click', function() {
        updatePreview();
        const reviewTab = new bootstrap.Tab(document.getElementById('review-tab'));
        reviewTab.show();
    });
    
    document.getElementById('backToSignatures').addEventListener('click', function() {
        const signaturesTab = new bootstrap.Tab(document.getElementById('signatures-tab'));
        signaturesTab.show();
    });
    
    // 新增物品按鈕
    document.getElementById('addItemBtn').addEventListener('click', function() {
        addNewItem();
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
        console.log('Save photo button clicked', currentItemId, currentPhotoData ? 'Has photo data' : 'No photo data');
        
        if (currentItemId && currentPhotoData) {
            // 正確選擇照片容器
            const itemCard = document.getElementById(currentItemId);
            if (!itemCard) {
                console.error('Cannot find item card with ID:', currentItemId);
                return;
            }
            
            const photoContainer = itemCard.querySelector('.photo-container');
            if (!photoContainer) {
                console.error('Cannot find photo container in item:', currentItemId);
                return;
            }
            
            // 清除現有內容
            photoContainer.innerHTML = '';
            
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
            
            photoContainer.appendChild(img);
            photoModal.hide();
        } else {
            if (!currentItemId) {
                console.error('No current item ID set');
            }
            if (!currentPhotoData) {
                console.error('No photo data available');
                alert('請先選擇一張照片再儲存');
            }
        }
    });
    
    // 添加新物品
    function addNewItem() {
        itemCounter++;
        const itemId = `item-${itemCounter}`;
        const itemsList = document.getElementById('inventoryItemsList');
        
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        itemCard.id = itemId;
        
        itemCard.innerHTML = `
            <div class="item-header" data-bs-toggle="collapse" data-bs-target="#${itemId}-body">
                <h6 class="item-title mb-0">新增物品</h6>
                <div>
                    <i class="bi bi-chevron-down"></i>
                </div>
            </div>
            <div class="collapse show" id="${itemId}-body">
                <div class="item-body">
                    <div class="item-row">
                        <label class="form-label">物品名稱</label>
                        <input type="text" class="form-control item-name" placeholder="輸入物品名稱" required>
                    </div>
                    <div class="row item-row">
                        <div class="col-6">
                            <label class="form-label">數量</label>
                            <input type="number" class="form-control item-quantity" placeholder="數量" min="1" value="1" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label">狀況</label>
                            <select class="form-control item-condition">
                                <option value="良好">良好</option>
                                <option value="輕微損壞">輕微損壞</option>
                                <option value="嚴重損壞">嚴重損壞</option>
                                <option value="不可用">不可用</option>
                            </select>
                        </div>
                    </div>
                    <div class="item-row">
                        <label class="form-label">備註</label>
                        <textarea class="form-control item-notes" rows="2" placeholder="輸入備註"></textarea>
                    </div>
                    <div class="item-row">
                        <label class="form-label">照片</label>
                        <div class="photo-container">
                            <div class="photo-placeholder upload-photo-btn">
                                <i class="bi bi-camera"></i> 點擊上傳照片
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end mt-3">
                        <button type="button" class="btn btn-outline-danger delete-item-btn" data-item-id="${itemId}">
                            <i class="bi bi-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        itemsList.appendChild(itemCard);
        
        // 更新物品標題當名稱改變時
        const nameInput = itemCard.querySelector('.item-name');
        nameInput.addEventListener('change', function() {
            const title = itemCard.querySelector('.item-title');
            title.textContent = this.value || '新增物品';
        });
        
        // 為新物品添加事件監聽器
        const uploadBtn = itemCard.querySelector('.upload-photo-btn');
        uploadBtn.addEventListener('click', function() {
            // 確保正確設置當前物品ID
            currentItemId = itemId;
            console.log('Setting current item ID:', currentItemId);
            
            // 重置照片上傳表單
            document.getElementById('photoUpload').value = '';
            document.getElementById('photoPreview').classList.add('d-none');
            currentPhotoData = null;
            photoModal.show();
        });
        
        const deleteBtn = itemCard.querySelector('.delete-item-btn');
        deleteBtn.addEventListener('click', function() {
            document.getElementById(this.dataset.itemId).remove();
        });
        
        // 自動聚焦到名稱輸入框
        nameInput.focus();
    }
    
    // 更新預覽內容
    function updatePreview() {
        const formData = collectFormData();
        const previewContent = document.getElementById('previewContent');
        
        // 清除現有內容
        previewContent.innerHTML = '';
        
        // 基本資訊
        const basicInfo = document.createElement('div');
        basicInfo.className = 'card mb-3';
        basicInfo.innerHTML = `
            <div class="card-header bg-light">
                <h6 class="mb-0">基本資訊</h6>
            </div>
            <div class="card-body p-3">
                <p class="mb-1"><strong>日期：</strong> ${formData.date}</p>
                <p class="mb-0"><strong>地點：</strong> ${formData.location}</p>
            </div>
        `;
        previewContent.appendChild(basicInfo);
        
        // 物品列表
        const itemsCard = document.createElement('div');
        itemsCard.className = 'card mb-3';
        itemsCard.innerHTML = `
            <div class="card-header bg-light">
                <h6 class="mb-0">物品列表</h6>
            </div>
            <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                    ${formData.items.map(item => `
                        <li class="list-group-item">
                            <h6 class="mb-1">${item.name}</h6>
                            <div class="d-flex justify-content-between mb-1">
                                <span><strong>數量：</strong> ${item.quantity}</span>
                                <span><strong>狀況：</strong> ${item.condition}</span>
                            </div>
                            ${item.notes ? `<p class="mb-1"><strong>備註：</strong> ${item.notes}</p>` : ''}
                            ${item.photo ? `<div class="mt-2"><img src="${item.photo}" class="photo-thumbnail"></div>` : ''}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        previewContent.appendChild(itemsCard);
        
        // 其他備註
        if (formData.additionalNotes) {
            const notesCard = document.createElement('div');
            notesCard.className = 'card mb-3';
            notesCard.innerHTML = `
                <div class="card-header bg-light">
                    <h6 class="mb-0">其他備註</h6>
                </div>
                <div class="card-body p-3">
                    <p class="mb-0">${formData.additionalNotes}</p>
                </div>
            `;
            previewContent.appendChild(notesCard);
        }
        
        // 簽名
        const signaturesCard = document.createElement('div');
        signaturesCard.className = 'card mb-3';
        signaturesCard.innerHTML = `
            <div class="card-header bg-light">
                <h6 class="mb-0">雙方簽名</h6>
            </div>
            <div class="card-body p-3">
                <div class="row">
                    <div class="col-6 mb-2">
                        <p class="mb-1"><strong>檢查人：</strong></p>
                        ${formData.inspectorSignature ? `<img src="${formData.inspectorSignature}" class="img-fluid">` : '<p class="text-danger">未簽名</p>'}
                    </div>
                    <div class="col-6 mb-2">
                        <p class="mb-1"><strong>確認人：</strong></p>
                        ${formData.confirmSignature ? `<img src="${formData.confirmSignature}" class="img-fluid">` : '<p class="text-danger">未簽名</p>'}
                    </div>
                </div>
            </div>
        `;
        previewContent.appendChild(signaturesCard);
    }
    
    // 收集表單數據
    function collectFormData() {
        // 確保簽名板已經初始化
        const inspectorSignaturePad = window.inspectorSignaturePad;
        const confirmSignaturePad = window.confirmSignaturePad;
        
        const formData = {
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            items: [],
            additionalNotes: document.getElementById('additionalNotes').value,
            inspectorSignature: inspectorSignaturePad && !inspectorSignaturePad.isEmpty() ? inspectorSignaturePad.toDataURL() : null,
            confirmSignature: confirmSignaturePad && !confirmSignaturePad.isEmpty() ? confirmSignaturePad.toDataURL() : null
        };
        
        // 收集物品數據
        document.querySelectorAll('.item-card').forEach(itemCard => {
            const nameInput = itemCard.querySelector('.item-name');
            const quantityInput = itemCard.querySelector('.item-quantity');
            const conditionSelect = itemCard.querySelector('.item-condition');
            const notesTextarea = itemCard.querySelector('.item-notes');
            const photoImg = itemCard.querySelector('.photo-container img');
            
            formData.items.push({
                name: nameInput.value,
                quantity: quantityInput.value,
                condition: conditionSelect.value,
                notes: notesTextarea.value,
                photo: photoImg ? photoImg.dataset.fullImage : null
            });
        });
        
        return formData;
    }
    
    // 儲存表單數據
    function saveFormData() {
        const formData = collectFormData();
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
            
            // 延遲加載簽名，確保簽名板已初始化
            setTimeout(() => {
                // 填充簽名
                if (formData.inspectorSignature && window.inspectorSignaturePad) {
                    window.inspectorSignaturePad.fromDataURL(formData.inspectorSignature);
                }
                if (formData.confirmSignature && window.confirmSignaturePad) {
                    window.confirmSignaturePad.fromDataURL(formData.confirmSignature);
                }
            }, 500);
            
            // 清除現有物品
            document.getElementById('inventoryItemsList').innerHTML = '';
            
            // 填充物品數據
            formData.items.forEach(item => {
                // 新增物品
                addNewItem();
                const itemCard = document.querySelector('.item-card:last-child');
                
                // 填充數據
                const nameInput = itemCard.querySelector('.item-name');
                const quantityInput = itemCard.querySelector('.item-quantity');
                const conditionSelect = itemCard.querySelector('.item-condition');
                const notesTextarea = itemCard.querySelector('.item-notes');
                
                nameInput.value = item.name;
                quantityInput.value = item.quantity;
                conditionSelect.value = item.condition;
                notesTextarea.value = item.notes;
                
                // 更新標題
                const title = itemCard.querySelector('.item-title');
                title.textContent = item.name || '新增物品';
                
                // 添加照片
                if (item.photo) {
                    const photoContainer = itemCard.querySelector('.photo-container');
                    photoContainer.innerHTML = '';
                    
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
                    
                    photoContainer.appendChild(img);
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
        pdfContent.className = 'container p-4';
        pdfContent.innerHTML = `
            <div class="text-center mb-4">
                <h2 class="fw-bold">物品檢查表</h2>
            </div>
            
            <div class="mb-4 p-3" style="border: 1px solid #dee2e6; border-radius: 8px;">
                <h4 class="mb-3">基本資訊</h4>
                <div class="row">
                    <div class="col-6">
                        <p><strong>日期：</strong> ${formData.date}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>地點：</strong> ${formData.location}</p>
                    </div>
                </div>
            </div>
            
            <div class="mb-4 p-3" style="border: 1px solid #dee2e6; border-radius: 8px;">
                <h4 class="mb-3">物品資料</h4>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
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
                                    <td>${item.name || '-'}</td>
                                    <td>${item.quantity || '-'}</td>
                                    <td>${item.condition || '-'}</td>
                                    <td>${item.notes || '-'}</td>
                                    <td style="text-align: center;">${item.photo ? `<img src="${item.photo}" style="max-width: 100px; max-height: 100px; border-radius: 4px;">` : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${formData.additionalNotes ? `
                <div class="mb-4 p-3" style="border: 1px solid #dee2e6; border-radius: 8px;">
                    <h4 class="mb-3">其他備註</h4>
                    <p>${formData.additionalNotes}</p>
                </div>
            ` : ''}
            
            <div class="mb-4 p-3" style="border: 1px solid #dee2e6; border-radius: 8px;">
                <h4 class="mb-3">雙方簽名</h4>
                <div class="row">
                    <div class="col-6 mb-3">
                        <p><strong>檢查人：</strong></p>
                        <div style="border: 1px solid #dee2e6; padding: 10px; border-radius: 4px; min-height: 150px;">
                            <img src="${formData.inspectorSignature}" style="max-width: 100%; max-height: 150px;">
                        </div>
                    </div>
                    <div class="col-6 mb-3">
                        <p><strong>確認人：</strong></p>
                        <div style="border: 1px solid #dee2e6; padding: 10px; border-radius: 4px; min-height: 150px;">
                            <img src="${formData.confirmSignature}" style="max-width: 100%; max-height: 150px;">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-5 pt-3" style="border-top: 1px solid #dee2e6;">
                <p class="text-muted small">檢查日期：${formData.date} | 地點：${formData.location}</p>
            </div>
        `;
        
        // 將 pdfContent 添加到 body 中以便 html2canvas 可以捕獲
        document.body.appendChild(pdfContent);
        pdfContent.style.position = 'absolute';
        pdfContent.style.top = '-9999px';
        pdfContent.style.width = '800px';
        pdfContent.style.backgroundColor = '#ffffff';
        
        // 使用 html2canvas 和 jsPDF 生成 PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        html2canvas(pdfContent, {
            scale: 2, // 提高清晰度
            useCORS: true, // 允許加載跨域圖片
            logging: false,
            backgroundColor: '#ffffff'
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
    
    // 添加新物品行
    function addNewItemRow() {
        // 檢查是否存在清單容器
        const inventoryItemsList = document.getElementById('inventoryItemsList');
        if (!inventoryItemsList) {
            console.error('Cannot find inventoryItemsList element');
            return;
        }
        
        // 添加新物品
        addNewItem();
    }
    
    // 添加一個初始行
    addNewItemRow();
    
    // 嘗試加載已保存的數據
    loadSavedData();
});
