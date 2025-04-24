// --- Game Content (Updated Chrono Labs & Boss Difficulty) ---

// --- Global Variables ---
let levelEl, xpEl, nextXpEl, streakEl, xpBarFillEl, worldsContainer,
    perksListEl, skillPointsDisplayEl, settingsModalEl, musicVolumeSlider, sfxVolumeSlider,
    statsModalEl, statsListEl, shopModalEl, shopItemsListEl, shopCurrencyDisplayEl, // Added Shop elements
    summaryModalEl, summaryTitleEl, summaryDetailsEl, // Added Summary elements
    bossBattleUI, bossNameEl, bossHpFillEl, bossHpTextEl, bossStatusEl, bossVisualEl,
    playerFocusFillEl, playerFocusTextEl, itemsUiEl, skillPointsStatEl, currencyStatEl, // Added currency stat display
    timerDisplayEl, modifierDisplayEl, difficultyChoiceEl, difficultySettingsButtonsEl; // Added difficulty settings buttons

// --- Initial Game Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign element variables
    levelEl = document.getElementById('level'); xpEl = document.getElementById('xp'); nextXpEl = document.getElementById('next-xp'); streakEl = document.getElementById('streak'); xpBarFillEl = document.getElementById('xp-bar-fill'); worldsContainer = document.getElementById('worlds'); worldSelectScreen = document.getElementById('world-select-screen'); missionSelectScreen = document.getElementById('mission-select-screen'); challengeScreen = document.getElementById('challenge-screen'); worldTitleEl = document.getElementById('world-title'); missionListEl = document.getElementById('mission-list'); challengeTitleEl = document.getElementById('challenge-title'); questionEl = document.getElementById('question'); optionsEl = document.getElementById('options'); feedbackEl = document.getElementById('feedback'); nextBtn = document.getElementById('next-btn'); bgMusicEl = document.getElementById('bg-music'); toggleMusicBtn = document.getElementById('toggle-music-btn'); musicIconOn = document.getElementById('music-icon-on'); musicIconOff = document.getElementById('music-icon-off'); musicBtnText = document.getElementById('music-btn-text'); achievementToastEl = document.getElementById('achievement-toast'); achievementsModalEl = document.getElementById('achievements-modal'); achievementsListEl = document.getElementById('achievements-list'); perksModalEl = document.getElementById('perks-modal'); perksListEl = document.getElementById('perks-list'); skillPointsDisplayEl = document.getElementById('skill-points-display'); settingsModalEl = document.getElementById('settings-modal'); musicVolumeSlider = document.getElementById('music-volume'); sfxVolumeSlider = document.getElementById('sfx-volume'); statsModalEl = document.getElementById('stats-modal'); statsListEl = document.getElementById('stats-list'); shopModalEl = document.getElementById('shop-modal'); shopItemsListEl = document.getElementById('shop-items-list'); shopCurrencyDisplayEl = document.getElementById('shop-currency-display'); summaryModalEl = document.getElementById('summary-modal'); summaryTitleEl = document.getElementById('summary-title'); summaryDetailsEl = document.getElementById('summary-details'); bossBattleUI = document.getElementById('boss-battle-ui'); bossNameEl = document.getElementById('boss-name'); bossHpFillEl = document.getElementById('boss-hp-fill'); bossHpTextEl = document.getElementById('boss-hp-text'); bossStatusEl = document.getElementById('boss-status'); bossVisualEl = document.getElementById('boss-visual'); playerFocusFillEl = document.getElementById('player-focus-fill'); playerFocusTextEl = document.getElementById('player-focus-text'); itemsUiEl = document.getElementById('items-ui'); skillPointsStatEl = document.getElementById('skill-points-stat'); currencyStatEl = document.getElementById('currency-stat'); timerDisplayEl = document.getElementById('timer-display'); modifierDisplayEl = document.getElementById('modifier-display'); difficultyChoiceEl = document.getElementById('difficulty-choice'); difficultySettingsButtonsEl = document.getElementById('difficulty-settings-buttons');

    // Add event listeners for settings sliders
    if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', (e) => updateSetting('musicVolume', e.target.value));
    if (sfxVolumeSlider) sfxVolumeSlider.addEventListener('input', (e) => updateSetting('sfxVolume', e.target.value));

    // Initialize game state and UI
    initializeSfxVolume();
    initializeMusic();
    checkLevelUp(); // Includes initial stats update
    showWorlds();
    loadSettings(); // Ensure initial difficulty buttons are styled correctly
});