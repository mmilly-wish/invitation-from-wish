/**
 * Sound UI Module
 * Shows a brief 3-second notification on page load
 */

class SoundUI {
    constructor() {
        // Don't initialize immediately - wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.soundGuide = document.getElementById('sound-guide');

        if (!this.soundGuide) {
            console.warn('[Sound UI] sound-guide element not found');
            return;
        }

        // Auto-show notification on page load (iOS/Safari only)
        if (this.shouldShowGuide()) {
            this.showBriefNotification();
        }
    }

    shouldShowGuide() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        return isIOS || isSafari;
    }

    async showBriefNotification() {
        if (!this.soundGuide) return;

        // Show notification
        this.soundGuide.classList.remove('hidden');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.soundGuide.classList.add('hidden');
        }, 3000);
    }
}

// Export singleton instance
export const soundUI = new SoundUI();
