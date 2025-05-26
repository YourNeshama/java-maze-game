const QUESTIONS = {
    easy: [
        {
            "question": "What will be printed by the following code?\n```java\nint x = 15;\nint y = 4;\nSystem.out.println(x % y);\n```",
            "options": ["3", "3.75", "4", "Error"],
            "correctAnswer": 0,
            "explanation": "The modulo operator (%) returns the remainder of division. 15 divided by 4 is 3 with remainder 3.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"Hello\";\nSystem.out.println(str.toUpperCase());\n```",
            "options": ["Hello", "HELLO", "hello", "Error"],
            "correctAnswer": 1,
            "explanation": "The toUpperCase() method converts all characters in the string to uppercase.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint[] arr = {2, 4, 6, 8};\nSystem.out.println(arr[2]);\n```",
            "options": ["2", "4", "6", "8"],
            "correctAnswer": 2,
            "explanation": "Array indices start at 0, so arr[2] refers to the third element (6).",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nboolean a = true;\nboolean b = false;\nSystem.out.println(a && b);\n```",
            "options": ["true", "false", "1", "0"],
            "correctAnswer": 1,
            "explanation": "The logical AND operator (&&) returns true only if both operands are true.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint x = 5;\nSystem.out.println(x++ + \" \" + x);\n```",
            "options": ["5 5", "5 6", "6 6", "6 5"],
            "correctAnswer": 1,
            "explanation": "Post-increment (x++) uses the value first, then increments it. So x is 5 when printed first, then becomes 6.",
            "difficulty": "easy"
        }
    ],
    medium: [
        {
            "question": "What will be printed by the following code?\n```java\nArrayList<Integer> list = new ArrayList<>();\nlist.add(10);\nlist.add(20);\nlist.add(1, 15);\nSystem.out.println(list);\n```",
            "options": ["[10, 15, 20]", "[15, 10, 20]", "[10, 20, 15]", "[20, 15, 10]"],
            "correctAnswer": 0,
            "explanation": "add(index, element) inserts at the specified position. The elements shift right.",
            "difficulty": "medium"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString s1 = new String(\"hello\");\nString s2 = new String(\"hello\");\nSystem.out.println(s1 == s2);\nSystem.out.println(s1.equals(s2));\n```",
            "options": ["true\\ntrue", "false\\ntrue", "true\\nfalse", "false\\nfalse"],
            "correctAnswer": 1,
            "explanation": "== compares object references (different for new String()), equals() compares content.",
            "difficulty": "medium"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint[][] matrix = {{1, 2}, {3, 4}};\nfor (int[] row : matrix) {\n    for (int num : row) {\n        System.out.print(num + \" \");\n    }\n}\n```",
            "options": ["1 2 3 4 ", "1 3 2 4 ", "[1, 2] [3, 4]", "Error"],
            "correctAnswer": 0,
            "explanation": "The nested enhanced for loops iterate through each element row by row.",
            "difficulty": "medium"
        },
        {
            "question": "What will be printed by the following code?\n```java\nArrayList<String> words = new ArrayList<>();\nwords.add(\"cat\");\nwords.add(\"dog\");\nwords.set(0, \"bird\");\nSystem.out.println(words);\n```",
            "options": ["[cat, dog]", "[bird, dog]", "[bird, cat]", "[cat, bird]"],
            "correctAnswer": 1,
            "explanation": "set(index, element) replaces the element at the specified position.",
            "difficulty": "medium"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"programming\";\nSystem.out.println(str.substring(2, 5));\n```",
            "options": ["pro", "ogr", "rog", "gram"],
            "correctAnswer": 1,
            "explanation": "substring(start, end) returns characters from start (inclusive) to end (exclusive).",
            "difficulty": "medium"
        }
    ],
    hard: [
        {
            "question": "What will be printed by the following code?\n```java\npublic static void mystery(int n) {\n    if (n <= 0) return;\n    System.out.print(n + \" \");\n    mystery(n-2);\n    System.out.print(n + \" \");\n}\n// In main:\nmystery(5);\n```",
            "options": ["5 3 1 1 3 5 ", "5 4 3 2 1 ", "1 3 5 5 3 1 ", "5 3 1 "],
            "correctAnswer": 0,
            "explanation": "Recursive call prints descending odd numbers, then prints same numbers ascending after each call returns.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\nArrayList<Integer> nums = new ArrayList<>();\nfor (int i = 1; i <= 5; i++) nums.add(i);\nfor (int i = 0; i < nums.size(); i++) {\n    if (nums.get(i) % 2 == 0) {\n        nums.remove(i);\n    }\n}\nSystem.out.println(nums);\n```",
            "options": ["[1, 3, 5]", "[1, 2, 3, 4, 5]", "[1, 3, 4, 5]", "[1, 2, 3, 5]"],
            "correctAnswer": 2,
            "explanation": "When removing elements while iterating, the indices shift. After removing 2, index doesn't adjust, so 4 is skipped.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\npublic static int binarySearch(int[] arr, int target) {\n    int left = 0, right = arr.length - 1;\n    while (left <= right) {\n        int mid = (left + right) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n// In main:\nint[] arr = {1, 3, 5, 7, 9};\nSystem.out.println(binarySearch(arr, 7));\n```",
            "options": ["7", "3", "-1", "4"],
            "correctAnswer": 1,
            "explanation": "Binary search finds 7 at index 3. The algorithm repeatedly divides the search interval in half.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\npublic static void bubbleSort(int[] arr) {\n    for (int i = 0; i < arr.length - 1; i++) {\n        for (int j = 0; j < arr.length - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                int temp = arr[j];\n                arr[j] = arr[j + 1];\n                arr[j + 1] = temp;\n            }\n        }\n        System.out.print(Arrays.toString(arr) + \" \");\n    }\n}\n// In main:\nint[] arr = {5, 2, 8, 1};\nbubbleSort(arr);\n```",
            "options": ["[2, 5, 1, 8] [2, 1, 5, 8] [1, 2, 5, 8] ", "[1, 2, 5, 8] ", "[5, 2, 8, 1] [2, 5, 1, 8] ", "[2, 5, 1, 8] [1, 2, 5, 8] "],
            "correctAnswer": 0,
            "explanation": "Bubble sort prints array after each outer loop iteration, showing intermediate states.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\npublic static int fibonacci(int n) {\n    if (n <= 1) return n;\n    return fibonacci(n-1) + fibonacci(n-2);\n}\n// In main:\nfor (int i = 0; i < 5; i++) {\n    System.out.print(fibonacci(i) + \" \");\n}\n```",
            "options": ["0 1 2 3 4 ", "0 1 1 2 3 ", "1 1 2 3 5 ", "0 1 1 2 2 "],
            "correctAnswer": 1,
            "explanation": "Fibonacci sequence starts with 0, 1, and each subsequent number is the sum of the previous two.",
            "difficulty": "hard"
        }
    ]
};

// Helper function to get questions by difficulty
function getQuestionsByDifficulty(difficulty) {
    const normalizedDifficulty = difficulty.toLowerCase();
    if (QUESTIONS.hasOwnProperty(normalizedDifficulty)) {
        return QUESTIONS[normalizedDifficulty];
    }
    console.error(`Invalid difficulty: ${difficulty}. Please choose 'easy', 'medium', or 'hard'.`);
    return [];
}

// Helper function to get a random question from a specific difficulty
function getRandomQuestion(difficulty) {
    const questions = getQuestionsByDifficulty(difficulty);
    if (questions.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

export { QUESTIONS, getQuestionsByDifficulty, getRandomQuestion }; 