/**
 * Sample code snippets for the typing game.
 * In Phase 2, these will be fetched from the Rails API.
 */
export interface Snippet {
  id: string;
  title: string;
  language: string;
  body: string;
  difficulty: number;
}

export const SAMPLE_SNIPPETS: Snippet[] = [
  {
    id: 'snippet-1',
    title: 'Fibonacci Generator',
    language: 'javascript',
    difficulty: 2,
    body: `function fibonacci(n) {
  if (n <= 1) return n;
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    [prev, curr] = [curr, prev + curr];
  }
  return curr;
}`,
  },
  {
    id: 'snippet-2',
    title: 'Binary Search',
    language: 'python',
    difficulty: 3,
    body: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
  },
  {
    id: 'snippet-3',
    title: 'FizzBuzz',
    language: 'ruby',
    difficulty: 1,
    body: `def fizzbuzz(n)
  (1..n).map do |i|
    if i % 15 == 0
      "FizzBuzz"
    elsif i % 3 == 0
      "Fizz"
    elsif i % 5 == 0
      "Buzz"
    else
      i.to_s
    end
  end
end`,
  },
  {
    id: 'snippet-4',
    title: 'Linked List Node',
    language: 'typescript',
    difficulty: 3,
    body: `class ListNode<T> {
  value: T;
  next: ListNode<T> | null;

  constructor(value: T, next: ListNode<T> | null = null) {
    this.value = value;
    this.next = next;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current: ListNode<T> | null = this;
    while (current !== null) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}`,
  },
  {
    id: 'snippet-5',
    title: 'Quick Sort',
    language: 'python',
    difficulty: 4,
    body: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
  },
  {
    id: 'snippet-6',
    title: 'Memoize Decorator',
    language: 'javascript',
    difficulty: 3,
    body: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
  },
];

/**
 * Returns a random snippet, optionally filtered by language.
 */
export function getRandomSnippet(language?: string): Snippet {
  const pool = language
    ? SAMPLE_SNIPPETS.filter(s => s.language === language)
    : SAMPLE_SNIPPETS;
  const filtered = pool.length > 0 ? pool : SAMPLE_SNIPPETS;
  return filtered[Math.floor(Math.random() * filtered.length)];
}
