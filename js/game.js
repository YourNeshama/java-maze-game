// Import questions module
import { QUESTIONS, getQuestionsByDifficulty, getRandomQuestion } from './questions.js';

const WALL = 1;
const PATH = 0;
const CORRECT_PATH = 2;
const DEAD_END = 3;

// Add debug logging
console.log('Game script loaded');

// Global game instance
let currentGame = null;

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
        console.log('Creating new MazeGame with difficulty:', difficulty);
        this.difficulty = difficulty;
        
        // Set maze size based on difficulty
        switch(difficulty) {
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
        
        // 添加已回答问题的跟踪
        this.answeredQuestions = new Set();
        this.allQuestions = getQuestionsByDifficulty(difficulty);
        
        // Initialize canvas
        this.canvas = document.getElementById('mazeCanvas');
        console.log('Canvas element:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // 固定单元格大小为40像素
        this.cellSize = 40;
        this.canvas.width = this.size * this.cellSize;
        this.canvas.height = this.size * this.cellSize;

        // Initialize player position
        this.playerX = 0;
        this.playerY = 0;

        // 添加问题锁定状态
        this.isQuestionActive = false;

        this.initializeMaze();
        
        // Calculate remaining steps to goal
        this.stepsRemaining = this.calculateRemainingSteps();
        this.updateStepCounter();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('MazeGame initialization complete');
    }

    initializeAllQuestions() {
        const questions = this.initializeQuestions();
        const deadEndQuestions = this.initializeDeadEndQuestions();
        
        // Store questions based on difficulty
        this.questions = questions;
        this.deadEndQuestions = deadEndQuestions;
        
        // Verify questions are properly loaded
        if (this.questions.length === 0) {
            console.error('No questions loaded for difficulty:', this.difficulty);
        }
        if (this.deadEndQuestions.length === 0) {
            console.error('No dead end questions loaded for difficulty:', this.difficulty);
        }
    }

    findShortestPath() {
        const visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
        const queue = [{x: 0, y: 0, steps: 0}];
        visited[0][0] = true;

        while (queue.length > 0) {
            const {x, y, steps} = queue.shift();
            
            if (x === this.size - 1 && y === this.size - 1) {
                return steps;
            }

            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < this.size && 
                    newY >= 0 && newY < this.size && 
                    !visited[newY][newX] && 
                    this.maze[newY][newX] !== WALL) {
                    visited[newY][newX] = true;
                    queue.push({x: newX, y: newY, steps: steps + 1});
                }
            }
        }
        return Infinity;
    }

    generateMaze(x, y) {
        this.maze[y][x] = PATH;

        // Define possible directions
        const directions = [
            [0, -2], // Up
            [2, 0],  // Right
            [0, 2],  // Down
            [-2, 0]  // Left
        ];

        // Shuffle directions
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }

        // Try each direction
        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX >= 0 && newX < this.size && 
                newY >= 0 && newY < this.size && 
                this.maze[newY][newX] === WALL) {
                
                // Create path between cells
                this.maze[y + dy/2][x + dx/2] = PATH;
                this.generateMaze(newX, newY);
            }
        }
    }

    // Add new method to ensure minimum path length
    ensureMinimumPathLength() {
        let currentPathLength = this.findShortestPath();
        const targetLength = {
            'easy': 5,
            'medium': 10,
            'hard': 15
        }[this.difficulty];

        // If path is too short, regenerate maze
        if (currentPathLength < targetLength) {
            this.maze = Array(this.size).fill().map(() => Array(this.size).fill(WALL));
            this.generateMaze(0, 0);
            this.maze[this.size - 1][this.size - 1] = PATH;
            return this.ensureMinimumPathLength(); // Recursively try again
        }
        return true;
    }

    initializeMaze() {
        // Initialize maze with walls
        this.maze = Array(this.size).fill().map(() => Array(this.size).fill(WALL));
        
        // Create paths using recursive backtracking
        this.generateMaze(0, 0);
        
        // Ensure there's a path to the end
        this.maze[this.size - 1][this.size - 1] = PATH;
        
        // Ensure minimum path length
        this.ensureMinimumPathLength();
        
        // Draw the initial state
        this.draw();
    }

    addDeadEnds() {
        // 增加死胡同的数量，使其与问题数量相匹配
        const deadEndCount = Math.min(8, Math.floor(this.size * 1.5)); // 增加到8个死胡同
        let added = 0;
        
        // Priority areas for dead ends (near start and end)
        const priorityAreas = [
            {x: 1, y: 0},  // Near start
            {x: 0, y: 1},  // Near start
            {x: this.size-2, y: this.size-1},  // Near end
            {x: this.size-1, y: this.size-2}   // Near end
        ];

        // First try to add dead ends in priority areas
        for (const pos of priorityAreas) {
            if (this.maze[pos.y][pos.x] === PATH && this.countPathNeighbors(pos.x, pos.y) === 1) {
                this.maze[pos.y][pos.x] = DEAD_END;
                added++;
            }
        }

        // Then add remaining dead ends randomly
        let attempts = 0;
        while (added < deadEndCount && attempts < 100) { // 增加尝试次数
            const x = Math.floor(Math.random() * this.size);
            const y = Math.floor(Math.random() * this.size);

            // Don't place dead ends at start, end, or adjacent to other dead ends
            if ((x === 0 && y === 0) || 
                (x === this.size-1 && y === this.size-1) ||
                this.hasAdjacentDeadEnd(x, y)) {
                attempts++;
                continue;
            }

            if (this.maze[y][x] === PATH && this.countPathNeighbors(x, y) === 1) {
                this.maze[y][x] = DEAD_END;
                added++;
            }
            attempts++;
        }
    }

    hasAdjacentDeadEnd(x, y) {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size) {
                if (this.maze[newY][newX] === DEAD_END) {
                    return true;
                }
            }
        }
        return false;
    }

    countPathNeighbors(x, y) {
        let count = 0;
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;
            if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size) {
                if (this.maze[newY][newX] === PATH) count++;
            }
        }
        return count;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.maze[y][x];
                
                if (cell === WALL) {
                    this.ctx.fillStyle = '#666';
                } else if (cell === PATH) {
                        this.ctx.fillStyle = '#fff';
                } else if (cell === CORRECT_PATH) {
                    this.ctx.fillStyle = '#afa';
                } else if (cell === DEAD_END) {
                    this.ctx.fillStyle = '#faa';
                }
                
                this.ctx.fillRect(
                    x * this.cellSize,
                    y * this.cellSize,
                    this.cellSize,
                    this.cellSize
                );
                
                // Draw cell border
                this.ctx.strokeStyle = '#000';
                this.ctx.strokeRect(
                    x * this.cellSize,
                    y * this.cellSize,
                    this.cellSize,
                    this.cellSize
                );
            }
        }
        
        // Draw player
        this.ctx.fillStyle = '#00f';
        this.ctx.beginPath();
        this.ctx.arc(
            (this.playerX + 0.5) * this.cellSize,
            (this.playerY + 0.5) * this.cellSize,
            this.cellSize * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw goal as a square
        this.ctx.fillStyle = '#0f0';
        const goalSize = this.cellSize * 0.8; // Make the square slightly smaller than the cell
        const goalX = (this.size - 1) * this.cellSize + (this.cellSize - goalSize) / 2;
        const goalY = (this.size - 1) * this.cellSize + (this.cellSize - goalSize) / 2;
        this.ctx.fillRect(goalX, goalY, goalSize, goalSize);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...'); // Debug log
        
        // 移除之前的事件监听器
        document.removeEventListener('keydown', this._handleKeyDown);
        
        // 添加移动冷却时间变量
        this.lastMoveTime = 0;
        const MOVE_COOLDOWN = 500; // 500ms冷却时间
        
        // 创建绑定到当前实例的事件处理函数
        this._handleKeyDown = (e) => {
            e.preventDefault(); // 防止按键滚动页面
            
            // 如果当前有问题正在显示，忽略移动
            if (this.isQuestionActive) {
                return;
            }
            
            // 检查是否在冷却时间内
            const currentTime = Date.now();
            if (currentTime - this.lastMoveTime < MOVE_COOLDOWN) {
                return; // 如果在冷却时间内,忽略这次按键
            }
            
            console.log('Key pressed:', e.key); // Debug log
            
            let dx = 0;
            let dy = 0;

            switch(e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    dy = -1;
                    break;
                case 'arrowdown':
                case 's':
                    dy = 1;
                    break;
                case 'arrowleft':
                case 'a':
                    dx = -1;
                    break;
                case 'arrowright':
                case 'd':
                    dx = 1;
                    break;
                default:
                    return; // Ignore other keys
            }

            if (dx !== 0 || dy !== 0) {
                console.log('Moving:', {dx, dy}); // Debug log
                this.lastMoveTime = currentTime; // 更新最后移动时间
                this.tryMove(dx, dy);
            }
        };

        // 添加新的事件监听器到document
        document.addEventListener('keydown', this._handleKeyDown);

        // Touch/click controls也需要添加冷却时间
        this.canvas.addEventListener('click', (e) => {
            // 如果当前有问题正在显示，忽略点击
            if (this.isQuestionActive) {
                return;
            }
            
            const currentTime = Date.now();
            if (currentTime - this.lastMoveTime < MOVE_COOLDOWN) {
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate cell coordinates
            const cellX = Math.floor(x / this.cellSize);
            const cellY = Math.floor(y / this.cellSize);
            
            // Calculate direction based on clicked cell relative to player
            const dx = Math.sign(cellX - this.playerX);
            const dy = Math.sign(cellY - this.playerY);
            
            // Only move if clicked adjacent cell
            if (Math.abs(dx) + Math.abs(dy) === 1) {
                this.lastMoveTime = currentTime;
                this.tryMove(dx, dy);
            }
        });

        // Add touch controls with cooldown
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            // 如果当前有问题正在显示，忽略触摸
            if (this.isQuestionActive) {
                return;
            }
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault(); // 防止页面滚动
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            // 防止页面滚动
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            // 如果当前有问题正在显示，忽略触摸
            if (this.isQuestionActive) {
                return;
            }
            
            const currentTime = Date.now();
            if (currentTime - this.lastMoveTime < MOVE_COOLDOWN) {
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // 设置最小滑动距离阈值，防止误触
            const minSwipeDistance = 30;
            
            // 只有当滑动距离超过阈值时才触发移动
            if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
                // 确定主要的滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                    // 水平滑动
                    this.lastMoveTime = currentTime;
                this.tryMove(Math.sign(dx), 0);
            } else {
                    // 垂直滑动
                    this.lastMoveTime = currentTime;
                this.tryMove(0, Math.sign(dy));
                }
            }
            
            e.preventDefault();
        }, { passive: false });

        // 添加移动设备的视觉反馈
        this.canvas.addEventListener('touchstart', (e) => {
            this.canvas.style.opacity = '0.7';
        });

        this.canvas.addEventListener('touchend', (e) => {
            this.canvas.style.opacity = '1';
        });

        // 添加移动设备的方向控制按钮
        if ('ontouchstart' in window) {
            const controlsContainer = document.createElement('div');
            controlsContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                z-index: 1000;
            `;

            const createButton = (text, dx, dy) => {
                const button = document.createElement('button');
                button.textContent = text;
                button.style.cssText = `
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.8);
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 20px;
                    touch-action: manipulation;
                `;
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!this.isQuestionActive) {
                        const currentTime = Date.now();
                        if (currentTime - this.lastMoveTime >= MOVE_COOLDOWN) {
                            this.lastMoveTime = currentTime;
                            this.tryMove(dx, dy);
                        }
                    }
                });
                return button;
            };

            // 创建方向按钮
            const upButton = createButton('↑', 0, -1);
            const leftButton = createButton('←', -1, 0);
            const downButton = createButton('↓', 0, 1);
            const rightButton = createButton('→', 1, 0);

            // 布局方向按钮
            controlsContainer.appendChild(document.createElement('div')); // 空白格
            controlsContainer.appendChild(upButton);
            controlsContainer.appendChild(document.createElement('div')); // 空白格
            controlsContainer.appendChild(leftButton);
            controlsContainer.appendChild(document.createElement('div')); // 空白格
            controlsContainer.appendChild(rightButton);
            controlsContainer.appendChild(document.createElement('div')); // 空白格
            controlsContainer.appendChild(downButton);
            controlsContainer.appendChild(document.createElement('div')); // 空白格

            document.body.appendChild(controlsContainer);
        }

        // Add regenerate maze button listener
        const regenerateBtn = document.getElementById('regenerateMazeBtn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.initializeMaze();
                this.playerX = 0;
                this.playerY = 0;
                this.draw();
            });
        }

        console.log('Event listeners setup complete'); // Debug log
    }

    tryMove(dx, dy) {
        // If there's an active question, don't allow movement
        if (this.isQuestionActive) {
            return;
        }
        
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        console.log('Attempting to move to:', {newX, newY}); // Debug log

        if (newX >= 0 && newX < this.size && 
            newY >= 0 && newY < this.size && 
            this.maze[newY][newX] !== WALL) {
            
            console.log('Valid move, getting question...'); // Debug log
            
            // Set question lock state
            this.isQuestionActive = true;
            
            // Save target position
            this._pendingMove = {x: newX, y: newY};
            
            // Get a random question
            const currentQuestion = getRandomQuestion(this.difficulty);
            
            if (!currentQuestion) {
                console.error('No questions available for difficulty:', this.difficulty);
                alert('Error: No questions available for this difficulty level');
                this.isQuestionActive = false;
                return;
            }
            
            console.log('Selected question:', currentQuestion); // Debug log
            
            // Create dialog with question and options
            const dialog = document.createElement('div');
            dialog.className = 'question-dialog';
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 90%;
                width: ${window.innerWidth > 768 ? '500px' : '85%'};
                max-height: 80vh;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                font-family: Arial, sans-serif;
            `;

            // Add question text
            const questionText = document.createElement('p');
            questionText.innerHTML = currentQuestion.question;
            questionText.style.cssText = `
                margin-bottom: 20px;
                white-space: pre-wrap;
                font-size: ${window.innerWidth > 768 ? '16px' : '14px'};
                line-height: 1.5;
                color: #333;
            `;
            dialog.appendChild(questionText);

            // Add options container
            const optionsContainer = document.createElement('div');
            optionsContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: ${window.innerWidth > 768 ? '10px' : '15px'};
                margin-bottom: 15px;
                color: #333;
            `;

            // Add options as buttons
            currentQuestion.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.textContent = `${index + 1}) ${option}`;
                button.style.cssText = `
                    padding: ${window.innerWidth > 768 ? '10px 15px' : '15px'};
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: #f8f9fa;
                    cursor: pointer;
                    text-align: left;
                    font-size: ${window.innerWidth > 768 ? '14px' : '16px'};
                    transition: all 0.2s;
                    width: 100%;
                    color: #333;
                    min-height: ${window.innerWidth > 768 ? '44px' : '48px'};
                    display: flex;
                    align-items: center;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                `;

                // 添加触摸反馈效果
                button.addEventListener('touchstart', () => {
                    button.style.background = '#e9ecef';
                });
                button.addEventListener('touchend', () => {
                    button.style.background = '#f8f9fa';
                });

                button.addEventListener('click', () => {
                    const isCorrect = index === currentQuestion.correctAnswer;
                    
                    // 创建结果对话框
                    const resultDialog = document.createElement('div');
                    resultDialog.style.cssText = dialog.style.cssText;
                    resultDialog.style.background = isCorrect ? '#e8f5e9' : '#ffebee';
                    
                    const resultText = document.createElement('p');
                    resultText.style.cssText = `
                        margin-bottom: 20px;
                        font-size: ${window.innerWidth > 768 ? '16px' : '14px'};
                        color: ${isCorrect ? '#2e7d32' : '#c62828'};
                        text-align: center;
                        font-weight: bold;
                    `;
                    resultText.textContent = isCorrect ? "Correct!" : "Wrong!";
                    
                    const explanationText = document.createElement('p');
                    explanationText.style.cssText = `
                        margin-bottom: 20px;
                        font-size: ${window.innerWidth > 768 ? '14px' : '13px'};
                        color: #333;
                        line-height: 1.5;
                    `;
                    explanationText.textContent = currentQuestion.explanation;
                    
                    const continueButton = document.createElement('button');
                    continueButton.textContent = "Continue";
                    continueButton.style.cssText = `
                        width: 100%;
                        padding: 12px;
                        background: ${isCorrect ? '#4caf50' : '#f44336'};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                        touch-action: manipulation;
                        -webkit-tap-highlight-color: transparent;
                    `;
                    
                    continueButton.addEventListener('click', () => {
                        resultDialog.remove();
                        if (isCorrect) {
                            // Update position immediately
                            const updatedX = newX;
                            const updatedY = newY;
                            
                            // Update player position
                            this.playerX = updatedX;
                            this.playerY = updatedY;
                            
                            // Force redraw
                            this.draw();
                            
                            // Update other states
                            this.stepsRemaining = this.calculateRemainingSteps();
                            this.updateStepCounter();
                            
                            // Check if reached the goal
                            if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
                                setTimeout(() => {
                                    alert("Congratulations! You've completed the maze!");
                                    document.getElementById('newGameBtn').click();
                                }, 100);
                            }
                        } else {
                            if (this.playerX === 0 && this.playerY === 0) {
                                alert("You're at the starting point. Try again!");
                                this.draw();
                            } else {
                                const nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                                if (nearestDeadEnd) {
                                    this.playerX = nearestDeadEnd.x;
                                    this.playerY = nearestDeadEnd.y;
                                    this.stepsRemaining = this.calculateRemainingSteps();
                                    this.updateStepCounter();
                                    this.draw();
                                }
                            }
                        }
                        // Reset question lock state
                        this.isQuestionActive = false;
                    });
                    
                    resultDialog.appendChild(resultText);
                    resultDialog.appendChild(explanationText);
                    resultDialog.appendChild(continueButton);
                    
                    dialog.remove();
                    document.body.appendChild(resultDialog);
                });
                
                optionsContainer.appendChild(button);
            });

            dialog.appendChild(optionsContainer);
            document.body.appendChild(dialog);
        } else {
            console.log('Invalid move - wall or out of bounds'); // Debug log
        }
    }

    findNearestDeadEnd(x, y) {
        const visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
        const queue = [{x, y, steps: 0}];
        visited[y][x] = true;
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check if current position is a dead end
            if (this.isDeadEnd(current.x, current.y)) {
                return current;
            }
            
            // Try all four directions
            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newX = current.x + dx;
                const newY = current.y + dy;
                
                if (newX >= 0 && newX < this.size && 
                    newY >= 0 && newY < this.size && 
                    !visited[newY][newX] && 
                    this.maze[newY][newX] !== WALL) {
                    visited[newY][newX] = true;
                    queue.push({x: newX, y: newY, steps: current.steps + 1});
                }
            }
        }
        
        return null;
    }

    isDeadEnd(x, y) {
        if (this.maze[y][x] === WALL) return false;
        
        let wallCount = 0;
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        
        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;
            
            if (newX < 0 || newX >= this.size || 
                newY < 0 || newY >= this.size || 
                this.maze[newY][newX] === WALL) {
                wallCount++;
            }
        }
        
        return wallCount >= 3;
    }

    calculateRemainingSteps() {
        // Calculate shortest path from current position to goal
        const visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
        const queue = [{x: this.playerX, y: this.playerY, steps: 0}];
        visited[this.playerY][this.playerX] = true;

        while (queue.length > 0) {
            const {x, y, steps} = queue.shift();
            
            if (x === this.size - 1 && y === this.size - 1) {
                return steps;
            }

            const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < this.size && 
                    newY >= 0 && newY < this.size && 
                    !visited[newY][newX] && 
                    this.maze[newY][newX] !== WALL) {
                    visited[newY][newX] = true;
                    queue.push({x: newX, y: newY, steps: steps + 1});
                }
            }
        }
        return Infinity;
    }

    updateStepCounter() {
        const counter = document.getElementById('stepCounter');
        if (counter) {
            counter.textContent = `Steps to goal: ${this.stepsRemaining}`;
        }
    }

    initializeQuestions() {
        console.log('Initializing questions for difficulty:', this.difficulty);
        
        // Questions organized by difficulty
        const easyQuestions = [
            new Question(
                "What is the output of: int x = 5 + 3; System.out.println(x);",
                "8",
                "Basic arithmetic operation: 5 + 3 equals 8"
            ),
            new Question(
                "Which keyword is used to declare a constant in Java?",
                "final",
                "The 'final' keyword is used to declare constants in Java"
            ),
            new Question(
                "What is the correct way to declare a String variable?",
                "String name;",
                "String is the correct class name for text in Java, and it starts with a capital S"
            ),
            new Question(
                "What is the output of: System.out.println(\"Hello\" + 123);",
                "Hello123",
                "String concatenation combines the string with the number"
            ),
            new Question(
                "Which loop is used when you know how many iterations you need?",
                "for",
                "for loops are best when you know the number of iterations in advance"
            )
        ];

        const mediumQuestions = [
            new Question(
                "What is the output of:\nint[] arr = {1, 2, 3};\nSystem.out.println(arr[1]);",
                "2",
                "Array indices start at 0, so arr[1] is the second element"
            ),
            new Question(
                "What happens when you divide two integers: 7/2",
                "3",
                "Integer division truncates the decimal part"
            ),
            new Question(
                "Which interface allows a class to be used in a for-each loop?",
                "Iterable",
                "The Iterable interface is required for for-each loop functionality"
            ),
            new Question(
                "What is the difference between ArrayList and LinkedList?",
                "ArrayList uses array, LinkedList uses nodes",
                "ArrayList is backed by an array, while LinkedList uses doubly-linked nodes"
            ),
            new Question(
                "Write a method signature for a static method named 'sum' that takes two integers and returns their sum:",
                "public static int sum(int a, int b)",
                "Static methods belong to the class, not instances, and need return type and parameters specified"
            )
        ];

        const hardQuestions = [
            new Question(
                "What is the output of:\ntry { throw new Exception(); }\ncatch(Exception e) { System.out.print(\"1\"); }\nfinally { System.out.print(\"2\"); }",
                "12",
                "catch block executes when exception is thrown, finally always executes"
            ),
            new Question(
                "What is the time complexity of binary search?",
                "O(log n)",
                "Binary search halves the search space in each step"
            ),
            new Question(
                "Write a bubble sort algorithm in Java (basic structure):",
                "for(int i=0;i<n-1;i++)for(int j=0;j<n-i-1;j++)if(arr[j]>arr[j+1])swap(arr[j],arr[j+1]);",
                "Bubble sort uses nested loops to repeatedly swap adjacent elements"
            ),
            new Question(
                "What is the purpose of the volatile keyword in Java?",
                "Thread visibility",
                "volatile ensures that variable updates are immediately visible to other threads"
            ),
            new Question(
                "Explain the diamond problem in multiple inheritance:",
                "When a class inherits from two classes with common ancestor",
                "The diamond problem occurs in multiple inheritance when a class inherits from two classes that have a common ancestor"
            ),
            new Question(
                "What is the difference between Runnable and Callable?",
                "Callable can return value and throw exceptions",
                "Runnable's run() returns void, while Callable's call() can return values and throw checked exceptions"
            ),
            new Question(
                "Explain how HashMap works internally:",
                "Uses buckets with linked lists/trees for collision",
                "HashMap uses an array of buckets, each containing a linked list or tree of entries with the same hash"
            ),
            new Question(
                "Write a deadlock prevention condition:",
                "Acquire locks in fixed order",
                "Acquiring locks in a consistent order prevents circular wait condition"
            )
        ];

        // Select questions based on difficulty
        let selectedQuestions;
        switch(this.difficulty) {
            case 'easy':
                selectedQuestions = easyQuestions;
                break;
            case 'medium':
                selectedQuestions = [...easyQuestions, ...mediumQuestions];
                break;
            case 'hard':
                selectedQuestions = [...mediumQuestions, ...hardQuestions];
                break;
            default:
                console.error('Invalid difficulty:', this.difficulty);
                selectedQuestions = easyQuestions;
        }

        console.log(`Selected ${selectedQuestions.length} questions for ${this.difficulty} mode`);
        return selectedQuestions;
    }

    initializeDeadEndQuestions() {
        const easyDeadEndQuestions = [
            new Question(
                "What does JVM stand for?",
                "Java Virtual Machine",
                "JVM (Java Virtual Machine) is the runtime environment for executing Java bytecode"
            ),
            new Question(
                "What is the entry point of a Java program?",
                "main",
                "The main() method is the entry point of every Java program"
            )
        ];

        const mediumDeadEndQuestions = [
            new Question(
                "What is garbage collection in Java?",
                "Automatic memory management",
                "Garbage collection automatically manages memory by removing unused objects"
            ),
            new Question(
                "What is the difference between == and .equals()?",
                "== compares references, equals compares content",
                "== compares object references, while .equals() compares the actual content"
            ),
            new Question(
                "Explain method overloading:",
                "Same name different parameters",
                "Method overloading allows multiple methods with the same name but different parameter lists"
            )
        ];

        const hardDeadEndQuestions = [
            new Question(
                "Explain the Singleton pattern:",
                "Ensures only one instance exists",
                "Singleton pattern restricts instantiation of a class to one single instance"
            ),
            new Question(
                "What is the difference between abstract class and interface in Java 8+?",
                "Abstract class can have state",
                "Abstract classes can have state and constructors, interfaces can have default methods but no state"
            ),
            new Question(
                "Explain the producer-consumer problem:",
                "Synchronization between threads producing and consuming data",
                "Producer-consumer is a classic synchronization problem where threads share a fixed-size buffer"
            ),
            new Question(
                "What is the purpose of the transient keyword?",
                "Skip serialization",
                "transient marks fields that should not be serialized when the object is converted to a byte stream"
            )
        ];

        // Return dead end questions based on difficulty
        switch(this.difficulty) {
            case 'easy':
                return easyDeadEndQuestions;
            case 'medium':
                return [...easyDeadEndQuestions, ...mediumDeadEndQuestions];
            case 'hard':
                return [...mediumDeadEndQuestions, ...hardDeadEndQuestions];
            default:
                return easyDeadEndQuestions;
        }
    }

    displayQuestionsForDebugging() {
        // Create debug info container
        const debugDiv = document.createElement('div');
        debugDiv.style.margin = '20px';
        debugDiv.style.padding = '20px';
        debugDiv.style.backgroundColor = '#f8f8f8';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.maxWidth = '800px';
        debugDiv.style.margin = '20px auto';

        // Add title
        const title = document.createElement('h3');
        title.textContent = `Questions for ${this.difficulty.toUpperCase()} mode:`;
        debugDiv.appendChild(title);

        // Add regular questions
        const questionsList = document.createElement('ul');
        this.questions.forEach((q, index) => {
            const li = document.createElement('li');
            li.textContent = `Question ${index + 1}: ${q.question}`;
            questionsList.appendChild(li);
        });
        debugDiv.appendChild(questionsList);

        // Add dead end questions
        const deadEndTitle = document.createElement('h3');
        deadEndTitle.textContent = 'Dead End Questions:';
        debugDiv.appendChild(deadEndTitle);

        const deadEndList = document.createElement('ul');
        this.deadEndQuestions.forEach((q, index) => {
            const li = document.createElement('li');
            li.textContent = `Question ${index + 1}: ${q.question}`;
            deadEndList.appendChild(li);
        });
        debugDiv.appendChild(deadEndList);

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Hide Debug Info';
        closeButton.onclick = () => debugDiv.style.display = 'none';
        debugDiv.appendChild(closeButton);

        // Insert debug info after game container
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.parentNode.insertBefore(debugDiv, gameContainer.nextSibling);
    }

    getRandomQuestion() {
        // 过滤掉已回答的问题
        const availableQuestions = this.allQuestions.filter(q => 
            !this.answeredQuestions.has(q.question)
        );

        // 如果所有问题都回答过了，重置已回答问题集合
        if (availableQuestions.length === 0) {
            this.answeredQuestions.clear();
            return this.getRandomQuestion();
        }

        // 随机选择一个未回答的问题
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const question = availableQuestions[randomIndex];
        
        // 将问题标记为已回答
        this.answeredQuestions.add(question.question);
        
        return question;
    }
}

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    console.log('Start screen:', startScreen);
    console.log('Game container:', gameContainer);

    // Show start screen, hide game container initially
    if (startScreen && gameContainer) {
        startScreen.style.display = 'flex';
        gameContainer.style.display = 'none';

        function startGame(difficulty) {
            console.log('Starting game with difficulty:', difficulty);
            startScreen.style.display = 'none';
            gameContainer.style.display = 'block';
            if (currentGame) {
                // Clean up old event listeners
                document.removeEventListener('keydown', currentGame._handleKeyDown);
            }
            currentGame = new MazeGame(difficulty);
            currentGame.setupEventListeners(); // 确保设置事件监听器
        }

        // Add click event listeners to difficulty buttons
        const easyBtn = document.getElementById('easyBtn');
        const mediumBtn = document.getElementById('mediumBtn');
        const hardBtn = document.getElementById('hardBtn');
        
        console.log('Difficulty buttons:', { easyBtn, mediumBtn, hardBtn });

        if (easyBtn) easyBtn.addEventListener('click', () => startGame('easy'));
        if (mediumBtn) mediumBtn.addEventListener('click', () => startGame('medium'));
        if (hardBtn) hardBtn.addEventListener('click', () => startGame('hard'));

        // Add click event listener to new game button
        const newGameBtn = document.getElementById('newGameBtn');
        console.log('New game button:', newGameBtn);
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => {
                console.log('New game button clicked');
                startScreen.style.display = 'flex';
                gameContainer.style.display = 'none';
                if (currentGame) {
                    // Clean up event listeners
                    document.removeEventListener('keydown', currentGame._handleKeyDown);
                    currentGame = null;
                }
            });
        }

        console.log('All event listeners set up');
    } else {
        console.error('Could not find required DOM elements');
    }
}); 

function showQuestion(question) {
    if (!question) return;
    
    const optionsHtml = question.options.map((option, index) => 
        `<button onclick="checkAnswer(${index})" class="option-button">${index + 1}) ${option}</button>`
    ).join('');

    const questionDialog = `
        <div class="question-dialog">
            <div class="question-content">
                <p class="question-text">${question.question}</p>
                <div class="options-container">
                    ${optionsHtml}
                </div>
            </div>
        </div>
    `;

    // Add styles if they don't exist
    if (!document.getElementById('questionStyles')) {
        const styles = document.createElement('style');
        styles.id = 'questionStyles';
        styles.textContent = `
            .question-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 1000;
                max-width: 90%;
                width: 500px;
            }
            .question-content {
                text-align: left;
            }
            .question-text {
                margin-bottom: 20px;
                white-space: pre-wrap;
                font-size: 16px;
            }
            .options-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .option-button {
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f8f9fa;
                cursor: pointer;
                text-align: left;
                font-size: 14px;
                transition: all 0.2s;
            }
            .option-button:hover {
                background: #e9ecef;
            }
        `;
        document.head.appendChild(styles);
    }

    // Create and show dialog
    const dialog = document.createElement('div');
    dialog.innerHTML = questionDialog;
    document.body.appendChild(dialog.firstElementChild);
}

// Function to start a new game
function startNewGame(difficulty) {
    console.log('Starting new game with difficulty:', difficulty);
    if (currentGame) {
        // Clean up old event listeners
        document.removeEventListener('keydown', currentGame._handleKeyDown);
    }
    currentGame = new MazeGame(difficulty);
}

// Export the startNewGame function
export { startNewGame }; 