const WALL = 1;
const PATH = 0;
const CORRECT_PATH = 2;
const DEAD_END = 3;

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

        // Initialize canvas
        this.canvas = document.getElementById('mazeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = Math.min(40, 600 / this.size);
        this.canvas.width = this.size * this.cellSize;
        this.canvas.height = this.size * this.cellSize;

        this.initializeMaze();
        this.setupEventListeners();
        this.updateQuestionCounter();
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
    }

    initializeQuestions() {
        const questions = [];
        
        // Basic Java questions
        questions.push(new Question(
            "What is the length of \"Hello\"?\nA) 4\nB) 5\nC) 6\nD) 0",
            "B",
            "String length counts all characters, 'Hello' has 5 characters"
        ));
        
        questions.push(new Question(
            "Which is NOT a primitive type in Java?\nA) int\nB) String\nC) boolean\nD) char",
            "B",
            "String is a class, not a primitive type"
        ));

        questions.push(new Question(
            "What is the default value of an int?\nA) 0\nB) null\nC) 1\nD) undefined",
            "A",
            "Numeric primitive types default to 0"
        ));

        return questions;
    }

    initializeDeadEndQuestions() {
        const questions = [];
        
        questions.push(new Question(
            "What is JVM?\nA) Java Virtual Machine\nB) Java Variable Method\nC) Java Visual Monitor\nD) Java Version Manager",
            "A",
            "JVM (Java Virtual Machine) executes Java bytecode"
        ));

        questions.push(new Question(
            "What is garbage collection?\nA) Cleaning computer\nB) Automatic memory management\nC) Removing files\nD) Code optimization",
            "B",
            "Garbage collection automatically frees unused memory"
        ));

        return questions;
    }

    // Game mechanics methods would go here
    // For brevity, we're showing core functionality
}

// Game initialization
window.onload = () => {
    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    let currentGame = null;

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
    });
}; 