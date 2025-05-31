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
        return [
            new Question("What is the main entry point method in Java?", "public static void main(String[] args)", "The main method is the entry point of a Java program"),
            new Question("What keyword is used to create a class in Java?", "class", "The class keyword defines a new class"),
            new Question("What is the primitive data type for whole numbers in Java?", "int", "int is used for integer values"),
            new Question("What keyword is used to create an object?", "new", "The new keyword instantiates objects"),
            new Question("What is the parent class of all classes in Java?", "Object", "Object is the root class"),
            new Question("What keyword is used for inheritance?", "extends", "extends is used to inherit from a class"),
            new Question("What access modifier makes a member visible only within its class?", "private", "private restricts access"),
            new Question("What keyword is used to define a constant?", "final", "final makes variables unchangeable"),
            new Question("What is the correct way to declare a string?", "String", "String is a class in Java"),
            new Question("What keyword is used to handle exceptions?", "try", "try begins exception handling")
        ];
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
        
        const userAnswer = prompt(question.question);
        
        if (question.checkAnswer(userAnswer)) {
            // CORRECT ANSWER - ALLOW MOVEMENT
            console.log("CORRECT ANSWER - MOVING FORWARD");
            alert('Correct! ' + question.explanation);
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
            alert('Wrong! The correct answer is: ' + question.answer + '\n' + question.explanation);
            this.handleWrongAnswer();
            
            const coinCost = COIN_COSTS.AVOID_DEAD_END;
            let shouldGoBack = true;
            
            // Check if player has enough coins and offer the option
            if (this.coins >= coinCost) {
                const useCoins = confirm(
                    `You answered incorrectly!\n\n` +
                    `Option 1: Go back to start (free)\n` +
                    `Option 2: Stay here and continue (costs ${coinCost} coins)\n\n` +
                    `You currently have ${this.coins} coins.\n` +
                    `Would you like to spend ${coinCost} coins to stay here?`
                );
                
                if (useCoins) {
                    // Player chooses to spend coins
                    this.addCoins(-coinCost);
                    shouldGoBack = false;
                    alert(`You spent ${coinCost} coins to continue!\nRemaining coins: ${this.coins}`);
                    console.log(`Player spent ${coinCost} coins to avoid going back`);
                }
            } else {
                // Not enough coins
                alert(`You don't have enough coins to stay here.\nYou need ${coinCost} coins but only have ${this.coins}.\nGoing back to start!`);
            }
            
            if (shouldGoBack) {
                // Send back to start
                console.log(`Going back to start (0,0)`);
                this.playerX = 0;
                this.playerY = 0;
                
                // Update question counter based on new position
                this.updateQuestionCounter();
                
                alert(`Sent back to start!`);
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
                // Game completed - add coins to total
                const newTotal = addToTotalCoins(this.coins);
                alert(`Congratulations! You completed the maze!\nGame Score: ${this.coins} coins\nTotal Coins Earned: ${newTotal} coins`);
                
                // Add completion bonus
                const completionBonus = 50;
                const finalTotal = addToTotalCoins(completionBonus);
                setTimeout(() => {
                    alert(`Completion Bonus: +${completionBonus} coins!\nYour new total: ${finalTotal} coins`);
                }, 1000);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const cell = this.maze[y][x];
                const centerX = x * this.cellSize + this.cellSize/2;
                const centerY = y * this.cellSize + this.cellSize/2;

                // Draw cell background
                this.ctx.fillStyle = cell === WALL ? '#333' : '#fff';
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

                // Draw special cells
                switch(cell) {
                    case CORRECT_PATH:
                        this.ctx.fillStyle = '#90EE90';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        break;
                    case DEAD_END:
                        this.ctx.fillStyle = '#FFB6C1';
                        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                        break;
                    case COIN:
                        // Draw coin as a circle with a gold gradient
                        const gradient = this.ctx.createRadialGradient(
                            centerX, centerY, 0,
                            centerX, centerY, this.cellSize/3
                        );
                        gradient.addColorStop(0, '#FFD700');    // Center: Bright gold
                        gradient.addColorStop(1, '#DAA520');    // Edge: Darker gold
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.beginPath();
                        this.ctx.arc(centerX, centerY, this.cellSize/3, 0, Math.PI * 2);
                        this.ctx.fill();
                        
                        // Add shine effect
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        this.ctx.beginPath();
                        this.ctx.arc(
                            centerX - this.cellSize/8,
                            centerY - this.cellSize/8,
                            this.cellSize/10,
                            0,
                            Math.PI * 2
                        );
                        this.ctx.fill();
                        break;
                }

                // Draw exit marker (at bottom-right corner)
                if (x === this.size - 1 && y === this.size - 1) {
                    // Draw exit marker
                    this.ctx.fillStyle = '#4CAF50';  // Green color for exit
                    this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    
                    // Draw "EXIT" text
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = `${this.cellSize/3}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('EXIT', centerX, centerY);
                }
            }
        }
        
        // Draw player
        this.ctx.fillStyle = '#2196F3';
        this.ctx.beginPath();
        this.ctx.arc(
            this.playerX * this.cellSize + this.cellSize/2,
            this.playerY * this.cellSize + this.cellSize/2,
            this.cellSize/3,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
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
}

// Game initialization
window.onload = () => {
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    let currentGame = null;

    // Initialize total coins display
    updateTotalCoinsDisplay();

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