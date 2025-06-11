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
    constructor(question, answer, explanation, options = null) {
        this.question = question;
        this.answer = answer; // For MCQ: should be 'A', 'B', 'C', or 'D'
        this.explanation = explanation;
        this.options = options; // Array of 4 options for MCQ
        this.isMCQ = options !== null;
    }

    checkAnswer(userAnswer) {
        if (this.isMCQ) {
            // For MCQ, compare the letter (A, B, C, D)
            return userAnswer && userAnswer.trim().toUpperCase() === this.answer.trim().toUpperCase();
        } else {
            // For text questions (backwards compatibility)
            return userAnswer && userAnswer.trim().toLowerCase() === this.answer.trim().toLowerCase();
        }
    }
}

class MazeGame {
    constructor(difficulty) {
        this.difficulty = difficulty;
        this.initializeGameSettings();
        this.questions = this.initializeQuestions();
        this.deadEndQuestions = this.initializeDeadEndQuestions();
        
        // Debug logging
        console.log(`🎯 GAME INIT: Difficulty=${difficulty}, Questions loaded=${this.questions.length}`);
        console.log(`📚 Questions by difficulty:`, this.questions.map(q => ({ 
            question: q.question.substring(0, 50) + '...', 
            isMCQ: q.isMCQ 
        })));
        
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
        return allQuestions.map(q => new Question(q.question, q.answer, q.explanation, q.options));
    }

