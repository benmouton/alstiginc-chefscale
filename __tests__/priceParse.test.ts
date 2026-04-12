import { parsePriceDescription } from '../lib/priceParse';

// Mock fetch. Each test overrides it to simulate server responses.
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(response: { ok: boolean; status?: number; json: () => Promise<any> }) {
  global.fetch = jest.fn().mockResolvedValue(response) as any;
}

describe('parsePriceDescription', () => {
  test('rejects empty or too-short input without calling fetch', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    expect(await parsePriceDescription('')).toBe(null);
    expect(await parsePriceDescription('  ')).toBe(null);
    expect(await parsePriceDescription('ab')).toBe(null);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns structured data on successful parse', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        purchaseCost: 30,
        amount: 50,
        unit: 'lb',
        container: '50 lb sack',
      }),
    });

    const result = await parsePriceDescription('30 bucks for a 50 lb sack');
    expect(result).toEqual({
      purchaseCost: 30,
      amount: 50,
      unit: 'lb',
      container: '50 lb sack',
    });
  });

  test('handles null container field', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        purchaseCost: 5,
        amount: 1,
        unit: 'lb',
        container: null,
      }),
    });

    const result = await parsePriceDescription('$5 per pound');
    expect(result?.container).toBe(null);
  });

  test('normalizes blank container to null', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        purchaseCost: 5,
        amount: 1,
        unit: 'lb',
        container: '   ',
      }),
    });

    const result = await parsePriceDescription('$5 per pound');
    expect(result?.container).toBe(null);
  });

  test('returns null on 4xx/5xx server response', async () => {
    mockFetch({ ok: false, status: 422, json: async () => ({ error: 'bad' }) });
    const result = await parsePriceDescription('30 bucks for a 50 lb sack');
    expect(result).toBe(null);
  });

  test('returns null when response shape is invalid', async () => {
    mockFetch({
      ok: true,
      json: async () => ({ purchaseCost: 'not a number', amount: 50, unit: 'lb' }),
    });
    expect(await parsePriceDescription('...')).toBe(null);
  });

  test('returns null when purchaseCost is zero or negative', async () => {
    mockFetch({
      ok: true,
      json: async () => ({ purchaseCost: 0, amount: 50, unit: 'lb' }),
    });
    expect(await parsePriceDescription('...')).toBe(null);
  });

  test('returns null on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;
    expect(await parsePriceDescription('...')).toBe(null);
  });

  test('stays silent on AbortError', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(abortErr) as any;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await parsePriceDescription('...');
    expect(result).toBe(null);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('passes ingredientName and signal through to fetch', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ purchaseCost: 30, amount: 50, unit: 'lb', container: null }),
    });
    global.fetch = fetchMock as any;

    const controller = new AbortController();
    await parsePriceDescription('30 bucks for 50 lb', {
      apiBase: 'https://example.com',
      ingredientName: 'Flour',
      signal: controller.signal,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/api/parse-price',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          description: '30 bucks for 50 lb',
          ingredientName: 'Flour',
        }),
        signal: controller.signal,
      })
    );
  });
});
