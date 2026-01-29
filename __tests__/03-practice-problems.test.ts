/**
 * =============================================================================
 * PROFESSIONAL SOFTWARE TESTING GUIDE - Part 3: Practice Problems
 * =============================================================================
 *
 * Complete these exercises to practice your testing skills!
 * Each problem has:
 * - A function to test
 * - Requirements to verify
 * - Space for your tests
 * - Solutions at the bottom (no peeking!)
 */

// =============================================================================
// PRACTICE PROBLEM 1: Room Code Validator
// =============================================================================

/**
 * Validates a room code for joining a study session.
 * Room codes must be exactly 6 digits (numeric only).
 */
const validateRoomCode = (code: string): { valid: boolean; error?: string } => {
  if (!code) {
    return { valid: false, error: 'Room code is required' };
  }
  if (code.length !== 6) {
    return { valid: false, error: 'Room code must be 6 digits' };
  }
  if (!/^\d+$/.test(code)) {
    return { valid: false, error: 'Room code must contain only numbers' };
  }
  return { valid: true };
};

describe('PRACTICE 1: validateRoomCode', () => {
  /**
   * TODO: Write tests for the following scenarios:
   * 1. Valid 6-digit code returns { valid: true }
   * 2. Empty string returns error 'Room code is required'
   * 3. Too short (5 digits) returns error about 6 digits
   * 4. Too long (7 digits) returns error about 6 digits
   * 5. Contains letters returns error about numbers only
   * 6. Contains special characters returns error about numbers only
   *
   * YOUR TESTS HERE:
   */

  it.todo('accepts valid 6-digit code');
  it.todo('rejects empty code');
  it.todo('rejects code that is too short');
  it.todo('rejects code that is too long');
  it.todo('rejects code with letters');
  it.todo('rejects code with special characters');
});

// =============================================================================
// PRACTICE PROBLEM 2: Session Timer
// =============================================================================

/**
 * Calculates remaining time and progress for a study session.
 */
interface TimerState {
  remainingSeconds: number;
  progressPercent: number;
  isComplete: boolean;
  formattedTime: string;
}

const calculateTimerState = (
  durationMinutes: number,
  elapsedSeconds: number
): TimerState => {
  const totalSeconds = durationMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = Math.min(100, (elapsedSeconds / totalSeconds) * 100);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return {
    remainingSeconds: remaining,
    progressPercent: Math.round(progress * 10) / 10, // 1 decimal place
    isComplete: remaining === 0,
    formattedTime: `${mins}:${secs.toString().padStart(2, '0')}`,
  };
};

describe('PRACTICE 2: calculateTimerState', () => {
  /**
   * TODO: Write tests for:
   * 1. At start (0 elapsed): remaining = total, progress = 0%, not complete
   * 2. At halfway: progress = 50%
   * 3. At completion: remaining = 0, progress = 100%, isComplete = true
   * 4. Over time (elapsed > duration): should clamp to 0 remaining, 100%
   * 5. Formatted time shows correct MM:SS format
   *
   * YOUR TESTS HERE:
   */

  it.todo('shows full time remaining at start');
  it.todo('shows 50% progress at halfway point');
  it.todo('shows complete state when timer finishes');
  it.todo('clamps values when elapsed exceeds duration');
  it.todo('formats time correctly');
});

// =============================================================================
// PRACTICE PROBLEM 3: Violation Aggregator (with mocking)
// =============================================================================

/**
 * Aggregates violations by user for a session.
 */
interface Violation {
  id: string;
  userId: string;
  durationSeconds: number;
  timestamp: Date;
}

interface UserViolationSummary {
  userId: string;
  totalViolations: number;
  totalSeconds: number;
  worstViolation: number;
  passed: boolean;
}