    getAvailableGameQuestions() {
        const defaultQuestions = this.getDefaultQuestions();
        const customQuestions = this.getCustomQuestions();
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

    getDefaultQuestions() {
        return [
            // Easy questions
            { 
                id: 'default_1', 
                question: "What keyword is used to create a class in Java?", 
                answer: "B", 
                explanation: "The 'class' keyword defines a new class in Java", 
                options: ["A) interface", "B) class", "C) object", "D) method"],
                type: 'default', 
                difficulty: 'easy' 
            },
            { 
                id: 'default_2', 
                question: "What is the primitive data type for whole numbers in Java?", 
                answer: "C", 
                explanation: "int is the primitive type for integer values", 
                options: ["A) string", "B) double", "C) int", "D) char"],
                type: 'default', 
                difficulty: 'easy' 
            },
            { 
                id: 'default_3', 
                question: "What keyword is used to create an object?", 
                answer: "A", 
                explanation: "The 'new' keyword instantiates objects", 
                options: ["A) new", "B) create", "C) make", "D) build"],
                type: 'default', 
                difficulty: 'easy' 
            },
            { 
                id: 'default_4', 
                question: "Which method is the main entry point in Java?", 
                answer: "D", 
                explanation: "public static void main(String[] args) is the main entry point", 
                options: ["A) start()", "B) begin()", "C) init()", "D) main()"],
                type: 'default', 
                difficulty: 'easy' 
            },
            { 
                id: 'default_5', 
                question: "What is the default value of a boolean variable?", 
                answer: "B", 
                explanation: "Boolean variables default to false in Java", 
                options: ["A) true", "B) false", "C) null", "D) 0"],
                type: 'default', 
                difficulty: 'easy' 
            },
            
            // Medium questions
            { 
                id: 'default_6', 
                question: "What keyword is used for inheritance in Java?", 
                answer: "A", 
                explanation: "'extends' is used to inherit from a class", 
                options: ["A) extends", "B) implements", "C) inherits", "D) derives"],
                type: 'default', 
                difficulty: 'medium' 
            },
            { 
                id: 'default_7', 
                question: "Which access modifier makes a member accessible only within the same class?", 
                answer: "C", 
                explanation: "'private' restricts access to the same class only", 
                options: ["A) public", "B) protected", "C) private", "D) default"],
                type: 'default', 
                difficulty: 'medium' 
            },
            { 
                id: 'default_8', 
                question: "What is method overloading?", 
                answer: "B", 
                explanation: "Method overloading means having multiple methods with the same name but different parameters", 
                options: ["A) Changing method visibility", "B) Same name, different parameters", "C) Inheriting methods", "D) Abstract methods"],
                type: 'default', 
                difficulty: 'medium' 
            },
            
            // Hard questions
            { 
                id: 'default_9', 
                question: "What is the difference between == and .equals() in Java?", 
                answer: "A", 
                explanation: "== compares references, .equals() compares object content", 
                options: ["A) == compares references, .equals() compares content", "B) They are identical", "C) == is faster", "D) .equals() is deprecated"],
                type: 'default', 
                difficulty: 'hard' 
            },
            { 
                id: 'default_10', 
                question: "What is a Java interface?", 
                answer: "C", 
                explanation: "An interface is a contract that defines method signatures without implementation", 
                options: ["A) A concrete class", "B) A data structure", "C) A contract with method signatures", "D) A primitive type"],
                type: 'default', 
                difficulty: 'hard' 
            },
            { 
                id: 'default_11', 
                question: "What does the 'final' keyword do when applied to a class?", 
                answer: "D", 
                explanation: "The 'final' keyword prevents a class from being extended/inherited", 
                options: ["A) Makes it abstract", "B) Makes it static", "C) Makes it immutable", "D) Prevents inheritance"],
                type: 'default', 
                difficulty: 'hard' 
            }
        ];
    }

    getCustomQuestions() {
        return JSON.parse(localStorage.getItem('javaMazeCustomQuestions') || '[]');
    }

    initializeDeadEndQuestions() {
        return [
            new Question(
                "What is a constructor?", 
                "B", 
                "A constructor is a special method that initializes objects",
                ["A) A destructor", "B) A special method that initializes objects", "C) A variable", "D) A loop"]
            ),
            new Question(
                "What package contains basic Java classes?", 
                "A", 
                "java.lang contains the fundamental Java classes",
                ["A) java.lang", "B) java.util", "C) java.io", "D) java.net"]
            ),
            new Question(
                "What operator is used for equality comparison?", 
                "C", 
                "== is used to compare two values for equality",
                ["A) =", "B) ===", "C) ==", "D) .equals()"]
            ),
            new Question(
                "What is the size of int in Java?", 
                "B", 
                "int is 32 bits or 4 bytes in Java",
                ["A) 16 bits", "B) 32 bits", "C) 64 bits", "D) 8 bits"]
            ),
            new Question(
                "What is the default value of boolean?", 
                "A", 
                "Boolean variables default to false in Java",
                ["A) false", "B) true", "C) null", "D) 0"]
            )
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
        // PREVENT DOUBLE EVENT LISTENERS - GLOBAL SINGLETON SYSTEM
        if (window.MAZE_GAME_EVENTS_INITIALIZED) {
            console.log('🔒 Event listeners already initialized globally - skipping setup');
            return;
        }
        
        console.log('🔧 INITIALIZING GLOBAL EVENT SYSTEM - FIRST TIME ONLY');
        window.MAZE_GAME_EVENTS_INITIALIZED = true;
        
        // GLOBAL QUESTION LOCK - shared across all game instances
        if (!window.GLOBAL_QUESTION_LOCK) {
            window.GLOBAL_QUESTION_LOCK = {
                isActive: false,
                lastInputTime: 0,
                inputCount: 0
            };
        }
        
        const SUPER_DEBOUNCE_MS = 500; // Even more aggressive debouncing
        
        const globalSafeInput = (dx, dy, source = 'unknown') => {
            window.GLOBAL_QUESTION_LOCK.inputCount++;
            const now = Date.now();
            const timeSinceLastInput = now - window.GLOBAL_QUESTION_LOCK.lastInputTime;
            
            console.log(`🌍 GLOBAL INPUT #${window.GLOBAL_QUESTION_LOCK.inputCount}: ${source}, Time=${timeSinceLastInput}ms, GlobalLock=${window.GLOBAL_QUESTION_LOCK.isActive}`);
            
            // ULTRA-STRICT GLOBAL BLOCKING
            if (window.GLOBAL_QUESTION_LOCK.isActive) {
                console.log(`🚫🚫🚫 GLOBAL BLOCK #${window.GLOBAL_QUESTION_LOCK.inputCount} - Question system locked globally (${source})`);
                return false;
            }
            
            if (!window.currentGame) {
                console.log(`🚫🚫🚫 GLOBAL BLOCK #${window.GLOBAL_QUESTION_LOCK.inputCount} - No active game (${source})`);
                return false;
            }
            
            if (window.currentGame.isMoving) {
                console.log(`🚫🚫🚫 GLOBAL BLOCK #${window.GLOBAL_QUESTION_LOCK.inputCount} - Game movement locked (${source})`);
                return false;
            }
            
            if (timeSinceLastInput < SUPER_DEBOUNCE_MS) {
                console.log(`🚫🚫🚫 GLOBAL BLOCK #${window.GLOBAL_QUESTION_LOCK.inputCount} - Too fast: ${timeSinceLastInput}ms < ${SUPER_DEBOUNCE_MS}ms (${source})`);
                return false;
            }
            
            // ACCEPT AND LOCK EVERYTHING GLOBALLY
            window.GLOBAL_QUESTION_LOCK.isActive = true;
            window.GLOBAL_QUESTION_LOCK.lastInputTime = now;
            console.log(`✅✅✅ GLOBAL ACCEPT #${window.GLOBAL_QUESTION_LOCK.inputCount} - LOCKED GLOBALLY: ${source}`);
            
            // Call the current game's input handler
            window.currentGame.handleDirectionalInput(dx, dy);
            return true;
        };
        
        // GLOBAL unlock function
        window.GLOBAL_UNLOCK = () => {
            console.log('🔓🌍 GLOBAL UNLOCK - Releasing global question lock');
            window.GLOBAL_QUESTION_LOCK.isActive = false;
            if (window.currentGame) {
                window.currentGame.isMoving = false;
                window.currentGame.isQuestionActive = false;
            }
        };

        // Add debug counter display method
        this.showDebugCounter = (message) => {
            let debugDiv = document.getElementById('inputDebugCounter');
            if (!debugDiv) {
                debugDiv = document.createElement('div');
                debugDiv.id = 'inputDebugCounter';
                debugDiv.style.cssText = `
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.8);
                    color: #00ff41;
                    padding: 10px;
                    border: 2px solid #00ff41;
                    border-radius: 5px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    z-index: 10000;
                    text-align: center;
                `;
                document.body.appendChild(debugDiv);
            }
            debugDiv.innerHTML = `Input #${window.GLOBAL_QUESTION_LOCK.inputCount}: ${message}<br>Moving: ${this.isMoving}`;
            
            // Auto-hide after 3 seconds
            clearTimeout(this.debugTimeout);
            this.debugTimeout = setTimeout(() => {
                if (debugDiv && debugDiv.parentNode) {
                    debugDiv.parentNode.removeChild(debugDiv);
                }
            }, 3000);
        };

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isMoving) return;
            
            let dx = 0, dy = 0;
            switch(e.key) {
                case 'ArrowUp': dy = -1; break;
                case 'ArrowDown': dy = 1; break;
                case 'ArrowLeft': dx = -1; break;
                case 'ArrowRight': dx = 1; break;
                default: return;
            }
            
            e.preventDefault();
            globalSafeInput(dx, dy, 'keyboard');
        });

