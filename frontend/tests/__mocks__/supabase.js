/**
 * Shared Supabase client mock for all tests.
 * Provides vi.fn() stubs for commonly used Supabase methods.
 */
import { vi } from 'vitest';

// Chain-friendly query builder mock
const createQueryBuilder = () => {
    const builder = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        upsert: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        neq: vi.fn(() => builder),
        gt: vi.fn(() => builder),
        lt: vi.fn(() => builder),
        gte: vi.fn(() => builder),
        lte: vi.fn(() => builder),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        single: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        then: vi.fn((resolve) => resolve({ data: [], error: null })),
    };
    return builder;
};

// Mock Supabase client
export const supabase = {
    from: vi.fn(() => createQueryBuilder()),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
        getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'test-token' } }, error: null })),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    functions: {
        invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
};

// Helper to reset all mocks between tests
export function resetSupabaseMocks() {
    vi.clearAllMocks();
}

// Helper to configure specific return values
export function mockSupabaseResponse(table, { data = [], error = null } = {}) {
    const builder = createQueryBuilder();
    builder.then = vi.fn((resolve) => resolve({ data, error }));
    supabase.from.mockImplementation((t) => {
        if (t === table) return builder;
        return createQueryBuilder();
    });
    return builder;
}

export default supabase;
