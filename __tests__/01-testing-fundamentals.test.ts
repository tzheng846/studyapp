/**
 * =============================================================================
 * PROFESSIONAL SOFTWARE TESTING GUIDE - Part 1: Fundamentals
 * =============================================================================
 *
 * THE TESTING PYRAMID (from bottom to top):
 *
 *                    /\
 *                   /  \        E2E Tests (Few, Slow, Expensive)
 *                  /----\       - Full user flows
 *                 /      \      - Real browser/device
 *                /--------\
 *               /          \    Integration Tests (Some)
 *              /------------\   - Multiple units together
 *             /              \  - API calls, DB queries
 *            /----------------\
 *           /                  \ Unit Tests (Many, Fast, Cheap)
 *          /--------------------\ - Single functions
 *                                 - Isolated logic
 *
 * PROFESSIONAL BEST PRACTICES:
 *
 * 1. AAA Pattern: Arrange, Act, Assert
 * 2. One assertion per concept (not strictly one per test)
 * 3. Test behavior, not implementation
 * 4. Use descriptive test names that explain WHAT and WHY
 * 5. Keep tests independent - no shared mutable state
 * 6. F.I.R.S.T principles: Fast, Independent, Repeatable, Self-validating, Timely
 */

// =============================================================================
// LESSON 1: THE AAA PATTERN (Arrange, Act, Assert)
// =============================================================================

describe('Lesson 1: AAA Pattern', () => {
  /**
   * The AAA pattern makes tests readable and consistent:
   * - ARRANGE: Set up the test data and conditions
   * - ACT: Execute the code being tested
   * - ASSERT: Verify the results
   */

  // Example: Testing a pure function
  const calculateSessionScore = (
    durationMinutes: number,
    violationSeconds: number
  ): number => {
    const maxScore = 100;
    const penaltyPerSecond = 0.5;
    const penalty = violationSeconds * penaltyPerSecond;
    return Math.max(0, maxScore - penalty);
  };

  it('calculates perfect score for session with no violations', () => {
    // ARRANGE: Set up test data
    const duration = 60;
    const violations = 0;

    // ACT: Call the function
    const score = calculateSessionScore(duration, violations);

    // ASSERT: Verify the result
    expect(score).toBe(100);
  });

  it('reduces score by 0.5 per violation second', () => {
    // ARRANGE
    const duration = 60;
    const violations = 20; // 20 seconds of violations

    // ACT
    const score = calculateSessionScore(duration, violations);

    // ASSERT
    expect(score).toBe(90); // 100 - (20 * 0.5)
  });

  it('never returns negative score', () => {
    // ARRANGE
    const duration = 60;
    const violations = 500; // More than would reduce to 0

    // ACT
    const score = calculateSessionScore(duration, violations);

    // ASSERT
    expect(score).toBe(0);
  });
});

// =============================================================================
// LESSON 2: DESCRIPTIVE TEST NAMES
// =============================================================================

describe('Lesson 2: Descriptive Test Names', () => {
  /**
   * BAD test names:
   * - "test1"
   * - "it works"
   * - "getUser test"
   *
   * GOOD test names follow patterns:
   * - "should [expected behavior] when [condition]"
   * - "[function] returns [expected] for [input]"
   * - "given [context], when [action], then [outcome]"
   */

  const getViolationCategory = (seconds: number): string => {
    if (seconds < 30) return 'minor';
    if (seconds < 120) return 'medium';
    if (seconds < 300) return 'large';
    return 'catastrophic';
  };

  // GOOD: Descriptive names that explain the behavior
  describe('getViolationCategory', () => {
    it('returns "minor" for violations under 30 seconds', () => {
      expect(getViolationCategory(15)).toBe('minor');
    });

    it('returns "medium" for violations between 30 seconds and 2 minutes', () => {
      expect(getViolationCategory(60)).toBe('medium');
    });

    it('returns "catastrophic" for violations over 5 minutes', () => {
      expect(getViolationCategory(301)).toBe('catastrophic');
    });
  });
});

// =============================================================================
// LESSON 3: TESTING EDGE CASES (Boundary Testing)
// =============================================================================

