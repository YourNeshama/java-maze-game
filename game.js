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
        
        // 确保画布背景是纯黑色
        this.canvas.style.backgroundColor = '#000000';
        
        // Add code-themed styling to canvas
        this.canvas.classList.add('code-themed-canvas');

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
            
            this.tryMove(dx, dy);
        });

        document.getElementById('regenerateMazeBtn').addEventListener('click', () => {
            this.initializeMaze();
            this.playerX = 0;
            this.playerY = 0;
            this.placeCoinInMaze();
            this.draw();
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
        
        // Check if move is valid (not wall, not out of bounds)
        if (!this.isValidCell(newX, newY) || this.maze[newY][newX] === WALL) {
            console.log("BLOCKED: Wall or out of bounds");
            return;
        }

        // If no questions left, check for dead ends then allow movement
        if (this.remainingQuestions === 0) {
            if (this.maze[newY][newX] === DEAD_END) {
                alert("That's a dead end! Choose another path.");
                return;
            }
            console.log("FREE MOVEMENT: No questions left");
            this.playerX = newX;
            this.playerY = newY;
            this.collectCoin(this.playerX, this.playerY);
            this.draw();
            return;
        }

        // We have questions - ask one
        console.log("ASKING QUESTION...");
        const questionIndex = Math.floor(Math.random() * this.questions.length);
        const question = this.questions[questionIndex];
        this.questions.splice(questionIndex, 1);
        
        // Use story-based question presentation
        this.handleStoryQuestion(question, newX, newY);
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
                // Game completed - add coins to total
                const newTotal = addToTotalCoins(this.coins);
                showDebugPopup('🎉 SYSTEM RESTORED - ESCAPE SUCCESSFUL!', 'success');
                alert(`🎊 CONGRATULATIONS! SYSTEM FULLY DEBUGGED! 🎊\n\nYou've successfully escaped the corrupted code maze!\nGame Score: ${this.coins} coins\nTotal Coins Earned: ${newTotal} coins`);
                
                // Add completion bonus
                const completionBonus = 50;
                const finalTotal = addToTotalCoins(completionBonus);
                setTimeout(() => {
                    alert(`🚀 SYSTEM BONUS UNLOCKED: +${completionBonus} coins!\nYour new total: ${finalTotal} coins\n\nThe digital realm is safe once again!`);
                }, 1000);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 设置纯黑色背景
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.maze[y][x];
                const centerX = x * this.cellSize + this.cellSize/2;
                const centerY = y * this.cellSize + this.cellSize/2;

                // 黑客风格的格子绘制
                if (cell === WALL) {
                    // 墙壁 - 深蓝色带发光边框
                    this.ctx.fillStyle = '#0a1a2e';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // 添加发光边框
                    this.ctx.strokeStyle = '#00ff41';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowColor = '#00ff41';
                    this.ctx.shadowBlur = 3;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    this.ctx.shadowBlur = 0;
                } else {
                    // 路径 - 纯黑色背景
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // 添加微弱的网格线
                    this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
                    this.ctx.lineWidth = 0.5;
                    this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                }

                // Draw special cells with cyber effects
                switch(cell) {
                    case CORRECT_PATH:
                        // 正确路径 - 绿色发光
                        this.ctx.fillStyle = 'rgba(0, 255, 65, 0.3)';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        
                        // 添加脉冲发光效果
                        this.ctx.shadowColor = '#00ff41';
                        this.ctx.shadowBlur = 8;
                        this.ctx.strokeStyle = '#00ff41';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x * this.cellSize + 2, y * this.cellSize + 2, this.cellSize - 4, this.cellSize - 4);
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case DEAD_END:
                        // 死路 - 红色警告
                        this.ctx.fillStyle = 'rgba(255, 68, 68, 0.3)';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        
                        // 添加警告发光
                        this.ctx.shadowColor = '#ff4444';
                        this.ctx.shadowBlur = 6;
                        this.ctx.strokeStyle = '#ff4444';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(x * this.cellSize + 1, y * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
                        this.ctx.shadowBlur = 0;
                        break;
                        
                    case COIN:
                        // 数据币 - 金色发光圆形
                        const gradient = this.ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, this.cellSize/3
                        );
                        gradient.addColorStop(0, '#00ffff');    // 青色中心
                        gradient.addColorStop(0.7, '#ffff00');  // 黄色过渡
                        gradient.addColorStop(1, '#ff8800');    // 橙色边缘
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.shadowColor = '#ffff00';
                        this.ctx.shadowBlur = 10;
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize/3, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        
                        // 添加旋转的内环
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

                // 出口标记 - 特殊的黑客风格
                if (x === this.size - 1 && y === this.size - 1) {
                    // 创建脉冲发光的出口
                    const exitGradient = this.ctx.createRadialGradient(
                        centerX, centerY, 0,
                        centerX, centerY, this.cellSize/2
                    );
                    exitGradient.addColorStop(0, 'rgba(0, 255, 65, 0.8)');
                    exitGradient.addColorStop(1, 'rgba(0, 255, 65, 0.2)');
                    
                    this.ctx.fillStyle = exitGradient;
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // EXIT 文字带发光
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.font = `bold ${this.cellSize/3}px 'Courier New'`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.shadowColor = '#00ff41';
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillText('EXIT', centerX, centerY);
                    this.ctx.shadowBlur = 0;
                    
                    // 添加扫描线效果
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
        
        // 绘制玩家 - 黑客风格
        const playerCenterX = this.playerX * this.cellSize + this.cellSize/2;
        const playerCenterY = this.playerY * this.cellSize + this.cellSize/2;
        
        // 玩家光环
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
        
        // 玩家核心
        this.ctx.fillStyle = '#00bfff';
        this.ctx.shadowColor = '#00bfff';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(playerCenterX, playerCenterY, this.cellSize/3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // 玩家内环
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
            coinDisplay.textContent = `Coins: ${this.coins}`;
        }
    }

    addCoins(amount) {
        this.coins += amount;
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

    handleStoryQuestion(question, newX, newY) {
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
        
        // After a brief delay, show the actual question
        setTimeout(() => {
            const userAnswer = prompt(`[DEBUG MODE ACTIVATED]\n\n${question.question}`);
            this.handleQuestionAnswer(question, userAnswer, newX, newY);
        }, 1500);
    }

    handleQuestionAnswer(question, userAnswer, newX, newY) {
        if (question.checkAnswer(userAnswer)) {
            // CORRECT ANSWER - ALLOW MOVEMENT
            console.log("CORRECT ANSWER - MOVING FORWARD");
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
            // WRONG ANSWER - OPTION TO SPEND COINS OR GO BACK
            console.log("WRONG ANSWER - OFFERING COIN OPTION");
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
        
        console.log(`=== FINAL POSITION: (${this.playerX}, ${this.playerY}) ===`);
    }
}

// Game initialization
window.onload = () => {
    console.log('🚀 GAME LOADING - Window loaded - Initializing game...');
    
    const startScreen = document.getElementById('startScreen');
    const storyScreen = document.getElementById('storyScreen');
    const gameContainer = document.getElementById('gameContainer');
    let currentGame = null;

    console.log('🔍 Found elements:', {
        startScreen: !!startScreen,
        storyScreen: !!storyScreen,
        gameContainer: !!gameContainer
    });

    // Test function - you can call this in console if needed
    window.forceShowStory = () => {
        console.log('🧪 FORCING STORY SCREEN...');
        const story = document.getElementById('storyScreen');
        if (story) {
            story.style.display = 'flex';
            story.style.zIndex = '9999';
            console.log('✅ Story screen forced to display');
        } else {
            console.error('❌ Story screen not found!');
        }
    };

    // Initialize audio system
    initializeAudioSystem();
    
    // Hide all screens initially
    if (startScreen) {
        startScreen.style.display = 'none';
        console.log('✅ Start screen hidden');
    }
    if (gameContainer) {
        gameContainer.style.display = 'none';
        console.log('✅ Game container hidden');
    }
    
    // Show story screen first after a brief delay to ensure DOM is ready
    console.log('⏰ Setting timeout to show story screen...');
    setTimeout(() => {
        console.log('🎬 Timeout triggered - calling showStoryScreen()');
        showStoryScreen();
    }, 100);

    // Initialize total coins display
    updateTotalCoinsDisplay();
    
    // Initialize question bank
    initializeQuestionBank();

    // Help modal functionality
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.getElementsByClassName('close')[0];

    helpBtn.addEventListener('click', () => {
        console.log('Help button clicked');
        helpModal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        console.log('Close button clicked');
        helpModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            console.log('Modal background clicked');
            helpModal.style.display = 'none';
        }
    });

    // Question Bank modal functionality
    const questionBankBtn = document.getElementById('questionBankBtn');
    const questionBankModal = document.getElementById('questionBankModal');
    const questionBankClose = document.getElementsByClassName('question-bank-close')[0];

    questionBankBtn.addEventListener('click', () => {
        console.log('Question Bank button clicked');
        questionBankModal.style.display = 'block';
        loadQuestionBank();
    });

    questionBankClose.addEventListener('click', () => {
        console.log('Question Bank close button clicked');
        questionBankModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === questionBankModal) {
            console.log('Question Bank modal background clicked');
            questionBankModal.style.display = 'none';
        }
    });

    // Question Bank tabs functionality
    const viewQuestionsTab = document.getElementById('viewQuestionsTab');
    const addQuestionTab = document.getElementById('addQuestionTab');
    const viewQuestionsContent = document.getElementById('viewQuestionsContent');
    const addQuestionContent = document.getElementById('addQuestionContent');

    viewQuestionsTab.addEventListener('click', () => {
        switchTab('view');
    });

    addQuestionTab.addEventListener('click', () => {
        switchTab('add');
    });

    function switchTab(tab) {
        if (tab === 'view') {
            viewQuestionsTab.classList.add('active');
            addQuestionTab.classList.remove('active');
            viewQuestionsContent.classList.add('active');
            addQuestionContent.classList.remove('active');
            loadQuestionBank();
        } else {
            viewQuestionsTab.classList.remove('active');
            addQuestionTab.classList.add('active');
            viewQuestionsContent.classList.remove('active');
            addQuestionContent.classList.add('active');
        }
    }

    // Question filter functionality
    const showAllBtn = document.getElementById('showAllBtn');
    const showDefaultBtn = document.getElementById('showDefaultBtn');
    const showCustomBtn = document.getElementById('showCustomBtn');
    
    // Difficulty filter functionality
    const showAllDiffBtn = document.getElementById('showAllDiffBtn');
    const showEasyBtn = document.getElementById('showEasyBtn');
    const showMediumBtn = document.getElementById('showMediumBtn');
    const showHardBtn = document.getElementById('showHardBtn');

    showAllBtn.addEventListener('click', () => filterQuestions('all', currentDifficultyFilter));
    showDefaultBtn.addEventListener('click', () => filterQuestions('default', currentDifficultyFilter));
    showCustomBtn.addEventListener('click', () => filterQuestions('custom', currentDifficultyFilter));
    
    showAllDiffBtn.addEventListener('click', () => filterQuestions(currentTypeFilter, 'all'));
    showEasyBtn.addEventListener('click', () => filterQuestions(currentTypeFilter, 'easy'));
    showMediumBtn.addEventListener('click', () => filterQuestions(currentTypeFilter, 'medium'));
    showHardBtn.addEventListener('click', () => filterQuestions(currentTypeFilter, 'hard'));

    // Current filter state
    let currentTypeFilter = 'all';
    let currentDifficultyFilter = 'all';

    function filterQuestions(typeFilter, difficultyFilter) {
        currentTypeFilter = typeFilter;
        currentDifficultyFilter = difficultyFilter;
        
        // Update type filter button states
        document.querySelectorAll('.filter-btn:not(.difficulty-filter)').forEach(btn => btn.classList.remove('active'));
        if (typeFilter === 'all') showAllBtn.classList.add('active');
        else if (typeFilter === 'default') showDefaultBtn.classList.add('active');
        else if (typeFilter === 'custom') showCustomBtn.classList.add('active');
        
        // Update difficulty filter button states
        document.querySelectorAll('.difficulty-filter').forEach(btn => btn.classList.remove('active'));
        if (difficultyFilter === 'all') showAllDiffBtn.classList.add('active');
        else if (difficultyFilter === 'easy') showEasyBtn.classList.add('active');
        else if (difficultyFilter === 'medium') showMediumBtn.classList.add('active');
        else if (difficultyFilter === 'hard') showHardBtn.classList.add('active');
        
        // Filter and display questions
        displayQuestions(typeFilter, difficultyFilter);
    }

    // Add question form functionality
    const addQuestionForm = document.getElementById('addQuestionForm');
    const clearFormBtn = document.getElementById('clearFormBtn');

    addQuestionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addCustomQuestion();
    });

    clearFormBtn.addEventListener('click', () => {
        clearQuestionForm();
    });

    // Make switchTab globally accessible
    window.switchTab = function(tab) {
        if (tab === 'view') {
            viewQuestionsTab.classList.add('active');
            addQuestionTab.classList.remove('active');
            viewQuestionsContent.classList.add('active');
            addQuestionContent.classList.remove('active');
            loadQuestionBank();
        } else {
            viewQuestionsTab.classList.remove('active');
            addQuestionTab.classList.add('active');
            viewQuestionsContent.classList.remove('active');
            addQuestionContent.classList.add('active');
        }
    };

    // Email functionality - attach event listeners after DOM is ready
    const emailBtn = document.getElementById('emailBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    
    console.log('Email button found:', emailBtn);
    console.log('Feedback button found:', feedbackBtn);
    
    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            console.log('Email button clicked');
            const subject = 'Java Maze Game - Bug Report';
            const body = `Hi there!

I found a bug in the Java Learning Maze Game:

**What happened:**
[Describe the issue]

**What I expected:**
[Describe what should have happened]

**Steps to reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Browser:** ${navigator.userAgent}
**Screen size:** ${window.screen.width}x${window.screen.height}
**Game URL:** ${window.location.href}

**Additional details:**
[Any other relevant information]

Thanks for making this awesome game!`;

            window.location.href = `mailto:kexinliu7a@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }

    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
            console.log('Feedback button clicked');
            const subject = 'Java Maze Game - Feedback & Suggestions';
            const body = `Hi there!

I have some feedback about the Java Learning Maze Game:

**What I liked:**
[What you enjoyed about the game]

**Suggestions for improvement:**
[Ideas for new features or changes]

**Overall experience:**
[Your general thoughts]

**Browser:** ${navigator.userAgent}
**Game URL:** ${window.location.href}

Thanks for creating this game!`;

            window.location.href = `mailto:kexinliu7a@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }

    // Show start screen, hide game container initially
    startScreen.style.display = 'flex';
    gameContainer.style.display = 'none';

    function startGame(difficulty) {
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        currentGame = new MazeGame(difficulty);
    }

    // Add click event listeners to difficulty buttons
    document.getElementById('easyBtn').addEventListener('click', () => startGame('easy'));
    document.getElementById('mediumBtn').addEventListener('click', () => startGame('medium'));
    document.getElementById('hardBtn').addEventListener('click', () => startGame('hard'));

    // Add click event listener to new game button
    document.getElementById('newGameBtn').addEventListener('click', () => {
        startScreen.style.display = 'flex';
        gameContainer.style.display = 'none';
        if (currentGame) {
            // Clean up any existing game resources
            currentGame = null;
        }
        // Update total coins display when returning to start screen
        updateTotalCoinsDisplay();
    });

    // Add click event listener to reset coins button
    document.getElementById('resetCoinsBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your total coins to 0?')) {
            saveTotalCoins(0);
            updateTotalCoinsDisplay();
            alert('Total coins reset to 0!');
        }
    });
};

