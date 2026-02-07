import { story } from './story.js';
import { audio } from './audio.js';
import { Terminal } from './terminal.js';
import { ImageProcessor } from './image-processor.js';
import { startMasqueradeBGM } from './interactive_bgm.js';
import { soundUI } from './sound_ui.js';
import { unlockAudio } from './ios_audio_helper.js';

const terminal = new Terminal(
    document.getElementById('terminal-output'),
    document.getElementById('command-input'),
    document.getElementById('input-area')
);
const processor = new ImageProcessor();
const visualCanvas = document.getElementById('visual-canvas');
if (visualCanvas) visualCanvas.style.display = 'none';

let state = {
    currentPhase: 'LOADING',
    currentIndex: 0,
    princes: story.princes,
    glitchInterval: null
};

document.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('click', async () => {
        await audio.init();
        const input = document.getElementById('command-input');
        if (input) input.focus();
    }, { once: true });

    document.addEventListener('click', () => {
        const input = document.getElementById('command-input');
        if (input && !input.disabled) {
            input.focus();
        }
    });

    terminal.onCommand(handleCommand);

    // Intro Button Logic
    const startBtn = document.getElementById('start-btn');
    const introScreen = document.getElementById('intro-screen');
    const terminalContainer = document.getElementById('terminal-container');

    console.log('Searching for start-btn...');
    if (startBtn) {
        console.log('start-btn found, adding listeners');
        let isStarting = false;
        const startHandler = async (e) => {
            console.log('Intro button clicked/touched', e.type);
            // Prevent multiple triggers (sync check)
            if (isStarting || introScreen.style.opacity === '0') {
                console.log('Ignored: isStarting=', isStarting, 'opacity=', introScreen.style.opacity);
                return;
            }
            isStarting = true;

            // Only prevent default on touch to avoid double-firing, let click pass if needed
            if (e.type === 'touchstart') {
                e.preventDefault();
            }

            // --- iOS Audio Unlock Sequence ---
            // 1. Force Audio Session to "Playback" via Silent Video
            // 2. Resume Tone.js Context
            try {
                await unlockAudio();

                // 3. Initialize SFX (Sharing the now-unlocked Tone context)
                await audio.init();

                console.log('Audio System Unlocked & Initialized');
            } catch (err) {
                console.warn('Audio unlock warning:', err);
            }

            // Start BGM (Context is already running)
            startMasqueradeBGM();

            // Prevent double clicks
            startBtn.style.pointerEvents = 'none';

            // Fade out intro
            introScreen.style.opacity = '0';
            introScreen.style.transition = 'opacity 1s ease';

            await delay(1000);
            introScreen.classList.add('hidden');
            terminalContainer.classList.remove('hidden');

            await startSequence();
        };

        startBtn.addEventListener('click', startHandler);
        startBtn.addEventListener('touchstart', startHandler, { passive: false });
    } else {
        console.error('start-btn NOT FOUND in DOM');
    }
});

async function startSequence() {
    state.currentPhase = 'LOADING';
    terminal.setInputEnabled(false);

    // Phase 0: Loading
    await termType("터미널 초기화 중...", 100);
    await delay(1500);
    audio.playBeep(800, 0.05);

    // Phase 1: System Boot
    state.currentPhase = 'BOOT';
    audio.startHum();

    await termType("[ SYSTEM ] 왕가 기록 보관소 v3.17", 30, 'system');
    await delay(300);
    await termType("[ SYSTEM ] 비정상 감정 패턴 감지", 30, 'system');
    await delay(300);
    await termType("[ SYSTEM ] 접근 권한 확인 중...", 30, 'system');
    audio.playGlitch();
    await delay(500);
    await termType("[ SYSTEM ] 우회 접속 허용", 50, 'system');

    await delay(2000);

    // Phase 2: Warning
    state.currentPhase = 'WARNING';
    terminal.print(" ");
    await termType("[ WARNING ]", 50, 'warning');
    await termType("본 시스템에는 왕자들의 민감정보가 포함되어 있습니다.", 40, 'warning');
    terminal.print(" ");
    await delay(1000);
    await termType("계속 접근할 경우 보안 시스템이 활성화될 수 있습니다.", 40, 'warning');

    await delay(2000);

    // Phase 3 Trigger
    // Prompt user to type manually instead of button
    await termType("[ HINT ] Type 'load princes' to proceed.", 30, 'system');
    terminal.setInputEnabled(true);
}

