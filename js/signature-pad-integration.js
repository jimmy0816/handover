// 使用 Signature Pad 庫實現簽名功能
document.addEventListener('DOMContentLoaded', function() {
    // 等待一下確保 DOM 完全加載
    setTimeout(function() {
        // 檢查人簽名
        setupSignaturePad('inspectorSignature', 'clearInspectorSignature');
        
        // 確認人簽名
        setupSignaturePad('confirmSignature', 'clearConfirmSignature');
    }, 500);
    
    // 監聽標籤頁切換事件
    document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(function(tabEl) {
        tabEl.addEventListener('shown.bs.tab', function(event) {
            // 如果切換到簽名標籤頁，重新設置簽名板
            if (event.target.getAttribute('href') === '#signatures') {
                console.log('Signatures tab activated, reinitializing signature pads');
                // 重新初始化簽名板
                setupSignaturePad('inspectorSignature', 'clearInspectorSignature');
                setupSignaturePad('confirmSignature', 'clearConfirmSignature');
            }
        });
    });
    
    function setupSignaturePad(canvasId, clearBtnId) {
        const canvas = document.getElementById(canvasId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!canvas || !clearBtn) {
            console.error(`Canvas ${canvasId} or clear button ${clearBtnId} not found`);
            return;
        }
        
        console.log(`Setting up signature pad for ${canvasId}`);
        
        // 初始化 SignaturePad
        let signaturePad = null;
        
        // 設置畫布尺寸
        function resizeCanvas() {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const parent = canvas.parentElement;
            
            // 確保父元素已經渲染並有尺寸
            if (parent.offsetWidth === 0 || parent.offsetHeight === 0) {
                console.log(`Parent element of ${canvasId} has zero size, using fixed size`);
                // 使用固定尺寸
                canvas.width = 300 * ratio;
                canvas.height = 180 * ratio;
                canvas.style.width = '300px';
                canvas.style.height = '180px';
            } else {
                canvas.width = parent.offsetWidth * ratio;
                canvas.height = parent.offsetHeight * ratio;
                canvas.style.width = parent.offsetWidth + 'px';
                canvas.style.height = parent.offsetHeight + 'px';
            }
            
            // 設置縮放比例
            canvas.getContext("2d").scale(ratio, ratio);
            console.log(`Canvas ${canvasId} size set to ${canvas.width}x${canvas.height}, ratio: ${ratio}`);
            
            // 如果已經有簽名數據，需要重新繪製
            if (signaturePad && !signaturePad.isEmpty()) {
                try {
                    const data = signaturePad.toData();
                    signaturePad.clear();
                    signaturePad.fromData(data);
                } catch (e) {
                    console.error('Error restoring signature data:', e);
                }
            }
        }
        
        // 初始化畫布尺寸
        resizeCanvas();
        
        // 初始化 SignaturePad
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 2,
            maxWidth: 4,
            throttle: 16, // 增加繪製速度
            velocityFilterWeight: 0.7
        });
        
        // 添加窗口調整大小事件
        window.addEventListener('resize', resizeCanvas);
        
        // 清除按鈕
        clearBtn.addEventListener('click', function() {
            signaturePad.clear();
        });
        
        // 為全局變量提供API
        window[canvasId + 'API'] = {
            clear: function() {
                signaturePad.clear();
            },
            isEmpty: function() {
                return signaturePad.isEmpty();
            },
            toDataURL: function() {
                return signaturePad.toDataURL();
            },
            fromDataURL: function(dataUrl) {
                signaturePad.fromDataURL(dataUrl);
            }
        };
    }
});
