import { QUESTIONS, getQuestionsByDifficulty, getRandomQuestion } from './questions.js';

// Test 1: Verify that we have questions for each difficulty level
console.log('=== Testing Question Counts ===');
console.log('Easy questions:', getQuestionsByDifficulty('easy').length);
console.log('Medium questions:', getQuestionsByDifficulty('medium').length);
console.log('Hard questions:', getQuestionsByDifficulty('hard').length);

// Test 2: Test random question selection
console.log('\n=== Testing Random Question Selection ===');
const easyQuestion = getRandomQuestion('easy');
console.log('Random Easy Question:', {
    question: easyQuestion.question.slice(0, 50) + '...',
    options: easyQuestion.options,
    correctAnswer: easyQuestion.correctAnswer
});

// Test 3: Test invalid difficulty handling
console.log('\n=== Testing Invalid Difficulty ===');
const invalidQuestions = getQuestionsByDifficulty('invalid');
console.log('Invalid difficulty returns:', invalidQuestions);

// Test 4: Verify question structure
console.log('\n=== Testing Question Structure ===');
function validateQuestion(question) {
    const requiredFields = ['question', 'options', 'correctAnswer', 'explanation'];
    const missingFields = requiredFields.filter(field => !(field in question));
    if (missingFields.length > 0) {
        console.error('Missing fields:', missingFields);
        return false;
    }
    if (!Array.isArray(question.options) || question.options.length === 0) {
        console.error('Invalid options array');
        return false;
    }
    if (typeof question.correctAnswer !== 'number') {
        console.error('Invalid correctAnswer type');
        return false;
    }
    return true;
}

const sampleQuestions = {
    easy: getRandomQuestion('easy'),
    medium: getRandomQuestion('medium'),
    hard: getRandomQuestion('hard')
};

Object.entries(sampleQuestions).forEach(([difficulty, question]) => {
    console.log(`${difficulty} question structure valid:`, validateQuestion(question));
}); 