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
        },
        {
            "question": "What will be printed by the following code?\n```java\nint[] numbers = {1, 2, 3};\nSystem.out.println(numbers.length);\n```",
            "options": ["1", "2", "3", "Error"],
            "correctAnswer": 2,
            "explanation": "The length property returns the number of elements in the array.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString word = \"Java\";\nSystem.out.println(word.charAt(0));\n```",
            "options": ["J", "a", "v", "Error"],
            "correctAnswer": 0,
            "explanation": "charAt(0) returns the first character of the string.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint num = 10;\nSystem.out.println(num > 5 ? \"Big\" : \"Small\");\n```",
            "options": ["Big", "Small", "true", "false"],
            "correctAnswer": 0,
            "explanation": "The ternary operator returns 'Big' when the condition (num > 5) is true.",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint x = 10;\nint y = 3;\nSystem.out.println(x / y);\n```",
            "options": ["3", "3.33", "4", "Error"],
            "correctAnswer": 0,
            "explanation": "Integer division in Java truncates the decimal part, so 10/3 = 3",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"Hello\";\nSystem.out.println(str.length());\n```",
            "options": ["4", "5", "6", "Error"],
            "correctAnswer": 1,
            "explanation": "The length() method returns the number of characters in the string",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint x = 5;\nSystem.out.println(++x);\n```",
            "options": ["5", "6", "4", "Error"],
            "correctAnswer": 1,
            "explanation": "Pre-increment (++x) increments the value before using it",
            "difficulty": "easy"
        },
        {
            "question": "What is the correct way to create an integer array of size 5?",
            "options": ["int[5] arr;", "int arr[5];", "int[] arr = new int[5];", "array int[5];"],
            "correctAnswer": 2,
            "explanation": "In Java, arrays are created using the new keyword and size in square brackets",
            "difficulty": "easy"
        },
        {
            "question": "Which of these is a valid Java variable name?",
            "options": ["123var", "my-var", "_myVar", "class"],
            "correctAnswer": 2,
            "explanation": "Variable names can start with underscore or letter, but not with numbers or special characters",
            "difficulty": "easy"
        },
        {
            "question": "What is the default value of an int variable in Java?",
            "options": ["0", "1", "null", "undefined"],
            "correctAnswer": 0,
            "explanation": "The default value for int type variables in Java is 0",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nboolean x = true;\nSystem.out.println(!x);\n```",
            "options": ["true", "false", "1", "0"],
            "correctAnswer": 1,
            "explanation": "The ! operator negates a boolean value",
            "difficulty": "easy"
        },
        {
            "question": "Which keyword is used to define a class in Java?",
            "options": ["define", "class", "struct", "object"],
            "correctAnswer": 1,
            "explanation": "The 'class' keyword is used to define a class in Java",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"Hello\" + 123;\nSystem.out.println(str);\n```",
            "options": ["Hello123", "Hello 123", "Error", "123Hello"],
            "correctAnswer": 0,
            "explanation": "The + operator concatenates strings with other types",
            "difficulty": "easy"
        },
        {
            "question": "What is the correct way to declare a constant in Java?",
            "options": ["const int x = 10;", "final int X = 10;", "static int x = 10;", "#define x 10"],
            "correctAnswer": 1,
            "explanation": "The final keyword is used to declare constants in Java, typically with uppercase names",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nint x = 10;\nSystem.out.println(x > 5 && x < 15);\n```",
            "options": ["1", "0", "true", "false"],
            "correctAnswer": 2,
            "explanation": "The expression evaluates to true because 10 is between 5 and 15",
            "difficulty": "easy"
        },
        {
            "question": "Which package is automatically imported in all Java programs?",
            "options": ["java.util", "java.lang", "java.io", "java.net"],
            "correctAnswer": 1,
            "explanation": "java.lang package is automatically imported and contains fundamental classes",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nchar ch = 'A';\nSystem.out.println((int)ch);\n```",
            "options": ["A", "1", "65", "97"],
            "correctAnswer": 2,
            "explanation": "Casting char 'A' to int gives its ASCII value, which is 65",
            "difficulty": "easy"
        },
        {
            "question": "What is the size of int data type in Java?",
            "options": ["16 bits", "32 bits", "64 bits", "8 bits"],
            "correctAnswer": 1,
            "explanation": "In Java, int is a 32-bit signed integer type",
            "difficulty": "easy"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"Java\";\nSystem.out.println(str.indexOf('a'));\n```",
            "options": ["0", "1", "2", "-1"],
            "correctAnswer": 1,
            "explanation": "indexOf returns the first occurrence of the character, 'a' is at index 1",
            "difficulty": "easy"
        },
        {
            "question": "Which operator is used for string equality in Java?",
            "options": ["==", "===", ".equals()", "="],
            "correctAnswer": 2,
            "explanation": "The equals() method is used to compare string contents in Java",
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
        },
        {
            "question": "What will be printed by the following code?\n```java\nArrayList<Integer> list = new ArrayList<>();\nlist.add(1);\nlist.add(2);\nlist.add(1, 3);\nlist.remove(1);\nSystem.out.println(list);\n```",
            "options": ["[1, 2]", "[1, 3]", "[3, 2]", "[2, 3]"],
            "correctAnswer": 1,
            "explanation": "After adding 3 at index 1 [1,3,2], removing element at index 1 results in [1,2].",
            "difficulty": "medium"
        },
        {
            "question": "What will be printed by the following code?\n```java\nString str = \"Hello\";\nString result = \"\";\nfor (int i = str.length() - 1; i >= 0; i--) {\n    result += str.charAt(i);\n}\nSystem.out.println(result);\n```",
            "options": ["Hello", "olleH", "HELLO", "Error"],
            "correctAnswer": 1,
            "explanation": "The loop builds a new string by adding characters from the end of str, reversing it.",
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
        },
        {
            "question": "What will be printed by the following code?\n```java\npublic static int gcd(int a, int b) {\n    if (b == 0) return a;\n    return gcd(b, a % b);\n}\n// In main:\nSystem.out.println(gcd(48, 18));\n```",
            "options": ["6", "9", "3", "2"],
            "correctAnswer": 0,
            "explanation": "This recursive implementation of Euclidean algorithm finds GCD. For 48 and 18: 48=2×18+12, 18=1×12+6, 12=2×6+0, so GCD is 6.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\npublic static void quickSort(int[] arr, int low, int high) {\n    if (low < high) {\n        int pivot = arr[high];\n        int i = low - 1;\n        for (int j = low; j < high; j++) {\n            if (arr[j] <= pivot) {\n                i++;\n                int temp = arr[i];\n                arr[i] = arr[j];\n                arr[j] = temp;\n            }\n        }\n        int temp = arr[i + 1];\n        arr[i + 1] = arr[high];\n        arr[high] = temp;\n        System.out.print(Arrays.toString(arr) + \" \");\n    }\n}\n// In main:\nint[] arr = {5, 2, 8, 1, 9};\nquickSort(arr, 0, arr.length - 1);\n```",
            "options": ["[2, 5, 8, 1, 9] [2, 1, 8, 5, 9] [2, 1, 5, 8, 9]", "[1, 2, 5, 8, 9]", "[5, 2, 8, 1, 9] [2, 1, 5, 8, 9]", "[2, 1, 5, 8, 9]"],
            "correctAnswer": 0,
            "explanation": "QuickSort prints array after each partition. First partition around 9, then 5, then 8.",
            "difficulty": "hard"
        },
        {
            "question": "What will be printed by the following code?\n```java\ntry { throw new Exception(); }\ncatch(Exception e) { System.out.print(\"1\"); }\nfinally { System.out.print(\"2\"); }",
            "options": ["12", "1", "2", "Exception"],
            "correctAnswer": 0,
            "explanation": "catch block executes when exception is thrown, finally always executes",
            "difficulty": "hard"
        },
        {
            "question": "What is the time complexity of binary search?",
            "options": ["O(log n)", "O(n)", "O(n log n)", "O(1)"],
            "correctAnswer": 0,
            "explanation": "Binary search halves the search space in each step",
            "difficulty": "hard"
        },
        {
            "question": "Which of the following is the correct bubble sort algorithm in Java?",
            "options": [
                "for(int i=0;i<n-1;i++)for(int j=0;j<n-i-1;j++)if(arr[j]>arr[j+1])swap(arr[j],arr[j+1]);",
                "for(int i=0;i<n;i++)for(int j=0;j<n;j++)if(arr[i]>arr[j])swap(arr[i],arr[j]);",
                "for(int i=0;i<n;i++)if(arr[i]>arr[i+1])swap(arr[i],arr[i+1]);",
                "for(int i=n-1;i>=0;i--)for(int j=0;j<i;j++)if(arr[j]>arr[j+1])swap(arr[j],arr[j+1]);"
            ],
            "correctAnswer": 0,
            "explanation": "Bubble sort uses nested loops to repeatedly swap adjacent elements",
            "difficulty": "hard"
        },
        {
            "question": "What is the purpose of the volatile keyword in Java?",
            "options": [
                "Thread visibility",
                "Memory optimization",
                "Performance improvement",
                "Exception handling"
            ],
            "correctAnswer": 0,
            "explanation": "volatile ensures that variable updates are immediately visible to other threads",
            "difficulty": "hard"
        },
        {
            "question": "What is the diamond problem in multiple inheritance?",
            "options": [
                "When a class inherits from two classes with common ancestor",
                "When a class has multiple constructors",
                "When a class implements multiple interfaces",
                "When a class has cyclic dependencies"
            ],
            "correctAnswer": 0,
            "explanation": "The diamond problem occurs in multiple inheritance when a class inherits from two classes that have a common ancestor",
            "difficulty": "hard"
        },
        {
            "question": "What is the difference between Runnable and Callable?",
            "options": [
                "Callable can return value and throw exceptions",
                "Runnable is faster than Callable",
                "Callable is deprecated",
                "Runnable supports multiple threads"
            ],
            "correctAnswer": 0,
            "explanation": "Runnable's run() returns void, while Callable's call() can return values and throw checked exceptions",
            "difficulty": "hard"
        },
        {
            "question": "How does HashMap work internally in Java?",
            "options": [
                "Uses buckets with linked lists/trees for collision",
                "Uses only arrays for storage",
                "Uses only linked lists",
                "Uses binary search trees only"
            ],
            "correctAnswer": 0,
            "explanation": "HashMap uses an array of buckets, each containing a linked list or tree of entries with the same hash",
            "difficulty": "hard"
        },
        {
            "question": "What is the best way to prevent deadlocks in Java?",
            "options": [
                "Acquire locks in fixed order",
                "Use more synchronization",
                "Avoid using locks",
                "Use wait() and notify()"
            ],
            "correctAnswer": 0,
            "explanation": "Acquiring locks in a consistent order prevents circular wait condition",
            "difficulty": "hard"
        }
    ]
};

    // Helper function to get questions by difficulty
