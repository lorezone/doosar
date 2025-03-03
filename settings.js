function changeModeDifficulty() {
    const mode = document.getElementById('mode-difficulty');
    console.log(`changeModeDifficulty() :`, mode.value);
    switch (mode.value) {
        case 'Easy':
            [500, 400, 300, 200].map((val,i) => { SKILL[i] = val; });
            break;
        case 'Normal':
            [1500, 1400, 1300, 1200].map((val,i) => { SKILL[i] = val; });
            break;
        case 'Hard':
            [2500, 2400, 2300, 2200].map((val,i) => { SKILL[i] = val; });
            break;
    }
    const settings = JSON.parse(localStorage.getItem('doosar-settings')) || {mode: {}};
    settings.mode.difficulty = mode.value;
    settings.skill = SKILL;
    localStorage.setItem('doosar-settings', JSON.stringify(settings));
    console.log('Saved settings:', settings);
}

function changeModeOpenness() {
    const mode = document.getElementById('mode-openness');
    console.log(`changeModeOpenness() :`, mode.value);
    [true, false, false, false].map((val,i) => { OPEN[i] = val; });
    [false, false, false, false].map((val,i) => { FLASH[i] = val; });
    [false, false, false, false].map((val,i) => { GLANCE[i] = val; });
    [true, false, false, false].map((val,i) => { PROBE[i] = val; });
    ALLOW.analysis = true;
    switch (mode.value) {
        case '1': // None
            ALLOW.analysis = false;
            break;
        case '2': // Analysis
            break;
        case '3': // Probe
            [true, true, true, true].map((val,i) => { PROBE[i] = val; });
            break;
        case '4': // Glance
            [true, true, true, true].map((val,i) => { GLANCE[i] = val; });
            [true, true, true, true].map((val,i) => { PROBE[i] = val; });
            break;
        case '5': // Flash
            [true, true, true, true].map((val,i) => { FLASH[i] = val; });
            [true, true, true, true].map((val,i) => { GLANCE[i] = val; });
            [true, true, true, true].map((val,i) => { PROBE[i] = val; });
            break;
        case '6': // Open
            [true, true, true, true].map((val,i) => { OPEN[i] = val; });
            [true, true, true, true].map((val,i) => { GLANCE[i] = val; });
            [true, true, true, true].map((val,i) => { PROBE[i] = val; });
            break;
    }
    const element = document.getElementById('analysis');
    if(!ALLOW.analysis) element.style.display = "none";
    else element.style.display = "block";
    if(!ALLOW.analysis) {
        const notice = document.createElement('p');
        notice.innerText = 'Change mode to allow Analysis.';
        notice.style.color = 'red';
        element.parentNode.insertBefore(notice, element);
    } else {
        const notice = element.parentNode.querySelector('p');
        if (notice) element.parentNode.removeChild(notice);
    }
    const settings = JSON.parse(localStorage.getItem('doosar-settings')) || {mode: {}};
    settings.mode.openness = mode.value;
    settings.open = OPEN;
    settings.flash = FLASH;
    settings.glance = GLANCE;
    settings.probe = PROBE;
    settings.allow = ALLOW;
    localStorage.setItem('doosar-settings', JSON.stringify(settings));
    console.log('Saved settings:', settings);
}

function changeModeSpeed() {
    const mode = document.getElementById('mode-speed');
    console.log(`changeModeSpeed() :`, mode.value);
    switch (mode.value) {
        case 'Slow':
            [0, 3600, 2400, 3000].map((val,i) => { SPEED[i] = val; });
            break;
        case 'Normal':
            [0, 1200, 800, 1000].map((val,i) => { SPEED[i] = val; });
            break;
        case 'Fast':
            [0, 500, 300, 400].map((val,i) => { SPEED[i] = val; });
            break;
    }
    const settings = JSON.parse(localStorage.getItem('doosar-settings')) || {mode: {}};
    settings.mode.speed = mode.value;
    settings.speed = SPEED;
    localStorage.setItem('doosar-settings', JSON.stringify(settings));
    console.log('Saved settings:', settings);
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('doosar-settings'));
    if (settings) {
        if(!settings.mode) {
            settings.mode = { difficulty: 'Normal', openness: '1', speed: 'Normal' };
        }
        console.log('Loaded settings:', settings);
        document.getElementById('mode-difficulty').value = settings.mode.difficulty || 'Normal';
        document.getElementById('mode-openness').value = settings.mode.openness || '1';
        document.getElementById('mode-speed').value = settings.mode.speed || 'Normal';
        changeModeDifficulty();
        changeModeOpenness();
        changeModeSpeed();
    } else {
        console.log('No settings found');
    }
}
