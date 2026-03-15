const config = {
    tempSupply: { min: 60, max: 90, normMin: 65, normMax: 80 },
    tempReturn: { min: 40, max: 60, normMin: 45, normMax: 55 },
    flow: { min: 5, max: 25, normMin: 10, normMax: 20 },
    power: { min: 0, max: 500, normMin: 50, normMax: 400 }
};

let historyData = [];
let totalEnergy = 0;

const ctx = document.getElementById('historyChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Потужність (кВт)',
            data: [],
            borderColor: '#2563eb',
            tension: 0.4
        }]
    },
    options: { responsive: true }
});

function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getStatus(val, cfg) {
    if (val >= cfg.normMin && val <= cfg.normMax) return 'normal';
    if (val < cfg.min || val > cfg.max) return 'critical';
    return 'warning';
}

function updateUI(id, value, status) {
    const card = document.getElementById(`${id}-card`);
    const dot = card.querySelector('.status-dot');
    card.className = `card status-${status}`;
    
    if (dot) {
        if (status === 'normal') dot.style.background = '#22c55e';
        else if (status === 'warning') dot.style.background = '#eab308';
        else dot.style.background = '#ef4444';
    }

    if (status === 'critical') {
        document.getElementById('alert-sound').play().catch(() => {});
    }
}

function refreshData() {
    try {
        const data = {
            ts: getRandom(config.tempSupply.min, config.tempSupply.max),
            tr: getRandom(config.tempReturn.min, config.tempReturn.max),
            f: getRandom(config.flow.min, config.flow.max),
            p: getRandom(config.power.min, config.power.max),
            dhw: getRandom(50, 70),
            time: new Date().toLocaleTimeString()
        };

        document.getElementById('temp-supply').textContent = data.ts;
        updateUI('temp-supply', data.ts, getStatus(data.ts, config.tempSupply));

        document.getElementById('temp-return').textContent = data.tr;
        updateUI('temp-return', data.tr, getStatus(data.tr, config.tempReturn));

        document.getElementById('flow').textContent = data.f;
        updateUI('flow', data.f, getStatus(data.f, config.flow));

        document.getElementById('power').textContent = data.p;
        updateUI('power', data.p, getStatus(data.p, config.power));

        document.getElementById('temp-dhw').textContent = data.dhw;
        document.getElementById('valve-status').textContent = data.p > 0 ? 'Відкрито 65%' : 'Закрито';
        document.getElementById('last-update').textContent = `Останнє оновлення: ${data.time}`;

        totalEnergy += (data.p / 60);
        
        updateHistory(data);
    } catch (e) {
        console.error("Помилка даних:", e);
    }
}

function updateHistory(data) {
    const log = document.getElementById('log-list');
    const li = document.createElement('li');
    li.textContent = `[${data.time}] Потужність: ${data.p}кВт | Всього: ${totalEnergy.toFixed(2)} кВт*год`;
    log.prepend(li);
    if (log.children.length > 10) log.lastChild.remove();

    chart.data.labels.push(data.time);
    chart.data.datasets[0].data.push(data.p);
    if (chart.data.labels.length > 15) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update();

    historyData.push(data);
}

document.getElementById('refresh-btn').addEventListener('click', refreshData);

document.getElementById('export-btn').addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Time,Supply,Return,Power\n"
        + historyData.map(d => `${d.time},${d.ts},${d.tr},${d.p}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "heat_data.csv");
    document.body.appendChild(link);
    link.click();
});

setInterval(refreshData, 5000);
refreshData();