// localStorage functions for total coins
function getTotalCoins() {
    return parseInt(localStorage.getItem('javaMazeTotalCoins') || '0');
}

function saveTotalCoins(coins) {
    localStorage.setItem('javaMazeTotalCoins', coins.toString());
}

function addToTotalCoins(gameCoins) {
    const currentTotal = getTotalCoins();
    const newTotal = currentTotal + gameCoins;
    saveTotalCoins(newTotal);
    updateTotalCoinsDisplay();
    return newTotal;
}

function updateTotalCoinsDisplay() {
    const totalCoinsElement = document.getElementById('totalCoinCount');
    if (totalCoinsElement) {
        totalCoinsElement.textContent = getTotalCoins();
    }
}

// Question Bank Management System
function initializeQuestionBank() {
    // Initialize custom questions in localStorage if not exists
    if (!localStorage.getItem('javaMazeCustomQuestions')) {
        localStorage.setItem('javaMazeCustomQuestions', JSON.stringify([]));
    }
}

function getCustomQuestions() {
    return JSON.parse(localStorage.getItem('javaMazeCustomQuestions') || '[]');
}

function saveCustomQuestions(questions) {
    localStorage.setItem('javaMazeCustomQuestions', JSON.stringify(questions));
}

function getDefaultQuestions() {
    return [
        // EASY LEVEL QUESTIONS
        {
            id: 'default_1',
            question: "What keyword is used to create a class in Java?",
            answer: "class",
            explanation: "The class keyword defines a new class",
            type: 'default',
            difficulty: 'easy'
        },
        {
            id: 'default_2',
            question: "What is the primitive data type for whole numbers in Java?",
            answer: "int",
            explanation: "int is used for integer values",
            type: 'default',
            difficulty: 'easy'
        },
        {
            id: 'default_3',
            question: "What keyword is used to create an object?",
            answer: "new",
            explanation: "The new keyword instantiates objects",
            type: 'default',
            difficulty: 'easy'
        },
        {
            id: 'default_4',
            question: "What is the correct way to declare a string?",
            answer: "String",
            explanation: "String is a class in Java",
            type: 'default',
            difficulty: 'easy'
        },
        {
            id: 'default_5',
            question: "What does 'public' mean in Java?",
            answer: "public",
            explanation: "public means accessible from anywhere",
            type: 'default',
            difficulty: 'easy'
        },
        {
            id: 'default_6',
            question: "What symbol is used to end a statement in Java?",
            answer: ";",
            explanation: "Semicolon (;) ends statements in Java",
            type: 'default',
            difficulty: 'easy'
        },
        
        // MEDIUM LEVEL QUESTIONS
        {
            id: 'default_7',
            question: "What is the main entry point method in Java?",
            answer: "public static void main(String[] args)",
            explanation: "The main method is the entry point of a Java program",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_8',
            question: "What is the parent class of all classes in Java?",
            answer: "Object",
            explanation: "Object is the root class",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_9',
            question: "What keyword is used for inheritance?",
            answer: "extends",
            explanation: "extends is used to inherit from a class",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_10',
            question: "What access modifier makes a member visible only within its class?",
            answer: "private",
            explanation: "private restricts access",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_11',
            question: "What keyword is used to define a constant?",
            answer: "final",
            explanation: "final makes variables unchangeable",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_12',
            question: "What keyword is used to handle exceptions?",
            answer: "try",
            explanation: "try begins exception handling",
            type: 'default',
            difficulty: 'medium'
        },
        {
            id: 'default_13',
            question: "What is method overloading?",
            answer: "same method name with different parameters",
            explanation: "Method overloading allows multiple methods with same name but different signatures",
            type: 'default',
            difficulty: 'medium'
        },
        
        // HARD LEVEL QUESTIONS
        {
            id: 'default_14',
            question: "What is the difference between abstract class and interface?",
            answer: "abstract class can have implementation, interface cannot",
            explanation: "Abstract classes can have concrete methods, interfaces only have abstract methods (before Java 8)",
            type: 'default',
            difficulty: 'hard'
        },
        {
            id: 'default_15',
            question: "What is a lambda expression in Java?",
            answer: "anonymous function",
            explanation: "Lambda expressions provide a concise way to represent anonymous functions",
            type: 'default',
            difficulty: 'hard'
        },
        {
            id: 'default_16',
            question: "What is the difference between == and .equals()?",
            answer: "== compares references, .equals() compares values",
            explanation: "== checks if two references point to same object, .equals() checks logical equality",
            type: 'default',
            difficulty: 'hard'
        },
        {
            id: 'default_17',
            question: "What is generics in Java?",
            answer: "type parameters for classes and methods",
            explanation: "Generics enable types to be parameters when defining classes, interfaces and methods",
            type: 'default',
            difficulty: 'hard'
        },
        {
            id: 'default_18',
            question: "What is the purpose of synchronized keyword?",
            answer: "thread synchronization",
            explanation: "synchronized ensures that only one thread can access a method or block at a time",
            type: 'default',
            difficulty: 'hard'
        },
        {
            id: 'default_19',
            question: "What is dependency injection?",
            answer: "providing dependencies from external source",
            explanation: "Dependency injection is a technique for providing object dependencies rather than creating them internally",
            type: 'default',
            difficulty: 'hard'
        }
    ];
}