async function loadPrincesSequence() { // Renamed from runProfileSequence
    state.currentPhase = 'PROFILE_LOOP';
    terminal.print(" ");
    await termType("[ SYSTEM ]", 30, 'system');
    await termType("Royal Archive loading...", 50);
    await delay(1000);

    for (let i = 0; i < state.princes.length; i++) {
        await showPrinceProfile(i);
        await delay(1500);
    }

    await triggerSelectionMenu();
}

async function handleCommand(cmd) {
    const cleanCmd = cmd.trim().toLowerCase();

    // Check for 'load princes' command
    // Note: We need to make sure currentPhase is correct. 
    // In startSequence, we should set a phase that allows this.
    // Let's assume 'WARNING' or 'INIT' is the phase before loading.
    // Looking at previous code, startSequence ends with the prompt.
    // Let's check startSequence phase setting.

    // Check for 'load princes' command during WARNING phase
    // Check for 'load princes' command during WARNING phase
    if (state.currentPhase === 'WARNING') {
        const easterEggKeywords = [
            'wish', 'nct wish', 'nct', '위시',
            '리쿠', '사쿠야', '시온', '재희', '대영', '유우시',
            '토쿠노', '료', '히로세', '후지나가', '마에다', '오시온', '김재희',
            '엔시티', '엔위시', '엔시티 위시'
        ];

        if (cleanCmd === 'load princes') {
            terminal.setInputEnabled(false);
            await loadPrincesSequence();
            return;
        } else if (easterEggKeywords.includes(cleanCmd)) {
            terminal.setInputEnabled(false);
            try {
                audio.playGlitch();

                // Show Wichu Image
                let imgSrc = `assets/pixelated/wichu.png`;
                let img = await processor.loadImage(imgSrc);
                const processedCanvas = processor.process(img);
                terminal.appendCanvas(processedCanvas);

                await termType(`[ SYSTEM ] ...WICHU DETECTED?`, 30);
                await delay(500);
                await termType(`[ SYSTEM ] Please type 'load princes' to proceed.`, 30, 'system');
            } catch (e) {
                console.error("Easter egg failed", e);
            }
            terminal.print(" ");
            terminal.setInputEnabled(true);
            return;
        } else {
            // Invalid command handling
            await termType(`[ SYSTEM ] Invalid command. Type 'load princes' to proceed.`, 30, 'warning');
            terminal.print(" ");
            return;
        }
    }

}

async function showPrinceProfile(index) {
    const prince = state.princes[index];
    state.currentIndex = index;

    terminal.clear();

    audio.playBeep(1200, 0.1);
    await termType(`[ LOADING PROFILE 0${index + 1}/0${state.princes.length}... ]`, 30);
    await delay(500);

    try {
        let imgSrc = `assets/pixelated/${prince.id}.png`;
        let img = await processor.loadImage(imgSrc);
        const processedCanvas = processor.process(img);
        terminal.appendCanvas(processedCanvas);
    } catch (e) {
        // Ignore
    }

    terminal.print(" ");

    const isMobile = window.innerWidth < 768;
    const baseSpeed = isMobile ? 60 : 30;

    await termType(`[ PROFILE LOADED ]`);
    await termType(`${prince.name} — ${prince.kingdom}`);

    terminal.print(" ");
    await termType(prince.quote, baseSpeed, 'highlight');
    terminal.print(" ");

    await delay(1000);

    audio.playGlitch();
    await termType("[ WARNING ] 기록 열람이 감지되었습니다.", 30, 'warning');
}

async function triggerSelectionMenu() {
    state.currentPhase = 'SELECTION_MENU';
    terminal.clear();

    await termType("[ SYSTEM ] 당신의 열람이 감지되고 있습니다.", 30, 'system');
    terminal.print(" ");
    audio.playGlitch();
    await termType("[ SYSTEM ] 선택한 왕자의 기록이 열람됩니다.", 30, 'system');
    await termType("[ SYSTEM ] 열람할 기록을 선택하세요:", 30, 'system');

    let availablePrinces = [...state.princes];

    while (true) {
        terminal.print(" ");
        const menuOptions = [
            ...availablePrinces.map(p => ({ label: p.id, value: p.id }))
        ];

        // Show exit only when all princes are visited
        if (availablePrinces.length === 0) {
            menuOptions.push({ label: 'exit', value: 'exit' });
        }

        const choice = await terminal.showMenu(menuOptions);

        if (choice === 'exit') {
            await triggerFinalCollapse();
            break;
        }

        await loadFinalPrinceStory(choice);

        availablePrinces = availablePrinces.filter(p => p.id !== choice);

        terminal.clear();
        await termType("[ SYSTEM ] 열람할 기록을 선택하세요:", 30, 'system');
        terminal.print(" ");
    }
}

