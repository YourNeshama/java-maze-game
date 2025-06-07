const WALL = 1;
const PATH = 0;
const CORRECT_PATH = 2;
const DEAD_END = 3;
const COIN = 4;  // New constant for coins

// Coin reward/penalty values
const COIN_REWARDS = {
    CORRECT_ANSWER: 10,
    COIN_PICKUP: 5,
    WRONG_ANSWER: -5,
    DEAD_END: -2
};

// Coin costs for special actions
const COIN_COSTS = {
    AVOID_DEAD_END: 5
};

class Question {
    constructor(question, answer, explanation) {
        this.question = question;
        this.answer = answer;
        this.explanation = explanation;
    }

    checkAnswer(userAnswer) {
        return userAnswer && userAnswer.trim().toLowerCase() === this.answer.trim().toLowerCase();
    }
}

class MazeGame {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.initializeGameSettings();
        this.questions = this.initializeQuestions();
        this.deadEndQuestions = this.initializeDeadEndQuestions();
        this.playerPath = [];
        this.moveQueue = [];
        this.isMoving = false;
        this.inDeadEnd = false;
        this.minPathLength = 0;
        this.isFirstMove = true;
        this.lastDeadEnd = { x: 0, y: 0 };  // Track the last dead end
        
        // Initialize coin system
        this.coins = 0;
        this.coinPositions = new Set();
        this.deadEndPositions = [];  // Change to array for easier management

        // Initialize canvas
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = Math.min(40, 600 / this.size);
        this.canvas.width = this.size * this.cellSize;
        this.canvas.height = this.size * this.cellSize;
        
        // Ensure canvas background is pure black
        this.canvas.style.backgroundColor = '#000000';
        this.canvas.style.background = '#000000';
        
        // Add code-themed styling to canvas
        this.canvas.classList.add('code-themed-canvas');
        
        // Force black background with setInterval to ensure it stays black
        setInterval(() => {
            this.canvas.style.backgroundColor = '#000000';
            this.canvas.style.background = '#000000';
        }, 1000);

        // Initialize player position
        this.playerX = 0;
        this.playerY = 0;

        this.initializeMaze();
        this.placeCoinInMaze();
        
        // Make the first box a dead end
        this.maze[0][0] = DEAD_END;
        this.deadEndPositions.push({ x: 0, y: 0 });
        
        // Ensure the second box (first move positions) are not dead ends
        this.maze[0][1] = PATH;
        this.maze[1][0] = PATH;
        