function getAllQuestions() {
    const defaultQuestions = getDefaultQuestions();
    const customQuestions = getCustomQuestions().map(q => ({...q, type: 'custom'}));
    return [...defaultQuestions, ...customQuestions];
}

function loadQuestionBank() {
    currentTypeFilter = 'all';
    currentDifficultyFilter = 'all';
    displayQuestions('all', 'all');
    updateQuestionStats();
    
    // Reset filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('showAllBtn').classList.add('active');
    document.getElementById('showAllDiffBtn').classList.add('active');
}

function updateQuestionStats() {
    const defaultQuestions = getDefaultQuestions();
    const customQuestions = getCustomQuestions();
    
    // Count by difficulty
    const easyCount = [...defaultQuestions, ...customQuestions].filter(q => (q.difficulty || 'easy') === 'easy').length;
    const mediumCount = [...defaultQuestions, ...customQuestions].filter(q => q.difficulty === 'medium').length;
    const hardCount = [...defaultQuestions, ...customQuestions].filter(q => q.difficulty === 'hard').length;
    
    const defaultCount = defaultQuestions.length;
    const customCount = customQuestions.length;
    const totalCount = defaultCount + customCount;
    
    const questionsList = document.getElementById('questionsList');
    const statsHtml = `
        <div class="stats-bar">
            <span class="stats-item">📊 Total: ${totalCount}</span>
            <span class="stats-item">🔧 Default: ${defaultCount}</span>
            <span class="stats-item">👤 Custom: ${customCount}</span>
            <span class="stats-item">🟢 Easy: ${easyCount}</span>
            <span class="stats-item">🟡 Medium: ${mediumCount}</span>
            <span class="stats-item">🔴 Hard: ${hardCount}</span>
        </div>
    `;
    
    questionsList.innerHTML = statsHtml + questionsList.innerHTML;
}

