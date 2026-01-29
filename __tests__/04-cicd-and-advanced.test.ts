/**
 * =============================================================================
 * PROFESSIONAL SOFTWARE TESTING GUIDE - Part 4: CI/CD & Advanced Patterns
 * =============================================================================
 *
 * HOW TESTS FIT INTO CI/CD:
 *
 * ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
 * │   COMMIT    │───>│    BUILD    │───>│    TEST     │───>│   DEPLOY    │
 * └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
 *       │                  │                  │                  │
 *       │                  │                  │                  │
 *    Push to           Compile &          Run tests          Deploy to
 *    GitHub            Bundle             (must pass)        production
 *
 * CI/CD PIPELINE TYPICAL STAGES:
 *
 * 1. Lint          - Code style checks (eslint)
 * 2. Type Check    - TypeScript compilation (tsc --noEmit)
 * 3. Unit Tests    - Fast, isolated tests
 * 4. Integration   - Tests with real dependencies
 * 5. E2E Tests     - Full user flow tests
 * 6. Build         - Production bundle
 * 7. Deploy        - Ship to staging/production
 *
 * WHAT BREAKS THE BUILD:
 * - Any test failure
 * - Coverage below threshold
 * - Lint errors
 * - Type errors
 */

// =============================================================================
// LESSON 1: COVERAGE THRESHOLDS
// =============================================================================

describe('Lesson 1: Understanding Code Coverage', () => {
  /**
   * Coverage types:
   * - LINE COVERAGE: % of lines executed
   * - BRANCH COVERAGE: % of if/else branches taken
   * - FUNCTION COVERAGE: % of functions called
   * - STATEMENT COVERAGE: % of statements executed
   *
   * Professional thresholds (add to jest.config.js):
   *
   * coverageThreshold: {
   *   global: {
   *     branches: 80,
   *     functions: 80,
   *     lines: 80,
   *     statements: 80
   *   }
   * }
   *
   * Run: npm run test:coverage
   */

  // This function has multiple branches - need tests for each
  const getRating = (score: number): string => {
    if (score >= 90) return 'A';      // Branch 1
    if (score >= 80) return 'B';      // Branch 2
    if (score >= 70) return 'C';      // Branch 3
    if (score >= 60) return 'D';      // Branch 4
    return 'F';                        // Branch 5 (default)
  };

  // To get 100% branch coverage, test ALL branches
  it('returns A for scores 90 and above', () => {
    expect(getRating(90)).toBe('A');
    expect(getRating(100)).toBe('A');
  });

  it('returns B for scores 80-89', () => {
    expect(getRating(80)).toBe('B');
    expect(getRating(89)).toBe('B');
  });

  it('returns C for scores 70-79', () => {
    expect(getRating(70)).toBe('C');
  });

  it('returns D for scores 60-69', () => {
    expect(getRating(60)).toBe('D');
  });

  it('returns F for scores below 60', () => {
    expect(getRating(59)).toBe('F');
    expect(getRating(0)).toBe('F');
  });
});

// =============================================================================
// LESSON 2: TEST DATA BUILDERS
// =============================================================================

describe('Lesson 2: Test Data Builders', () => {
  /**
   * Problem: Creating test data is repetitive and verbose
   * Solution: Use builder pattern to create test data
   *
   * Benefits:
   * - DRY (Don't Repeat Yourself)
   * - Clear what's important in each test
   * - Easy to create variations
   */

  interface Session {
    id: string;
    hostId: string;
    participants: string[];
    duration: number;
    status: 'pending' | 'active' | 'ended';
    violations: { userId: string; seconds: number }[];
  }

  // Builder class for creating test sessions
  class SessionBuilder {
    private session: Session = {
      id: 'default-id',
      hostId: 'default-host',
      participants: ['default-host'],
      duration: 60,
      status: 'pending',
      violations: [],
    };

    withId(id: string): SessionBuilder {
      this.session.id = id;
      return this;
    }

    withHost(hostId: string): SessionBuilder {
      this.session.hostId = hostId;
      this.session.participants = [hostId, ...this.session.participants.slice(1)];
      return this;
    }

    withParticipants(participants: string[]): SessionBuilder {
      this.session.participants = [this.session.hostId, ...participants];
      return this;
    }

    withDuration(minutes: number): SessionBuilder {
      this.session.duration = minutes;
      return this;
    }

    withStatus(status: 'pending' | 'active' | 'ended'): SessionBuilder {
      this.session.status = status;
      return this;
    }

    withViolation(userId: string, seconds: number): SessionBuilder {
      this.session.violations.push({ userId, seconds });
      return this;
    }

    build(): Session {
      return { ...this.session };
    }
  }

  // Factory function for even simpler usage
  const aSession = () => new SessionBuilder();

  it('creates default session easily', () => {
    const session = aSession().build();

    expect(session.status).toBe('pending');
    expect(session.duration).toBe(60);
  });

  it('creates active session with violations', () => {
    const session = aSession()
      .withId('session-123')
      .withHost('host-456')
      .withParticipants(['user1', 'user2'])
      .withStatus('active')
      .withViolation('user1', 30)
      .withViolation('user2', 45)
      .build();

    expect(session.id).toBe('session-123');
    expect(session.status).toBe('active');
    expect(session.violations).toHaveLength(2);
    expect(session.participants).toContain('user1');
  });

  it('makes tests focus on what matters', () => {
    // Only specify what's relevant to THIS test
    const session = aSession()
      .withViolation('user1', 400) // > 5 min = fail
      .build();

    const totalViolations = session.violations.reduce((sum, v) => sum + v.seconds, 0);
    expect(totalViolations).toBeGreaterThan(300);
  });
});

