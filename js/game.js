const WALL = 1;
const PATH = 0;
const CORRECT_PATH = 2;
const DEAD_END = 3;

// Add debug logging
console.log('Game script loaded');

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
        this.initializeGameSettings();
        this.questions = this.initializeQuestions();
        this.deadEndQuestions = this.initializeDeadEndQuestions();
        this.playerPath = [];
        this.moveQueue = [];
        this.isMoving = false;
        this.inDeadEnd = false;
        this.minPathLength = 0;

        // Initialize canvas
        this.canvas = document.getElementById('mazeCanvas');
        console.log('Canvas element:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = Math.min(40, 600 / this.size);
        this.canvas.width = this.size * this.cellSize;
        this.canvas.height = this.size * this.cellSize;

        this.initializeMaze();
        this.setupEventListeners();
        this.updateQuestionCounter();
        console.log('MazeGame initialization complete');
    }

    initializeGameSettings() {
        switch(this.difficulty) {
            case 'easy':
                this.size = 5;
                this.questionCount = 5;
                break;
            case 'medium':
                this.size = 7;
                this.questionCount = 8;
                break;
            case 'hard':
                this.size = 9;
                this.questionCount = 12;
                break;
            default:
                this.size = 5;
                this.questionCount = 5;
        }
        this.questionsRemaining = this.questionCount;
        this.playerX = 0;
        this.playerY = 0;
    }

    initializeMaze() {
        // Create empty maze
        this.maze = Array(this.size).fill().map(() => Array(this.size).fill(WALL));
        this.visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
        
        // Generate maze using recursive backtracking
        this.generateMaze(0, 0);
        
        // Set start and end points
        this.maze[0][0] = PATH;
        this.maze[this.size-1][this.size-1] = PATH;
        
        // Add some dead ends
        this.addDeadEnds();
        
        this.draw();
    }

    generateMaze(x, y) {
        this.visited[y][x] = true;
        this.maze[y][x] = PATH;

        // Define possible directions: [dx, dy]
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

            if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size && !this.visited[newY][newX]) {
                // Carve path by making the wall between current and new cell a path
                this.maze[y + dy/2][x + dx/2] = PATH;
                this.generateMaze(newX, newY);
            }
        }
    }

    addDeadEnds() {
        const deadEndCount = Math.floor(this.size / 2);
        let added = 0;

        while (added < deadEndCount) {
            const x = Math.floor(Math.random() * this.size);
            const y = Math.floor(Math.random() * this.size);

            if (this.maze[y][x] === PATH && this.countPathNeighbors(x, y) === 1) {
                this.maze[y][x] = DEAD_END;
                added++;
            }
        }
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
                switch(cell) {
                    case WALL:
                        this.ctx.fillStyle = '#333';
                        break;
                    case PATH:
                        this.ctx.fillStyle = '#fff';
                        break;
                    case CORRECT_PATH:
                        this.ctx.fillStyle = '#90EE90';
                        break;
                    case DEAD_END:
                        this.ctx.fillStyle = '#FFB6C1';
                        break;
                }
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                this.ctx.strokeStyle = '#999';
                this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Draw endpoint (only at the bottom right corner)
        const endX = this.size - 1;
        const endY = this.size - 1;
        this.ctx.fillStyle = '#FFD700'; // Gold color for endpoint
        this.ctx.fillRect(endX * this.cellSize, endY * this.cellSize, this.cellSize, this.cellSize);
        this.ctx.strokeStyle = '#999';
        this.ctx.strokeRect(endX * this.cellSize, endY * this.cellSize, this.cellSize, this.cellSize);

        // Draw player as a circle with a border
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            (this.playerX + 0.5) * this.cellSize,
            (this.playerY + 0.5) * this.cellSize,
            this.cellSize * 0.4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.stroke();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.isMoving) return;

            let dx = 0;
            let dy = 0;

            switch(e.key) {
                case 'ArrowUp':
                    dy = -1;
                    break;
                case 'ArrowDown':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                    dx = -1;
                    break;
                case 'ArrowRight':
                    dx = 1;
                    break;
            }

            if (dx !== 0 || dy !== 0) {
                this.tryMove(dx, dy);
            }
        });

        document.getElementById('regenerateMazeBtn').addEventListener('click', () => {
            this.initializeMaze();
            this.playerX = 0;
            this.playerY = 0;
            this.draw();
        });
    }

    tryMove(dx, dy) {
        const newX = this.playerX + dx;
        const newY = this.playerY + dy;

        if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size && this.maze[newY][newX] !== WALL) {
            const currentQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
            const answer = prompt(currentQuestion.question);
            
            if (currentQuestion.checkAnswer(answer)) {
                alert("正确! " + currentQuestion.explanation);
                this.playerX = newX;
                this.playerY = newY;
                this.questionsRemaining--;
                this.updateQuestionCounter();
                
                if (this.maze[newY][newX] === DEAD_END) {
                    const deadEndQuestion = this.deadEndQuestions[Math.floor(Math.random() * this.deadEndQuestions.length)];
                    const deadEndAnswer = prompt(deadEndQuestion.question);
                    
                    if (!deadEndQuestion.checkAnswer(deadEndAnswer)) {
                        alert("回答错误! " + deadEndQuestion.explanation + "\n传送到最近的死胡同!");
                        // 找到最近的死胡同
                        let nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                        if (nearestDeadEnd) {
                            this.playerX = nearestDeadEnd.x;
                            this.playerY = nearestDeadEnd.y;
                        } else {
                            // 如果找不到死胡同，就回到起点
                            this.playerX = 0;
                            this.playerY = 0;
                        }
                    }
                }
                
                if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
                    alert("恭喜你完成了迷宫!");
                    document.getElementById('newGameBtn').click();
                }
            } else {
                alert("回答错误! " + currentQuestion.explanation);
                // 找到最近的死胡同
                let nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                if (nearestDeadEnd) {
                    alert("传送到最近的死胡同!");
                    this.playerX = nearestDeadEnd.x;
                    this.playerY = nearestDeadEnd.y;
                }
            }
            
            this.draw();
        }
    }

    findNearestDeadEnd(startX, startY) {
        let nearestDeadEnd = null;
        let minDistance = Infinity;

        // 遍历迷宫找到最近的死胡同
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                if (this.maze[y][x] === DEAD_END) {
                    const distance = Math.abs(x - startX) + Math.abs(y - startY);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestDeadEnd = { x, y };
                    }
                }
            }
        }

        return nearestDeadEnd;
    }

    updateQuestionCounter() {
        document.getElementById('questionCounter').textContent = `Questions Remaining: ${this.questionsRemaining}`;
    }

    initializeQuestions() {
        const questions = [];
        
        // 基础 Java 问题
        questions.push(new Question(
            "String \"Hello\" 的长度是多少?\nA) 4\nB) 5\nC) 6\nD) 0",
            "B",
            "String 的长度包括所有字符，'Hello' 有 5 个字符"
        ));
        
        questions.push(new Question(
            "下列哪个不是 Java 的基本数据类型?\nA) int\nB) String\nC) boolean\nD) char",
            "B",
            "String 是一个类，不是基本数据类型"
        ));

        questions.push(new Question(
            "int 类型的默认值是什么?\nA) 0\nB) null\nC) 1\nD) undefined",
            "A",
            "数值类型的默认值是 0"
        ));

        return questions;
    }

    initializeDeadEndQuestions() {
        const questions = [];
        
        questions.push(new Question(
            "JVM 是什么?\nA) Java Virtual Machine\nB) Java Variable Method\nC) Java Visual Monitor\nD) Java Version Manager",
            "A",
            "JVM (Java Virtual Machine) 是 Java 虚拟机，用于执行 Java 字节码"
        ));

        questions.push(new Question(
            "什么是垃圾回收?\nA) 清理电脑\nB) 自动内存管理\nC) 删除文件\nD) 代码优化",
            "B",
            "垃圾回收是 Java 的自动内存管理机制，用于释放不再使用的内存"
        ));

        return questions;
    }
}

