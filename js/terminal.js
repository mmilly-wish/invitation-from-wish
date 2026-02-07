import { audio } from './audio.js';

export class Terminal {
    constructor(outputElement, inputElement, inputArea) {
        this.output = outputElement;
        this.input = inputElement;
        this.inputArea = inputArea;

        this.commandCallback = null;
        this.isTyping = false;

        this.inputDisplay = document.getElementById('input-display');

        this.input.addEventListener('keydown', (e) => this.handleInput(e));
        this.input.addEventListener('input', () => this.updateDisplay());

        // iOS Keyboard Fix:
        // Use focus event on the input itself, which now covers the area
        this.input.addEventListener('focus', () => {
            // Delay to allow keyboard to appear
            setTimeout(() => {
                // Method 1: Scroll element into view
                this.inputArea.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Method 2: Force window scroll to bottom as backup
                window.scrollTo(0, document.body.scrollHeight);
            }, 300); // 300ms delay for keyboard animation
        });

        // Keep direct click as fallback/backup
        this.inputArea.addEventListener('click', () => {
            if (!this.input.disabled) {
                this.input.focus();
            }
        });

        // Disable input initially
        this.setInputEnabled(false);
    }

    setInputEnabled(enabled) {
        if (enabled) {
            this.inputArea.classList.remove('hidden');
            this.input.disabled = false;
            this.input.focus();
        } else {
            this.inputArea.classList.add('hidden');
            this.input.disabled = true;
        }
    }

    onCommand(callback) {
        this.commandCallback = callback;
    }

    updateDisplay() {
        this.input.value = this.input.value.toLowerCase(); // Force input value to lowercase
        this.inputDisplay.textContent = this.input.value;
        this.scrollToBottom();
    }

    handleInput(e) {
        if (e.key === 'Enter') {
            const command = this.input.value.trim().toLowerCase(); // Force lowercase
            this.print(`> ${command}`);
            this.input.value = '';
            this.updateDisplay();

            if (this.commandCallback) {
                this.commandCallback(command);
            }
            audio.playBeep(600, 0.1);
        } else {
            // Typing sound for user input
            // Only play if key is printable (simple check)
            if (e.key.length === 1) {
                audio.playTypingSound();
            }
        }
    }

    clear() {
        // Clear all content but preserve inputArea
        while (this.output.firstChild && this.output.firstChild !== this.inputArea) {
            this.output.removeChild(this.output.firstChild);
        }
        // If inputArea was removed or not found (safety), ensure it's there
        if (!this.output.contains(this.inputArea)) {
            this.output.appendChild(this.inputArea);
        }

        // Ensure inputArea is the only child (remove anything else that might have snuck in)
        while (this.output.firstChild && this.output.firstChild !== this.inputArea) {
            this.output.removeChild(this.output.firstChild);
        }

        this.output.scrollTop = 0; // Reset scroll position
    }

    print(text, className = '') {
        const div = document.createElement('div');
        div.className = `line ${className}`;
        div.textContent = text;
        this.output.insertBefore(div, this.inputArea);
        this.scrollToBottom();
    }

    appendCanvas(canvas) {
        const div = document.createElement('div');
        div.className = 'line image-line';
        div.style.marginBottom = '10px';
        div.appendChild(canvas);
        this.output.insertBefore(div, this.inputArea);
        this.scrollToBottom();
    }

    async type(text, options = {}) {
        const {
            speed = 30,
            className = '',
            sound = true
        } = options;

        const div = document.createElement('div');
        div.className = `line ${className}`;
        this.output.insertBefore(div, this.inputArea);
        this.scrollToBottom();

        this.isTyping = true;

        for (let i = 0; i < text.length; i++) {
            div.textContent += text[i];
            this.scrollToBottom(); // Ensure visibility as text grows
            if (sound && text[i] !== ' ') {
                audio.playTypingSound();
            }
            await new Promise(r => setTimeout(r, speed + Math.random() * 20));
        }

        this.isTyping = false;
    }