// =============================================================================
// LESSON 3: PARAMETERIZED TESTS
// =============================================================================

describe('Lesson 3: Parameterized Tests (test.each)', () => {
  /**
   * When you have many similar test cases, use test.each
   * to avoid repetition and make patterns clear.
   */

  const getViolationLevel = (seconds: number): string => {
    if (seconds < 30) return 'minor';
    if (seconds < 120) return 'medium';
    if (seconds < 300) return 'large';
    return 'catastrophic';
  };

  // Array format
  it.each([
    [0, 'minor'],
    [29, 'minor'],
    [30, 'medium'],
    [119, 'medium'],
    [120, 'large'],
    [299, 'large'],
    [300, 'catastrophic'],
    [600, 'catastrophic'],
  ])('getViolationLevel(%i) returns "%s"', (seconds, expected) => {
    expect(getViolationLevel(seconds)).toBe(expected);
  });

  // Object format (more readable for complex data)
  it.each`
    input | expected      | description
    ${0}  | ${'minor'}    | ${'zero seconds'}
    ${29} | ${'minor'}    | ${'just under threshold'}
    ${30} | ${'medium'}   | ${'at threshold'}
  `('returns $expected for $description ($input seconds)', ({ input, expected }) => {
    expect(getViolationLevel(input)).toBe(expected);
  });

  // Testing error cases with each
  const parseRoomCode = (code: string): number => {
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Invalid room code');
    }
    return parseInt(code, 10);
  };

  it.each([
    ['12345'],     // too short
    ['1234567'],   // too long
    ['abcdef'],    // letters
    ['12.456'],    // decimal
    [''],          // empty
  ])('throws error for invalid code: "%s"', (invalidCode) => {
    expect(() => parseRoomCode(invalidCode)).toThrow('Invalid room code');
  });
});

// =============================================================================
// LESSON 4: TESTING ERROR HANDLING
// =============================================================================

describe('Lesson 4: Testing Error Handling', () => {
  /**
   * Errors are part of your API contract.
   * Test that:
   * - Correct errors are thrown
   * - Error messages are helpful
   * - Error types are correct
   * - Recovery is possible
   */

  class SessionError extends Error {
    constructor(
      message: string,
      public code: 'NOT_FOUND' | 'ALREADY_STARTED' | 'INVALID_STATE'
    ) {
      super(message);
      this.name = 'SessionError';
    }
  }

  const joinSession = async (sessionId: string, userId: string) => {
    if (!sessionId) {
      throw new SessionError('Session ID is required', 'NOT_FOUND');
    }
    if (sessionId === 'started-session') {
      throw new SessionError('Session has already started', 'ALREADY_STARTED');
    }
    return { sessionId, userId };
  };

  it('throws SessionError with NOT_FOUND code for missing ID', async () => {
    await expect(joinSession('', 'user1')).rejects.toThrow(SessionError);

    try {
      await joinSession('', 'user1');
    } catch (error) {
      expect(error).toBeInstanceOf(SessionError);
      expect((error as SessionError).code).toBe('NOT_FOUND');
      expect((error as SessionError).message).toBe('Session ID is required');
    }
  });

  it('throws ALREADY_STARTED for active session', async () => {
    await expect(joinSession('started-session', 'user1'))
      .rejects
      .toThrow('Session has already started');
  });

  it('succeeds for valid session', async () => {
    const result = await joinSession('valid-session', 'user1');
    expect(result.sessionId).toBe('valid-session');
  });
});

// =============================================================================
// LESSON 5: SNAPSHOT TESTING
// =============================================================================