        // Canvas click controls - SINGLE consolidated handler
        this.canvas.addEventListener('click', (e) => {
            if (this.isMoving) return;
            
            // Only handle left clicks (button 0), ignore right clicks
            if (e.button !== undefined && e.button !== 0) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate direction relative to player
            const playerPixelX = this.playerX * this.cellSize + this.cellSize/2;
            const playerPixelY = this.playerY * this.cellSize + this.cellSize/2;
            
            const deltaX = x - playerPixelX;
            const deltaY = y - playerPixelY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            let dx = 0, dy = 0;
            if (absDeltaX > absDeltaY) {
                dx = deltaX > 0 ? 1 : -1;
            } else {
                dy = deltaY > 0 ? 1 : -1;
            }
            
            globalSafeInput(dx, dy, 'canvas-click');
        });

        // Disable right-click context menu without triggering movement
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            console.log('🖱️ Right-click disabled on canvas');
        });

        // Prevent any mouse button events that might interfere
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button
                e.preventDefault();
                e.stopPropagation();
            }
        });

        // Touch controls with debouncing
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 30;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.isMoving) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const touch = e.changedTouches[0];
            const touchEndX = touch.clientX;
            const touchEndY = touch.clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);
            
            if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) {
                return;
            }
            
            let dx = 0, dy = 0;
            if (absDeltaX > absDeltaY) {
                dx = deltaX > 0 ? 1 : -1;
            } else {
                dy = deltaY > 0 ? 1 : -1;
            }
            
            globalSafeInput(dx, dy, 'touch-swipe');
        }, { passive: false });

        // Virtual D-pad controls with unified debouncing
        const setupVirtualDPad = () => {
            const upBtn = document.getElementById('upBtn');
            const downBtn = document.getElementById('downBtn');
            const leftBtn = document.getElementById('leftBtn');
            const rightBtn = document.getElementById('rightBtn');
            
            const handleDPadInput = (dx, dy, event) => {
                if (this.isMoving) return;
                
                event.preventDefault();
                event.stopPropagation();
                
                globalSafeInput(dx, dy, 'virtual-dpad');
            };
            
            if (upBtn) {
                upBtn.addEventListener('mousedown', (e) => handleDPadInput(0, -1, e));
                upBtn.addEventListener('touchstart', (e) => handleDPadInput(0, -1, e), { passive: false });
            }
            
            if (downBtn) {
                downBtn.addEventListener('mousedown', (e) => handleDPadInput(0, 1, e));
                downBtn.addEventListener('touchstart', (e) => handleDPadInput(0, 1, e), { passive: false });
            }
            
            if (leftBtn) {
                leftBtn.addEventListener('mousedown', (e) => handleDPadInput(-1, 0, e));
                leftBtn.addEventListener('touchstart', (e) => handleDPadInput(-1, 0, e), { passive: false });
            }
            
            if (rightBtn) {
                rightBtn.addEventListener('mousedown', (e) => handleDPadInput(1, 0, e));
                rightBtn.addEventListener('touchstart', (e) => handleDPadInput(1, 0, e), { passive: false });
            }
        };
        
        setTimeout(setupVirtualDPad, 100);

        // Set up regenerate maze button
        const regenerateMazeBtn = document.getElementById('regenerateMazeBtn');
        if (regenerateMazeBtn) {
            regenerateMazeBtn.addEventListener('click', () => {
                console.log('🔄 Regenerating maze...');
                this.initializeMaze();
                this.playerX = 0;
                this.playerY = 0;
                this.placeCoinInMaze();
                this.draw();
                this.updateQuestionCounter();
                console.log('✅ Maze regenerated successfully');
            });
        }
    }

    handleDirectionalInput(dx, dy) {
        // STRICT SINGLE QUESTION ENFORCEMENT
        if (this.isMoving) {
            console.log('🚫 Movement locked - ignoring input');
            return;
        }
        
        console.log(`🎮 SINGLE MOVE: Direction (${dx}, ${dy})`);
        
        // Validate move
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;
        
        if (!this.isValidCell(newX, newY) || this.maze[newY][newX] === WALL) {
            console.log('❌ Invalid move - wall or boundary');
            return;
        }

        // LOCK MOVEMENT IMMEDIATELY
        this.isMoving = true;
        console.log('🔒 MOVEMENT LOCKED');
        
        // Store intended move
        this.pendingMove = { newX, newY };
        
        // Safety timeout
        this.movementTimeout = setTimeout(() => {
            console.log('⚠️ SAFETY TIMEOUT - Force unlocking movement');
            this.isMoving = false;
            if (this.movementTimeout) {
                clearTimeout(this.movementTimeout);
                this.movementTimeout = null;
            }
        }, 30000);
        
        // Check if we have questions
        if (this.questions.length === 0) {
            console.log('📚 No questions - adding emergency questions');
            this.addEmergencyQuestions();
        }
        
        // Ask EXACTLY ONE question
        this.askSingleQuestion();
    }

    askSingleQuestion() {
        console.log('❓ ASKING EXACTLY ONE QUESTION');
        console.log('📊 Questions in pool:', this.questions.length);
        
        // Get one random question
        const questionIndex = Math.floor(Math.random() * this.questions.length);
        const question = this.questions[questionIndex];
        this.questions.splice(questionIndex, 1);
        
        console.log('📝 Selected question:', question.question.substring(0, 50) + '...');
        console.log('📊 Questions remaining after selection:', this.questions.length);
        
        // Show the question using simple prompt
        this.showSingleQuestion(question);
    }

    showSingleQuestion(question) {
        // Create the question prompt
        let promptText = `🤖 DEBUG PROTOCOL INITIATED\n\n${question.question}\n\n`;
        
        if (question.isMCQ && question.options) {
            question.options.forEach(option => {
                promptText += option + "\n";
            });
            promptText += "\nEnter your answer (A, B, C, or D):";
        } else {
            promptText += "Enter your answer:";
        }
        
        console.log('🎯 SHOWING SINGLE PROMPT');
        const userAnswer = prompt(promptText);
        console.log('💬 User answered:', userAnswer);
        
        // Process the answer
        this.processSingleAnswer(question, userAnswer);
    }

    processSingleAnswer(question, userAnswer) {
        console.log('⚖️ PROCESSING SINGLE ANSWER');
        
        const isCorrect = question.checkAnswer(userAnswer);
        console.log('✅ Answer correct:', isCorrect);
        
        if (isCorrect) {
            // CORRECT - Move forward
            console.log('🎉 CORRECT ANSWER - Moving forward');
            this.addCoins(COIN_REWARDS.CORRECT_ANSWER);
            this.executePendingMove();
        } else {
            // WRONG - Back to start or spend coins
            console.log('❌ WRONG ANSWER - Handling penalty');
            this.addCoins(COIN_REWARDS.WRONG_ANSWER);
            
            const coinCost = COIN_COSTS.AVOID_DEAD_END;
            let shouldGoBack = true;
            
            if (this.coins >= coinCost) {
                const useCoins = confirm(
                    `⚠️ WRONG ANSWER!\n\n` +
                    `Correct answer: ${question.answer}\n\n` +
                    `Option 1: Return to start (free)\n` +
                    `Option 2: Continue with ${coinCost} coins\n\n` +
                    `Current coins: ${this.coins}\n` +
                    `Use coins to continue?`
                );
                
                if (useCoins) {
                    this.addCoins(-coinCost);
                    shouldGoBack = false;
                    console.log('💰 Used coins to continue');
                    this.executePendingMove();
                }
            }
            
            if (shouldGoBack) {
                console.log('🔄 Returning to start');
                this.returnToStart();
            }
        }
        
        // ALWAYS unlock movement after processing
        this.unlockMovement();
    }

    executePendingMove() {
        if (!this.pendingMove) {
            console.log('⚠️ No pending move to execute');
            return;
        }
        
        console.log('🚀 EXECUTING MOVE to:', this.pendingMove.newX, this.pendingMove.newY);
        
        // Mark path as correct
        this.maze[this.pendingMove.newY][this.pendingMove.newX] = CORRECT_PATH;
        
        // Move player
        this.playerX = this.pendingMove.newX;
        this.playerY = this.pendingMove.newY;
        
        // Collect coin if present
        this.collectCoin(this.playerX, this.playerY);
        
        // Update display
        this.draw();
        this.updateQuestionCounter();
        
        // Check if at exit
        this.checkExit();
        
        // Clear pending move
        this.pendingMove = null;
    }

    returnToStart() {
        console.log('↩️ RETURNING TO START');
        this.playerX = 0;
        this.playerY = 0;
        this.handleDeadEnd();
        this.draw();
        this.updateQuestionCounter();
        this.pendingMove = null;
    }

    unlockMovement() {
        console.log('🔓 UNLOCKING MOVEMENT AND QUESTION SYSTEM');
        this.isMoving = false;
        this.isQuestionActive = false; // Reset question lock
        
        // ALSO UNLOCK GLOBAL SYSTEM
        if (window.GLOBAL_UNLOCK) {
            window.GLOBAL_UNLOCK();
        }
        
        if (this.movementTimeout) {
            clearTimeout(this.movementTimeout);
            this.movementTimeout = null;
        }
        
        console.log('✅ Movement and questions unlocked - ready for next input');
    }

    addEmergencyQuestions() {
        // Add some backup questions if we run out
        const emergencyQuestions = [
            new Question(
                "What is the main method signature in Java?", 
                "B", 
                "public static void main(String[] args) is the main method signature",
                ["A) public void main(String[] args)", "B) public static void main(String[] args)", "C) static void main(String[] args)", "D) public main(String[] args)"]
            ),
            new Question(
                "Which keyword is used to inherit from a class?", 
                "A", 
                "'extends' is used to inherit from a class in Java",
                ["A) extends", "B) implements", "C) inherits", "D) super"]
            ),
            new Question(
                "What is the default value of a boolean variable?", 
                "B", 
                "Boolean variables default to false in Java",
                ["A) true", "B) false", "C) null", "D) 0"]
            ),
            new Question(
                "Which access modifier provides the most restrictive access?", 
                "C", 
                "'private' provides the most restrictive access - only within the same class",
                ["A) public", "B) protected", "C) private", "D) default"]
            ),
            new Question(
                "What is used to create an instance of a class?", 
                "D", 
                "The 'new' keyword is used to create instances of classes",
                ["A) create", "B) instance", "C) make", "D) new"]
            )
        ];
        
        this.questions.push(...emergencyQuestions);
        console.log('🆘 Added', emergencyQuestions.length, 'emergency questions. Total questions now:', this.questions.length);
    }

    executeMove(newX, newY) {
        this.playerX = newX;
        this.playerY = newY;
        this.collectCoin(this.playerX, this.playerY);
        this.draw();
        this.checkExit();
        
        // Unlock movement after executing move
        this.isMoving = false;
    }

    findNearestDeadEnd(x, y) {
        // If it's the first move or no dead ends, return to start
        if (this.isFirstMove || this.deadEndPositions.length === 0) {
            return { x: 0, y: 0 };
        }

        // Return the last dead end we created
        return this.lastDeadEnd;
    }

    checkExit() {
        if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
            // At exit - check if we need more questions
            if (this.remainingQuestions > 0) {
                alert('You need to answer all questions before finishing! Questions remaining: ' + this.remainingQuestions);
                // Send back to start (the only dead end)
                this.playerX = 0;
                this.playerY = 0;
                this.updateQuestionCounter();
            } else {
                // Game completed - UNLOCK EVERYTHING FIRST
                console.log('🏁 GAME COMPLETED - Unlocking all systems');
                this.unlockMovement();
                
                // Mark this difficulty as completed
                this.markDifficultyCompleted(this.difficulty);
                
                // Add coins to total
                const newTotal = addToTotalCoins(this.coins);
                
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
                        
                        // Auto-return to start screen after final message
                        setTimeout(() => {
                            this.returnToStartScreen();
                        }, 2000);
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
                        
                        // Auto-return to start screen after completion
                        setTimeout(() => {
                            this.returnToStartScreen();
                        }, 2000);
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
                console.log('💳 System debt cleared - Fresh start!');
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
            
            return true;
        }
        return false;
    }

    handleDeadEnd() {
        this.addCoins(COIN_REWARDS.DEAD_END);
        this.inDeadEnd = true;
    }

    // Emergency debug functions - can be called from console
    forceUnlockMovement() {
        this.isMoving = false;
        this.isQuestionActive = false; // Reset question lock
        if (this.movementTimeout) {
            clearTimeout(this.movementTimeout);
            this.movementTimeout = null;
        }
        console.log('🚑 EMERGENCY: Movement and questions force unlocked!');
        return 'Movement and questions unlocked successfully';
    }

    getGameStatus() {
        return {
            isMoving: this.isMoving,
            playerPosition: { x: this.playerX, y: this.playerY },
            remainingQuestions: this.remainingQuestions,
            questionsInPool: this.questions.length,
            coins: this.coins,
            difficulty: this.difficulty,
            mazeSize: this.size
        };
    }

    addMoreQuestions() {
        // Use the same emergency questions system
        this.addEmergencyQuestions();
        console.log('🆘 Added more emergency questions. Questions now:', this.questions.length);
        return `Emergency questions added. Total: ${this.questions.length}`;
    }

    // New function to return to start screen
    returnToStartScreen() {
        console.log('🏠 RETURNING TO START SCREEN');
        
        // Unlock everything
        this.unlockMovement();
        
        // Get screen elements
        const startScreen = document.getElementById('startScreen');
        const gameContainer = document.getElementById('gameContainer');
        
        if (startScreen && gameContainer) {
            startScreen.style.display = 'flex';
            gameContainer.style.display = 'none';
            
            // Clear the current game
            if (window.currentGame) {
                window.currentGame = null;
            }
            
            // Update difficulty button status to show completion
            if (typeof updateDifficultyButtonStatus === 'function') {
                updateDifficultyButtonStatus();
            }
            
            console.log('✅ Successfully returned to start screen after completion');
        } else {
            console.error('❌ Could not find screen elements for return');
        }
    }
}

// Q's dialogue system
function startPigQDialogue() {
    const pigMessages = [
        "Hello there! I'm Q, your guide! 🐷",
        "Miss me? I'm always here to help!",
        "You are a programmer... but something's wrong.",
        "You've been trapped in this digital maze.",
        "The code around you is corrupted and broken.",
        "As a trapped programmer, you must use your skills.",
        "Debug your way out of this nightmare!",
        "Good luck, brave coder! 💻✨"
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
            
            // Change message every 18 seconds (extended by 10 seconds)
            if (messageIndex < pigMessages.length) {
                setTimeout(updateDialogue, 18000);
            } else {
                // Q dialogue finished, prepare to show final prompt
                setTimeout(() => {
                    dialogueElement.textContent = "Ready to start your debugging adventure?";
                    document.querySelector('.continue-prompt .blinking-cursor').textContent = '▶ Tap to begin coding journey';
                }, 3000);
            }
        }
    }
    
    // Start Q's dialogue
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