function getQuestionsByDifficulty(difficulty) {
    const normalizedDifficulty = difficulty.toLowerCase();
    
    // Get custom questions from localStorage
    const customQuestions = JSON.parse(localStorage.getItem('customQuestions') || '[]');
    const customQuestionsForDifficulty = customQuestions.filter(q => q.difficulty === normalizedDifficulty);
    
    // Combine built-in and custom questions
    let allQuestions = [];
    if (QUESTIONS.hasOwnProperty(normalizedDifficulty)) {
        allQuestions = QUESTIONS[normalizedDifficulty];
    }
    
    // Add custom questions
    allQuestions = allQuestions.concat(customQuestionsForDifficulty);
    
    if (allQuestions.length === 0) {
        console.error(`No questions found for difficulty: ${difficulty}. Please choose 'easy', 'medium', or 'hard'.`);
                return [];
    }
    
    return allQuestions;
}

// Helper function to generate wrong answers for multiple choice questions
function generateWrongAnswers(correctAnswer, questionType) {
    const wrongAnswers = [];
    
    // Different types of wrong answers based on question type
    const numberAnswers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '-1'];
    const booleanAnswers = ['true', 'false', '1', '0', 'yes', 'no'];
    const dataStructureAnswers = ['Array', 'LinkedList', 'Stack', 'Queue', 'Tree', 'HashMap', 'Set'];
    const methodAnswers = ['length()', 'size()', 'isEmpty()', 'clear()', 'remove()', 'add()', 'get()'];
    const keywordAnswers = ['public', 'private', 'static', 'final', 'abstract', 'synchronized', 'volatile'];
    const commonWrongAnswers = ['Error', 'null', 'undefined', 'NaN', 'Exception'];

    // Combine all possible answers
    let possibleAnswers = [...numberAnswers, ...booleanAnswers, ...dataStructureAnswers, 
                          ...methodAnswers, ...keywordAnswers, ...commonWrongAnswers];
    
    // Remove the correct answer from possible answers
    possibleAnswers = possibleAnswers.filter(answer => answer !== correctAnswer);
    
    // Shuffle the array
    possibleAnswers.sort(() => Math.random() - 0.5);
    
    // Take first 3 answers
    return possibleAnswers.slice(0, 3);
    }

    // Helper function to get a random question from a specific difficulty
function getRandomQuestion(difficulty) {
        const questions = getQuestionsByDifficulty(difficulty);
    if (questions.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * questions.length);
        const question = questions[randomIndex];

    // If the question doesn't have options, generate them
    if (!question.options || question.options.length === 0) {
        const correctAnswer = question.correctAnswer;
        const wrongAnswers = generateWrongAnswers(correctAnswer, question.type);
        
        // Create options array with correct answer and wrong answers
        const options = [...wrongAnswers];
        // Insert correct answer at random position
        const correctPosition = Math.floor(Math.random() * 4);
        options.splice(correctPosition, 0, correctAnswer);
        
        question.options = options;
        question.correctAnswer = correctPosition;
    }

    return question;
}

export { QUESTIONS, getQuestionsByDifficulty, getRandomQuestion }; 