import { parseLocal, parsePriceDescription } from '../lib/priceParse';

// --- Local regex parser tests (no network, instant) ---

describe('parseLocal', () => {
  test('"$150 for a 30lb sack"', () => {
    const r = parseLocal('$150 for a 30lb sack');
    expect(r?.purchaseCost).toBe(150);
    expect(r?.amount).toBe(30);
    expect(r?.unit).toBe('lb');
    expect(r?.container).toBe('30lb sack');
  });

  test('"$150 for a 30 lb sack"', () => {
    const r = parseLocal('$150 for a 30 lb sack');
    expect(r?.purchaseCost).toBe(150);
    expect(r?.amount).toBe(30);
    expect(r?.unit).toBe('lb');
    expect(r?.container).toBe('30 lb sack');
  });

  test('"$30 for 50 lbs"', () => {
    const r = parseLocal('$30 for 50 lbs');
    expect(r?.purchaseCost).toBe(30);
    expect(r?.amount).toBe(50);
    expect(r?.unit).toBe('lb');
  });

  test('"30 bucks for a 50 lb sack"', () => {
    const r = parseLocal('30 bucks for a 50 lb sack');
    expect(r?.purchaseCost).toBe(30);
    expect(r?.amount).toBe(50);
    expect(r?.unit).toBe('lb');
    expect(r?.container).toBe('50 lb sack');
  });

  test('"$5 per lb"', () => {
    const r = parseLocal('$5 per lb');
    expect(r?.purchaseCost).toBe(5);
    expect(r?.amount).toBe(1);
    expect(r?.unit).toBe('lb');
    expect(r?.container).toBe(null);
  });

  test('"$5/lb"', () => {
    const r = parseLocal('$5/lb');
    expect(r?.purchaseCost).toBe(5);
    expect(r?.amount).toBe(1);
    expect(r?.unit).toBe('lb');
  });

  test('"$42.03 for 60 ct"', () => {
    const r = parseLocal('$42.03 for 60 ct');
    expect(r?.purchaseCost).toBe(42.03);
    expect(r?.amount).toBe(60);
    expect(r?.unit).toBe('each');
  });

  test('"$5 per pound"', () => {
    const r = parseLocal('$5 per pound');
    expect(r?.purchaseCost).toBe(5);
    expect(r?.amount).toBe(1);
    expect(r?.unit).toBe('lb');
  });

  test('"$11.40 for 5 lb"', () => {
    const r = parseLocal('$11.40 for 5 lb');
    expect(r?.purchaseCost).toBe(11.4);
    expect(r?.amount).toBe(5);
    expect(r?.unit).toBe('lb');
  });

  test('"$34.50 for 15 lb"', () => {
    const r = parseLocal('$34.50 for 15 lb');
    expect(r?.purchaseCost).toBe(34.5);
    expect(r?.amount).toBe(15);
    expect(r?.unit).toBe('lb');
  });

  test('"$106.80 for 4 gallon"', () => {
    const r = parseLocal('$106.80 for 4 gallon');
    expect(r?.purchaseCost).toBe(106.8);
    expect(r?.amount).toBe(4);
    expect(r?.unit).toBe('gallon');
  });

  test('"$63.78 for 50 lb"', () => {
    const r = parseLocal('$63.78 for 50 lb');
    expect(r?.purchaseCost).toBe(63.78);
    expect(r?.amount).toBe(50);
    expect(r?.unit).toBe('lb');
  });

  test('handles comma in dollar amounts', () => {
    const r = parseLocal('$1,500 for 100 lb');
    expect(r?.purchaseCost).toBe(1500);
    expect(r?.amount).toBe(100);
  });

  test('returns null for empty / too-short input', () => {
    expect(parseLocal('')).toBe(null);
    expect(parseLocal('hi')).toBe(null);
  });

  test('returns null when no dollar amount found', () => {
    expect(parseLocal('50 lbs of flour')).toBe(null);
  });

  test('"$3 per dozen"', () => {
    const r = parseLocal('$3 per dozen');
    expect(r?.purchaseCost).toBe(3);
    expect(r?.amount).toBe(1);
    expect(r?.unit).toBe('dozen');
  });

  test('"$8 for 2 gallons"', () => {
    const r = parseLocal('$8 for 2 gallons');
    expect(r?.purchaseCost).toBe(8);
    expect(r?.amount).toBe(2);
    expect(r?.unit).toBe('gallon');
  });

  test('"$25 for a 5 kg bag"', () => {
    const r = parseLocal('$25 for a 5 kg bag');
    expect(r?.purchaseCost).toBe(25);
    expect(r?.amount).toBe(5);
    expect(r?.unit).toBe('kg');
    expect(r?.container).toBe('5 kg bag');
  });
});

// --- Integration tests (parsePriceDescription with mock fetch) ---

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetch(response: { ok: boolean; status?: number; json: () => Promise<any> }) {
  global.fetch = jest.fn().mockResolvedValue(response) as any;
}

describe('parsePriceDescription', () => {
  test('uses local parser first — never hits server for simple inputs', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    const result = await parsePriceDescription('$150 for a 30lb sack');
    expect(result?.purchaseCost).toBe(150);
    expect(result?.amount).toBe(30);
    expect(result?.unit).toBe('lb');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('falls back to server when local parse fails', async () => {
    mockFetch({
      ok: true,
      json: async () => ({
        purchaseCost: 42,
        amount: 6,
        unit: 'each',
        container: 'case of 6 jugs',
      }),
    });

    // Ambiguous input that local regex can't handle
    const result = await parsePriceDescription('case of 6 jugs forty two dollars');
    expect(result?.purchaseCost).toBe(42);
    expect(result?.unit).toBe('each');
    expect(global.fetch).toHaveBeenCalled();
  });

  test('rejects empty or too-short input without calling fetch', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;

    expect(await parsePriceDescription('')).toBe(null);
    expect(await parsePriceDescription('  ')).toBe(null);
    expect(await parsePriceDescription('ab')).toBe(null);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('returns null on server 4xx/5xx and no local match', async () => {
    mockFetch({ ok: false, status: 422, json: async () => ({ error: 'bad' }) });
    expect(await parsePriceDescription('something weird that regex cant parse')).toBe(null);
  });

  test('returns null on network error and no local match', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as any;
    expect(await parsePriceDescription('something weird that regex cant parse')).toBe(null);
  });

  test('stays silent on AbortError', async () => {
    const abortErr = new Error('aborted');
    abortErr.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(abortErr) as any;

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    expect(await parsePriceDescription('something weird that regex cant parse')).toBe(null);
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
