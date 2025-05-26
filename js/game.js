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
        
        // Initialize questions with proper difficulty
        this.initializeAllQuestions();
        
        // Display questions for debugging
        this.displayQuestionsForDebugging();
        
        // Initialize canvas
        this.canvas = document.getElementById('mazeCanvas');
        console.log('Canvas element:', this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = Math.min(40, 600 / this.size);
        this.canvas.width = this.size * this.cellSize;
        this.canvas.height = this.size * this.cellSize;

        this.initializeMaze();
        this.setupEventListeners();
        
        // Calculate minimum path length
        this.minPathLength = this.findShortestPath();
        this.stepsRemaining = this.minPathLength;
        this.updateStepCounter();
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
        
        // Add dead ends near start and end
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
        // Reduce number of dead ends based on maze size
        const deadEndCount = Math.floor(this.size / 2); // Reduced from this.size * 1.5
        let added = 0;
        
        // Priority areas for dead ends (near start and end)
        const priorityAreas = [
            {x: 1, y: 0},  // Near start
            {x: this.size-2, y: this.size-1}  // Near end
        ];

        // First try to add dead ends in priority areas
        for (const pos of priorityAreas) {
            if (this.maze[pos.y][pos.x] === PATH && this.countPathNeighbors(pos.x, pos.y) === 1) {
                this.maze[pos.y][pos.x] = DEAD_END;
                added++;
            }
        }

        // Then add remaining dead ends randomly, but with more restrictions
        let attempts = 0;
        while (added < deadEndCount && attempts < 50) { // Reduced max attempts
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

        // Draw player's current cell with a highlight
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillRect(this.playerX * this.cellSize, this.playerY * this.cellSize, this.cellSize, this.cellSize);
        this.ctx.globalAlpha = 1.0;

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
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.isMoving) return;

            let dx = 0;
            let dy = 0;

            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dy = -1;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dy = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dx = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dx = 1;
                    break;
            }

            if (dx !== 0 || dy !== 0) {
                this.tryMove(dx, dy);
            }
        });

        // Touch/click controls
        this.canvas.addEventListener('click', (e) => {
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
                this.tryMove(dx, dy);
            }
        });

        // Add touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault(); // Prevent scrolling
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // Determine swipe direction
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                this.tryMove(Math.sign(dx), 0);
            } else {
                // Vertical swipe
                this.tryMove(0, Math.sign(dy));
            }
            
            e.preventDefault();
        }, { passive: false });

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
            // Get a random question based on current difficulty
            console.log(`Selecting question for ${this.difficulty} mode from ${this.questions.length} questions`);
            const questionIndex = Math.floor(Math.random() * this.questions.length);
            const currentQuestion = this.questions[questionIndex];
            console.log('Selected question:', currentQuestion.question);
            
            const answer = prompt(currentQuestion.question);
            
            if (currentQuestion.checkAnswer(answer)) {
                alert("Correct! " + currentQuestion.explanation);
                this.playerX = newX;
                this.playerY = newY;
                this.stepsRemaining--;
                this.updateStepCounter();
                
                if (this.maze[newY][newX] === DEAD_END) {
                    // Get a random dead end question
                    console.log(`Selecting dead end question for ${this.difficulty} mode from ${this.deadEndQuestions.length} questions`);
                    const deadEndIndex = Math.floor(Math.random() * this.deadEndQuestions.length);
                    const deadEndQuestion = this.deadEndQuestions[deadEndIndex];
                    console.log('Selected dead end question:', deadEndQuestion.question);
                    
                    const deadEndAnswer = prompt(deadEndQuestion.question);
                    
                    if (!deadEndQuestion.checkAnswer(deadEndAnswer)) {
                        alert("Wrong! " + deadEndQuestion.explanation + "\nTeleporting to nearest dead end!");
                        const nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                        if (nearestDeadEnd) {
                            this.playerX = nearestDeadEnd.x;
                            this.playerY = nearestDeadEnd.y;
                            this.stepsRemaining += 3;
                            this.updateStepCounter();
                        }
                    }
                }
                
                if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
                    alert("Congratulations! You've completed the maze!");
                    document.getElementById('newGameBtn').click();
                }
            } else {
                alert("Wrong! " + currentQuestion.explanation + "\nTeleporting to nearest dead end!");
                const nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                if (nearestDeadEnd) {
                    this.playerX = nearestDeadEnd.x;
                    this.playerY = nearestDeadEnd.y;
                    this.stepsRemaining += 3;
                    this.updateStepCounter();
                }
            }
            
            this.draw();
        }
    }

    findNearestDeadEnd(startX, startY) {
        let nearestDeadEnd = null;
        let minDistance = Infinity;

        // Traverse the maze to find the nearest dead end
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

    updateStepCounter() {
        document.getElementById('questionCounter').textContent = 
            `Steps Remaining: ${this.stepsRemaining} (Minimum path: ${this.minPathLength} steps)`;
    }

    initializeQuestions() {
        console.log('Initializing questions for difficulty:', this.difficulty);
        
        // Questions organized by difficulty
        const easyQuestions = [
            new Question(
                "What is the length of \"Hello\"?\nA) 4\nB) 5\nC) 6\nD) 0",
                "B",
                "String length counts all characters, 'Hello' has 5 characters"
            ),
            new Question(
                "Which operator is used for string concatenation in Java?\nA) +\nB) &\nC) .\nD) ,",
                "A",
                "The + operator is used to concatenate strings in Java"
            ),
            new Question(
                "What is the default value of an int?\nA) 0\nB) null\nC) 1\nD) undefined",
                "A",
                "Numeric primitive types default to 0"
            ),
            new Question(
                "What is the main method's return type?\nA) int\nB) void\nC) String\nD) boolean",
                "B",
                "The main method in Java must be declared as void"
            ),
            new Question(
                "Which symbol is used for single-line comments?\nA) //\nB) /*\nC) #\nD) --",
                "A",
                "// is used for single-line comments in Java"
            )
        ];

        const mediumQuestions = [
            new Question(
                "Which is NOT a primitive type in Java?\nA) int\nB) String\nC) boolean\nD) char",
                "B",
                "String is a class, not a primitive type"
            ),
            new Question(
                "What is the correct way to declare a constant in Java?\nA) const int NUM\nB) final int NUM\nC) static int NUM\nD) constant int NUM",
                "B",
                "The 'final' keyword is used to declare constants in Java"
            ),
            new Question(
                "What is the size of int in Java?\nA) 16 bits\nB) 32 bits\nC) 64 bits\nD) 8 bits",
                "B",
                "In Java, int is 32 bits (4 bytes)"
            ),
            new Question(
                "Which collection type is ordered and allows duplicates?\nA) HashSet\nB) ArrayList\nC) HashMap\nD) TreeSet",
                "B",
                "ArrayList maintains insertion order and allows duplicate elements"
            ),
            new Question(
                "What is the purpose of 'break' statement?\nA) Exit program\nB) Exit loop or switch\nC) Skip iteration\nD) Debug code",
                "B",
                "break statement is used to exit a loop or switch statement"
            )
        ];

        const hardQuestions = [
            new Question(
                "What is the difference between '==' and '.equals()'?\nA) No difference\nB) == for primitives, equals() for objects\nC) == is faster\nD) equals() is deprecated",
                "B",
                "== compares references for objects, while equals() compares content"
            ),
            new Question(
                "Which interface is used for functional programming?\nA) Runnable\nB) Comparable\nC) Function\nD) Iterator",
                "C",
                "Function interface is a key component of Java's functional programming support"
            ),
            new Question(
                "What is the purpose of 'synchronized' keyword?\nA) Increase speed\nB) Thread safety\nC) Memory management\nD) Error handling",
                "B",
                "synchronized keyword is used to prevent thread interference and memory consistency errors"
            ),
            new Question(
                "What is the difference between abstract class and interface?\nA) No difference\nB) Abstract class can have state\nC) Interface can have constructors\nD) Abstract class is faster",
                "B",
                "Abstract classes can have state (fields) and constructors, interfaces traditionally cannot"
            ),
            new Question(
                "What is the purpose of volatile keyword?\nA) Speed optimization\nB) Thread visibility\nC) Memory saving\nD) Error prevention",
                "B",
                "volatile ensures that variable updates are visible across threads"
            )
        ];

        // Select questions based on difficulty
        let selectedQuestions;
        switch(this.difficulty) {
            case 'easy':
                selectedQuestions = easyQuestions;
                break;
            case 'medium':
                selectedQuestions = mediumQuestions;
                break;
            case 'hard':
                selectedQuestions = hardQuestions;
                break;
            default:
                console.error('Invalid difficulty:', this.difficulty);
                selectedQuestions = easyQuestions;
        }

        console.log(`Selected ${selectedQuestions.length} questions for ${this.difficulty} mode`);
        return selectedQuestions;
    }

    initializeDeadEndQuestions() {
        // Dead end questions are also separated by difficulty
        const easyDeadEndQuestions = [
            new Question(
                "What does JVM stand for?\nA) Java Virtual Machine\nB) Java Variable Method\nC) Java Visual Monitor\nD) Java Version Manager",
                "A",
                "JVM (Java Virtual Machine) is the runtime environment for executing Java bytecode"
            ),
            new Question(
                "What is the entry point of a Java program?\nA) start()\nB) main()\nC) run()\nD) execute()",
                "B",
                "The main() method is the entry point of every Java program"
            )
        ];

        const mediumDeadEndQuestions = [
            new Question(
                "What is garbage collection in Java?\nA) Cleaning files\nB) Automatic memory management\nC) Removing variables\nD) Code optimization",
                "B",
                "Garbage collection automatically manages memory by removing unused objects"
            ),
            new Question(
                "Which of these is not a valid access modifier?\nA) public\nB) friendly\nC) protected\nD) private",
                "B",
                "The valid access modifiers are public, private, protected, and default (package-private)"
            )
        ];

        const hardDeadEndQuestions = [
            new Question(
                "What is the parent class of all classes in Java?\nA) Parent\nB) Main\nC) Object\nD) Class",
                "C",
                "In Java, Object is the root class of all class hierarchy"
            ),
            new Question(
                "Which design pattern is used in Runtime class?\nA) Factory\nB) Singleton\nC) Observer\nD) Builder",
                "B",
                "Runtime class uses the Singleton pattern to ensure only one instance exists"
            )
        ];

        // Return dead end questions based on difficulty
        switch(this.difficulty) {
            case 'easy':
                return easyDeadEndQuestions;
            case 'medium':
                return mediumDeadEndQuestions;
            case 'hard':
                return hardDeadEndQuestions;
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