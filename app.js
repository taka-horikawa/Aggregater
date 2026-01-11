// グローバル変数
let allData = [];
let filteredData = [];
// 不要なグローバルは削除

// ファイル選択イベント
document.getElementById('csvFile').addEventListener('change', handleFileSelect);
document.getElementById('resetFilter').addEventListener('click', resetFilters);
// 競馬場別集計のエクスポートは削除

// 閾値・レース数フィルターの変更を自動反映
document.addEventListener('DOMContentLoaded', () => {
    const thresholdInput = document.getElementById('thresholdInput');
    const raceCountMin = document.getElementById('raceCountMin');
    const hitRateMin = document.getElementById('hitRateMin');
    const onChangeRecalc = () => displayData();
    if (thresholdInput) thresholdInput.addEventListener('input', onChangeRecalc);
    if (raceCountMin) raceCountMin.addEventListener('input', onChangeRecalc);
    if (hitRateMin) hitRateMin.addEventListener('input', onChangeRecalc);

    // 競馬場・月の変更で即フィルター適用
    const venueFilter = document.getElementById('venueFilter');
    const monthSelect = document.getElementById('monthSelect');
    const onFilterChange = () => applyFilters();
    if (venueFilter) venueFilter.addEventListener('change', onFilterChange);
    if (monthSelect) monthSelect.addEventListener('change', onFilterChange);
});

// ファイル選択処理
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('fileInfo').textContent = `選択されたファイル: ${file.name}`;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file, 'UTF-8');
}

// CSV解析
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    
    allData = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        
        // データ型変換
        row['金額'] = row['金額'] && row['金額'] !== '' ? parseInt(row['金額']) : 0;
        row['出走頭数'] = parseInt(row['出走頭数']) || 0;
        row['開催日(年)'] = parseInt(row['開催日(年)']) || 0;
        row['開催日(月)'] = parseInt(row['開催日(月)']) || 0;
        row['レース番号'] = parseInt(row['レース番号']) || 0;
        
        allData.push(row);
    }
    
    console.log('データ読み込み完了:', allData.length, '件');
    console.log('サンプル:', allData[0]);
    
    filteredData = [...allData];
    
    // フィルター設定の初期化
    initializeFilters();
    
    // データ表示
    displayData();
    
    // セクション表示
    document.getElementById('filterSection').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';
}

// フィルター初期化
function initializeFilters() {
    // 競馬場フィルター
    const venues = [...new Set(allData.map(row => row['競馬場']))].sort();
    const venueFilter = document.getElementById('venueFilter');
    venueFilter.innerHTML = '<option value="" disabled selected>選択してください</option>';
    venues.forEach(venue => {
        venueFilter.innerHTML += `<option value="${venue}">${venue}</option>`;
    });

    // 月セレクト（単一）: システム月±1を初期選択
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        monthSelect.innerHTML += `<option value="${i}">${i}月</option>`;
    }
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    let defaultMonth = currentMonth; // 単一指定は現在月にします
    monthSelect.value = String(defaultMonth);

    // 金額閾値の初期値（UIに既定値があるが念のため整合）
    const thresholdInput = document.getElementById('thresholdInput');
    if (thresholdInput && !thresholdInput.value) {
        thresholdInput.value = '5000';
    }

    const raceCountMin = document.getElementById('raceCountMin');
    if (raceCountMin && !raceCountMin.value) {
        raceCountMin.value = '5';
    }

    const hitRateMin = document.getElementById('hitRateMin');
    if (hitRateMin && !hitRateMin.value) {
        hitRateMin.value = '50';
    }
}

// フィルター適用
function applyFilters() {
    const venue = document.getElementById('venueFilter').value;
    const month = parseInt(document.getElementById('monthSelect').value) || null;

    if (!venue) {
        alert('競馬場は必ず選択してください');
        return;
    }

    console.log('フィルター適用:', { venue, month });

    filteredData = allData.filter(row => {
        if (row['競馬場'] !== venue) return false;
        if (month && row['開催日(月)'] !== month) return false;
        return true;
    });

    console.log('フィルター後:', filteredData.length, '件');
    displayData();
}

// フィルターリセット
function resetFilters() {
    const venueFilter = document.getElementById('venueFilter');
    venueFilter.value = '';
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    document.getElementById('monthSelect').value = String(currentMonth);
}


