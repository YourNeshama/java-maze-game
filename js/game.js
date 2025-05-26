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
        
        // Set start point as dead end and ensure second block is not
        this.maze[0][0] = DEAD_END;
        
        // Ensure the path to second block
        if (this.maze[0][1] === PATH) {
            this.maze[0][1] = PATH; // Second block is always a path
        } else if (this.maze[1][0] === PATH) {
            this.maze[1][0] = PATH; // Second block is always a path
        }
        
        // Set end point
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
                    case DEAD_END:  // Dead ends now look like normal paths
                        this.ctx.fillStyle = '#fff';
                        break;
                    case CORRECT_PATH:
                        this.ctx.fillStyle = '#90EE90';
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
            console.log(`Selecting question for ${this.difficulty} mode`);
            const currentQuestion = getRandomQuestion(this.difficulty);
            console.log('Selected question:', currentQuestion.question);
            
            const answer = prompt(currentQuestion.question);
            
            if (currentQuestion.checkAnswer(answer)) {
                alert("Correct! " + currentQuestion.explanation);
                this.playerX = newX;
                this.playerY = newY;
                this.stepsRemaining--;
                this.updateStepCounter();
                
                // Special handling for third block
                if (this.isThirdBlock(newX, newY) && this.maze[newY][newX] === DEAD_END) {
                    const deadEndQuestion = getRandomQuestion(this.difficulty);
                    const deadEndAnswer = prompt(deadEndQuestion.question);
                    
                    if (!deadEndQuestion.checkAnswer(deadEndAnswer)) {
                        alert("Wrong! " + deadEndQuestion.explanation + "\nReturning to start!");
                        this.playerX = 0;
                        this.playerY = 0;
                        this.stepsRemaining += 3;
                        this.updateStepCounter();
                    }
                }
                
                if (this.playerX === this.size - 1 && this.playerY === this.size - 1) {
                    alert("Congratulations! You've completed the maze!");
                    document.getElementById('newGameBtn').click();
                }
            } else {
                alert("Wrong! " + currentQuestion.explanation);
                if (this.playerX === 0 && this.playerY === 0) {
                    // If at starting point, stay there
                    alert("You're at the starting point. Try again!");
                } else if (this.isThirdBlock(this.playerX, this.playerY)) {
                    // If at third block, return to start
                    alert("Returning to start!");
                    this.playerX = 0;
                    this.playerY = 0;
                } else {
                    // Otherwise teleport to nearest dead end
                    alert("Teleporting to nearest dead end!");
                    const nearestDeadEnd = this.findNearestDeadEnd(this.playerX, this.playerY);
                    if (nearestDeadEnd) {
                        this.playerX = nearestDeadEnd.x;
                        this.playerY = nearestDeadEnd.y;
                        this.stepsRemaining += 3;
                        this.updateStepCounter();
                    }
                }
            }
            
            this.draw();
        }
    }

    isThirdBlock(x, y) {
        // Check if the current position is the third block from start
        if ((x === 0 && y === 2) || (x === 2 && y === 0) || 
            (x === 1 && y === 1)) {
            return true;
        }
        return false;
    }

    findNearestDeadEnd(startX, startY) {
        let nearestDeadEnd = null;
        let minDistance = Infinity;

        // Consider starting point (0,0) as a dead end
        const distanceToStart = Math.abs(startX) + Math.abs(startY);
        if (distanceToStart < minDistance) {
            minDistance = distanceToStart;
            nearestDeadEnd = { x: 0, y: 0 };
        }

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