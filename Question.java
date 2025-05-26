public class Question {
    private String question;
    private String[] options;
    private int correctAnswer;
    private String explanation;
    private String difficulty;

    // Constructor with validation
    public Question(String question, String[] options, int correctAnswer, String explanation, String difficulty) {
        // Validate inputs
        if (question == null || question.trim().isEmpty()) {
            throw new IllegalArgumentException("Question cannot be null or empty");
        }
        if (options == null || options.length < 2) {
            throw new IllegalArgumentException("Must provide at least 2 options");
        }
        if (correctAnswer < 0 || correctAnswer >= options.length) {
            throw new IllegalArgumentException("Correct answer index must be valid");
        }
        if (explanation == null || explanation.trim().isEmpty()) {
            throw new IllegalArgumentException("Explanation cannot be null or empty");
        }
        if (difficulty == null || difficulty.trim().isEmpty()) {
            throw new IllegalArgumentException("Difficulty cannot be null or empty");
        }

        this.question = question.trim();
        this.options = options.clone(); // Create a defensive copy
        this.correctAnswer = correctAnswer;
        this.explanation = explanation.trim();
        this.difficulty = difficulty.toLowerCase().trim();
    }

    // Getters with defensive copies where needed
    public String getQuestion() {
        return question;
    }

    public String[] getOptions() {
        return options.clone(); // Return a defensive copy
    }

    public int getCorrectAnswer() {
        return correctAnswer;
    }

    public String getExplanation() {
        return explanation;
    }

    public String getDifficulty() {
        return difficulty;
    }

    // Method to check if an answer is correct
    public boolean isCorrect(int answer) {
        return answer >= 0 && answer < options.length && answer == correctAnswer;
    }

    // Method to get the correct option text
    public String getCorrectOptionText() {
        try {
            return options[correctAnswer];
        } catch (ArrayIndexOutOfBoundsException e) {
            return "Invalid answer index";
        }
    }

    // Static factory methods for different difficulty levels
    public static Question createEasyQuestion(String question, String[] options, int correctAnswer, String explanation) {
        try {
            return new Question(question, options, correctAnswer, explanation, "easy");
        } catch (IllegalArgumentException e) {
            System.err.println("Error creating easy question: " + e.getMessage());
            return null;
        }
    }

    public static Question createMediumQuestion(String question, String[] options, int correctAnswer, String explanation) {
        try {
            return new Question(question, options, correctAnswer, explanation, "medium");
        } catch (IllegalArgumentException e) {
            System.err.println("Error creating medium question: " + e.getMessage());
            return null;
        }
    }

    public static Question createHardQuestion(String question, String[] options, int correctAnswer, String explanation) {
        try {
            return new Question(question, options, correctAnswer, explanation, "hard");
        } catch (IllegalArgumentException e) {
            System.err.println("Error creating hard question: " + e.getMessage());
            return null;
        }
    }

    // Override toString for easy printing
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("Question: ").append(question).append("\n");
        sb.append("Options:\n");
        for (int i = 0; i < options.length; i++) {
            sb.append(i + 1).append(") ").append(options[i]).append("\n");
        }
        sb.append("Difficulty: ").append(difficulty).append("\n");
        return sb.toString();
    }

    // Method to display the question with options
    public void display() {
        try {
            System.out.println(this.toString());
        } catch (Exception e) {
            System.err.println("Error displaying question: " + e.getMessage());
        }
    }

    // Method to display the explanation
    public void displayExplanation() {
        if (explanation != null) {
            System.out.println("Explanation: " + explanation);
        } else {
            System.out.println("No explanation available.");
        }
    }

    // Method to validate the question structure
    public boolean isValid() {
        try {
            return question != null && !question.trim().isEmpty() &&
                   options != null && options.length > 0 &&
                   correctAnswer >= 0 && correctAnswer < options.length &&
                   explanation != null && !explanation.trim().isEmpty() &&
                   difficulty != null && !difficulty.trim().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    // Example usage of creating a question
    public static void main(String[] args) {
        try {
            // Example of creating an easy question
            Question easyQuestion = createEasyQuestion(
                "What will be printed by the following code?\nint x = 10;\nint y = 3;\nSystem.out.println(x / y);",
                new String[]{"3.333", "3", "4", "Error"},
                1,
                "Integer division in Java truncates the decimal part, so 10 / 3 results in 3."
            );

            if (easyQuestion != null) {
                // Display the question
                easyQuestion.display();
                
                // Test some answers
                System.out.println("Testing answer 1 (correct): " + easyQuestion.isCorrect(1));
                System.out.println("Testing answer 0 (incorrect): " + easyQuestion.isCorrect(0));
                System.out.println("Testing invalid answer -1: " + easyQuestion.isCorrect(-1));
                
                // Show explanation
                easyQuestion.displayExplanation();
            }

            // Test invalid question creation
            Question invalidQuestion = createEasyQuestion(
                "",  // Empty question
                new String[]{"Option1"},  // Only one option
                0,
                "Test explanation"
            );
            // This should print an error message and return null

        } catch (Exception e) {
            System.err.println("Error in main: " + e.getMessage());
        }
    }
} 