// Sound Effects System
const soundEffects = {
    // Create audio context for web audio (optional, fallback to simple sounds)
    audioContext: null,
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 Audio context initialized');
        } catch (e) {
            console.log('🔇 Audio context not supported, using fallback sounds');
        }
    },
    
    // Generate simple beep sounds
    beep(frequency = 440, duration = 200, type = 'sine') {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
        } catch (e) {
            console.log('🔇 Sound generation failed');
        }
    },
    
    // Specific game sounds
    correctAnswer() {
        this.beep(600, 300, 'sine');
        setTimeout(() => this.beep(800, 200, 'sine'), 150);
        console.log('🎵 Correct answer sound');
    },
    
    wrongAnswer() {
        this.beep(200, 500, 'sawtooth');
        console.log('🎵 Wrong answer sound');
    },
    
    coinCollect() {
        this.beep(800, 100, 'sine');
        setTimeout(() => this.beep(1000, 100, 'sine'), 50);
        setTimeout(() => this.beep(1200, 150, 'sine'), 100);
        console.log('🎵 Coin collect sound');
    },
    
    debugMode() {
        this.beep(300, 150, 'square');
        setTimeout(() => this.beep(400, 150, 'square'), 100);
        console.log('🎵 Debug mode sound');
    },
    
    pigOink() {
        // Fun pig oink sound
        this.beep(150, 200, 'sawtooth');
        setTimeout(() => this.beep(120, 300, 'sawtooth'), 200);
        console.log('🐷 Oink oink!');
    },
    
    // Enable audio context (needs user interaction)
    enable() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('🔊 Audio context resumed');
            });
        }
    }
};

// Initialize when module loads
soundEffects.init();

// Enable audio on first user interaction
document.addEventListener('click', () => {
    soundEffects.enable();
}, { once: true });

document.addEventListener('keydown', () => {
    soundEffects.enable();
}, { once: true });

console.log('🔊 Sound effects module loaded'); 