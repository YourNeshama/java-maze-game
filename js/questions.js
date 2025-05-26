// Questions database organized by difficulty levels
const QUESTIONS = {
    easy: [
        {
            question: "What will be printed?\nint x = 5 + 3;\nSystem.out.println(x);",
            options: ["5", "8", "53", "Error"],
            correctAnswer: 1,
            explanation: "Basic arithmetic: 5 + 3 equals 8"
        },
        {
            question: "Which keyword declares a constant in Java?",
            options: ["const", "final", "static", "constant"],
            correctAnswer: 1,
            explanation: "The final keyword makes a variable unchangeable"
        },
        {
            question: "What is the output?\nString s = \"Hello\";\nSystem.out.println(s.length());",
            options: ["4", "5", "6", "Error"],
            correctAnswer: 1,
            explanation: "String length counts all characters"
        },
        {
            question: "What is the result of: boolean b = true && false;",
            options: ["true", "false", "1", "0"],
            correctAnswer: 1,
            explanation: "AND (&&) requires both operands to be true"
        },
        {
            question: "Which loop prints numbers 1 to 5?\nfor (int i = 1; i <= 5; i++) {\n  System.out.print(i);\n}",
            options: ["12345", "1234", "2345", "54321"],
            correctAnswer: 0,
            explanation: "Loop runs while i <= 5, printing each number"
        }
    ],
    medium: [
        {
            question: "What is printed?\nArrayList<Integer> list = new ArrayList<>();\nlist.add(1);\nlist.add(2);\nlist.add(0, 3);\nSystem.out.println(list);",
            options: ["[1, 2, 3]", "[3, 1, 2]", "[2, 1, 3]", "[3, 2, 1]"],
            correctAnswer: 1,
            explanation: "add(0, 3) inserts 3 at index 0, shifting other elements right"
        },
        {
            question: "What is the output?\nString s1 = new String(\"hello\");\nString s2 = \"hello\";\nSystem.out.println(s1 == s2);",
            options: ["true", "false", "hello", "Error"],
            correctAnswer: 1,
            explanation: "== compares references, not string content"
        },
        {
            question: "Which method header correctly overrides:\npublic void process(int x) { }",
            options: [
                "private void process(int x)",
                "public int process(int x)",
                "public void process(int y)",
                "protected void process(int x)"
            ],
            correctAnswer: 2,
            explanation: "Override must have same return type and access level"
        },
        {
            question: "What is the time complexity of binary search?",
            options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
            correctAnswer: 1,
            explanation: "Binary search halves the search space each time"
        }
    ],
    hard: [
        {
            question: "What is printed?\npublic class A {\n  public void m() { System.out.print(\"A\"); }\n}\npublic class B extends A {\n  public void m() { System.out.print(\"B\"); }\n}\nA obj = new B();\nobj.m();",
            options: ["A", "B", "AB", "Error"],
            correctAnswer: 1,
            explanation: "Dynamic dispatch calls B's method at runtime"
        },
        {
            question: "Consider:\npublic static void sort(int[] arr) {\n  for(int i = 0; i < arr.length-1; i++)\n    for(int j = 0; j < arr.length-i-1; j++)\n      if(arr[j] > arr[j+1]) {\n        int temp = arr[j];\n        arr[j] = arr[j+1];\n        arr[j+1] = temp;\n      }\n}\nWhat is the best case time complexity?",
            options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
            correctAnswer: 0,
            explanation: "Best case is when array is already sorted"
        },
        {
            question: "What is the output?\npublic static int mystery(int n) {\n  if(n == 0) return 0;\n  if(n == 1) return 1;\n  return mystery(n-1) + mystery(n-2);\n}\nSystem.out.println(mystery(4));",
            options: ["3", "4", "5", "8"],
            correctAnswer: 0,
            explanation: "Fibonacci sequence: F(4) = F(3) + F(2) = 2 + 1 = 3"
        },
        {
            question: "Which data structure is most efficient for implementing a priority queue?",
            options: [
                "Array",
                "Linked List",
                "Binary Heap",
                "Hash Table"
            ],
            correctAnswer: 2,
            explanation: "Binary Heap provides O(log n) insert and remove-min"
        }
    ]
};

// Helper function to get questions by difficulty
function getQuestionsByDifficulty(difficulty) {
    return QUESTIONS[difficulty] || [];
}

// Helper function to get a random question from a specific difficulty
function getRandomQuestion(difficulty) {
    const questions = getQuestionsByDifficulty(difficulty);
    if (questions.length === 0) return null;
    return questions[Math.floor(Math.random() * questions.length)];
}

// Export the functions
export { getQuestionsByDifficulty, getRandomQuestion }; 