// データ表示
function displayData() {
    displayStats();
    displayRaceDetail();
}
// 総レース数の詳細テーブル表示
function displayRaceDetail() {
    const tbody1 = document.getElementById('raceDetailBody');
    const tbody2 = document.getElementById('raceDetailBody2');
    if (!tbody1 && !tbody2) return;
    if (tbody1) tbody1.innerHTML = '';
    if (tbody2) tbody2.innerHTML = '';

    // 閾値の取得（未設定は5000）
    const thresholdEl = document.getElementById('thresholdInput');
    const threshold = thresholdEl ? (parseInt(thresholdEl.value) || 5000) : 5000;
    const raceCountMinEl = document.getElementById('raceCountMin');
    const raceCountMin = raceCountMinEl ? (parseInt(raceCountMinEl.value) || 1) : 1;
    const hitRateMinEl = document.getElementById('hitRateMin');
    const hitRateMin = hitRateMinEl ? (parseInt(hitRateMinEl.value) || 0) : 0; // %

    // 年間分析用データ: 月フィルターは無視し、競馬場のみ適用（未選択なら全件）
    const venueSelected = document.getElementById('venueFilter')?.value || '';
    const annualData = venueSelected ? allData.filter(row => row['競馬場'] === venueSelected) : allData;

    // 集計キー: 競馬場|レース番号|コース|距離|出走頭数
    const monthlyAgg = {};
    const annualAgg = {};
    // 月間分析は filteredData（競馬場・月のフィルター適用済み）
    filteredData.forEach(row => {
        const key = `${row['競馬場']}|${row['レース番号']}|${row['コース']}|${row['距離']}|${row['出走頭数']}`;
        if (!monthlyAgg[key]) monthlyAgg[key] = { total: 0, over: 0 };
        monthlyAgg[key].total++;
        if (row['金額'] > threshold) monthlyAgg[key].over++;
    });
    // 年間分析は annualData（競馬場のみ適用、月は無視）
    annualData.forEach(row => {
        const key = `${row['競馬場']}|${row['レース番号']}|${row['コース']}|${row['距離']}|${row['出走頭数']}`;
        if (!annualAgg[key]) annualAgg[key] = { total: 0, over: 0 };
        annualAgg[key].total++;
        if (row['金額'] > threshold) annualAgg[key].over++;
    });

    // 並び順: 競馬場(文字列) → レース番号(数値) → コース(文字列) → 距離(数値) → 出走頭数(数値)
    const sortKeys = (aggObj) => Object.keys(aggObj).sort((a,b) => {
        const [va, ra, ca, da, ha] = a.split('|');
        const [vb, rb, cb, db, hb] = b.split('|');
        if (va !== vb) return va.localeCompare(vb, 'ja');
        const rna = parseInt(ra,10), rnb = parseInt(rb,10);
        if (rna !== rnb) return rna - rnb;
        if (ca !== cb) return ca.localeCompare(cb, 'ja');
        const dna = parseInt(da,10), dnb = parseInt(db,10);
        if (dna !== dnb) return dna - dnb;
        const hna = parseInt(ha,10), hnb = parseInt(hb,10);
        return hna - hnb;
    });

    // 月間テーブルの描画（tbody1）
    if (tbody1) {
        const rowsMonthly = sortKeys(monthlyAgg);
        rowsMonthly.forEach(key => {
            const [venue, raceNum, course, distance, horses] = key.split('|');
            const { total, over } = monthlyAgg[key];
            if (total < raceCountMin) return; // 件数フィルター
            const ratio = total > 0 ? (over / total) : 0;
            if ((ratio * 100) < hitRateMin) return; // 的中率フィルター
            const tr1 = document.createElement('tr');
            tr1.innerHTML = `
                <td>${venue}</td>
                <td>${parseInt(raceNum,10)}</td>
                <td>${course}</td>
                <td>${parseInt(distance,10)}</td>
                <td>${parseInt(horses,10)}</td>
                <td>${total}</td>
                <td>${over}</td>
                <td>${(ratio * 100).toFixed(1)}%</td>
            `;
            tbody1.appendChild(tr1);
        });
    }

    // 年間テーブルの描画（tbody2）
    if (tbody2) {
        const rowsAnnual = sortKeys(annualAgg);
        rowsAnnual.forEach(key => {
            const [venue, raceNum, course, distance, horses] = key.split('|');
            const { total, over } = annualAgg[key];
            if (total < raceCountMin) return;
            const ratio = total > 0 ? (over / total) : 0;
            if ((ratio * 100) < hitRateMin) return;
            const tr2 = document.createElement('tr');
            tr2.innerHTML = `
                <td>${venue}</td>
                <td>${parseInt(raceNum,10)}</td>
                <td>${course}</td>
                <td>${parseInt(distance,10)}</td>
                <td>${parseInt(horses,10)}</td>
                <td>${total}</td>
                <td>${over}</td>
                <td>${(ratio * 100).toFixed(1)}%</td>
            `;
            tbody2.appendChild(tr2);
        });
    }
}

// 統計表示
function displayStats() {
    const totalRaces = filteredData.length;
    document.getElementById('totalRaces').textContent = totalRaces.toLocaleString();
}