describe('Lesson 5: Snapshot Testing', () => {
  /**
   * Snapshots capture output and compare against saved values.
   * Good for:
   * - UI components
   * - Configuration objects
   * - API responses
   *
   * Bad for:
   * - Frequently changing data
   * - Time-dependent values
   */

  const generateSessionReport = (session: {
    id: string;
    duration: number;
    participants: string[];
    violations: number;
  }) => {
    return {
      sessionId: session.id,
      summary: {
        durationMinutes: session.duration,
        participantCount: session.participants.length,
        totalViolations: session.violations,
        averageViolationsPerPerson: session.violations / session.participants.length,
      },
      status: session.violations > 10 ? 'NEEDS_IMPROVEMENT' : 'GOOD',
    };
  };

  it('generates correct report structure', () => {
    const report = generateSessionReport({
      id: 'session-123',
      duration: 60,
      participants: ['user1', 'user2'],
      violations: 5,
    });

    // First run: creates snapshot
    // Subsequent runs: compares against snapshot
    expect(report).toMatchSnapshot();
  });

  // Inline snapshots are embedded in the test file
  it('generates status based on violations', () => {
    const goodReport = generateSessionReport({
      id: 's1',
      duration: 60,
      participants: ['u1'],
      violations: 5,
    });

    const badReport = generateSessionReport({
      id: 's2',
      duration: 60,
      participants: ['u1'],
      violations: 15,
    });

    expect(goodReport.status).toMatchInlineSnapshot(`"GOOD"`);
    expect(badReport.status).toMatchInlineSnapshot(`"NEEDS_IMPROVEMENT"`);
  });
});

// =============================================================================
// LESSON 6: GITHUB ACTIONS CI CONFIGURATION
// =============================================================================

/**
 * Create .github/workflows/test.yml:
 *
 * ```yaml
 * name: Test
 *
 * on:
 *   push:
 *     branches: [main, master]
 *   pull_request:
 *     branches: [main, master]
 *
 * jobs:
 *   test:
 *     runs-on: ubuntu-latest
 *
 *     steps:
 *       - uses: actions/checkout@v4
 *
 *       - name: Setup Node
 *         uses: actions/setup-node@v4
 *         with:
 *           node-version: '20'
 *           cache: 'npm'
 *
 *       - name: Install dependencies
 *         run: npm ci
 *
 *       - name: Type check
 *         run: npm run type-check
 *
 *       - name: Lint
 *         run: npm run lint
 *
 *       - name: Run tests
 *         run: npm run test:coverage
 *
 *       - name: Upload coverage
 *         uses: codecov/codecov-action@v4
 *         with:
 *           files: ./coverage/lcov.info
 * ```
 *
 * This workflow:
 * 1. Triggers on push/PR to main branches
 * 2. Sets up Node.js with caching
 * 3. Installs dependencies
 * 4. Runs type checking
 * 5. Runs linting
 * 6. Runs tests with coverage
 * 7. Uploads coverage to Codecov (optional)
 */

describe('CI/CD Best Practices', () => {
  it('is a reference section - see comments above', () => {
    expect(true).toBe(true);
  });
});

// =============================================================================
// LESSON 7: TESTING REACT COMPONENTS (React Native)
// =============================================================================

/**
 * For React Native components, use @testing-library/react-native
 *
 * Example test for a SessionCard component:
 *
 * ```tsx
 * import React from 'react';
 * import { render, screen, fireEvent } from '@testing-library/react-native';
 * import SessionCard from '../app/components/SessionCard';
 *
 * describe('SessionCard', () => {
 *   const defaultProps = {
 *     session: {
 *       id: '123',
 *       duration: 60,
 *       status: 'ended',
 *       violations: [],
 *       participants: ['user1'],
 *     },
 *     onPress: jest.fn(),
 *   };
 *
 *   it('renders session duration', () => {
 *     render(<SessionCard {...defaultProps} />);
 *
 *     expect(screen.getByText('60 min')).toBeTruthy();
 *   });
 *
 *   it('calls onPress when tapped', () => {
 *     render(<SessionCard {...defaultProps} />);
 *
 *     fireEvent.press(screen.getByTestId('session-card'));
 *
 *     expect(defaultProps.onPress).toHaveBeenCalledWith('123');
 *   });
 *
 *   it('shows success badge for sessions with no violations', () => {
 *     render(<SessionCard {...defaultProps} />);
 *
 *     expect(screen.getByText('Success')).toBeTruthy();
 *   });
 * });
 * ```
 */

describe('Component Testing Notes', () => {
  it('see code comments for React Native testing examples', () => {
    expect(true).toBe(true);
  });
});
