// 使用 Signature Pad 庫實現簽名功能
document.addEventListener('DOMContentLoaded', function() {
    // 全局變數
    let inspectorSignaturePad = null;
    let confirmSignaturePad = null;
    
    // 標籤頁切換事件
    const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabs.forEach(function(tab) {
        tab.addEventListener('shown.bs.tab', function(event) {
            // 如果切換到簽名標籤頁
            if (event.target.getAttribute('data-bs-target') === '#signatures') {
                console.log('簽名標籤頁已激活，初始化簽名板');
                // 延遲一下，確保標籤頁內容已完全顯示
                setTimeout(initSignaturePads, 100);
            }
        });
    });
    
    // 初始化簽名板
    function initSignaturePads() {
        // 檢查人簽名
        initSignaturePad('inspectorSignature', 'clearInspectorSignature', function(pad) {
            inspectorSignaturePad = pad;
        });
        
        // 確認人簽名
        initSignaturePad('confirmSignature', 'clearConfirmSignature', function(pad) {
            confirmSignaturePad = pad;
        });
    }
    
    // 初始化單個簽名板
    function initSignaturePad(canvasId, clearBtnId, callback) {
        const canvas = document.getElementById(canvasId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!canvas) {
            console.error(`找不到畫布元素: ${canvasId}`);
            return;
        }
        
        if (!clearBtn) {
            console.error(`找不到清除按鈕: ${clearBtnId}`);
            return;
        }
        
        console.log(`正在設置簽名板: ${canvasId}`);
        
        // 獲取簽名容器
        const container = canvas.parentElement;
        if (!container) {
            console.error(`找不到簽名容器: ${canvasId}`);
            return;
        }
        
        // 獲取容器尺寸
        const rect = container.getBoundingClientRect();
        console.log(`簽名容器尺寸: ${rect.width}x${rect.height}`);
        
        // 設置畫布尺寸
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        
        // 確保容器有尺寸
        if (rect.width <= 0 || rect.height <= 0) {
            console.warn(`簽名容器尺寸為零，使用固定尺寸`);
            canvas.width = 800 * ratio;
            canvas.height = 180 * ratio;
            canvas.style.width = '800px';
            canvas.style.height = '180px';
        } else {
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
        }
        
        // 設置縮放比例
        const ctx = canvas.getContext('2d');
        ctx.scale(ratio, ratio);
        
        console.log(`畫布尺寸設置為: ${canvas.width}x${canvas.height}, 比例: ${ratio}`);
        
        // 初始化 SignaturePad
        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
            minWidth: 2,
            maxWidth: 5,
            throttle: 16,
            velocityFilterWeight: 0.7
        });
        
        // 清除按鈕事件
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
        
        // 返回簽名板實例
        if (typeof callback === 'function') {
            callback(signaturePad);
        }
        
        return signaturePad;
    }
    
    // 頁面加載完成後初始化簽名板
    window.addEventListener('load', function() {
        console.log('頁面加載完成，初始化簽名板');
        // 如果簽名標籤頁是活動的，初始化簽名板
        const signaturesTab = document.getElementById('signatures');
        if (signaturesTab && signaturesTab.classList.contains('active')) {
            initSignaturePads();
        }
    });
    
    // 窗口大小改變時重新初始化簽名板
    window.addEventListener('resize', function() {
        console.log('窗口大小改變，重新初始化簽名板');
        // 如果簽名標籤頁是活動的，初始化簽名板
        const signaturesTab = document.getElementById('signatures');
        if (signaturesTab && signaturesTab.classList.contains('active')) {
            initSignaturePads();
        }
    });
});
