// 簽名板功能專用JS文件
document.addEventListener('DOMContentLoaded', function() {
    // 簡單的簽名板實現
    function setupSignaturePad(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas with id ${canvasId} not found`);
            return null;
        }
        
        // 設置畫布尺寸
        function resizeCanvas() {
            const container = canvas.parentElement;
            const rect = container.getBoundingClientRect();
            
            // 設置畫布尺寸為容器的實際尺寸
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // 清除畫布
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 重新繪製已有的簽名
            if (canvas.signatureData && canvas.signatureData.length > 0) {
                drawSignature(canvas.signatureData);
            }
        }
        
        // 初始化畫布
        canvas.signatureData = [];
        resizeCanvas();
        
        // 繪製簽名
        function drawSignature(points) {
            if (points.length === 0) return;
            
            const ctx = canvas.getContext('2d');
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // 繪製所有線段
            for (const line of points) {
                if (line.length < 2) continue;
                
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[0].y);
                
                for (let i = 1; i < line.length; i++) {
                    ctx.lineTo(line[i].x, line[i].y);
                }
                
                ctx.stroke();
            }
        }
        
        // 事件處理
        let isDrawing = false;
        let currentLine = [];
        
        // 獲取相對於畫布的坐標
        function getCoordinates(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            return { x, y };
        }
        
        // 獲取觸摸事件的坐標
        function getTouchCoordinates(event) {
            const rect = canvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            return { x, y };
        }
        
        // 開始繪製
        function startDrawing(coords) {
            isDrawing = true;
            currentLine = [coords];
            
            const ctx = canvas.getContext('2d');
            ctx.beginPath();
            ctx.moveTo(coords.x, coords.y);
        }
        
        // 繼續繪製
        function draw(coords) {
            if (!isDrawing) return;
            
            currentLine.push(coords);
            
            const ctx = canvas.getContext('2d');
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
        
        // 結束繪製
        function stopDrawing() {
            if (!isDrawing) return;
            
            isDrawing = false;
            if (currentLine.length > 0) {
                canvas.signatureData.push(currentLine);
            }
        }
        
        // 滑鼠事件
        canvas.addEventListener('mousedown', function(e) {
            e.preventDefault();
            startDrawing(getCoordinates(e));
        });
        
        canvas.addEventListener('mousemove', function(e) {
            e.preventDefault();
            draw(getCoordinates(e));
        });
        
        canvas.addEventListener('mouseup', function(e) {
            e.preventDefault();
            stopDrawing();
        });
        
        canvas.addEventListener('mouseout', function(e) {
            e.preventDefault();
            stopDrawing();
        });
        
        // 觸摸事件
        canvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            startDrawing(getTouchCoordinates(e));
        });
        
        canvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            draw(getTouchCoordinates(e));
        });
        
        canvas.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopDrawing();
        });
        
        // 視窗大小變化時調整畫布
        window.addEventListener('resize', resizeCanvas);
        
        // 返回簽名板API
        return {
            clear: function() {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.signatureData = [];
            },
            isEmpty: function() {
                return canvas.signatureData.length === 0;
            },
            toDataURL: function() {
                return canvas.toDataURL();
            },
            fromDataURL: function(dataUrl) {
                const img = new Image();
                img.onload = function() {
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                };
                img.src = dataUrl;
            }
        };
    }
    
    // 初始化簽名板
    setTimeout(function() {
        // 創建簽名板實例
        window.inspectorSignaturePad = setupSignaturePad('inspectorSignature');
        window.confirmSignaturePad = setupSignaturePad('confirmSignature');
        
        // 綁定清除按鈕
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
        
        // 嘗試加載已保存的簽名
        const savedData = localStorage.getItem('checklistData');
        if (savedData) {
            try {
                const formData = JSON.parse(savedData);
                if (formData.inspectorSignature && window.inspectorSignaturePad) {
                    window.inspectorSignaturePad.fromDataURL(formData.inspectorSignature);
                }
                if (formData.confirmSignature && window.confirmSignaturePad) {
                    window.confirmSignaturePad.fromDataURL(formData.confirmSignature);
                }
            } catch (e) {
                console.error('Error loading saved signatures:', e);
            }
        }
    }, 500);
});
