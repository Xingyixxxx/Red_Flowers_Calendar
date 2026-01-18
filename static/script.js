let currentDate = new Date();
let flowerData = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchFlowers();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        updateStats();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        updateStats();
    });
});

async function fetchFlowers() {
    try {
        const response = await fetch('/api/flowers');
        flowerData = await response.json();
        renderCalendar();
        updateStats();
    } catch (error) {
        console.error('Error fetching flowers:', error);
    }
}

function updateStats() {
    // Total count
    const total = Object.values(flowerData).reduce((sum, count) => sum + count, 0);
    document.getElementById('totalCount').innerText = total;

    // Monthly count
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const monthlyTotal = Object.keys(flowerData)
        .filter(dateStr => dateStr.startsWith(prefix))
        .reduce((sum, key) => sum + flowerData[key], 0);

    document.getElementById('monthlyCount').innerText = monthlyTotal;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update Header
    const formattedMonth = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(currentDate);
    document.getElementById('monthDisplay').innerText = formattedMonth;

    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '';

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Day of week of 1st day (0 = Sunday, 1 = Monday, etc.)
    // Let's assume Monday start for Chinese preference, or Sunday.
    // Standard JS getDay(): 0(Sun) - 6(Sat). 
    // Usually calendars start on Sunday or Monday. Let's do Sunday for standard grid logic first.
    const startDay = firstDay.getDay();

    // Padding days
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty-day');
        calendarDiv.appendChild(emptyCell);
    }

    const todayDate = new Date();
    const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() === month;

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');

        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Check if today
        if (isCurrentMonth && todayDate.getDate() === day) {
            cell.classList.add('today');
        }

        // Add Date Number
        const numberSpan = document.createElement('span');
        numberSpan.classList.add('day-number');
        numberSpan.innerText = day;
        cell.appendChild(numberSpan);

        // Check if has flower
        if (flowerData[dateStr] && flowerData[dateStr] > 0) {
            addFlowerVisual(cell);
        }

        // Click Event
        cell.addEventListener('click', () => toggleFlower(dateStr, cell));

        calendarDiv.appendChild(cell);
    }
}

function addFlowerVisual(cell) {
    // Prevent duplicate flowers visually if logic is called multiple times
    if (cell.querySelector('.flower')) return;

    const flower = document.createElement('div');
    flower.classList.add('flower');
    flower.innerText = '🌺'; // Could be randomized later
    cell.appendChild(flower);
}

async function toggleFlower(dateStr, cell) {
    const currentCount = flowerData[dateStr] || 0;
    const newCount = currentCount > 0 ? 0 : 1; // Toggle logic

    // Optimistic UI update
    if (newCount > 0) {
        flowerData[dateStr] = 1;
        addFlowerVisual(cell);
    } else {
        delete flowerData[dateStr];
        const flower = cell.querySelector('.flower');
        if (flower) flower.remove();
    }
    updateStats();

    // Send to backend
    try {
        const response = await fetch('/api/flowers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date: dateStr, count: newCount })
        });

        if (!response.ok) {
            console.error('Sync failed');
            // Revert on failure (omitted for MVP simplicity)
        }
    } catch (error) {
        console.error('Network error', error);
    }
}