    async showMenu(options) {
        return new Promise((resolve) => {
            const menuContainer = document.createElement('div');
            menuContainer.className = 'menu-container';
            menuContainer.style.marginTop = '10px';
            this.output.insertBefore(menuContainer, this.inputArea);
            this.scrollToBottom();

            let selectedIndex = 0;

            const render = () => {
                menuContainer.innerHTML = '';
                options.forEach((opt, idx) => {
                    const item = document.createElement('div');
                    item.className = `menu-item ${idx === selectedIndex ? 'selected' : ''}`;
                    item.style.cursor = 'pointer';
                    item.style.padding = '2px 0';
                    item.style.color = idx === selectedIndex ? 'var(--text-color)' : 'rgba(255,255,255,0.5)';

                    // Add selector cursor
                    const cursor = idx === selectedIndex ? '▶ ' : '  ';
                    item.textContent = `${cursor}${opt.label}`;

                    item.onclick = () => {
                        cleanup();
                        resolve(opt.value);
                    };

                    menuContainer.appendChild(item);
                });
                this.scrollToBottom();
            };

            const handleKey = (e) => {
                // Ignore if not active (safety)
                if (e.key === 'ArrowUp') {
                    selectedIndex = (selectedIndex - 1 + options.length) % options.length;
                    render();
                    e.preventDefault();
                    audio.playBeep(800, 0.05);
                } else if (e.key === 'ArrowDown') {
                    selectedIndex = (selectedIndex + 1) % options.length;
                    render();
                    e.preventDefault();
                    audio.playBeep(800, 0.05);
                } else if (e.key === 'Enter') {
                    cleanup();
                    resolve(options[selectedIndex].value);
                    audio.playBeep(1200, 0.1);
                }
            };

            const cleanup = () => {
                document.removeEventListener('keydown', handleKey);
                // Visual feedback of selection
                const items = menuContainer.querySelectorAll('.menu-item');
                items.forEach(i => {
                    i.onclick = null;
                    i.style.cursor = 'default';
                });
            };

            document.addEventListener('keydown', handleKey);
            render();

            // Ensure standard input is disabled
            this.setInputEnabled(false);
        });
    }

    async waitInput() {
        return new Promise((resolve) => {
            const indicator = document.createElement('div');
            indicator.className = 'input-indicator';
            indicator.textContent = '▼';
            indicator.style.animation = 'blink 1s infinite';
            indicator.style.textAlign = 'center';
            indicator.style.margin = '10px 0';
            indicator.style.color = 'var(--text-color)';
            this.output.insertBefore(indicator, this.inputArea);
            this.scrollToBottom();

            const handler = (e) => {
                if (e.type === 'keydown' && !['Enter', ' '].includes(e.key)) return;

                indicator.remove();
                document.removeEventListener('keydown', handler);
                document.removeEventListener('click', handler);
                document.removeEventListener('touchstart', handler);
                audio.playBeep(800, 0.05);
                resolve();
            };

            // Small interaction lockout to prevent acccidental double-skip
            setTimeout(() => {
                document.addEventListener('keydown', handler);
                document.addEventListener('click', handler);
                document.addEventListener('touchstart', handler);
            }, 300);
        });
    }

    async showButton(text, className = '') {
        return new Promise((resolve) => {
            const btn = document.createElement('div');
            btn.className = `terminal-button ${className}`;
            btn.textContent = text;
            btn.style.cursor = 'pointer';
            btn.style.marginTop = '10px';
            btn.style.display = 'inline-block';

            this.output.insertBefore(btn, this.inputArea);
            this.scrollToBottom();
            // ...
        });
    }

    scrollToBottom() {
        this.output.scrollTop = this.output.scrollHeight;
    }

    showCursor(show) {
        // Handled via CSS usually, but method kept for API completeness
    }
}