function displayQuestions(typeFilter = 'all', difficultyFilter = 'all') {
    const questionsList = document.getElementById('questionsList');
    const allQuestions = getAllQuestions();
    
    let filteredQuestions = allQuestions;
    
    // Filter by type
    if (typeFilter === 'default') {
        filteredQuestions = filteredQuestions.filter(q => q.type === 'default');
    } else if (typeFilter === 'custom') {
        filteredQuestions = filteredQuestions.filter(q => q.type === 'custom');
    }
    
    // Filter by difficulty
    if (difficultyFilter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficultyFilter);
    }
    
    if (filteredQuestions.length === 0) {
        questionsList.innerHTML = `
            <div class="empty-state">
                ${typeFilter === 'custom' ? 
                    '📝 No custom questions yet. Click "➕ Add Question" to create your first one!' : 
                    'No questions found for the selected filters.'}
            </div>
        `;
        return;
    }
    
    const questionsHtml = filteredQuestions.map(q => `
        <div class="question-item ${q.type}" data-id="${q.id}">
            <div class="question-text">${q.question}</div>
            <div class="question-answer"><strong>Answer:</strong> ${q.answer}</div>
            <div class="question-explanation"><strong>Explanation:</strong> ${q.explanation || 'No explanation provided'}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <span class="question-type ${q.type}">${q.type}</span>
                    <span class="question-difficulty ${q.difficulty || 'easy'}">${getDifficultyIcon(q.difficulty)} ${q.difficulty || 'easy'}</span>
                </div>
                <div class="question-actions">
                    ${q.type === 'custom' ? `
                        <button class="edit-btn" onclick="editQuestion('${q.id}')">✏️ Edit</button>
                        <button class="delete-btn" onclick="deleteQuestion('${q.id}')">🗑️ Delete</button>
                    ` : `
                        <button class="delete-btn" onclick="deleteDefaultQuestion('${q.id}')">🚫 Remove</button>
                    `}
                </div>
            </div>
        </div>
    `).join('');
    
    questionsList.innerHTML = questionsHtml;
    updateQuestionStats();
}

