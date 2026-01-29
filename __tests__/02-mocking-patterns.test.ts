/**
 * =============================================================================
 * PROFESSIONAL SOFTWARE TESTING GUIDE - Part 2: Mocking
 * =============================================================================
 *
 * WHY MOCK?
 * - Isolate the unit under test
 * - Control external dependencies (APIs, databases, time)
 * - Make tests fast and deterministic
 * - Test error conditions that are hard to reproduce
 *
 * WHAT TO MOCK:
 * - External services (Firebase, APIs)
 * - Time-dependent code (Date, setTimeout)
 * - Random values
 * - File system operations
 * - Network requests
 *
 * WHAT NOT TO MOCK:
 * - The code you're testing
 * - Simple utility functions
 * - Value objects / data structures
 */

// =============================================================================
// LESSON 1: BASIC FUNCTION MOCKING
// =============================================================================

describe('Lesson 1: Basic Mocking with jest.fn()', () => {
  /**
   * jest.fn() creates a mock function that:
   * - Tracks all calls and arguments
   * - Can be configured to return specific values
   * - Can be configured to throw errors
   */

  it('tracks function calls', () => {
    const mockCallback = jest.fn();

    // Call the mock
    mockCallback('arg1', 'arg2');
    mockCallback('arg3');

    // Verify calls
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockCallback).toHaveBeenLastCalledWith('arg3');
  });

  it('returns configured values', () => {
    const mockGetUser = jest.fn()
      .mockReturnValueOnce({ id: '1', name: 'First' })
      .mockReturnValueOnce({ id: '2', name: 'Second' })
      .mockReturnValue({ id: 'default', name: 'Default' });

    expect(mockGetUser()).toEqual({ id: '1', name: 'First' });
    expect(mockGetUser()).toEqual({ id: '2', name: 'Second' });
    expect(mockGetUser()).toEqual({ id: 'default', name: 'Default' });
    expect(mockGetUser()).toEqual({ id: 'default', name: 'Default' });
  });

  it('mocks async functions', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      id: 'user123',
      name: 'Test User',
    });

    const result = await mockFetch('user123');

    expect(result.name).toBe('Test User');
    expect(mockFetch).toHaveBeenCalledWith('user123');
  });

  it('mocks rejected promises for error testing', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(mockFetch()).rejects.toThrow('Network error');
  });
});

// =============================================================================
// LESSON 2: MOCKING MODULES
// =============================================================================