        this.setupEventListeners();
        this.updateQuestionCounter();
        this.updateCoinDisplay();
        this.draw();
    }

    initializeGameSettings() {
        switch(this.difficulty) {
            case 'easy':
                this.size = 5;
                break;
            case 'medium':
                this.size = 7;
                break;
            case 'hard':
                this.size = 9;
                break;
            default:
                this.size = 5;
        }
        // remainingQuestions will be calculated dynamically based on position
    }

    initializeQuestions() {
        // Get all available questions from question bank
        const allQuestions = this.getAvailableGameQuestions();
        
        // Convert to Question objects for the game
        return allQuestions.map(q => new Question(q.question, q.answer, q.explanation));
    }

    getAvailableGameQuestions() {
        const defaultQuestions = getDefaultQuestions();
        const customQuestions = getCustomQuestions();
        const disabledQuestions = JSON.parse(localStorage.getItem('javaMazeDisabledQuestions') || '[]');
        
        // Filter out disabled default questions
        const enabledDefaultQuestions = defaultQuestions.filter(q => !disabledQuestions.includes(q.id));
        
        // Combine enabled default questions with all custom questions
        const allQuestions = [...enabledDefaultQuestions, ...customQuestions];
        
        // Filter questions based on maze difficulty
        let availableQuestions = allQuestions;
        
        // Add default difficulty to custom questions if not set
        const questionsWithDifficulty = allQuestions.map(q => ({
            ...q,
            difficulty: q.difficulty || 'easy'
        }));
        
        switch(this.difficulty) {
            case 'easy':
                availableQuestions = questionsWithDifficulty.filter(q => q.difficulty === 'easy');
                break;
            case 'medium':
                availableQuestions = questionsWithDifficulty.filter(q => 
                    q.difficulty === 'easy' || q.difficulty === 'medium'
                );
                break;
            case 'hard':
                availableQuestions = questionsWithDifficulty; // All difficulties
                break;
            default:
                availableQuestions = questionsWithDifficulty.filter(q => q.difficulty === 'easy');
        }
        
        // Ensure we have enough questions for the game
        if (availableQuestions.length === 0) {
            console.warn(`No questions available for ${this.difficulty} difficulty. Using easy questions as fallback.`);
            availableQuestions = questionsWithDifficulty.filter(q => q.difficulty === 'easy');
        }
        
        console.log(`Selected ${availableQuestions.length} questions for ${this.difficulty} difficulty:`, 
                   availableQuestions.map(q => `${q.difficulty}: ${q.question.substring(0, 50)}...`));
        
        return availableQuestions;
    }

    initializeDeadEndQuestions() {
        return [
            new Question("What is a constructor?", "method", "A special method that initializes objects"),
            new Question("What package contains basic Java classes?", "java.lang", "The fundamental package"),
            new Question("What operator is used for equality comparison?", "==", "Compares two values"),
            new Question("What is the size of int in Java?", "32", "32 bits or 4 bytes"),
            new Question("What is the default value of boolean?", "false", "Boolean defaults to false")
        ];
    }

    initializeMaze() {
        // Create empty maze
        this.maze = Array(this.size).fill().map(() => Array(this.size).fill(WALL));
        this.generateMaze(0, 0);
        this.maze[this.size-1][this.size-1] = PATH; // Set exit
    }

    generateMaze(x, y) {
        this.maze[y][x] = PATH;
        const directions = this.shuffleDirections();
        
        for (let [dx, dy] of directions) {
            const newX = x + dx * 2;
            const newY = y + dy * 2;
            
            if (this.isValidCell(newX, newY) && this.maze[newY][newX] === WALL) {
                this.maze[y + dy][x + dx] = PATH;
                this.generateMaze(newX, newY);
            }
        }
    }

    shuffleDirections() {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        return directions;
    }

    isValidCell(x, y) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Emergency unlock with Escape key
            if (e.key === 'Escape') {
                console.log("🚨 EMERGENCY UNLOCK - Escape key pressed");
                this.isMoving = false;
                showDebugPopup('🔓 Movement force unlocked!', 'success');
                return;
            }
            
            let dx = 0, dy = 0;
            switch(e.key) {
                case 'ArrowUp': dy = -1; break;
                case 'ArrowDown': dy = 1; break;
                case 'ArrowLeft': dx = -1; break;
                case 'ArrowRight': dx = 1; break;
                default: return;
            }
            
            this.tryMove(dx, dy);
        });

        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        const minSwipeDistance = 30; // Minimum swipe distance

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent page scrolling
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            
            const touch = e.changedTouches[0];
            touchEndX = touch.clientX;
            touchEndY = touch.clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            // Check if it's a valid swipe
            if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) {
                return; // Swipe distance too short, ignore
            }
            
            let dx = 0, dy = 0;
            
            // Determine swipe direction
            if (absDeltaX > absDeltaY) {
                // Horizontal swipe
                dx = deltaX > 0 ? 1 : -1;
            } else {
                // Vertical swipe
                dy = deltaY > 0 ? 1 : -1;
            }
            
            this.tryMove(dx, dy);
        }, { passive: false });

        // Virtual D-pad controls
        const setupVirtualDPad = () => {
            const upBtn = document.getElementById('upBtn');
            const downBtn = document.getElementById('downBtn');
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');
            
            if (upBtn) {
                upBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tryMove(0, -1);
                });
                upBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.tryMove(0, -1);
                });
            }
            
            if (downBtn) {
                downBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tryMove(0, 1);
                });
                downBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.tryMove(0, 1);
                });
            }
            
            if (leftBtn) {
                leftBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tryMove(-1, 0);
                });
                leftBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.tryMove(-1, 0);
                });
            }
            
            if (rightBtn) {
                rightBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.tryMove(1, 0);
                });
                rightBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.tryMove(1, 0);
                });
            }
        };
        
        // Delay setup of virtual D-pad to ensure DOM is loaded
        setTimeout(setupVirtualDPad, 100);

        document.getElementById('regenerateMazeBtn').addEventListener('click', () => {
            this.initializeMaze();
            this.playerX = 0;
            this.playerY = 0;
            this.placeCoinInMaze();
            this.draw();
        });
        
        // Emergency reset button
        document.getElementById('emergencyResetBtn').addEventListener('click', () => {
            if (confirm('🚨 EMERGENCY RESET\n\nThis will reset:\n• Player position to start\n• Coins to 0\n• Movement flags\n• Generate new maze\n\nContinue?')) {
                // Reset all game state
                this.playerX = 0;
                this.playerY = 0;
                this.coins = 0;
                this.isMoving = false;
                this.isFirstMove = true;
                this.inDeadEnd = false;
                
                // Generate new maze
                this.initializeMaze();
                this.placeCoinInMaze();
                
                // Make the first box a dead end again
                this.maze[0][0] = DEAD_END;
                this.deadEndPositions = [{ x: 0, y: 0 }];
                
                // Ensure the second box (first move positions) are not dead ends
                this.maze[0][1] = PATH;
                this.maze[1][0] = PATH;
                
                // Update displays
                this.updateQuestionCounter();
                this.updateCoinDisplay();
                this.draw();
                
                showDebugPopup('🚨 Emergency reset complete - Game state restored!', 'success');
                console.log('Emergency reset performed - all flags cleared');
            }
        });
    }

    findNearestDeadEnd(x, y) {
        // If it's the first move or no dead ends, return to start
        if (this.isFirstMove || this.deadEndPositions.length === 0) {
            return { x: 0, y: 0 };
        }

        // Return the last dead end we created
        return this.lastDeadEnd;
    }

    tryMove(dx, dy) {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;
        
        console.log(`=== MOVE ATTEMPT: (${this.playerX}, ${this.playerY}) to (${newX}, ${newY}) ===`);
        console.log(`Current isMoving state: ${this.isMoving}`);
        console.log(`Current coins: ${this.coins}`);
        console.log(`Remaining questions: ${this.remainingQuestions}`);
        console.log(`Available questions in bank: ${this.questions.length}`);
        
        // Prevent multiple simultaneous moves
        if (this.isMoving) {
            console.log("BLOCKED: Already moving/processing");
            return;
        }
        
        // Check if move is valid (not wall, not out of bounds)
        if (!this.isValidCell(newX, newY) || this.maze[newY][newX] === WALL) {
            console.log("BLOCKED: Wall or out of bounds");
            return;
        }

        // Set moving state
        this.isMoving = true;
        console.log("Setting isMoving to true");

        // Safety timeout to reset isMoving state in case something goes wrong
        setTimeout(() => {
            if (this.isMoving) {
                console.log("⚠️ Safety timeout: Force resetting isMoving state");
                this.isMoving = false;
            }
        }, 1000); // Reduced from 5000 to 1000 for faster recovery

        // If no questions left, check for dead ends then allow movement
        if (this.remainingQuestions === 0) {
            if (this.maze[newY][newX] === DEAD_END) {
                alert("That's a dead end! Choose another path.");
                this.isMoving = false; // Reset moving state
                console.log("Reset isMoving to false (dead end)");
                return;
            }
            console.log("FREE MOVEMENT: No questions left");
            this.playerX = newX;
            this.playerY = newY;
            this.collectCoin(this.playerX, this.playerY);
            this.draw();
            this.isMoving = false; // Reset moving state
            console.log("Reset isMoving to false (free movement complete)");
            return;
        }

        // Check if we have questions available
        if (this.questions.length === 0) {
            console.log("ERROR: No questions available but remainingQuestions > 0");
            alert("Game error: No questions available! Please restart the game.");
            this.isMoving = false;
            return;
        }

        // We have questions - ask one
        console.log("ASKING QUESTION...");
        const questionIndex = Math.floor(Math.random() * this.questions.length);
        const question = this.questions[questionIndex];
        
        // Don't remove question from bank yet - only remove after successful answer
        // this.questions.splice(questionIndex, 1);
        
        // Use story-based question presentation
        this.handleStoryQuestion(question, newX, newY, questionIndex);
    }

    checkExit() {
        if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
            // At exit - check if we need more questions
            if (this.remainingQuestions > 0) {
                showDebugPopup('⚠️ SYSTEM INCOMPLETE - More debugging required!', 'error');
                alert('You need to answer all questions before finishing! Questions remaining: ' + this.remainingQuestions);
                // Send back to start (the only dead end)
                this.playerX = 0;
                this.playerY = 0;
                this.updateQuestionCounter();
            } else {
                // Game completed - mark this difficulty as completed
                this.markDifficultyCompleted(this.difficulty);
                
                // Add coins to total
                const newTotal = addToTotalCoins(this.coins);
                showDebugPopup('🎉 SYSTEM RESTORED - ESCAPE SUCCESSFUL!', 'success');
                
                // Check if all difficulties are completed
                const completedDifficulties = this.getCompletedDifficulties();
                const allCompleted = completedDifficulties.includes('easy') && 
                                   completedDifficulties.includes('medium') && 
                                   completedDifficulties.includes('hard');
                
                if (allCompleted) {
                    // Special message for completing all difficulties
                    alert(`🎊 CONGRATULATIONS! SYSTEM FULLY DEBUGGED! 🎊\n\nYou've successfully escaped the corrupted code maze!\nGame Score: ${this.coins} coins\nTotal Coins Earned: ${newTotal} coins`);
                    
                    setTimeout(() => {
                        alert(`🌟 ULTIMATE ACHIEVEMENT UNLOCKED! 🌟\n\n💀 ESCAPE FROM DIGITAL DEATH COMPLETE! 💀\n\nYou have successfully conquered ALL difficulty levels!\n✅ Easy Mode - CLEARED\n✅ Medium Mode - CLEARED  \n✅ Hard Mode - CLEARED\n\nThe corrupted digital realm has been fully purged!\nYou are now a true MASTER DEBUGGER!\n\n🚀 FREEDOM ACHIEVED - WELCOME BACK TO REALITY! 🚀`);
                    }, 1500);
                    
                    // Add completion bonus
                    const completionBonus = 100; // Higher bonus for completing all
                    const finalTotal = addToTotalCoins(completionBonus);
                    setTimeout(() => {
                        alert(`💎 MASTER DEBUGGER BONUS: +${completionBonus} coins!\nYour new total: ${finalTotal} coins\n\nThe digital world owes you a debt of gratitude!`);
                    }, 3000);
                } else {
                    // Regular completion message
                    alert(`🎊 CONGRATULATIONS! SYSTEM FULLY DEBUGGED! 🎊\n\nYou've successfully escaped the corrupted code maze!\nGame Score: ${this.coins} coins\nTotal Coins Earned: ${newTotal} coins\n\nCompleted Difficulties: ${completedDifficulties.map(d => d.toUpperCase()).join(', ')}\n${this.getRemainingDifficultiesMessage(completedDifficulties)}`);
                    
                    // Add completion bonus
                    const completionBonus = 50;
                    const finalTotal = addToTotalCoins(completionBonus);
                    setTimeout(() => {
                        alert(`🚀 SYSTEM BONUS UNLOCKED: +${completionBonus} coins!\nYour new total: ${finalTotal} coins\n\nThe digital realm is safe once again!`);
                    }, 1000);
                }
            }
        }
    }

    markDifficultyCompleted(difficulty) {
        const completed = JSON.parse(localStorage.getItem('javaMazeCompletedDifficulties') || '[]');
        if (!completed.includes(difficulty)) {
            completed.push(difficulty);
            localStorage.setItem('javaMazeCompletedDifficulties', JSON.stringify(completed));
        }
    }

    getCompletedDifficulties() {
        return JSON.parse(localStorage.getItem('javaMazeCompletedDifficulties') || '[]');
    }

    getRemainingDifficultiesMessage(completed) {
        const all = ['easy', 'medium', 'hard'];
        const remaining = all.filter(d => !completed.includes(d));
        
        if (remaining.length === 0) {
            return "🎯 ALL DIFFICULTIES MASTERED!";
        } else if (remaining.length === 1) {
            return `🎯 One more challenge awaits: ${remaining[0].toUpperCase()} mode!`;
        } else {
            return `🎯 Continue your journey: ${remaining.map(d => d.toUpperCase()).join(' and ')} modes await!`;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set pure black background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.maze[y][x];
                const centerX = x * this.cellSize + this.cellSize/2;
                const centerY = y * this.cellSize + this.cellSize/2;

                // Hacker-style cell rendering
                if (cell === WALL) {
                    // Wall - deep blue with glowing border
                    this.ctx.fillStyle = '#0a1a2e';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // Add glowing border
                    this.ctx.strokeStyle = '#00ff41';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowColor = '#00ff41';
                    this.ctx.shadowBlur = 3;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    this.ctx.shadowBlur = 0;
                } else {
                    // Path - pure black background
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // Add subtle grid lines
                    this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }

                // Draw special cells with cyber effects
                switch(cell) {
                    case CORRECT_PATH:
                        // Correct path - green glow
                        this.ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        
                        // Add pulsing glow effect
                        this.ctx.shadowColor = '#00ff41';
                        this.ctx.shadowBlur = 8;
                        this.ctx.strokeStyle = '#00ff41';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x * this.cellSize + 2, y * this.cellSize + 2, this.cellSize - 4, this.cellSize - 4);
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case DEAD_END:
                        // Dead end - red warning
                        this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        
                        // Add warning glow
                        this.ctx.shadowColor = '#ff4444';
                        this.ctx.shadowBlur = 6;
                        this.ctx.strokeStyle = '#ff4444';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case COIN:
                        // Data coin - golden glowing circle
                        const gradient = this.ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, this.cellSize/3
                        );
                        gradient.addColorStop(0, '#00ffff');    // Cyan center
                        gradient.addColorStop(0.7, '#ffff00');  // Yellow transition
                        gradient.addColorStop(1, '#ff8800');    // Orange edge
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.shadowColor = '#ffff00';
                        this.ctx.shadowBlur = 10;
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize/3, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        
                        // Add rotating inner ring
                        this.ctx.strokeStyle = '#ffffff';
                        this.ctx.lineWidth = 2;
                        this.ctx.shadowColor = '#ffffff';
                        this.ctx.shadowBlur = 5;
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize/5, 0, Math.PI * 2);
                        this.ctx.stroke();
                        this.ctx.shadowBlur = 0;
                        break;
                }

                // Exit marker - special hacker style
                if (x === this.size - 1 && y === this.size - 1) {
                    // Create pulsing glowing exit
                    const exitGradient = this.ctx.createRadialGradient(
                        centerX, centerY, 0,
                        centerX, centerY, this.cellSize/2
                    );
                    exitGradient.addColorStop(0, 'rgba(0, 255, 65, 0.8)');
                    exitGradient.addColorStop(1, 'rgba(0, 255, 65, 0.2)');
                    
                    this.ctx.fillStyle = exitGradient;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // EXIT text with glow
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `bold ${this.cellSize/3}px 'Courier New'`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.shadowColor = '#00ff41';
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillText('EXIT', centerX, centerY);
                    this.ctx.shadowBlur = 0;
                    
                    // Add scan line effect
                    this.ctx.strokeStyle = '#00ff41';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowColor = '#00ff41';
                    this.ctx.shadowBlur = 5;
                    this.ctx.beginPath();
                    this.ctx.rect(x * this.cellSize + 2, y * this.cellSize + 2, this.cellSize - 4, this.cellSize - 4);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
        }
        
        // Draw player - hacker style
        const playerCenterX = this.playerX * this.cellSize + this.cellSize/2;
        const playerCenterY = this.playerY * this.cellSize + this.cellSize/2;
        
        // Player aura
        const playerGradient = this.ctx.createRadialGradient(
            playerCenterX, playerCenterY, 0,
            playerCenterX, playerCenterY, this.cellSize/2
        );
        playerGradient.addColorStop(0, 'rgba(0, 191, 255, 0.8)');
        playerGradient.addColorStop(1, 'rgba(0, 191, 255, 0.1)');
        
        this.ctx.fillStyle = playerGradient;
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, this.cellSize/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Player core
        this.ctx.fillStyle = '#00bfff';
        this.ctx.shadowColor = '#00bfff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, this.cellSize/3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Player inner ring
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, this.cellSize/4, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }

    updateQuestionCounter() {
        // Calculate shortest path from current position to exit
        const shortestPath = this.calculateShortestPathToExit();
        this.remainingQuestions = shortestPath;
        
        const counter = document.getElementById('questionCounter');
        counter.textContent = `Questions Remaining: ${this.remainingQuestions}`;
        console.log(`Updated questions remaining to: ${this.remainingQuestions} (shortest path to exit)`);
    }

    calculateShortestPathToExit() {
        const startX = this.playerX;
        const startY = this.playerY;
        const endX = this.size - 1;
        const endY = this.size - 1;
        
        // If already at exit
        if (startX === endX && startY === endY) {
            return 0;
        }
        
        // BFS to find shortest path
        const queue = [{x: startX, y: startY, distance: 0}];
        const visited = new Set();
        visited.add(`${startX},${startY}`);
        
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
        
        while (queue.length > 0) {
            const {x, y, distance} = queue.shift();
            
            for (let [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                const key = `${newX},${newY}`;
                
                if (this.isValidCell(newX, newY) && 
                    !visited.has(key) && 
                    this.maze[newY][newX] !== WALL) {
                    
                    // Found the exit
                    if (newX === endX && newY === endY) {
                        console.log(`Shortest path to exit: ${distance + 1} steps`);
                        return distance + 1;
                    }
                    
                    visited.add(key);
                    queue.push({x: newX, y: newY, distance: distance + 1});
                }
            }
        }
        
        // No path found (shouldn't happen in a proper maze)
        console.log("No path to exit found!");
        return 0;
    }

    updateCoinDisplay() {
        const coinDisplay = document.getElementById('coinCounter');
        if (coinDisplay) {
            if (this.coins < 0) {
                coinDisplay.textContent = `Debt: ${Math.abs(this.coins)} tokens`;
                coinDisplay.style.color = '#ff4444';
                coinDisplay.style.fontWeight = 'bold';
            } else {
                coinDisplay.textContent = `Coins: ${this.coins}`;
                coinDisplay.style.color = '#00ff41';
                coinDisplay.style.fontWeight = 'normal';
            }
        }
    }

    addCoins(amount) {
        this.coins += amount;
        
        // Safeguard: if coins go too negative, offer to reset
        if (this.coins <= -50) {
            const resetCoins = confirm(
                `💻 SYSTEM DEBT WARNING!\n\n` +
                `Current debt: ${Math.abs(this.coins)} tokens\n\n` +
                `Your debugging attempts have resulted in significant system debt.\n` +
                `Would you like to reset your debt to 0 and continue?\n\n` +
                `Choose "OK" to reset debt to 0, or "Cancel" to continue with current debt.`
            );
            
            if (resetCoins) {
                this.coins = 0;
                showDebugPopup('💳 System debt cleared - Fresh start!', 'success');
            }
        }
        
        this.updateCoinDisplay();
    }

    placeCoinInMaze() {
        // Find empty cells to place coins
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.maze[y][x] === PATH && Math.random() < 0.2) {  // 20% chance to place a coin
                    this.maze[y][x] = COIN;
                    this.coinPositions.add(`${x},${y}`);
                }
            }
        }
    }

    collectCoin(x, y) {
        const position = `${x},${y}`;
        if (this.coinPositions.has(position)) {
            this.coinPositions.delete(position);
            this.addCoins(COIN_REWARDS.COIN_PICKUP);
            this.maze[y][x] = PATH;
            
            // Play coin collection sound
            soundEffects.coinCollect();
            showDebugPopup('💰 Data token acquired!');
            
            return true;
        }
        return false;
    }

    handleCorrectAnswer() {
        this.addCoins(COIN_REWARDS.CORRECT_ANSWER);
        this.remainingQuestions--;
        this.updateQuestionCounter();
    }

    handleWrongAnswer() {
        this.addCoins(COIN_REWARDS.WRONG_ANSWER);
    }

    handleDeadEnd() {
        this.addCoins(COIN_REWARDS.DEAD_END);
        this.inDeadEnd = true;
    }

    handleStoryQuestion(question, newX, newY, questionIndex) {
        const debugMessages = [
            "🔍 Logic gate blocked - Debug required",
            "⚠️ Syntax barrier detected - Fix to proceed", 
            "🛠️ Code compilation failed - Resolve error",
            "🔧 System malfunction - Apply knowledge patch",
            "💻 Runtime exception - Debug to continue"
        ];
        
        const randomMessage = debugMessages[Math.floor(Math.random() * debugMessages.length)];
        showDebugPopup(randomMessage);
        
        soundEffects.debugMode();
        
        console.log("Starting question handling immediately");
        
        try {
            // Use setTimeout to ensure prompt is called after current execution context
            setTimeout(() => {
                try {
                    const userAnswer = prompt(`[DEBUG MODE ACTIVATED]\n\n${question.question}\n\n💡 Instructions:\n• Enter your answer to proceed\n• Type "skip" to skip without penalty\n• Press Cancel to abort movement`);
                    
                    console.log("Prompt returned:", userAnswer === null ? "CANCELED" : userAnswer);
                    
                    // Handle case where user cancels the prompt
                    if (userAnswer === null) {
                        console.log("User canceled the question prompt - no penalty, just reset movement");
                        this.isMoving = false;
                        showDebugPopup('🚫 Movement canceled', 'info');
                        return;
                    }
                    
                    // Handle skip option
                    if (userAnswer && userAnswer.trim().toLowerCase() === 'skip') {
                        console.log("User chose to skip question - no penalty");
                        this.isMoving = false;
                        showDebugPopup('⏭️ Question skipped - no penalty', 'info');
                        return;
                    }
                    
                    console.log("Processing answer...");
                    this.handleQuestionAnswer(question, userAnswer, newX, newY, questionIndex);
                    
                } catch (error) {
                    console.error("Error in prompt handling:", error);
                    this.isMoving = false;
                    showDebugPopup('❌ Question prompt error - Movement unlocked', 'error');
                }
            }, 10); // Very short delay to ensure proper execution order
            
        } catch (error) {
            console.error("Error in question handling:", error);
            this.isMoving = false;
            showDebugPopup('❌ Question handling error - Movement unlocked', 'error');
        }
    }

    handleQuestionAnswer(question, userAnswer, newX, newY, questionIndex) {
        console.log("Processing question answer...");
        
        if (question.checkAnswer(userAnswer)) {
            // CORRECT ANSWER - ALLOW MOVEMENT AND REMOVE QUESTION
            console.log("CORRECT ANSWER - MOVING FORWARD");
            
            // Remove question from bank only on correct answer
            this.questions.splice(questionIndex, 1);
            
            showDebugPopup('✅ CODE COMPILED SUCCESSFULLY!', 'success');
            soundEffects.correctAnswer();
            this.addCoins(COIN_REWARDS.CORRECT_ANSWER);
            
            this.playerX = newX;
            this.playerY = newY;
            this.maze[newY][newX] = CORRECT_PATH;
            this.isFirstMove = false;
            
            // Update question counter based on new position
            this.updateQuestionCounter();
            
            this.collectCoin(this.playerX, this.playerY);
            this.checkExit();
            this.draw();
            
        } else {
            // WRONG ANSWER - QUESTION STAYS IN BANK
            console.log("WRONG ANSWER - QUESTION REMAINS IN BANK");
            showDebugPopup(`❌ SYNTAX ERROR: ${question.answer}`, 'error');
            soundEffects.wrongAnswer();
            this.handleWrongAnswer();
            
            const coinCost = COIN_COSTS.AVOID_DEAD_END;
            let shouldGoBack = true;
            
            // Check if player has enough coins and offer the option
            if (this.coins >= coinCost) {
                const useCoins = confirm(
                    `⚠️ DEBUG PROTOCOL FAILED!\n\n` +
                    `Option 1: Return to system start (free)\n` +
                    `Option 2: Override with ${coinCost} data tokens\n\n` +
                    `Current tokens: ${this.coins}\n` +
                    `Execute override protocol?`
                );
                
                if (useCoins) {
                    // Player chooses to spend coins
                    this.addCoins(-coinCost);
                    shouldGoBack = false;
                    showDebugPopup(`💰 Override successful! -${coinCost} tokens`);
                    console.log(`Player spent ${coinCost} coins to avoid going back`);
                }
            } else {
                // Not enough coins
                showDebugPopup(`❌ Insufficient tokens for override!`, 'error');
                alert(`💻 INSUFFICIENT DATA TOKENS!\nRequired: ${coinCost} tokens\nAvailable: ${this.coins}\nInitiating system reset...`);
            }
            
            if (shouldGoBack) {
                // Send back to start
                console.log(`Going back to start (0,0)`);
                this.playerX = 0;
                this.playerY = 0;
                
                // Update question counter based on new position
                this.updateQuestionCounter();
                
                showDebugPopup(`🔄 System reset - Returned to origin`);
                console.log(`Player position after wrong answer: (${this.playerX}, ${this.playerY})`);
                
                this.handleDeadEnd();
            } else {
                // Player stayed, update question counter for current position
                this.updateQuestionCounter();
            }
            
            this.draw();
        }
        
        // Always reset moving state after handling question
        this.isMoving = false;
        console.log("Reset isMoving to false (question handled)");
        
        console.log(`=== FINAL POSITION: (${this.playerX}, ${this.playerY}) ===`);
    }
}

