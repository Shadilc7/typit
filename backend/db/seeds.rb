# db/seeds.rb
puts "Seeding Snippets..."

TypingResult.destroy_all
RaceParticipant.destroy_all rescue nil
Race.destroy_all
Snippet.destroy_all

snippets = [
  {
    title: 'Fibonacci Generator',
    language: 'javascript',
    difficulty: 2,
    body: "function fibonacci(n) {\n  if (n <= 1) return n;\n  let prev = 0, curr = 1;\n  for (let i = 2; i <= n; i++) {\n    [prev, curr] = [curr, prev + curr];\n  }\n  return curr;\n}"
  },
  {
    title: 'Binary Search',
    language: 'python',
    difficulty: 3,
    body: "def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1"
  },
  {
    title: 'FizzBuzz',
    language: 'ruby',
    difficulty: 1,
    body: "def fizzbuzz(n)\n  (1..n).map do |i|\n    if i % 15 == 0\n      \"FizzBuzz\"\n    elsif i % 3 == 0\n      \"Fizz\"\n    elsif i % 5 == 0\n      \"Buzz\"\n    else\n      i.to_s\n    end\n  end\nend"
  },
  {
    title: 'Linked List Node',
    language: 'typescript',
    difficulty: 3,
    body: "class ListNode<T> {\n  value: T;\n  next: ListNode<T> | null;\n\n  constructor(value: T, next: ListNode<T> | null = null) {\n    this.value = value;\n    this.next = next;\n  }\n\n  toArray(): T[] {\n    const result: T[] = [];\n    let current: ListNode<T> | null = this;\n    while (current !== null) {\n      result.push(current.value);\n      current = current.next;\n    }\n    return result;\n  }\n}"
  },
  {
    title: 'Quick Sort',
    language: 'python',
    difficulty: 4,
    body: "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)"
  },
  {
    title: 'Memoize Decorator',
    language: 'javascript',
    difficulty: 3,
    body: "function memoize(fn) {\n  const cache = new Map();\n  return function (...args) {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) {\n      return cache.get(key);\n    }\n    const result = fn.apply(this, args);\n    cache.set(key, result);\n    return result;\n  };\n}"
  },
  {
    title: 'The Quick Brown Fox',
    language: 'text',
    difficulty: 1,
    body: "The quick brown fox jumps over the lazy dog. This sentence contains every letter in the English alphabet. It is often used to test typewriters and computer keyboards. How fast can you type it?"
  },
  {
    title: 'To Be Or Not To Be',
    language: 'text',
    difficulty: 2,
    body: "To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them?"
  },
  {
    title: 'A Tale of Two Cities',
    language: 'text',
    difficulty: 3,
    body: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of light, it was the season of darkness, it was the spring of hope, it was the winter of despair."
  },
  {
    title: 'Steve Jobs Quote',
    language: 'text',
    difficulty: 1,
    body: "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma - which is living with the results of other people's thinking."
  },
  {
    title: 'Short Hello',
    language: 'text',
    difficulty: 1,
    body: "Hello there! Welcome to the typing test. This is a very simple and easy sentence to get you warmed up for the harder challenges ahead."
  },
  {
    title: 'Simple Weather',
    language: 'text',
    difficulty: 1,
    body: "The weather today is very sunny and bright. I hope it stays this way for the entire weekend so we can go out and play in the park."
  },
  {
    title: 'Basic Morning Routine',
    language: 'text',
    difficulty: 1,
    body: "I wake up early every morning, brush my teeth, and make a hot cup of coffee. It helps me start my day with a lot of energy."
  },
  {
    title: 'A Little Fox',
    language: 'text',
    difficulty: 1,
    body: "A little fox ran across the green meadow. It was looking for some food before the sun went down. The forest was quiet and peaceful."
  },
  {
    title: 'Daily Commute',
    language: 'text',
    difficulty: 2,
    body: "Taking the train to work can be quite relaxing if you have a good book to read. You just sit back, listen to the rhythmic sounds of the tracks, and let the journey pass by."
  },
  {
    title: 'The Art of Baking',
    language: 'text',
    difficulty: 2,
    body: "Baking bread at home requires patience and precision. You must carefully measure the flour, water, and yeast, then allow the dough enough time to rise before placing it in a hot oven."
  },
  {
    title: 'Stargazing',
    language: 'text',
    difficulty: 2,
    body: "Looking up at the night sky always makes me feel incredibly small. The countless stars scattered across the dark canvas remind us of the vastness of the universe we live in."
  },
  {
    title: 'Learning to Ride',
    language: 'text',
    difficulty: 2,
    body: "Learning to ride a bicycle is a rite of passage for many children. It takes a few scraped knees and a lot of determination, but the feeling of balancing on two wheels is unforgettable."
  },
  {
    title: 'Einstein Quote',
    language: 'text',
    difficulty: 2,
    body: "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution."
  },
  {
    title: 'The Great Gatsby',
    language: 'text',
    difficulty: 3,
    body: "He smiled understandingly-much more than understandingly. It was one of those rare smiles with a quality of eternal reassurance in it, that you may come across four or five times in life."
  },
  {
    title: 'Coffee Science',
    language: 'text',
    difficulty: 3,
    body: "The chemical process of roasting coffee beans is known as the Maillard reaction. This reaction between amino acids and reducing sugars gives browned food its distinctive flavor."
  },
  {
    title: 'Ocean Currents',
    language: 'text',
    difficulty: 3,
    body: "Ocean currents are driven by wind, water density differences, and tides. They play a crucial role in regulating the Earth's climate by transporting warm water from the equator toward the poles."
  },
  {
    title: 'History of Aviation',
    language: 'text',
    difficulty: 3,
    body: "On December 17, 1903, Orville and Wilbur Wright achieved the first successful flight of a powered, controlled airplane. The historic flight lasted only 12 seconds and covered 120 feet."
  },
  {
    title: 'Moby Dick Opening',
    language: 'text',
    difficulty: 3,
    body: "Call me Ishmael. Some years ago-never mind how long precisely-having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little."
  },
  {
    title: 'Financial Analysis',
    language: 'text',
    difficulty: 4,
    body: "The company reported a Q3 revenue of $45.2M, representing an 18.5% year-over-year growth. However, operating expenses rose by 22%, driven largely by R&D investments and an expanded marketing budget across the EMEA region."
  },
  {
    title: 'Quantum Mechanics',
    language: 'text',
    difficulty: 4,
    body: "In quantum mechanics, Heisenberg's uncertainty principle states that certain pairs of physical properties, like position (x) and momentum (p), cannot be simultaneously measured with arbitrarily high precision: Δx * Δp >= h/(4*pi)."
  },
  {
    title: 'Shakespeare Sonnet',
    language: 'text',
    difficulty: 4,
    body: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, And summer's lease hath all too short a date."
  },
  {
    title: 'Legal Disclaimer',
    language: 'text',
    difficulty: 4,
    body: "Terms & Conditions (Section 4.1.a): The Provider shall not be held liable for any incidental, consequential, or indirect damages (including, but not limited to, loss of data or profit) arising out of the use or inability to use the Service."
  },
  {
    title: 'Chemical Compound',
    language: 'text',
    difficulty: 4,
    body: "Caffeine is a central nervous system stimulant of the methylxanthine class. Its chemical formula is C8H10N4O2. It acts primarily by reversibly blocking the action of adenosine on its receptors, preventing the onset of drowsiness."
  },
  {
    title: 'Advanced Cryptography',
    language: 'text',
    difficulty: 5,
    body: "The RSA algorithm involves four steps: key generation, key distribution, encryption, and decryption. Let p = 61 and q = 53. Compute n = p * q = 3233. The totient φ(n) = (p-1)*(q-1) = 3120. Choose e = 17, then compute d = 2753 such that (e * d) % φ(n) == 1."
  },
  {
    title: 'Complex Regex Pattern',
    language: 'text',
    difficulty: 5,
    body: "To match an IPv4 address, you can use the regular expression: ^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$. This ensures each octet is strictly between 0 and 255."
  },
  {
    title: 'Obfuscated Code Logic',
    language: 'text',
    difficulty: 5,
    body: "What is the output of the following sequence? x ^= y; y ^= x; x ^= y; This is the classic XOR swap algorithm. If x = 0b1010 and y = 0b1100, the intermediate states are: x = 0b0110, y = 0b1010, x = 0b1100. Thus, the values are successfully swapped."
  },
  {
    title: 'Astrophysics Equation',
    language: 'text',
    difficulty: 5,
    body: "The Schwarzschild radius (r_s) of an object of mass M is given by the equation: r_s = (2 * G * M) / c^2, where G is the gravitational constant (6.674×10^-11 m^3/kg*s^2) and c is the speed of light (~2.9979×10^8 m/s). For Earth, r_s is approximately 8.87 millimeters."
  },
  {
    title: 'Medical Terminology',
    language: 'text',
    difficulty: 5,
    body: "The patient presented with acute sphygmomanometric irregularities, suggesting transient ischemic attacks or potentially paroxysmal supraventricular tachycardia (PSVT). Treatment required intravenous administration of 6mg Adenosine, followed by a rapid 20mL saline flush."
  }
]

snippets.each do |s|
  Snippet.create!(
    title: s[:title],
    language: s[:language],
    difficulty: s[:difficulty],
    body: s[:body],
    char_count: s[:body].length
  )
end

puts "Seeded #{Snippet.count} snippets!"
