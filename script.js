// --- JavaScript content extracted from the HTML ---
// --- Includes game logic, world selection, and MCQs ---

// --- Global Variables ---
let levelEl, xpEl, nextXpEl, streakEl, xpBarFillEl, worldsContainer,
    perksListEl, skillPointsDisplayEl, settingsModalEl, musicVolumeSlider, sfxVolumeSlider,
    statsModalEl, statsListEl, shopModalEl, shopItemsListEl, shopCurrencyDisplayEl, // Added Shop elements
    summaryModalEl, summaryTitleEl, summaryDetailsEl, // Added Summary elements
    bossBattleUI, bossNameEl, bossHpFillEl, bossHpTextEl, bossStatusEl, bossVisualEl,
    playerFocusFillEl, playerFocusTextEl, itemsUiEl, skillPointsStatEl, currencyStatEl, // Added currency stat display
    timerDisplayEl, modifierDisplayEl, difficultyChoiceEl, difficultySettingsButtonsEl; // Added difficulty settings buttons

// --- Game Content (Restored Worlds and Missions) ---
const gameData = {};

// --- Load Worlds Dynamically ---
const loadWorlds = async () => {
    const worldFiles = ['gaia.js', 'neuro.js', 'chrono.js'];
    for (const file of worldFiles) {
        const module = await import(`./worlds/${file}`);
        Object.assign(gameData, module.default);
    }
    showWorlds();
};

// --- Initial Game Load ---
document.addEventListener('DOMContentLoaded', async () => {
    // Assign element variables
    levelEl = document.getElementById('level');
    xpEl = document.getElementById('xp');
    nextXpEl = document.getElementById('next-xp');
    streakEl = document.getElementById('streak');
    xpBarFillEl = document.getElementById('xp-bar-fill');
    worldsContainer = document.getElementById('worlds');
    worldSelectScreen = document.getElementById('world-select-screen');
    missionSelectScreen = document.getElementById('mission-select-screen');
    challengeScreen = document.getElementById('challenge-screen');
    worldTitleEl = document.getElementById('world-title');
    missionListEl = document.getElementById('mission-list');
    challengeTitleEl = document.getElementById('challenge-title');
    questionEl = document.getElementById('question');
    optionsEl = document.getElementById('options');
    feedbackEl = document.getElementById('feedback');
    nextBtn = document.getElementById('next-btn');
    bgMusicEl = document.getElementById('bg-music');
    toggleMusicBtn = document.getElementById('toggle-music-btn');
    musicIconOn = document.getElementById('music-icon-on');
    musicIconOff = document.getElementById('music-icon-off');
    musicBtnText = document.getElementById('music-btn-text');
    achievementToastEl = document.getElementById('achievement-toast');
    achievementsModalEl = document.getElementById('achievements-modal');
    achievementsListEl = document.getElementById('achievements-list');
    perksModalEl = document.getElementById('perks-modal');
    perksListEl = document.getElementById('perks-list');
    skillPointsDisplayEl = document.getElementById('skill-points-display');
    settingsModalEl = document.getElementById('settings-modal');
    musicVolumeSlider = document.getElementById('music-volume');
    sfxVolumeSlider = document.getElementById('sfx-volume');
    statsModalEl = document.getElementById('stats-modal');
    statsListEl = document.getElementById('stats-list');
    shopModalEl = document.getElementById('shop-modal');
    shopItemsListEl = document.getElementById('shop-items-list');
    shopCurrencyDisplayEl = document.getElementById('shop-currency-display');
    summaryModalEl = document.getElementById('summary-modal');
    summaryTitleEl = document.getElementById('summary-title');
    summaryDetailsEl = document.getElementById('summary-details');
    bossBattleUI = document.getElementById('boss-battle-ui');
    bossNameEl = document.getElementById('boss-name');
    bossHpFillEl = document.getElementById('boss-hp-fill');
    bossHpTextEl = document.getElementById('boss-hp-text');
    bossStatusEl = document.getElementById('boss-status');
    bossVisualEl = document.getElementById('boss-visual');
    playerFocusFillEl = document.getElementById('player-focus-fill');
    playerFocusTextEl = document.getElementById('player-focus-text');
    itemsUiEl = document.getElementById('items-ui');
    skillPointsStatEl = document.getElementById('skill-points-stat');
    currencyStatEl = document.getElementById('currency-stat');
    timerDisplayEl = document.getElementById('timer-display');
    modifierDisplayEl = document.getElementById('modifier-display');
    difficultyChoiceEl = document.getElementById('difficulty-choice');
    difficultySettingsButtonsEl = document.getElementById('difficulty-settings-buttons');

    // Add event listeners for settings sliders
    if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', (e) => updateSetting('musicVolume', e.target.value));
    if (sfxVolumeSlider) sfxVolumeSlider.addEventListener('input', (e) => updateSetting('sfxVolume', e.target.value));

    // Load worlds dynamically
    await loadWorlds();

    // Initialize game state and UI
    initializeSfxVolume();
    initializeMusic();
    checkLevelUp(); // Includes initial stats update
    loadSettings(); // Ensure initial difficulty buttons are styled correctly
});

// --- Close Modal Function ---
const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-hidden');
        modal.classList.remove('modal-visible');
    }
};

// --- Open Modal Function ---
const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('modal-visible');
        modal.classList.remove('modal-hidden');
    }
};

// --- Ensure Modal Clicks Don't Propagate ---
document.addEventListener('click', (event) => {
    const modalContent = event.target.closest('.modal-content');
    if (!modalContent) {
        const openModals = document.querySelectorAll('.modal-visible');
        openModals.forEach((modal) => {
            modal.classList.add('modal-hidden');
            modal.classList.remove('modal-visible');
        });
    }
});

// --- Display World Selection ---
const showWorlds = () => {
    if (!worldsContainer) return;
    worldsContainer.innerHTML = '';
    const worldEntries = Object.entries(gameData).filter(([id, data]) => data.order).sort(([,a], [,b]) => a.order - b.order);
    worldEntries.forEach(([id, world]) => {
        const unlocked = true; // Simplified for local testing
        const worldCard = document.createElement('button');
        worldCard.className = `p-5 rounded-lg shadow-md text-left transition duration-200 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-60 flex items-center space-x-4 ${ unlocked ? 'bg-gray-700/70 hover:bg-gray-600/90 hover:scale-[1.03] cursor-pointer' : 'bg-gray-800/50 opacity-50 cursor-not-allowed' }`;
        worldCard.innerHTML = `<span class="text-3xl">${world.icon || '🌐'}</span><div><strong class="text-lg ${unlocked ? 'text-blue-300' : 'text-gray-500'} block mb-0.5 font-title">${world.name}</strong><span class="text-sm ${unlocked ? 'text-gray-400' : 'text-gray-600'}">Explore ${world.missions.length} challenges</span></div>`;
        if (unlocked) {
            worldCard.onclick = () => {
                selectWorld(id);
            };
        } else {
            worldCard.disabled = true;
        }
        worldsContainer.appendChild(worldCard);
    });
};

// --- Select World ---
const selectWorld = (worldId) => {
    if (!worldTitleEl || !missionListEl) return;
    currentWorldId = worldId;
    const world = gameData[worldId];
    worldTitleEl.textContent = world.name;
    missionListEl.innerHTML = '';
    world.missions.forEach((mission) => {
        const btn = document.createElement('button');
        btn.textContent = mission.name;
        btn.onclick = () => loadMission(mission);
        missionListEl.appendChild(btn);
    });
    switchScreen('mission-select-screen');
};