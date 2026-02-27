// const container = document.getElementById('draggableContainer');
//         const img = document.getElementById('draggableImage');
//         const debug = document.getElementById('debug');

//         // Конфигурация
//         const maxScale = 5;
        
//         // Состояние
//         let scaleValue = 1;
//         let currentX = 0;
//         let currentY = 0;
//         let isDragging = false;
//         let startX = 0;
//         let startY = 0;

//         // Состояние для Pinch
//         let initialPinchDistance = 0;
//         let initialPinchScale = 1;
//         let lastTouchTime = 0;

//         // --- ОСНОВНЫЕ ФУНКЦИИ ---

//         function updatePosition(newScale, calcX, calcY) {
//             const rect = container.getBoundingClientRect();
//             const scaledWidth = img.offsetWidth * newScale;
//             const scaledHeight = img.offsetHeight * newScale;

//             // Clamping (ограничение перемещения)
//             let finalX, finalY;

//             if (scaledWidth > rect.width) {
//                 finalX = Math.min(0, Math.max(calcX, rect.width - scaledWidth));
//             } else {
//                 finalX = (rect.width - scaledWidth) / 2;
//             }

//             if (scaledHeight > rect.height) {
//                 finalY = Math.min(0, Math.max(calcY, rect.height - scaledHeight));
//             } else {
//                 finalY = (rect.height - scaledHeight) / 2;
//             }

//             // Обновляем состояние
//             scaleValue = newScale;
//             currentX = finalX;
//             currentY = finalY;

//             // Применяем стили
//             img.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scaleValue})`;
//             debug.innerText = `Scale: ${scaleValue.toFixed(2)}`;
//         }

//         function calculateDistance(touches) {
//             return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
//         }

//         function handleDoubleInteraction(clientX, clientY) {
//             const targetScale = scaleValue >= maxScale / 2 ? 1 : maxScale;
//             const rect = container.getBoundingClientRect();
            
//             const x = clientX - rect.left;
//             const y = clientY - rect.top;
//             const ratio = targetScale / scaleValue;

//             const newX = x - (x - currentX) * ratio;
//             const newY = y - (y - currentY) * ratio;

//             updatePosition(targetScale, newX, newY);
//         }

//         // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

//         // Колесико мыши
//         container.addEventListener('wheel', (e) => {
//             e.preventDefault();
//             const rect = container.getBoundingClientRect();
//             const mouseX = e.clientX - rect.left;
//             const mouseY = e.clientY - rect.top;

//             const delta = -Math.sign(e.deltaY);
//             const step = Math.pow(1 + 0.1, delta); // 0.1 для более быстрого зума на ПК
//             const newScale = Math.min(maxScale, Math.max(1, scaleValue * step));

//             const ratio = newScale / scaleValue;
//             updatePosition(newScale, mouseX - (mouseX - currentX) * ratio, mouseY - (mouseY - currentY) * ratio);
//         }, { passive: false });

//         // Тач события
//         container.addEventListener('touchstart', (e) => {
//             e.preventDefault();
//             const touches = e.touches;

//             if (touches.length === 1) {
//                 // Drag start
//                 isDragging = scaleValue > 1;
//                 startX = touches[0].clientX - currentX;
//                 startY = touches[0].clientY - currentY;
//             } else if (touches.length === 2) {
//                 // Pinch start
//                 isDragging = false;
//                 initialPinchDistance = calculateDistance(touches);
//                 initialPinchScale = scaleValue;
//             }
//         }, { passive: false });

//         container.addEventListener('touchmove', (e) => {
//             e.preventDefault();
//             const touches = e.touches;

//             if (touches.length === 1 && isDragging) {
//                 updatePosition(scaleValue, touches[0].clientX - startX, touches[0].clientY - startY);
//             } else if (touches.length === 2 && initialPinchDistance > 0) {
//                 const currentDist = calculateDistance(touches);
//                 if (Math.abs(currentDist - initialPinchDistance) < 5) return;
//                 const newScale = Math.min(maxScale, Math.max(1, initialPinchScale * (currentDist / initialPinchDistance)));

//                 const rect = container.getBoundingClientRect();
//                 const centerX = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
//                 const centerY = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

//                 const ratio = newScale / scaleValue;
//                 updatePosition(newScale, centerX - (centerX - currentX) * ratio, centerY - (centerY - currentY) * ratio);
//             }
//         }, { passive: false });

//         container.addEventListener('touchend', (e) => {
//             const now = Date.now();
//             const timeBetweenTouching = now - lastTouchTime;

//             if (timeBetweenTouching < 300 && e.touches.length === 0) {
//                 const t = e.changedTouches[0];
//                 handleDoubleInteraction(t.clientX, t.clientY);
//             }
//             lastTouchTime = now;
            
//             isDragging = false;
//             initialPinchDistance = 0;
//             initialPinchScale = 1;
//         });

//         // Мышь (для тестов на ПК)
//         container.addEventListener('mousedown', (e) => {
//             if (scaleValue > 1) {
//                 isDragging = true;
//                 startX = e.clientX - currentX;
//                 startY = e.clientY - currentY;
//             }
//         });

//         window.addEventListener('mousemove', (e) => {
//             if (isDragging) updatePosition(scaleValue, e.clientX - startX, e.clientY - startY);
//         });

//         window.addEventListener('mouseup', () => isDragging = false);

//         // Центрируем картинку при загрузке
//         window.onload = () => updatePosition(1, 0, 0);

//elements that should be @ViewChild - change to signal
const wrapper = document.getElementById('wrapper');
const container = document.getElementById('draggableContainer');
const image = document.getElementById('draggableImage');

const pointersValue = document.getElementById('pointersValue')

//variables that should be input
const maxScale = 5;

//variables that should be signal
const isDragging = false;
const scaleValue = 1;
const startX = 0;
const startY = 0;
const currentX = 0;
const currentY = 0;
const initialPinchDistance = 0;
const lastTouch = 0;

//is really need to use dublications?
const initialPinchDublication = 0;


wrapper.addEventListener('pointerdown', (event) => {
    event.preventDefault();

    console.log('down', event);
})
wrapper.addEventListener('pointermove', (event) => {
    event.preventDefault();

    // console.log('move', event);
})
wrapper.addEventListener('pointerup', (event) => {
    event.preventDefault();

    // console.log('up', event);
    pointersValue.innerHTML = 0;
})
wrapper.addEventListener('pointercancel', (event) => {
    event.preventDefault();

    // console.log('cancel', event);
})

wrapper.addEventListener('touchstart', (e) => {
    console.log(e.touches.length); 

    pointersValue.innerHTML = e.touches.length;
});
wrapper.addEventListener('touchend', (e) => {
    console.log(e.touches.length);

    pointersValue.innerHTML = 0;
});


wrapper.addEventListener('wheel', (event) => {
    event.preventDefault();

    console.log('wheel', event);
})
wrapper.addEventListener('dblclick', (event) => {

})