// Q's dialogue system
function startPigQDialogue() {
    const pigMessages = [
        "Hello there! I'm Q, your guide.",
        "You are a programmer... but something's wrong.",
        "You've been trapped in this digital maze.",
        "The code around you is corrupted and broken.",
        "As a trapped programmer, you must use your skills.",
        "Debug your way out of this nightmare!"
    ];
    
    const dialogueElement = document.getElementById('dialogueText');
    let messageIndex = 0;
    let isQDialoguePhase = true;
    
    function updateDialogue() {
        if (isQDialoguePhase && dialogueElement && messageIndex < pigMessages.length) {
            dialogueElement.textContent = pigMessages[messageIndex];
            
            // Add typewriter effect
            dialogueElement.style.opacity = '0';
            setTimeout(() => {
                dialogueElement.style.opacity = '1';
            }, 100);
            
            messageIndex++;
            
            // Change message every 7 seconds (increased interval time)
            if (messageIndex < pigMessages.length) {
                setTimeout(updateDialogue, 7000);
            } else {
                // Q dialogue finished, prepare to show final prompt
                setTimeout(() => {
                    dialogueElement.textContent = "Now let me show you the full picture of your situation...";
                    document.querySelector('.continue-prompt .blinking-cursor').textContent = '▶ Tap to continue';
                }, 3000);
            }
        }
    }
    
    // Start Q's dialogue (added initial delay)
    setTimeout(updateDialogue, 1000);
}