describe('Lesson 2: Mocking Modules', () => {
  /**
   * jest.mock() replaces an entire module with a mock
   * This is how you mock Firebase, APIs, etc.
   *
   * Note: In a real test file, jest.mock() goes at the top level
   * Here we're demonstrating the concepts inline
   */

  // Simulating what a mocked Firebase might look like
  const mockFirestore = {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
  };

  // Function that uses Firestore
  const getUserProfile = async (userId: string) => {
    const docRef = mockFirestore.doc(`users/${userId}`);
    const docSnap = await mockFirestore.getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('returns user data when document exists', async () => {
    // ARRANGE: Configure mock to return user data
    const mockDocRef = { path: 'users/user123' };
    const mockDocSnap = {
      exists: () => true,
      data: () => ({ id: 'user123', name: 'Test User', email: 'test@example.com' }),
    };

    mockFirestore.doc.mockReturnValue(mockDocRef);
    mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

    // ACT
    const user = await getUserProfile('user123');

    // ASSERT
    expect(user).toEqual({ id: 'user123', name: 'Test User', email: 'test@example.com' });
    expect(mockFirestore.doc).toHaveBeenCalledWith('users/user123');
  });

  it('returns null when document does not exist', async () => {
    // ARRANGE
    const mockDocSnap = {
      exists: () => false,
      data: () => null,
    };

    mockFirestore.doc.mockReturnValue({});
    mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

    // ACT
    const user = await getUserProfile('nonexistent');

    // ASSERT
    expect(user).toBeNull();
  });
});

// =============================================================================
// LESSON 3: SPIES - Watching Real Functions
// =============================================================================

describe('Lesson 3: Spies with jest.spyOn()', () => {
  /**
   * Spies watch real functions without replacing them (by default)
   * Use spies when you want to:
   * - Verify a method was called without changing its behavior
   * - Temporarily override a method, then restore it
   */

  const mathUtils = {
    add: (a: number, b: number) => a + b,
    multiply: (a: number, b: number) => a * b,
    calculateScore: function(base: number, multiplier: number) {
      return this.multiply(this.add(base, 10), multiplier);
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('spies on method calls without changing behavior', () => {
    const addSpy = jest.spyOn(mathUtils, 'add');

    const result = mathUtils.add(5, 3);

    expect(result).toBe(8); // Original behavior preserved
    expect(addSpy).toHaveBeenCalledWith(5, 3);
  });

  it('can override method behavior temporarily', () => {
    const multiplySpy = jest.spyOn(mathUtils, 'multiply').mockReturnValue(100);

    const result = mathUtils.multiply(5, 3);

    expect(result).toBe(100); // Overridden behavior
    expect(multiplySpy).toHaveBeenCalledWith(5, 3);
  });

  it('can spy on Date for time-dependent tests', () => {
    const mockDate = new Date('2024-06-15T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as Date);

    const now = new Date();

    expect(now.toISOString()).toBe('2024-06-15T12:00:00.000Z');
  });
});

// =============================================================================
// LESSON 4: TESTING WITH DEPENDENCY INJECTION
// =============================================================================

describe('Lesson 4: Dependency Injection for Testability', () => {
  /**
   * Dependency Injection makes code testable by:
   * - Allowing you to pass in mock dependencies
   * - Avoiding hidden dependencies on global state
   * - Making dependencies explicit
   *
   * BAD (hard to test):
   *   function createSession() {
   *     const db = firebase.firestore();  // Hidden dependency!
   *     return db.collection('sessions').add(...);
   *   }
   *
   * GOOD (easy to test):
   *   function createSession(db: Firestore) {
   *     return db.collection('sessions').add(...);
   *   }
   */

  // Type for our database abstraction
  interface Database {
    addDocument: (collection: string, data: object) => Promise<string>;
    getDocument: (collection: string, id: string) => Promise<object | null>;
  }

  // The function accepts its dependencies
  const createSession = async (
    db: Database,
    hostId: string,
    duration: number
  ): Promise<string> => {
    const sessionData = {
      hostId,
      duration,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return db.addDocument('sessions', sessionData);
  };

  it('creates session with correct data', async () => {
    // ARRANGE: Create a mock database
    const mockDb: Database = {
      addDocument: jest.fn().mockResolvedValue('session123'),
      getDocument: jest.fn(),
    };

    // ACT
    const sessionId = await createSession(mockDb, 'host456', 60);

    // ASSERT
    expect(sessionId).toBe('session123');
    expect(mockDb.addDocument).toHaveBeenCalledWith(
      'sessions',
      expect.objectContaining({
        hostId: 'host456',
        duration: 60,
        status: 'pending',
      })
    );
  });
});

// =============================================================================
// LESSON 5: MOCKING TIMERS
// =============================================================================

describe('Lesson 5: Mocking Timers', () => {
  /**
   * Jest can control time for testing:
   * - setTimeout, setInterval
   * - Date.now()
   * - Fast-forward time without waiting
   */

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('tests debounced function', () => {
    const callback = jest.fn();

    // Simple debounce implementation
    const debounce = (fn: () => void, delay: number) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(fn, delay);
      };
    };

    const debouncedFn = debounce(callback, 1000);

    // Call multiple times rapidly
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // Callback not called yet
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Now it's called (only once!)
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('tests countdown timer', () => {
    const onTick = jest.fn();
    const onComplete = jest.fn();

    // Simple countdown
    const startCountdown = (seconds: number) => {
      let remaining = seconds;
      const interval = setInterval(() => {
        remaining--;
        onTick(remaining);
        if (remaining === 0) {
          clearInterval(interval);
          onComplete();
        }
      }, 1000);
    };

    startCountdown(3);

    // After 1 second
    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenLastCalledWith(2);

    // After 2 seconds total
    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenLastCalledWith(1);

    // After 3 seconds total
    jest.advanceTimersByTime(1000);
    expect(onTick).toHaveBeenLastCalledWith(0);
    expect(onComplete).toHaveBeenCalled();
  });
});

// =============================================================================
// LESSON 6: PARTIAL MOCKING
// =============================================================================

describe('Lesson 6: Partial Mocking', () => {
  /**
   * Sometimes you want to mock only part of a module
   * Use jest.requireActual() to get the real implementation
   */

  // Original module simulation
  const sessionUtils = {
    formatDuration: (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    },
    calculatePenalty: (violationSeconds: number): number => {
      return violationSeconds * 0.5;
    },
    getSessionSummary: function(duration: number, violations: number) {
      return {
        duration: this.formatDuration(duration),
        penalty: this.calculatePenalty(violations),
        passed: violations < 300,
      };
    },
  };

  it('mocks only specific methods', () => {
    // Mock only calculatePenalty, keep formatDuration real
    const penaltySpy = jest.spyOn(sessionUtils, 'calculatePenalty')
      .mockReturnValue(999);

    const summary = sessionUtils.getSessionSummary(3600, 60);

    // formatDuration uses real implementation
    expect(summary.duration).toBe('60m 0s');

    // calculatePenalty uses mocked value
    expect(summary.penalty).toBe(999);
  });
});