function getDifficultyIcon(difficulty) {
    switch(difficulty) {
        case 'easy': return '🟢';
        case 'medium': return '🟡';
        case 'hard': return '🔴';
        default: return '🟢';
    }
}

function addCustomQuestion() {
    const questionText = document.getElementById('newQuestion').value.trim();
    const answerText = document.getElementById('newAnswer').value.trim();
    const explanationText = document.getElementById('newExplanation').value.trim();
    const difficultyLevel = document.getElementById('newDifficulty').value;
    
    if (!questionText || !answerText || !difficultyLevel) {
        alert('Please fill in question, answer, and difficulty level!');
        return;
    }
    
    const customQuestions = getCustomQuestions();
    const newQuestion = {
        id: 'custom_' + Date.now(),
        question: questionText,
        answer: answerText,
        explanation: explanationText || 'No explanation provided',
        difficulty: difficultyLevel,
        type: 'custom'
    };
    
    customQuestions.push(newQuestion);
    saveCustomQuestions(customQuestions);
    
    // Clear form and switch to view tab
    clearQuestionForm();
    switchTab('view');
    loadQuestionBank();
    
    alert(`✅ ${getDifficultyIcon(difficultyLevel)} ${difficultyLevel.toUpperCase()} question added successfully!`);
}

function editQuestion(questionId) {
    const customQuestions = getCustomQuestions();
    const question = customQuestions.find(q => q.id === questionId);
    
    if (!question) {
        alert('Question not found!');
        return;
    }
    
    // Fill form with question data
    document.getElementById('newQuestion').value = question.question;
    document.getElementById('newAnswer').value = question.answer;
    document.getElementById('newExplanation').value = question.explanation;
    document.getElementById('newDifficulty').value = question.difficulty || 'easy';
    
    // Switch to add tab and change button text
    const switchTabFunction = () => switchTab('add');
    switchTabFunction();
    
    // Change form to edit mode
    const form = document.getElementById('addQuestionForm');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.textContent = '💾 Update Question';
    submitBtn.onclick = (e) => {
        e.preventDefault();
        updateQuestion(questionId);
    };
}

