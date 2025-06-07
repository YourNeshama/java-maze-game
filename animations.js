// Code Rain Animation for Start Screen and Story Screen
function initializeAnimations() {
    console.log('🎨 Initializing animations...');
    
    // Initialize code rain for start screen
    initCodeRain('startScreenCodeRain');
    
    // Initialize code rain for story screen (will be activated when story screen shows)
    setTimeout(() => {
        const storyCodeRain = document.querySelector('#storyScreen .code-rain');
        if (storyCodeRain) {
            initCodeRain(storyCodeRain);
        }
    }, 1000);
}

function initCodeRain(container) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    
    if (!container) {
        console.log('Code rain container not found');
        return;
    }

    const codeSnippets = [
        'public class', 'private int', 'String[]', 'void main',
        'if (condition)', 'for (int i', 'while (true)', 'try {',
        'catch (Exception', '} finally {', 'new Object()', 'return value;',
        'System.out.print', 'Scanner input', 'ArrayList<>', 'HashMap<>',
        'extends Class', 'implements Interface', '@Override', 'static final',
        'boolean result', 'char character', 'double decimal', 'float number'
    ];

    function createCodeParticle() {
        const particle = document.createElement('div');
        particle.className = 'code-particle';
        particle.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        
        // Random position and timing
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 5000);
    }

    // Create initial particles
    for (let i = 0; i < 15; i++) {
        setTimeout(createCodeParticle, i * 200);
    }

    // Continue creating particles
    const interval = setInterval(() => {
        if (container.parentNode) {
            createCodeParticle();
        } else {
            clearInterval(interval);
        }
    }, 300);
}

// Debug animation for visual feedback
function showDebugPopup(message, type = 'info') {
    // Remove existing popup
    const existingPopup = document.querySelector('.debug-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create new popup
    const popup = document.createElement('div');
    popup.className = 'debug-popup';
    popup.textContent = message;
    
    // Add type-specific styling
    if (type === 'success') {
        popup.style.borderColor = '#00ff41';
        popup.style.color = '#00ff41';
    } else if (type === 'error') {
        popup.style.borderColor = '#ff4444';
        popup.style.color = '#ff4444';
    } else {
        popup.style.borderColor = '#00bfff';
        popup.style.color = '#00bfff';
    }
    
    document.body.appendChild(popup);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.opacity = '0';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 500);
        }
    }, 3000);
}

console.log('🎨 Animations module loaded'); 