// Game initialization
window.onload = () => {
    console.log('Window loaded');
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    console.log('Start screen:', startScreen);
    console.log('Game container:', gameContainer);
    let currentGame = null;

    // Show start screen, hide game container initially
    startScreen.style.display = 'flex';
    gameContainer.style.display = 'none';

    function startGame(difficulty) {
        console.log('Starting game with difficulty:', difficulty);
        startScreen.style.display = 'none';
        gameContainer.style.display = 'block';
        currentGame = new MazeGame(difficulty);
    }

    // Add click event listeners to difficulty buttons
    const easyBtn = document.getElementById('easyBtn');
    const mediumBtn = document.getElementById('mediumBtn');
    const hardBtn = document.getElementById('hardBtn');
    
    console.log('Difficulty buttons:', { easyBtn, mediumBtn, hardBtn });

    easyBtn.addEventListener('click', () => {
        console.log('Easy button clicked');
        startGame('easy');
    });
    mediumBtn.addEventListener('click', () => {
        console.log('Medium button clicked');
        startGame('medium');
    });
    hardBtn.addEventListener('click', () => {
        console.log('Hard button clicked');
        startGame('hard');
    });

    // Add click event listener to new game button
    const newGameBtn = document.getElementById('newGameBtn');
    console.log('New game button:', newGameBtn);
    
    newGameBtn.addEventListener('click', () => {
        console.log('New game button clicked');
        startScreen.style.display = 'flex';
        gameContainer.style.display = 'none';
        if (currentGame) {
            // Clean up any existing game resources
            currentGame = null;
        }
    });

    console.log('All event listeners set up');
}; 