function updateDifficultyButtonStatus() {
    const completedDifficulties = JSON.parse(localStorage.getItem('javaMazeCompletedDifficulties') || '[]');
    
    // Update each difficulty button
    const difficultyButtons = {
        'easy': document.getElementById('easyBtn'),
        'medium': document.getElementById('mediumBtn'),
        'hard': document.getElementById('hardBtn')
    };
    
    Object.entries(difficultyButtons).forEach(([difficulty, button]) => {
        if (button) {
            const isCompleted = completedDifficulties.includes(difficulty);
            const label = button.nextElementSibling;
            
            if (isCompleted) {
                // Add completion styling
                button.innerHTML = `${button.textContent.replace('✅ ', '')} ✅`;
                button.style.background = 'linear-gradient(145deg, rgba(0, 255, 65, 0.3), rgba(0, 200, 50, 0.4))';
                button.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.5)';
                
                if (label) {
                    label.innerHTML = label.innerHTML.replace(' - COMPLETED', '') + ' - <span style="color: #00ff41; font-weight: bold;">COMPLETED ✅</span>';
                }
            } else {
                // Reset to original styling if not completed
                button.innerHTML = button.textContent.replace(' ✅', '');
                button.style.background = '';
                button.style.boxShadow = '';
                
                if (label) {
                    label.innerHTML = label.innerHTML.replace(' - <span style="color: #00ff41; font-weight: bold;">COMPLETED ✅</span>', '');
                }
            }
        }
    });
    
    // Check if all completed for special message
    const allCompleted = completedDifficulties.length === 3 && 
                        completedDifficulties.includes('easy') && 
                        completedDifficulties.includes('medium') && 
                        completedDifficulties.includes('hard');
    
    if (allCompleted) {
        // Add special completion message to start screen
        const startContent = document.getElementById('startContent');
        if (startContent && !document.getElementById('masterDebuggerStatus')) {
            const masterStatus = document.createElement('div');
            masterStatus.id = 'masterDebuggerStatus';
            masterStatus.innerHTML = `
                <div style="
                    margin: 20px 0;
                    padding: 15px;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    border: 2px solid #FF8C00;
                    border-radius: 10px;
                    color: #8B4513;
                    font-weight: bold;
                    text-align: center;
                    animation: victoryGlow 2s ease-in-out infinite alternate;
                ">
                    🏆 MASTER DEBUGGER STATUS ACHIEVED! 🏆<br>
                    <span style="font-size: 14px;">💀 Successfully Escaped Digital Death 💀</span>
                </div>
            `;
            
            startContent.appendChild(masterStatus);
            
            // Add the victory glow animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes victoryGlow {
                    from { 
                        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                        transform: scale(1);
                    }
                    to { 
                        box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
                        transform: scale(1.02);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
} 