const aggregateViolationsByUser = (
  violations: Violation[]
): Map<string, UserViolationSummary> => {
  const summaries = new Map<string, UserViolationSummary>();

  for (const v of violations) {
    const existing = summaries.get(v.userId);

    if (existing) {
      existing.totalViolations++;
      existing.totalSeconds += v.durationSeconds;
      existing.worstViolation = Math.max(existing.worstViolation, v.durationSeconds);
      existing.passed = existing.totalSeconds < 300;
    } else {
      summaries.set(v.userId, {
        userId: v.userId,
        totalViolations: 1,
        totalSeconds: v.durationSeconds,
        worstViolation: v.durationSeconds,
        passed: v.durationSeconds < 300,
      });
    }
  }

  return summaries;
};

describe('PRACTICE 3: aggregateViolationsByUser', () => {
  /**
   * TODO: Write tests for:
   * 1. Empty violations array returns empty map
   * 2. Single violation creates correct summary
   * 3. Multiple violations for same user are aggregated
   * 4. Multiple users are tracked separately
   * 5. User fails (passed=false) when total >= 300 seconds
   * 6. worstViolation tracks the longest single violation
   *
   * Hint: Create test data like:
   * const violations: Violation[] = [
   *   { id: 'v1', userId: 'user1', durationSeconds: 30, timestamp: new Date() },
   *   ...
   * ];
   *
   * YOUR TESTS HERE:
   */

  it.todo('returns empty map for no violations');
  it.todo('creates summary for single violation');
  it.todo('aggregates multiple violations for same user');
  it.todo('tracks multiple users separately');
  it.todo('marks user as failed when total exceeds 5 minutes');
  it.todo('tracks worst violation correctly');
});

// =============================================================================
// PRACTICE PROBLEM 4: Async Session Loader (mocking practice)
// =============================================================================

/**
 * Loads session data with user details.
 * This simulates fetching from Firebase.
 */
interface Session {
  id: string;
  hostId: string;
  participantIds: string[];
  status: string;
}

interface User {
  id: string;
  username: string;
}

// These would normally come from Firebase
interface SessionLoader {
  getSession: (id: string) => Promise<Session | null>;
  getUser: (id: string) => Promise<User | null>;
}

const loadSessionWithParticipants = async (
  loader: SessionLoader,
  sessionId: string
): Promise<{
  session: Session;
  host: User;
  participants: User[];
} | null> => {
  const session = await loader.getSession(sessionId);
  if (!session) return null;

  const host = await loader.getUser(session.hostId);
  if (!host) return null;

  const participants = await Promise.all(
    session.participantIds.map(id => loader.getUser(id))
  );

  return {
    session,
    host,
    participants: participants.filter((p): p is User => p !== null),
  };
};

describe('PRACTICE 4: loadSessionWithParticipants', () => {
  /**
   * TODO: Write tests using mock SessionLoader:
   * 1. Returns null when session not found
   * 2. Returns null when host user not found
   * 3. Returns session with host and participants when all found
   * 4. Filters out null participants (some users might not exist)
   * 5. Verify loader.getSession is called with correct ID
   * 6. Verify loader.getUser is called for host and each participant
   *
   * Create your mock like:
   * const mockLoader: SessionLoader = {
   *   getSession: jest.fn(),
   *   getUser: jest.fn(),
   * };
   *
   * YOUR TESTS HERE:
   */

  it.todo('returns null when session not found');
  it.todo('returns null when host not found');
  it.todo('returns complete data when all users found');
  it.todo('filters out participants that do not exist');
  it.todo('calls loader methods with correct arguments');
});

// =============================================================================
// =============================================================================
// SOLUTIONS BELOW - TRY THE PROBLEMS FIRST!
// =============================================================================
// =============================================================================