describe('Lesson 3: Edge Cases & Boundary Testing', () => {
  /**
   * Always test:
   * - Zero/empty values
   * - Boundary conditions (exactly at threshold)
   * - One below/above threshold
   * - Negative values
   * - Maximum/overflow values
   * - Null/undefined (if applicable)
   */

  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  describe('formatTime edge cases', () => {
    // Zero
    it('handles zero seconds', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    // Negative (edge case)
    it('handles negative seconds gracefully', () => {
      expect(formatTime(-5)).toBe('00:00');
    });

    // Boundary: exactly 60 seconds
    it('handles exactly 60 seconds (1 minute boundary)', () => {
      expect(formatTime(60)).toBe('01:00');
    });

    // Just below boundary
    it('handles 59 seconds (just below minute boundary)', () => {
      expect(formatTime(59)).toBe('00:59');
    });

    // Large values
    it('handles large values correctly', () => {
      expect(formatTime(3661)).toBe('61:01'); // 1 hour, 1 minute, 1 second
    });
  });
});

// =============================================================================
// LESSON 4: TEST ISOLATION
// =============================================================================

describe('Lesson 4: Test Isolation', () => {
  /**
   * Each test should be independent:
   * - Tests should not depend on other tests running first
   * - Tests should not share mutable state
   * - Use beforeEach to reset state
   * - Use afterEach to clean up
   */

  // Simulating a simple state manager
  class SessionTracker {
    private violations: number[] = [];

    addViolation(seconds: number): void {
      this.violations.push(seconds);
    }

    getTotalViolationTime(): number {
      return this.violations.reduce((sum, v) => sum + v, 0);
    }

    reset(): void {
      this.violations = [];
    }
  }

  let tracker: SessionTracker;

  // beforeEach runs before EACH test - ensures clean state
  beforeEach(() => {
    tracker = new SessionTracker();
  });

  it('starts with zero violations', () => {
    expect(tracker.getTotalViolationTime()).toBe(0);
  });

  it('tracks single violation', () => {
    tracker.addViolation(30);
    expect(tracker.getTotalViolationTime()).toBe(30);
  });

  it('accumulates multiple violations', () => {
    tracker.addViolation(30);
    tracker.addViolation(45);
    expect(tracker.getTotalViolationTime()).toBe(75);
  });

  // Each test above gets a fresh tracker - they don't interfere!
});

// =============================================================================
// LESSON 5: TESTING ASYNC CODE
// =============================================================================

describe('Lesson 5: Testing Async Code', () => {
  /**
   * Three ways to test async code:
   * 1. async/await (preferred)
   * 2. Return the promise
   * 3. done callback (legacy)
   */

  // Simulated async function
  const fetchUserProfile = async (userId: string): Promise<{ id: string; name: string } | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 10));

    if (userId === 'user123') {
      return { id: 'user123', name: 'Test User' };
    }
    return null;
  };

  // Method 1: async/await (PREFERRED)
  it('fetches user profile with async/await', async () => {
    const user = await fetchUserProfile('user123');

    expect(user).not.toBeNull();
    expect(user?.name).toBe('Test User');
  });

  // Method 2: Return the promise
  it('returns null for unknown user', () => {
    return fetchUserProfile('unknown').then(user => {
      expect(user).toBeNull();
    });
  });

  // Testing async errors
  const fetchWithValidation = async (userId: string): Promise<{ id: string }> => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return { id: userId };
  };

  it('throws error for empty user ID', async () => {
    await expect(fetchWithValidation('')).rejects.toThrow('User ID is required');
  });
});

// =============================================================================
// LESSON 6: GROUPING RELATED TESTS
// =============================================================================

describe('Lesson 6: Organizing Tests with describe blocks', () => {
  /**
   * Use nested describe blocks to:
   * - Group related tests
   * - Share setup/teardown within groups
   * - Make test output more readable
   */

  const isSessionSuccessful = (
    totalViolationSeconds: number,
    wasCompleted: boolean
  ): { success: boolean; reason?: string } => {
    if (!wasCompleted) {
      return { success: false, reason: 'Session not completed' };
    }
    if (totalViolationSeconds >= 300) {
      return { success: false, reason: 'Too many violations' };
    }
    return { success: true };
  };

  describe('when session is completed', () => {
    const wasCompleted = true;

    it('succeeds with no violations', () => {
      const result = isSessionSuccessful(0, wasCompleted);
      expect(result.success).toBe(true);
    });

    it('succeeds with violations under 5 minutes', () => {
      const result = isSessionSuccessful(299, wasCompleted);
      expect(result.success).toBe(true);
    });

    it('fails with violations at exactly 5 minutes', () => {
      const result = isSessionSuccessful(300, wasCompleted);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Too many violations');
    });
  });

  describe('when session is not completed', () => {
    const wasCompleted = false;

    it('fails regardless of violation count', () => {
      const result = isSessionSuccessful(0, wasCompleted);
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Session not completed');
    });
  });
});