function updateQuestion(questionId) {
    const questionText = document.getElementById('newQuestion').value.trim();
    const answerText = document.getElementById('newAnswer').value.trim();
    const explanationText = document.getElementById('newExplanation').value.trim();
    const difficultyLevel = document.getElementById('newDifficulty').value;
    
    if (!questionText || !answerText || !difficultyLevel) {
        alert('Please fill in question, answer, and difficulty level!');
        return;
    }
    
    const customQuestions = getCustomQuestions();
    const questionIndex = customQuestions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
        alert('Question not found!');
        return;
    }
    
    // Update the question
    customQuestions[questionIndex] = {
        ...customQuestions[questionIndex],
        question: questionText,
        answer: answerText,
        explanation: explanationText || 'No explanation provided',
        difficulty: difficultyLevel
    };
    
    saveCustomQuestions(customQuestions);
    
    // Reset form
    clearQuestionForm();
    resetFormToAddMode();
    switchTab('view');
    loadQuestionBank();
    
    alert(`✅ ${getDifficultyIcon(difficultyLevel)} Question updated successfully!`);
}

function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    const customQuestions = getCustomQuestions();
    const filteredQuestions = customQuestions.filter(q => q.id !== questionId);
    
    saveCustomQuestions(filteredQuestions);
    loadQuestionBank();
    
    alert('🗑️ Question deleted successfully!');
}

function deleteDefaultQuestion(questionId) {
    if (!confirm('Are you sure you want to remove this default question from the game? You can add it back by refreshing the page.')) {
        return;
    }
    
    // Add to a "disabled default questions" list
    const disabledQuestions = JSON.parse(localStorage.getItem('javaMazeDisabledQuestions') || '[]');
    if (!disabledQuestions.includes(questionId)) {
        disabledQuestions.push(questionId);
        localStorage.setItem('javaMazeDisabledQuestions', JSON.stringify(disabledQuestions));
    }
    
    loadQuestionBank();
    alert('🚫 Default question removed from game!');
}

function clearQuestionForm() {
    document.getElementById('newQuestion').value = '';
    document.getElementById('newAnswer').value = '';
    document.getElementById('newExplanation').value = '';
    document.getElementById('newDifficulty').value = '';
    resetFormToAddMode();
}

function resetFormToAddMode() {
    const form = document.getElementById('addQuestionForm');
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.textContent = '💾 Save Question';
    submitBtn.onclick = null;
}

// Story and Atmospheric System
let audioContext;
let backgroundMusic;
let soundEffects = {};

function initializeAudioSystem() {
    try {
        // Note: In a real implementation, you would load actual audio files
        // For this demo, we'll simulate the audio system
        console.log('Audio system initialized - Ready for atmospheric sounds');
        
        // Simulate background music setup
        backgroundMusic = {
            play: () => console.log('🎵 Playing ambient electronic background music'),
            pause: () => console.log('🎵 Pausing background music'),
            volume: 0.3
        };
        
        // Simulate sound effects
        soundEffects = {
            coinCollect: () => console.log('🔊 Data chirp - Coin collected'),
            correctAnswer: () => console.log('🔊 Success chime - Code compiled successfully'),
            wrongAnswer: () => console.log('🔊 Error beep - Syntax error detected'),
            systemHum: () => console.log('🔊 Subtle system hum'),
            debugMode: () => console.log('🔊 Debug mode activated'),
            codeRain: () => console.log('🔊 Data stream flowing')
        };
        
    } catch (error) {
        console.log('Audio not available, running in silent mode');
    }
}