describe('SOLUTIONS', () => {
  describe('Solution 1: validateRoomCode', () => {
    it('accepts valid 6-digit code', () => {
      expect(validateRoomCode('123456')).toEqual({ valid: true });
      expect(validateRoomCode('000000')).toEqual({ valid: true });
      expect(validateRoomCode('999999')).toEqual({ valid: true });
    });

    it('rejects empty code', () => {
      expect(validateRoomCode('')).toEqual({
        valid: false,
        error: 'Room code is required',
      });
    });

    it('rejects code that is too short', () => {
      expect(validateRoomCode('12345')).toEqual({
        valid: false,
        error: 'Room code must be 6 digits',
      });
    });

    it('rejects code that is too long', () => {
      expect(validateRoomCode('1234567')).toEqual({
        valid: false,
        error: 'Room code must be 6 digits',
      });
    });

    it('rejects code with letters', () => {
      expect(validateRoomCode('12345a')).toEqual({
        valid: false,
        error: 'Room code must contain only numbers',
      });
      expect(validateRoomCode('abcdef')).toEqual({
        valid: false,
        error: 'Room code must contain only numbers',
      });
    });

    it('rejects code with special characters', () => {
      expect(validateRoomCode('12345!')).toEqual({
        valid: false,
        error: 'Room code must contain only numbers',
      });
      expect(validateRoomCode('123-56')).toEqual({
        valid: false,
        error: 'Room code must contain only numbers',
      });
    });
  });

  describe('Solution 2: calculateTimerState', () => {
    it('shows full time remaining at start', () => {
      const state = calculateTimerState(60, 0); // 60 min session, 0 elapsed

      expect(state.remainingSeconds).toBe(3600);
      expect(state.progressPercent).toBe(0);
      expect(state.isComplete).toBe(false);
    });

    it('shows 50% progress at halfway point', () => {
      const state = calculateTimerState(60, 1800); // 30 min elapsed of 60

      expect(state.remainingSeconds).toBe(1800);
      expect(state.progressPercent).toBe(50);
      expect(state.isComplete).toBe(false);
    });

    it('shows complete state when timer finishes', () => {
      const state = calculateTimerState(60, 3600); // All time elapsed

      expect(state.remainingSeconds).toBe(0);
      expect(state.progressPercent).toBe(100);
      expect(state.isComplete).toBe(true);
    });

    it('clamps values when elapsed exceeds duration', () => {
      const state = calculateTimerState(60, 4000); // Exceeded by 400 sec

      expect(state.remainingSeconds).toBe(0);
      expect(state.progressPercent).toBe(100);
      expect(state.isComplete).toBe(true);
    });

    it('formats time correctly', () => {
      expect(calculateTimerState(60, 0).formattedTime).toBe('60:00');
      expect(calculateTimerState(60, 3540).formattedTime).toBe('1:00');
      expect(calculateTimerState(60, 3595).formattedTime).toBe('0:05');
      expect(calculateTimerState(5, 65).formattedTime).toBe('3:55'); // 5min=300s, 300-65=235s = 3:55
    });
  });

  describe('Solution 3: aggregateViolationsByUser', () => {
    it('returns empty map for no violations', () => {
      const result = aggregateViolationsByUser([]);
      expect(result.size).toBe(0);
    });

    it('creates summary for single violation', () => {
      const violations: Violation[] = [
        { id: 'v1', userId: 'user1', durationSeconds: 45, timestamp: new Date() },
      ];

      const result = aggregateViolationsByUser(violations);
      const summary = result.get('user1');

      expect(summary).toEqual({
        userId: 'user1',
        totalViolations: 1,
        totalSeconds: 45,
        worstViolation: 45,
        passed: true,
      });
    });

    it('aggregates multiple violations for same user', () => {
      const violations: Violation[] = [
        { id: 'v1', userId: 'user1', durationSeconds: 30, timestamp: new Date() },
        { id: 'v2', userId: 'user1', durationSeconds: 60, timestamp: new Date() },
        { id: 'v3', userId: 'user1', durationSeconds: 20, timestamp: new Date() },
      ];

      const result = aggregateViolationsByUser(violations);
      const summary = result.get('user1');

      expect(summary?.totalViolations).toBe(3);
      expect(summary?.totalSeconds).toBe(110);
      expect(summary?.worstViolation).toBe(60);
    });

    it('tracks multiple users separately', () => {
      const violations: Violation[] = [
        { id: 'v1', userId: 'user1', durationSeconds: 30, timestamp: new Date() },
        { id: 'v2', userId: 'user2', durationSeconds: 60, timestamp: new Date() },
      ];

      const result = aggregateViolationsByUser(violations);

      expect(result.size).toBe(2);
      expect(result.get('user1')?.totalSeconds).toBe(30);
      expect(result.get('user2')?.totalSeconds).toBe(60);
    });

    it('marks user as failed when total exceeds 5 minutes', () => {
      const violations: Violation[] = [
        { id: 'v1', userId: 'user1', durationSeconds: 200, timestamp: new Date() },
        { id: 'v2', userId: 'user1', durationSeconds: 150, timestamp: new Date() },
      ];

      const result = aggregateViolationsByUser(violations);

      expect(result.get('user1')?.passed).toBe(false);
      expect(result.get('user1')?.totalSeconds).toBe(350);
    });

    it('tracks worst violation correctly', () => {
      const violations: Violation[] = [
        { id: 'v1', userId: 'user1', durationSeconds: 10, timestamp: new Date() },
        { id: 'v2', userId: 'user1', durationSeconds: 120, timestamp: new Date() },
        { id: 'v3', userId: 'user1', durationSeconds: 45, timestamp: new Date() },
      ];

      const result = aggregateViolationsByUser(violations);

      expect(result.get('user1')?.worstViolation).toBe(120);
    });
  });

  describe('Solution 4: loadSessionWithParticipants', () => {
    let mockLoader: SessionLoader;

    beforeEach(() => {
      mockLoader = {
        getSession: jest.fn(),
        getUser: jest.fn(),
      };
    });

    it('returns null when session not found', async () => {
      (mockLoader.getSession as jest.Mock).mockResolvedValue(null);

      const result = await loadSessionWithParticipants(mockLoader, 'session123');

      expect(result).toBeNull();
    });

    it('returns null when host not found', async () => {
      (mockLoader.getSession as jest.Mock).mockResolvedValue({
        id: 'session123',
        hostId: 'host1',
        participantIds: [],
        status: 'active',
      });
      (mockLoader.getUser as jest.Mock).mockResolvedValue(null);

      const result = await loadSessionWithParticipants(mockLoader, 'session123');

      expect(result).toBeNull();
    });

    it('returns complete data when all users found', async () => {
      const mockSession: Session = {
        id: 'session123',
        hostId: 'host1',
        participantIds: ['user2', 'user3'],
        status: 'active',
      };

      (mockLoader.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockLoader.getUser as jest.Mock)
        .mockResolvedValueOnce({ id: 'host1', username: 'Host' })
        .mockResolvedValueOnce({ id: 'user2', username: 'User2' })
        .mockResolvedValueOnce({ id: 'user3', username: 'User3' });

      const result = await loadSessionWithParticipants(mockLoader, 'session123');

      expect(result).not.toBeNull();
      expect(result?.session.id).toBe('session123');
      expect(result?.host.username).toBe('Host');
      expect(result?.participants).toHaveLength(2);
    });

    it('filters out participants that do not exist', async () => {
      const mockSession: Session = {
        id: 'session123',
        hostId: 'host1',
        participantIds: ['user2', 'user3'],
        status: 'active',
      };

      (mockLoader.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockLoader.getUser as jest.Mock)
        .mockResolvedValueOnce({ id: 'host1', username: 'Host' })
        .mockResolvedValueOnce({ id: 'user2', username: 'User2' })
        .mockResolvedValueOnce(null); // user3 doesn't exist

      const result = await loadSessionWithParticipants(mockLoader, 'session123');

      expect(result?.participants).toHaveLength(1);
      expect(result?.participants[0].username).toBe('User2');
    });

    it('calls loader methods with correct arguments', async () => {
      const mockSession: Session = {
        id: 'session123',
        hostId: 'host1',
        participantIds: ['user2'],
        status: 'active',
      };

      (mockLoader.getSession as jest.Mock).mockResolvedValue(mockSession);
      (mockLoader.getUser as jest.Mock).mockResolvedValue({ id: 'any', username: 'Any' });

      await loadSessionWithParticipants(mockLoader, 'session123');

      expect(mockLoader.getSession).toHaveBeenCalledWith('session123');
      expect(mockLoader.getUser).toHaveBeenCalledWith('host1');
      expect(mockLoader.getUser).toHaveBeenCalledWith('user2');
    });
  });
});
