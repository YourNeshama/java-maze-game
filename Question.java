package java_maze_game;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Question {
    private String question;
    private String[] options;
    private int correctAnswer;
    private String explanation;
    private Difficulty difficulty;
    
    public enum Difficulty {
        EASY,
        MEDIUM,
        HARD
    }
    
    public Question(String question, String[] options, int correctAnswer, String explanation, Difficulty difficulty) {
        this.question = question;
        this.options = options;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.difficulty = difficulty;
    }
    
    // Getters
    public String getQuestion() { return question; }
    public String[] getOptions() { return options; }
    public int getCorrectAnswer() { return correctAnswer; }
    public String getExplanation() { return explanation; }
    public Difficulty getDifficulty() { return difficulty; }
    
    private static final List<Question> ALL_QUESTIONS = new ArrayList<>();
    
    static {
        // Easy Questions
        ALL_QUESTIONS.add(new Question(
            "What is the output of: int x = 5 + 3; System.out.println(x);",
            new String[]{"5", "8", "53", "Error"},
            1,
            "Basic arithmetic operation: 5 + 3 equals 8",
            Difficulty.EASY
        ));
        
        ALL_QUESTIONS.add(new Question(
            "Which keyword is used to declare a constant in Java?",
            new String[]{"const", "final", "static", "constant"},
            1,
            "The 'final' keyword is used to declare constants in Java",
            Difficulty.EASY
        ));
        
        ALL_QUESTIONS.add(new Question(
            "What is the correct way to declare a String variable?",
            new String[]{"string name;", "String name;", "str name;", "text name;"},
            1,
            "String is the correct class name for text in Java, and it starts with a capital S",
            Difficulty.EASY
        ));
        
        // Medium Questions
        ALL_QUESTIONS.add(new Question(
            "What is the difference between '==' and '.equals()' for String comparison?",
            new String[]{
                "They are the same",
                "'==' compares references, .equals() compares content",
                ".equals() compares references, '==' compares content",
                "None of the above"
            },
            1,
            "'==' compares object references (memory addresses), while .equals() compares the actual content of Strings",
            Difficulty.MEDIUM
        ));
        
        ALL_QUESTIONS.add(new Question(
            "What is the output of: for(int i=0; i<3; i++) { System.out.print(i); }",
            new String[]{"123", "012", "1 2 3", "0 1 2"},
            1,
            "The loop starts at 0, runs while i is less than 3, and prints each number without spaces",
            Difficulty.MEDIUM
        ));
        
        ALL_QUESTIONS.add(new Question(
            "Which collection type should you use for a dynamic size list?",
            new String[]{"Array", "ArrayList", "Vector", "LinkedList"},
            1,
            "ArrayList provides dynamic sizing and is the most commonly used List implementation",
            Difficulty.MEDIUM
        ));
        
        // Hard Questions
        ALL_QUESTIONS.add(new Question(
            "What is the output of:\n" +
            "try {\n" +
            "    throw new Exception();\n" +
            "} catch(Exception e) {\n" +
            "    System.out.print(\"1\");\n" +
            "} finally {\n" +
            "    System.out.print(\"2\");\n" +
            "}",
            new String[]{"1", "2", "12", "Exception"},
            2,
            "The catch block executes when the exception is thrown, then the finally block always executes",
            Difficulty.HARD
        ));
        
        ALL_QUESTIONS.add(new Question(
            "What is the time complexity of binary search?",
            new String[]{"O(n)", "O(log n)", "O(n²)", "O(1)"},
            1,
            "Binary search has logarithmic time complexity as it halves the search space in each step",
            Difficulty.HARD
        ));
        
        ALL_QUESTIONS.add(new Question(
            "Which statement about abstract classes is correct?",
            new String[]{
                "They can be instantiated directly",
                "They can have both implemented and unimplemented methods",
                "They can be used to achieve multiple inheritance",
                "They must implement all methods from their interfaces"
            },
            1,
            "Abstract classes can have both concrete (implemented) and abstract (unimplemented) methods",
            Difficulty.HARD
        ));
    }
    
    public static Question getRandomQuestion(Difficulty difficulty) {
        List<Question> questionsOfDifficulty = new ArrayList<>();
        for (Question q : ALL_QUESTIONS) {
            if (q.getDifficulty() == difficulty) {
                questionsOfDifficulty.add(q);
            }
        }
        if (questionsOfDifficulty.isEmpty()) {
            return null;
        }
        Collections.shuffle(questionsOfDifficulty);
        return questionsOfDifficulty.get(0);
    }
    
    public static Question getRandomQuestion() {
        Collections.shuffle(ALL_QUESTIONS);
        return ALL_QUESTIONS.get(0);
    }
} 