async function loadFinalPrinceStory(princeId) {
    const prince = state.princes.find(p => p.id === princeId);
    if (!prince) return;

    state.currentIndex = state.princes.indexOf(prince);
    state.currentPhase = 'STORY';

    terminal.clear();
    await delay(1000);

    await termType(prince.quote, 40, 'highlight');
    terminal.print(" ");
    await delay(1000);

    try {
        let imgSrc = `assets/pixelated/${prince.id}.png`;
        let img = await processor.loadImage(imgSrc);
        const processedCanvas = processor.process(img);
        terminal.appendCanvas(processedCanvas);
    } catch (e) { }

    terminal.print(" ");

    const cleanDescription = prince.description.replace(/\\n/g, '\n');
    const paragraphs = cleanDescription.split('\n\n');
    for (const p of paragraphs) {
        if (!p.trim()) continue;
        await termType(p, 30);
        terminal.print(" ");
        await delay(500);
    }

    terminal.print(" ");

    await terminal.showButton("> 돌아가기", 'command-style bottom-aligned');
}

async function triggerFinalCollapse() {
    state.currentPhase = 'COLLAPSE';
    // Start shaking immediately
    if (typeof startGlitchEffect === 'function') startGlitchEffect();

    audio.playGlitch();

    await termType("[ SYSTEM ] 해당 명령은 허용되지 않습니다.", 30, 'warning');
    await delay(1000);

    // Dialogue Intervention 1
    terminal.print(" ");
    await termType("[ SYSTEM ] Reason: 통제 외 요소가 여전히 내부에 존재함", 30, 'system');
    await delay(500);
    await termType("— …괜찮아요?", 50, 'highlight');
    await delay(1500);

    // Dialogue Intervention 2
    terminal.print(" ");
    await termType("— 거기 있죠. 나가려고 하지 마요.", 50, 'highlight');
    await delay(1500);

    await delay(1000);

    audio.playGlitch();

    // Dialogue Intervention 3
    terminal.print(" ");
    await termType("— 선택은 아직 끝나지 않았어요.", 50, 'highlight');
    await delay(1500);

    // Dialogue Intervention 4 (New)
    terminal.print(" ");
    await termType("— 당신의 선택이 필요해요.", 50, 'highlight');
    await delay(1500);

    // Dialogue Intervention 5 (New)
    terminal.print(" ");
    await termType("— 당신이 없으면 의미가 없어요.", 50, 'highlight');
    await delay(1500);

    // Dialogue Intervention 6 (New)
    terminal.print(" ");
    await termType("— 제 옆에 남아주세요….", 50, 'highlight');
    await delay(2000);

    await termType("[ SYSTEM ] 왕가 기록 보관소 무결성이 손상되었습니다", 20, 'glitch warning');
    await delay(2000);

    // Stop Glitch removed per user request - screen continues to shake
    // if (state.glitchInterval) { ... }

    terminal.print(" ");
    await termType("[ SYSTEM ] 모든 기록이 정지됩니다.", 40, 'system');
    await delay(2000);

    terminal.print(" ");
    await termType("[ SYSTEM ] 처음으로 돌아가시겠습니까?", 40, 'system');

    await terminal.showButton("처음으로 돌아가기", 'restart-button');

    // Reset Game
    location.reload();
}

function startGlitchEffect() {
    const overlay = document.getElementById('crt-overlay');
    if (!state.glitchInterval) {
        state.glitchInterval = setInterval(() => {
            if (overlay) overlay.style.background = `rgba(${Math.random() * 50}, 0, 0, 0.3)`;
            document.body.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        }, 50);
    }
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function termType(text, speed, className) {
    await terminal.type(text, { speed, className });
}