function showStoryScreen() {
    console.log('🎬 STORY SCREEN - showStoryScreen() called');
    
    const storyScreen = document.getElementById('storyScreen');
    const startScreen = document.getElementById('startScreen');
    
    console.log('🔍 STORY SCREEN - Story screen element:', storyScreen);
    console.log('🔍 STORY SCREEN - Start screen element:', startScreen);
    
    if (!storyScreen) {
        console.error('❌ STORY SCREEN - Story screen element not found!');
        console.log('🔧 STORY SCREEN - Available elements with id:', 
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    // Force display settings
    storyScreen.style.display = 'flex';
    storyScreen.style.position = 'fixed';
    storyScreen.style.top = '0';
    storyScreen.style.left = '0';
    storyScreen.style.width = '100%';
    storyScreen.style.height = '100%';
    storyScreen.style.zIndex = '9999';
    storyScreen.style.background = 'linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e)';
    
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    
    console.log('✅ STORY SCREEN - Display set to:', storyScreen.style.display);
    console.log('✅ STORY SCREEN - Z-index set to:', storyScreen.style.zIndex);
    
    // Verify it's actually visible
    const computedStyle = window.getComputedStyle(storyScreen);
    console.log('🔍 STORY SCREEN - Computed display:', computedStyle.display);
    console.log('🔍 STORY SCREEN - Computed visibility:', computedStyle.visibility);
    console.log('🔍 STORY SCREEN - Computed z-index:', computedStyle.zIndex);
    
    // Start code rain effect
    console.log('🌧️ STORY SCREEN - Starting code rain...');
    startCodeRain();
    
    // Start pig Q dialogue sequence
    startPigQDialogue();
    
    // Play atmospheric sound
    soundEffects.systemHum();
    
    let isFirstPhase = true; // Track if we're in Q dialogue phase
    
    // Listen for space key, mouse clicks, and touch events to continue
    const handleStorySkip = (event) => {
        console.log('⌨️ STORY SCREEN - Event triggered:', event.type, event.key || 'N/A', event.code || 'N/A');
        
        // Handle keyboard events
        if (event.type === 'keydown' && (event.key === ' ' || event.code === 'Space')) {
            handleNextPhase();
            return;
        }
        
        // Handle mouse clicks and touch events
        if (event.type === 'click' || event.type === 'touchstart') {
            handleNextPhase();
            return;
        }
    };
    
    function handleNextPhase() {
        if (isFirstPhase) {
            // Transition to original story without Q
            showOriginalStory();
            isFirstPhase = false;
        } else {
            // Go to start screen
            console.log('✅ STORY SCREEN - Dismissed to start screen');
            hideStoryScreen();
            cleanup();
        }
    }
    
    function showOriginalStory() {
        // Hide Q character
        const characterPortrait = document.querySelector('.character-portrait');
        if (characterPortrait) {
            characterPortrait.style.display = 'none';
        }
        
        // Update dialogue box content
        const speakerName = document.querySelector('.speaker-name');
        const dialogueText = document.getElementById('dialogueText');
        const continuePrompt = document.querySelector('.continue-prompt .blinking-cursor');
        
        if (speakerName) speakerName.style.display = 'none';
        if (dialogueText) {
            dialogueText.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 24px; color: #ff4444; margin-bottom: 10px; text-shadow: 0 0 10px #ff4444;">SYSTEM ERROR</div>
                    <div style="font-size: 16px; color: #ffaa00; margin-bottom: 20px; text-shadow: 0 0 5px #ffaa00;">CRITICAL LOGIC FAILURE DETECTED</div>
                </div>
                <div style="line-height: 1.8;">
                    You are a programmer trapped in a corrupted code maze...<br><br>
                    The system's logic gates have malfunctioned.<br><br>
                    Each pathway requires debugging to unlock.<br><br>
                    Your Java knowledge is the only way out.<br><br>
                    Fix the code. Escape the maze. Restore the system.
                </div>
            `;
        }
        if (continuePrompt) {
            continuePrompt.textContent = '▶ Press Space to initialize debugging protocol...';
        }
        
        console.log('Transitioned to original story without Q');
    }
    
    function cleanup() {
        document.removeEventListener('keydown', handleStorySkip);
        storyScreen.removeEventListener('click', handleStorySkip);
        storyScreen.removeEventListener('touchstart', handleStorySkip);
    }
    
    // Add event listeners for multiple input methods
    document.addEventListener('keydown', handleStorySkip);
    storyScreen.addEventListener('click', handleStorySkip);
    storyScreen.addEventListener('touchstart', handleStorySkip);
    
    console.log('👂 STORY SCREEN - Event listeners added');
    
    // Auto-advance after 20 seconds if no interaction (increased for visual novel)
    setTimeout(() => {
        if (storyScreen.style.display !== 'none') {
            console.log('⏰ STORY SCREEN - Auto-advancing after 20 seconds');
            hideStoryScreen();
            cleanup();
        }
    }, 20000);
    
    console.log('🎬 STORY SCREEN - Setup complete!');
}

function hideStoryScreen() {
    const storyScreen = document.getElementById('storyScreen');
    const startScreen = document.getElementById('startScreen');
    
    console.log('Hiding story screen...');
    
    // Immediate transition for now (we can add fade later if needed)
    storyScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    
    console.log('Start screen now visible');
    
    // Start code rain on start screen
    startStartScreenCodeRain();
    
    // Start background music
    backgroundMusic.play();
}

function startStartScreenCodeRain() {
    const codeRain = document.getElementById('startScreenCodeRain');
    if (!codeRain) return;
    
    const codeSymbols = [
        'class', 'public', 'private', 'void', 'int', 'String', 'new', 'if', 'else', 'for', 'while',
        '{}', '();', '[]', '&&', '||', '==', '!=', '//', '/*', '*/', 'extends', 'implements',
        'try', 'catch', 'throw', 'final', 'static', 'abstract', 'interface', 'package', 'import'
    ];
    
    function createCodeParticle() {
        const particle = document.createElement('div');
        particle.className = 'code-particle';
        particle.textContent = codeSymbols[Math.floor(Math.random() * codeSymbols.length)];
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particle.style.opacity = Math.random() * 0.3 + 0.1; // More subtle on start screen
        particle.style.fontSize = (Math.random() * 6 + 8) + 'px'; // Smaller particles
        
        codeRain.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 5000);
    }
    
    // Create particles at intervals - less frequent for start screen
    const rainInterval = setInterval(() => {
        if (document.getElementById('startScreen').style.display !== 'none') {
            createCodeParticle();
        } else {
            clearInterval(rainInterval);
        }
    }, 300);
}

function startCodeRain() {
    const codeRain = document.querySelector('.code-rain');
    const codeSymbols = [
        'class', 'public', 'private', 'void', 'int', 'String', 'new', 'if', 'else', 'for', 'while',
        '{}', '();', '[]', '&&', '||', '==', '!=', '//', '/*', '*/', 'extends', 'implements',
        'try', 'catch', 'throw', 'final', 'static', 'abstract', 'interface', 'package', 'import'
    ];
    
    soundEffects.codeRain();
    
    function createCodeParticle() {
        const particle = document.createElement('div');
        particle.className = 'code-particle';
        particle.textContent = codeSymbols[Math.floor(Math.random() * codeSymbols.length)];
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particle.style.opacity = Math.random() * 0.7 + 0.3;
        particle.style.fontSize = (Math.random() * 8 + 10) + 'px';
        
        codeRain.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 5000);
    }
    
    // Create particles at intervals
    const rainInterval = setInterval(() => {
        if (document.getElementById('storyScreen').style.display !== 'none') {
            createCodeParticle();
        } else {
            clearInterval(rainInterval);
        }
    }, 200);
}

function showDebugPopup(message, type = 'info') {
    const popup = document.createElement('div');
    popup.className = `debug-popup ${type === 'success' ? 'success-feedback' : type === 'error' ? 'error-feedback' : ''}`;
    popup.textContent = message;
    
    document.body.appendChild(popup);
    
    // Remove popup after 3 seconds
    setTimeout(() => {
        if (popup.parentNode) {
            popup.style.transition = 'opacity 0.5s ease-out';
            popup.style.opacity = '0';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
            }, 500);
        }
    }, 3000);
}

// Enhanced question integration with story
function showStoryQuestion(question) {
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
    
    // After a brief delay, show the actual question
    setTimeout(() => {
        const userAnswer = prompt(`[DEBUG MODE ACTIVATED]\n\n${question.question}`);
        this.handleQuestionAnswer(question, userAnswer);
    }, 1500);
}

function handleQuestionAnswer(question, userAnswer) {
    if (question.checkAnswer(userAnswer)) {
        showDebugPopup('✅ CODE COMPILED SUCCESSFULLY!', 'success');
        soundEffects.correctAnswer();
    } else {
        showDebugPopup(`❌ SYNTAX ERROR: ${question.answer}`, 'error');
        soundEffects.wrongAnswer();
    }
}

// 小猪Q的对话系统
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
            
            // 添加打字机效果
            dialogueElement.style.opacity = '0';
            setTimeout(() => {
                dialogueElement.style.opacity = '1';
            }, 100);
            
            messageIndex++;
            
            // 每7秒更换一次消息（增加了间隔时间）
            if (messageIndex < pigMessages.length) {
                setTimeout(updateDialogue, 7000);
            } else {
                // Q对话结束，准备显示最终提示
                setTimeout(() => {
                    dialogueElement.textContent = "Now let me show you the full picture of your situation...";
                    document.querySelector('.continue-prompt .blinking-cursor').textContent = '▶ Tap to continue';
                }, 3000);
            }
        }
    }
    
    // 开始Q的对话（增加初始延迟）
    setTimeout(updateDialogue, 1000);
} 