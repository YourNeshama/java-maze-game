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
            question: "Consider the following code segment:\nfor (int k = 0; k < 20; k = k + 2) {\n  if (k % 3 == 1) {\n    System.out.print(k + \" \");\n  }\n}",
            options: ["4 16", "4 10 16", "0 6 12 18", "1 4 7 10 13 16 19"],
            correctAnswer: 0,
            explanation: "The loop increments by 2, and prints k when k%3 equals 1"
        },
        {
            question: "What is the output?\nString s = \"Hello\";\nSystem.out.println(s.length());",
            options: ["4", "5", "6", "Error"],
            correctAnswer: 1,
            explanation: "String length counts all characters, 'Hello' has 5 characters"
        },
        {
            question: "What is the output of:\nint[] arr = {1, 2, 3};\nSystem.out.println(arr[1]);",
            options: ["1", "2", "3", "Error"],
            correctAnswer: 1,
            explanation: "Array indices start at 0, arr[1] accesses the second element"
        },
        {
            question: "Which of these declares a constant in Java?",
            options: ["const int x = 5;", "final int x = 5;", "static int x = 5;", "private int x = 5;"],
            correctAnswer: 1,
            explanation: "The final keyword is used to declare constants in Java"
        },
        {
            question: "What is the result of: 7 / 2",
            options: ["3.5", "3", "4", "2"],
            correctAnswer: 1,
            explanation: "Integer division truncates the decimal part"
        },
        {
            question: "Which loop is best when you know the number of iterations?",
            options: ["while", "do-while", "for", "if"],
            correctAnswer: 2,
            explanation: "for loops are designed for known iteration counts"
        },
        {
            question: "What is the output of:\nString str = \"Java\";\nSystem.out.println(str.substring(1, 3));",
            options: ["Ja", "av", "ava", "va"],
            correctAnswer: 1,
            explanation: "substring(1,3) returns characters from index 1 (inclusive) to 3 (exclusive)"
        },
        {
            question: "Which statement correctly creates an ArrayList of integers?",
            options: [
                "ArrayList<int> list = new ArrayList<int>();",
                "ArrayList<Integer> list = new ArrayList<Integer>();",
                "ArrayList list = new ArrayList();",
                "ArrayList<int> list = new ArrayList();"
            ],
            correctAnswer: 1,
            explanation: "Must use Integer wrapper class, not primitive int"
        },
        {
            question: "What is the value of x after:\nint x = 3;\nx += 2;",
            options: ["2", "3", "5", "6"],
            correctAnswer: 2,
            explanation: "x += 2 is equivalent to x = x + 2"
        },
        // ... Add more easy questions to reach 40
    ],
    medium: [
        {
            question: "Consider:\nList<String> animals = new ArrayList<String>();\nanimals.add(\"dog\");\nanimals.add(\"cat\");\nanimals.add(\"snake\");\nanimals.set(2, \"lizard\");\nanimals.add(1, \"fish\");\nanimals.remove(3);\nSystem.out.println(animals);",
            options: ["[dog, fish, cat]", "[dog, fish, lizard]", "[dog, lizard, fish]", "[fish, dog, cat]"],
            correctAnswer: 0,
            explanation: "Track each operation: add dog, add cat, add snake, replace snake with lizard, insert fish at index 1, remove at index 3"
        },
        {
            question: "What is the output?\nint[][] matrix = { {1, 2}, {3, 4} };\nSystem.out.println(matrix[1][0]);",
            options: ["1", "2", "3", "4"],
            correctAnswer: 2,
            explanation: "matrix[1][0] accesses row 1 (second row) and column 0 (first column)"
        },
        {
            question: "Consider:\npublic interface Shape {\n  int isLargerThan(Shape other);\n}\npublic class Circle implements Shape\nWhich method header satisfies the interface?",
            options: [
                "public int isLargerThan(Shape other)",
                "public int isLargerThan(Circle other)",
                "public boolean isLargerThan(Shape other)",
                "private int isLargerThan(Shape other)"
            ],
            correctAnswer: 0,
            explanation: "Must match exact return type and parameter type from interface"
        },
        {
            question: "What is printed?\nfor (int j = 1; j <= 5; j++) {\n  for (int k = 5; k >= j; k--) {\n    System.out.print(j + \" \");\n  }\n  System.out.println();\n}",
            options: [
                "1 1 1 1 1\n2 2 2 2\n3 3 3\n4 4\n5",
                "5 4 3 2 1\n4 3 2 1\n3 2 1\n2 1\n1",
                "1 2 3 4 5\n2 3 4 5\n3 4 5\n4 5\n5",
                "5 5 5 5 5\n4 4 4 4\n3 3 3\n2 2\n1"
            ],
            correctAnswer: 0,
            explanation: "Outer loop controls rows, inner loop prints j decreasing number of times"
        },
        {
            question: "Consider:\npublic static void mystery(List<Integer> nums) {\n  for (int k = 0; k < nums.size(); k++) {\n    if (nums.get(k).intValue() == 0) {\n      nums.remove(k);\n    }\n  }\n}\nIf nums contains [0, 0, 4, 2, 5, 0, 3, 0], what will it contain after mystery(nums)?",
            options: [
                "[4, 2, 5, 3]",
                "[0, 4, 2, 5, 3]",
                "[0, 0, 4, 2, 5, 0, 3]",
                "[0, 4, 2, 5, 0, 3]"
            ],
            correctAnswer: 3,
            explanation: "Removing elements shifts indices, causing some zeros to be skipped"
        },
        {
            question: "What is returned by:\npublic static int findLongest(int[] nums, int target) {\n  int lenCount = 0;\n  int maxLen = 0;\n  for (int val : nums) {\n    if (val == target) {\n      lenCount++;\n    } else {\n      if (lenCount > maxLen) {\n        maxLen = lenCount;\n      }\n      lenCount = 0;\n    }\n  }\n  return Math.max(maxLen, lenCount);\n}",
            options: [
                "Length of array",
                "Number of occurrences of target",
                "Length of longest consecutive sequence of target",
                "Index of first occurrence of target"
            ],
            correctAnswer: 2,
            explanation: "Tracks longest consecutive sequence of target value"
        },
        // ... Add more medium questions to reach 40
    ],
    hard: [
        {
            question: "Consider the recursive method:\npublic static int mystery(int n) {\n  if (n <= 1) return 0;\n  else return 1 + mystery(n / 2);\n}\nWhat value is returned by mystery(8)?",
            options: ["3", "4", "8", "16"],
            correctAnswer: 0,
            explanation: "Trace: 8->4->2->1, counting steps: 3"
        },
        {
            question: "What is the time complexity of:\npublic static void sort(int[] elements) {\n  for (int j = 0; j < elements.length - 1; j++) {\n    int index = j;\n    for (int k = j + 1; k < elements.length; k++) {\n      if (elements[k] < elements[index]) index = k;\n    }\n    int temp = elements[j];\n    elements[j] = elements[index];\n    elements[index] = temp;\n  }\n}",
            options: ["O(n)", "O(n log n)", "O(n²)", "O(n³)"],
            correctAnswer: 2,
            explanation: "Selection sort with nested loops: O(n²)"
        },
        {
            question: "Consider:\npublic static void doSome(int[] arr, int lim) {\n  int v = 0;\n  int k = 0;\n  while (k < arr.length && arr[k] < lim) {\n    if (arr[k] > v) {\n      v = arr[k];\n    }\n    k++;\n  }\n}\nWhat does this method do?",
            options: [
                "Finds the largest value in arr",
                "Finds the largest value less than lim in arr",
                "Counts values less than lim in arr",
                "Finds the first value greater than lim in arr"
            ],
            correctAnswer: 1,
            explanation: "Tracks largest value (v) while elements are less than lim"
        },
        {
            question: "What is the output?\npublic class Dog {\n  public void act() {\n    System.out.print(\"run \");\n    eat();\n  }\n  public void eat() {\n    System.out.print(\"eat \");\n  }\n}\npublic class UnderDog extends Dog {\n  public void act() {\n    super.act();\n    System.out.print(\"sleep \");\n  }\n  public void eat() {\n    super.eat();\n    System.out.print(\"bark \");\n  }\n}\nDog fido = new UnderDog();\nfido.act();",
            options: [
                "run eat",
                "run eat sleep",
                "run eat sleep bark",
                "run eat bark sleep"
            ],
            correctAnswer: 3,
            explanation: "Polymorphism: UnderDog's eat() is called from Dog's act()"
        },
        {
            question: "Consider:\npublic class TimeRecord {\n  private int hours;\n  private int minutes; // 0 < minutes < 60\n  public void advance(int h, int m) {\n    hours = hours + h;\n    minutes = minutes + m;\n    /* missing code */\n  }\n}\nWhat should replace /* missing code */ to correctly update the time?",
            options: [
                "minutes = minutes % 60;",
                "minutes = minutes + hours % 60;",
                "hours = hours + minutes / 60;\nminutes = minutes % 60;",
                "hours = hours + minutes % 60;\nminutes = minutes / 60;"
            ],
            correctAnswer: 2,
            explanation: "Must carry extra minutes to hours and keep minutes in range 0-59"
        },
        {
            question: "What is the output of:\npublic static void mystery(int x) {\n  System.out.print(x % 10);\n  if ((x / 10) != 0) {\n    mystery(x / 10);\n  }\n  System.out.print(x % 10);\n}\nmystery(1234);",
            options: [
                "1234",
                "4321",
                "12344321",
                "43211234"
            ],
            correctAnswer: 2,
            explanation: "Recursive method prints digits forward then backward"
        },
        // ... Add more hard questions to reach 40
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