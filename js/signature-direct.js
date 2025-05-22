// 直接從測試頁面複製的簽名功能
document.addEventListener('DOMContentLoaded', function() {
    // 檢查人簽名
    setupSignature('inspectorSignature', 'clearInspectorSignature');
    
    // 確認人簽名
    setupSignature('confirmSignature', 'clearConfirmSignature');
    
    function setupSignature(canvasId, clearBtnId) {
        const canvas = document.getElementById(canvasId);
        const clearBtn = document.getElementById(clearBtnId);
        
        if (!canvas || !clearBtn) {
            console.error(`Canvas ${canvasId} or clear button ${clearBtnId} not found`);
            return;
        }
        
        console.log(`Setting up signature for ${canvasId}`);
        
        // 設置畫布尺寸
        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            console.log(`Canvas size set to ${canvas.width}x${canvas.height}`);
            
            // 重新設置繪圖樣式，因為 canvas 尺寸改變會重置上下文
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            
            // 設置白色背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 初始化
        const ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 初始設置繪圖樣式
        ctx.lineWidth = 5; // 增加線條寬度
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000'; // 確保使用純黑色
        
        // 清除畫布並設置背景色
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
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
        
        // 清除按鈕
        clearBtn.addEventListener('click', function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // 重新填充白色背景
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        
        // 為全局變量提供API
        window[canvasId + 'API'] = {
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
});
