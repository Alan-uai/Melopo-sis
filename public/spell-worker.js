"use strict";
(() => {
  // src/lib/bloom-filter.ts
  var BloomFilter = class _BloomFilter {
    constructor(config, existingBits) {
      this.size = config.size;
      this.hashCount = config.hashCount;
      this.bits = existingBits ?? new Uint8Array(Math.ceil(this.size / 8));
    }
    hash(str, seed) {
      let h1 = seed;
      for (let i = 0; i < str.length; i++) {
        h1 = Math.imul(31, h1) + str.charCodeAt(i) | 0;
      }
      return Math.abs(h1 % this.size);
    }
    add(item) {
      for (let i = 0; i < this.hashCount; i++) {
        const idx = this.hash(item, i * 31337);
        this.bits[Math.floor(idx / 8)] |= 1 << idx % 8;
      }
    }
    mayContain(item) {
      for (let i = 0; i < this.hashCount; i++) {
        const idx = this.hash(item, i * 31337);
        if ((this.bits[Math.floor(idx / 8)] & 1 << idx % 8) === 0) {
          return false;
        }
      }
      return true;
    }
    getBits() {
      return this.bits;
    }
    getState() {
      return {
        bits: Array.from(this.bits),
        size: this.size,
        hashCount: this.hashCount
      };
    }
    static fromState(state2) {
      const filter = new _BloomFilter(
        { size: state2.size, hashCount: state2.hashCount },
        new Uint8Array(state2.bits)
      );
      return filter;
    }
  };

  // src/lib/dictionary-client.ts
  var WORDS_URL = "/dict/words-pt-list.txt";
  var BLOOM_URL = "/dict/bloom.json";
  var COMMON_MISSING = ["\xE9", "quil\xF4metro", "\xF4nibus"];
  var BLOOM_CONFIG = {
    size: 6e6,
    hashCount: 7
  };
  var state = {
    wordSet: null,
    wordArray: null,
    bloomFilter: null,
    initPromise: null,
    initialized: false
  };
  var CAPS_REGEX = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/;
  function base64ToBytes(b64) {
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
  async function ensureInit() {
    if (state.initialized) return;
    if (state.initPromise) return state.initPromise;
    state.initPromise = (async () => {
      try {
        const [textRes, bloomRes] = await Promise.all([
          fetch(WORDS_URL),
          fetch(BLOOM_URL)
        ]);
        const content = await textRes.text();
        const words = content.split("\n").filter(Boolean);
        state.wordArray = [...words, ...COMMON_MISSING];
        state.wordSet = new Set(state.wordArray);
        const bloomRaw = await bloomRes.json();
        const bits = base64ToBytes(bloomRaw.bits_b64);
        state.bloomFilter = new BloomFilter(
          { size: bloomRaw.size, hashCount: bloomRaw.hashCount },
          bits
        );
        state.initialized = true;
      } catch (e) {
        console.error("[dictionary-client] Failed to load words:", e);
        state.wordArray = [...COMMON_MISSING];
        state.wordSet = new Set(COMMON_MISSING);
        const fallbackBloom = new BloomFilter(BLOOM_CONFIG);
        for (const w of COMMON_MISSING) fallbackBloom.add(w);
        state.bloomFilter = fallbackBloom;
        state.initialized = true;
      }
    })();
    return state.initPromise;
  }
  async function isWordCorrect(word) {
    await ensureInit();
    if (state.wordSet.has(word)) return true;
    if (word.includes(" ")) {
      const parts = word.split(/\s+/);
      const results = await Promise.all(parts.map((w) => isWordCorrect(w)));
      return results.every((r) => r);
    }
    if (CAPS_REGEX.test(word)) return true;
    if (state.bloomFilter.mayContain(word.toLowerCase())) return true;
    return false;
  }
  async function getAllWords() {
    await ensureInit();
    return state.wordArray ?? [];
  }

  // node_modules/symspell-ts/dist/suggest-item.js
  var SuggestItem = class _SuggestItem {
    /** Create a new instance of SuggestItem. */
    constructor(term = "", distance = 0, count = 0) {
      this.term = "";
      this.distance = 0;
      this.count = 0;
      this.term = term;
      this.distance = distance;
      this.count = count;
    }
    /** Compare to another SuggestItem, ordering by distance ascending, then by frequency count descending. */
    compareTo(other) {
      if (this.distance === other.distance) {
        if (other.count > this.count)
          return 1;
        if (other.count < this.count)
          return -1;
        return 0;
      }
      return this.distance - other.distance;
    }
    /** Check equality by term string. */
    equals(other) {
      return this.term === other.term;
    }
    /** Return a string representation. */
    toString() {
      return `{${this.term}, ${this.distance}, ${this.count}}`;
    }
    /** Create a shallow copy. */
    shallowCopy() {
      return new _SuggestItem(this.term, this.distance, this.count);
    }
  };

  // node_modules/symspell-ts/dist/verbosity.js
  var Verbosity;
  (function(Verbosity2) {
    Verbosity2[Verbosity2["Top"] = 0] = "Top";
    Verbosity2[Verbosity2["Closest"] = 1] = "Closest";
    Verbosity2[Verbosity2["All"] = 2] = "All";
  })(Verbosity || (Verbosity = {}));

  // node_modules/symspell-ts/dist/helpers.js
  function nullDistanceResults(string1, string2, maxDistance) {
    if (string1 == null) {
      return string2 == null ? 0 : string2.length <= maxDistance ? string2.length : -1;
    }
    return string1.length <= maxDistance ? string1.length : -1;
  }
  function nullSimilarityResults(string1, string2, minSimilarity) {
    return string1 == null && string2 == null ? 1 : 0 <= minSimilarity ? 0 : -1;
  }
  function prefixSuffixPrep(string1, string2) {
    let len2 = string2.length;
    let len1 = string1.length;
    while (len1 !== 0 && string1[len1 - 1] === string2[len2 - 1]) {
      len1 = len1 - 1;
      len2 = len2 - 1;
    }
    let start = 0;
    while (start !== len1 && string1[start] === string2[start])
      start++;
    if (start !== 0) {
      len2 -= start;
      len1 -= start;
    }
    return { len1, len2, start };
  }
  function toSimilarity(distance, length) {
    return distance < 0 ? -1 : 1 - distance / length;
  }
  function toDistance(similarity, length) {
    return Math.floor(length * (1 - similarity) + 1e-10);
  }

  // node_modules/symspell-ts/dist/damerau-osa.js
  var DamerauOSA = class _DamerauOSA {
    constructor(expectedMaxStringLength = 0) {
      this.baseChar1Costs = new Int32Array(expectedMaxStringLength);
      this.basePrevChar1Costs = new Int32Array(expectedMaxStringLength);
    }
    distance(string1, string2, maxDistance) {
      if (maxDistance !== void 0) {
        return this._distanceMax(string1, string2, maxDistance);
      }
      return this._distance(string1, string2);
    }
    _distance(string1, string2) {
      if (string1 == null)
        return (string2 ?? "").length;
      if (string2 == null)
        return string1.length;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return len2;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
        this.basePrevChar1Costs = new Int32Array(len2);
      }
      return _DamerauOSA.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs, this.basePrevChar1Costs);
    }
    _distanceMax(string1, string2, maxDistance) {
      if (string1 == null || string2 == null)
        return nullDistanceResults(string1, string2, maxDistance);
      if (maxDistance <= 0)
        return string1 === string2 ? 0 : -1;
      maxDistance = Math.ceil(maxDistance);
      const iMaxDistance = maxDistance <= 2147483647 ? maxDistance : 2147483647;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      if (string2.length - string1.length > iMaxDistance)
        return -1;
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return len2 <= iMaxDistance ? len2 : -1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
        this.basePrevChar1Costs = new Int32Array(len2);
      }
      if (iMaxDistance < len2) {
        return _DamerauOSA.distanceInternalMax(string1, string2, len1, len2, start, iMaxDistance, this.baseChar1Costs, this.basePrevChar1Costs);
      }
      return _DamerauOSA.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs, this.basePrevChar1Costs);
    }
    similarity(string1, string2, minSimilarity) {
      if (minSimilarity !== void 0) {
        return this._similarityMin(string1, string2, minSimilarity);
      }
      return this._similarity(string1, string2);
    }
    _similarity(string1, string2) {
      if (string1 == null)
        return string2 == null ? 1 : 0;
      if (string2 == null)
        return 0;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return 1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
        this.basePrevChar1Costs = new Int32Array(len2);
      }
      return toSimilarity(_DamerauOSA.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs, this.basePrevChar1Costs), string2.length);
    }
    _similarityMin(string1, string2, minSimilarity) {
      if (minSimilarity < 0 || minSimilarity > 1)
        throw new Error("minSimilarity must be in range 0 to 1.0");
      if (string1 == null || string2 == null)
        return nullSimilarityResults(string1, string2, minSimilarity);
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const iMaxDistance = toDistance(minSimilarity, string2.length);
      if (string2.length - string1.length > iMaxDistance)
        return -1;
      if (iMaxDistance <= 0)
        return string1 === string2 ? 1 : -1;
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return 1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
        this.basePrevChar1Costs = new Int32Array(len2);
      }
      if (iMaxDistance < len2) {
        return toSimilarity(_DamerauOSA.distanceInternalMax(string1, string2, len1, len2, start, iMaxDistance, this.baseChar1Costs, this.basePrevChar1Costs), string2.length);
      }
      return toSimilarity(_DamerauOSA.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs, this.basePrevChar1Costs), string2.length);
    }
    /** Internal implementation of the core Damerau-Levenshtein OSA algorithm. */
    static distanceInternal(string1, string2, len1, len2, start, char1Costs, prevChar1Costs) {
      let j;
      for (j = 0; j < len2; )
        char1Costs[j] = ++j;
      let char1 = 32;
      let currentCost = 0;
      for (let i = 0; i < len1; ++i) {
        const prevChar1 = char1;
        char1 = string1.charCodeAt(start + i);
        let char2 = 32;
        let leftCharCost, aboveCharCost;
        leftCharCost = aboveCharCost = i;
        let nextTransCost = 0;
        for (j = 0; j < len2; ++j) {
          const thisTransCost = nextTransCost;
          nextTransCost = prevChar1Costs[j];
          prevChar1Costs[j] = currentCost = leftCharCost;
          leftCharCost = char1Costs[j];
          const prevChar2 = char2;
          char2 = string2.charCodeAt(start + j);
          if (char1 !== char2) {
            if (aboveCharCost < currentCost)
              currentCost = aboveCharCost;
            if (leftCharCost < currentCost)
              currentCost = leftCharCost;
            ++currentCost;
            if (i !== 0 && j !== 0 && char1 === prevChar2 && prevChar1 === char2 && thisTransCost + 1 < currentCost) {
              currentCost = thisTransCost + 1;
            }
          }
          char1Costs[j] = aboveCharCost = currentCost;
        }
      }
      return currentCost;
    }
    /** Internal implementation of the core Damerau-Levenshtein OSA algorithm that accepts a maxDistance. */
    static distanceInternalMax(string1, string2, len1, len2, start, maxDistance, char1Costs, prevChar1Costs) {
      let i, j;
      for (j = 0; j < maxDistance; )
        char1Costs[j] = ++j;
      for (; j < len2; )
        char1Costs[j++] = maxDistance + 1;
      const lenDiff = len2 - len1;
      const jStartOffset = maxDistance - lenDiff;
      let jStart = 0;
      let jEnd = maxDistance;
      let char1 = 32;
      let currentCost = 0;
      for (i = 0; i < len1; ++i) {
        const prevChar1 = char1;
        char1 = string1.charCodeAt(start + i);
        let char2 = 32;
        let leftCharCost, aboveCharCost;
        leftCharCost = aboveCharCost = i;
        let nextTransCost = 0;
        jStart += i > jStartOffset ? 1 : 0;
        jEnd += jEnd < len2 ? 1 : 0;
        for (j = jStart; j < jEnd; ++j) {
          const thisTransCost = nextTransCost;
          nextTransCost = prevChar1Costs[j];
          prevChar1Costs[j] = currentCost = leftCharCost;
          leftCharCost = char1Costs[j];
          const prevChar2 = char2;
          char2 = string2.charCodeAt(start + j);
          if (char1 !== char2) {
            if (aboveCharCost < currentCost)
              currentCost = aboveCharCost;
            if (leftCharCost < currentCost)
              currentCost = leftCharCost;
            ++currentCost;
            if (i !== 0 && j !== 0 && char1 === prevChar2 && prevChar1 === char2 && thisTransCost + 1 < currentCost) {
              currentCost = thisTransCost + 1;
            }
          }
          char1Costs[j] = aboveCharCost = currentCost;
        }
        if (char1Costs[i + lenDiff] > maxDistance)
          return -1;
      }
      return currentCost <= maxDistance ? currentCost : -1;
    }
  };

  // node_modules/symspell-ts/dist/levenshtein.js
  var Levenshtein = class _Levenshtein {
    constructor(expectedMaxStringLength = 0) {
      this.baseChar1Costs = new Int32Array(expectedMaxStringLength);
    }
    distance(string1, string2, maxDistance) {
      if (maxDistance !== void 0) {
        return this._distanceMax(string1, string2, maxDistance);
      }
      return this._distance(string1, string2);
    }
    _distance(string1, string2) {
      if (string1 == null)
        return (string2 ?? "").length;
      if (string2 == null)
        return string1.length;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return len2;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
      }
      return _Levenshtein.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs);
    }
    _distanceMax(string1, string2, maxDistance) {
      if (string1 == null || string2 == null)
        return nullDistanceResults(string1, string2, maxDistance);
      if (maxDistance <= 0)
        return string1 === string2 ? 0 : -1;
      maxDistance = Math.ceil(maxDistance);
      const iMaxDistance = maxDistance <= 2147483647 ? maxDistance : 2147483647;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      if (string2.length - string1.length > iMaxDistance)
        return -1;
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return len2 <= iMaxDistance ? len2 : -1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
      }
      if (iMaxDistance < len2) {
        return _Levenshtein.distanceInternalMax(string1, string2, len1, len2, start, iMaxDistance, this.baseChar1Costs);
      }
      return _Levenshtein.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs);
    }
    similarity(string1, string2, minSimilarity) {
      if (minSimilarity !== void 0) {
        return this._similarityMin(string1, string2, minSimilarity);
      }
      return this._similarity(string1, string2);
    }
    _similarity(string1, string2) {
      if (string1 == null)
        return string2 == null ? 1 : 0;
      if (string2 == null)
        return 0;
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return 1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
      }
      return toSimilarity(_Levenshtein.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs), string2.length);
    }
    _similarityMin(string1, string2, minSimilarity) {
      if (minSimilarity < 0 || minSimilarity > 1)
        throw new Error("minSimilarity must be in range 0 to 1.0");
      if (string1 == null || string2 == null)
        return nullSimilarityResults(string1, string2, minSimilarity);
      if (string1.length > string2.length) {
        const t = string1;
        string1 = string2;
        string2 = t;
      }
      const iMaxDistance = toDistance(minSimilarity, string2.length);
      if (string2.length - string1.length > iMaxDistance)
        return -1;
      if (iMaxDistance === 0)
        return string1 === string2 ? 1 : -1;
      const { len1, len2, start } = prefixSuffixPrep(string1, string2);
      if (len1 === 0)
        return 1;
      if (len2 > this.baseChar1Costs.length) {
        this.baseChar1Costs = new Int32Array(len2);
      }
      if (iMaxDistance < len2) {
        return toSimilarity(_Levenshtein.distanceInternalMax(string1, string2, len1, len2, start, iMaxDistance, this.baseChar1Costs), string2.length);
      }
      return toSimilarity(_Levenshtein.distanceInternal(string1, string2, len1, len2, start, this.baseChar1Costs), string2.length);
    }
    /** Internal implementation of the core Levenshtein algorithm. */
    static distanceInternal(string1, string2, len1, len2, start, char1Costs) {
      for (let j = 0; j < len2; )
        char1Costs[j] = ++j;
      let currentCharCost = 0;
      if (start === 0) {
        for (let i = 0; i < len1; ++i) {
          let leftCharCost, aboveCharCost;
          leftCharCost = aboveCharCost = i;
          const char1 = string1.charCodeAt(i);
          for (let j = 0; j < len2; ++j) {
            currentCharCost = leftCharCost;
            leftCharCost = char1Costs[j];
            if (string2.charCodeAt(j) !== char1) {
              if (aboveCharCost < currentCharCost)
                currentCharCost = aboveCharCost;
              if (leftCharCost < currentCharCost)
                currentCharCost = leftCharCost;
              ++currentCharCost;
            }
            char1Costs[j] = aboveCharCost = currentCharCost;
          }
        }
      } else {
        for (let i = 0; i < len1; ++i) {
          let leftCharCost, aboveCharCost;
          leftCharCost = aboveCharCost = i;
          const char1 = string1.charCodeAt(start + i);
          for (let j = 0; j < len2; ++j) {
            currentCharCost = leftCharCost;
            leftCharCost = char1Costs[j];
            if (string2.charCodeAt(start + j) !== char1) {
              if (aboveCharCost < currentCharCost)
                currentCharCost = aboveCharCost;
              if (leftCharCost < currentCharCost)
                currentCharCost = leftCharCost;
              ++currentCharCost;
            }
            char1Costs[j] = aboveCharCost = currentCharCost;
          }
        }
      }
      return currentCharCost;
    }
    /** Internal implementation of the core Levenshtein algorithm that accepts a maxDistance. */
    static distanceInternalMax(string1, string2, len1, len2, start, maxDistance, char1Costs) {
      let i, j;
      for (j = 0; j < maxDistance; )
        char1Costs[j] = ++j;
      for (; j < len2; )
        char1Costs[j++] = maxDistance + 1;
      const lenDiff = len2 - len1;
      const jStartOffset = maxDistance - lenDiff;
      let jStart = 0;
      let jEnd = maxDistance;
      let currentCost = 0;
      if (start === 0) {
        for (i = 0; i < len1; ++i) {
          const char1 = string1.charCodeAt(i);
          let prevChar1Cost, aboveCharCost;
          prevChar1Cost = aboveCharCost = i;
          jStart += i > jStartOffset ? 1 : 0;
          jEnd += jEnd < len2 ? 1 : 0;
          for (j = jStart; j < jEnd; ++j) {
            currentCost = prevChar1Cost;
            prevChar1Cost = char1Costs[j];
            if (string2.charCodeAt(j) !== char1) {
              if (aboveCharCost < currentCost)
                currentCost = aboveCharCost;
              if (prevChar1Cost < currentCost)
                currentCost = prevChar1Cost;
              ++currentCost;
            }
            char1Costs[j] = aboveCharCost = currentCost;
          }
          if (char1Costs[i + lenDiff] > maxDistance)
            return -1;
        }
      } else {
        for (i = 0; i < len1; ++i) {
          const char1 = string1.charCodeAt(start + i);
          let prevChar1Cost, aboveCharCost;
          prevChar1Cost = aboveCharCost = i;
          jStart += i > jStartOffset ? 1 : 0;
          jEnd += jEnd < len2 ? 1 : 0;
          for (j = jStart; j < jEnd; ++j) {
            currentCost = prevChar1Cost;
            prevChar1Cost = char1Costs[j];
            if (string2.charCodeAt(start + j) !== char1) {
              if (aboveCharCost < currentCost)
                currentCost = aboveCharCost;
              if (prevChar1Cost < currentCost)
                currentCost = prevChar1Cost;
              ++currentCost;
            }
            char1Costs[j] = aboveCharCost = currentCost;
          }
          if (char1Costs[i + lenDiff] > maxDistance)
            return -1;
        }
      }
      return currentCost <= maxDistance ? currentCost : -1;
    }
  };

  // node_modules/symspell-ts/dist/edit-distance.js
  var DistanceAlgorithm;
  (function(DistanceAlgorithm2) {
    DistanceAlgorithm2[DistanceAlgorithm2["Levenshtein"] = 0] = "Levenshtein";
    DistanceAlgorithm2[DistanceAlgorithm2["DamerauOSA"] = 1] = "DamerauOSA";
  })(DistanceAlgorithm || (DistanceAlgorithm = {}));
  var EditDistance = class {
    constructor(algorithm) {
      this.algorithm = algorithm;
      switch (algorithm) {
        case DistanceAlgorithm.DamerauOSA:
          this.distanceComparer = new DamerauOSA();
          break;
        case DistanceAlgorithm.Levenshtein:
          this.distanceComparer = new Levenshtein();
          break;
        default:
          throw new Error("Unknown distance algorithm.");
      }
    }
    /** Compare two strings to determine the edit distance, using the previously selected algorithm.
     *  Returns the edit distance (or -1 if maxDistance exceeded). */
    compare(string1, string2, maxDistance) {
      return this.distanceComparer.distance(string1, string2, maxDistance);
    }
  };

  // node_modules/symspell-ts/dist/symspell.js
  var CHUNK_SIZE = 4096;
  var DIV_SHIFT = 12;
  var ChunkArray = class {
    constructor(initialCapacity) {
      const chunks = Math.ceil(initialCapacity / CHUNK_SIZE) || 1;
      this.values = [];
      for (let i = 0; i < chunks; i++)
        this.values.push(new Array(CHUNK_SIZE));
      this.count = 0;
    }
    add(value) {
      if (this.count === this.capacity) {
        this.values.push(new Array(CHUNK_SIZE));
      }
      this.values[this.count >> DIV_SHIFT][this.count & CHUNK_SIZE - 1] = value;
      this.count++;
      return this.count - 1;
    }
    clear() {
      this.count = 0;
    }
    get(index) {
      return this.values[index >> DIV_SHIFT][index & CHUNK_SIZE - 1];
    }
    set(index, value) {
      this.values[index >> DIV_SHIFT][index & CHUNK_SIZE - 1] = value;
    }
    get capacity() {
      return this.values.length * CHUNK_SIZE;
    }
  };
  var SuggestionStage = class {
    constructor(initialCapacity) {
      this.deletes = /* @__PURE__ */ new Map();
      this.nodes = new ChunkArray(initialCapacity * 2);
    }
    get deleteCount() {
      return this.deletes.size;
    }
    get nodeCount() {
      return this.nodes.count;
    }
    clear() {
      this.deletes.clear();
      this.nodes.clear();
    }
    add(deleteHash, suggestion) {
      let entry = this.deletes.get(deleteHash);
      if (entry === void 0)
        entry = { count: 0, first: -1 };
      const next = entry.first;
      entry.count++;
      entry.first = this.nodes.count;
      this.deletes.set(deleteHash, entry);
      this.nodes.add({ suggestion, next });
    }
    commitTo(permanentDeletes) {
      for (const [key, entry] of this.deletes) {
        let i;
        let suggestions = permanentDeletes.get(key);
        if (suggestions !== void 0) {
          i = suggestions.length;
          const newSuggestions = new Array(suggestions.length + entry.count);
          for (let k = 0; k < suggestions.length; k++)
            newSuggestions[k] = suggestions[k];
          permanentDeletes.set(key, suggestions = newSuggestions);
        } else {
          i = 0;
          suggestions = new Array(entry.count);
          permanentDeletes.set(key, suggestions);
        }
        let next = entry.first;
        while (next >= 0) {
          const node = this.nodes.get(next);
          suggestions[i] = node.suggestion;
          next = node.next;
          i++;
        }
      }
    }
  };
  var defaultMaxEditDistance = 2;
  var defaultPrefixLength = 7;
  var defaultCountThreshold = 1;
  var defaultInitialCapacity = 16;
  var defaultCompactLevel = 5;
  var SymSpell = class _SymSpell {
    /** Maximum edit distance for dictionary precalculation. */
    get maxEditDistance() {
      return this.maxDictionaryEditDistance;
    }
    /** Length of prefix, from which deletes are generated. */
    get prefixLen() {
      return this.prefixLength;
    }
    /** Length of longest word in the dictionary. */
    get maxLength() {
      return this.maxDictionaryWordLength;
    }
    /** Count threshold for a word to be considered a valid word for spelling correction. */
    get countThresholdValue() {
      return this.countThreshold;
    }
    /** Number of unique words in the dictionary. */
    get wordCount() {
      return this.words.size;
    }
    /** Number of word prefixes and intermediate word deletes encoded in the dictionary. */
    get entryCount() {
      return this.deletes?.size ?? 0;
    }
    constructor(initialCapacity = defaultInitialCapacity, maxDictionaryEditDistance = defaultMaxEditDistance, prefixLength = defaultPrefixLength, countThreshold = defaultCountThreshold, compactLevel = defaultCompactLevel) {
      this.distanceAlgorithm = DistanceAlgorithm.DamerauOSA;
      this.maxDictionaryWordLength = 0;
      this.deletes = null;
      this.belowThresholdWords = /* @__PURE__ */ new Map();
      this.bigrams = /* @__PURE__ */ new Map();
      this.bigramCountMin = Number.MAX_SAFE_INTEGER;
      if (initialCapacity < 0)
        throw new RangeError("initialCapacity must be >= 0");
      if (maxDictionaryEditDistance < 0)
        throw new RangeError("maxDictionaryEditDistance must be >= 0");
      if (prefixLength < 1 || prefixLength <= maxDictionaryEditDistance)
        throw new RangeError("prefixLength must be > maxDictionaryEditDistance");
      if (countThreshold < 0)
        throw new RangeError("countThreshold must be >= 0");
      if (compactLevel < 0 || compactLevel > 16)
        throw new RangeError("compactLevel must be >= 0 and <= 16");
      this.initialCapacity = initialCapacity;
      this.words = /* @__PURE__ */ new Map();
      this.maxDictionaryEditDistance = maxDictionaryEditDistance;
      this.prefixLength = prefixLength;
      this.countThreshold = countThreshold;
      if (compactLevel > 16)
        compactLevel = 16;
      this.compactMask = 4294967295 >>> 3 + compactLevel << 2 >>> 0;
    }
    // ---------- Dictionary building ----------
    /**
     * Create/Update an entry in the dictionary.
     * Returns true if the word was added as a new correctly spelled word.
     */
    createDictionaryEntry(key, count, staging) {
      if (count <= 0) {
        if (this.countThreshold > 0)
          return false;
        count = 0;
      }
      let countPrevious = -1;
      if (this.countThreshold > 1) {
        const belowCount = this.belowThresholdWords.get(key);
        if (belowCount !== void 0) {
          countPrevious = belowCount;
          count = Number.MAX_SAFE_INTEGER - countPrevious > count ? countPrevious + count : Number.MAX_SAFE_INTEGER;
          if (count >= this.countThreshold) {
            this.belowThresholdWords.delete(key);
          } else {
            this.belowThresholdWords.set(key, count);
            return false;
          }
        }
      }
      if (countPrevious === -1) {
        const wordCount = this.words.get(key);
        if (wordCount !== void 0) {
          countPrevious = wordCount;
          count = Number.MAX_SAFE_INTEGER - countPrevious > count ? countPrevious + count : Number.MAX_SAFE_INTEGER;
          this.words.set(key, count);
          return false;
        } else if (count < this.countThreshold) {
          this.belowThresholdWords.set(key, count);
          return false;
        }
      }
      this.words.set(key, count);
      if (key.length > this.maxDictionaryWordLength)
        this.maxDictionaryWordLength = key.length;
      if (this.deletes === null)
        this.deletes = /* @__PURE__ */ new Map();
      const edits = this.editsPrefix(key);
      if (staging) {
        for (const del of edits)
          staging.add(this.getStringHash(del), key);
      } else {
        for (const del of edits) {
          const deleteHash = this.getStringHash(del);
          const suggestions = this.deletes.get(deleteHash);
          if (suggestions !== void 0) {
            const newSuggestions = new Array(suggestions.length + 1);
            for (let i = 0; i < suggestions.length; i++)
              newSuggestions[i] = suggestions[i];
            this.deletes.set(deleteHash, newSuggestions);
            newSuggestions[suggestions.length] = key;
          } else {
            this.deletes.set(deleteHash, [key]);
          }
        }
      }
      return true;
    }
    /**
     * Load multiple dictionary entries from a string of word/frequency count pairs (one per line).
     * Merges with any dictionary data already loaded.
     */
    loadDictionary(corpus, termIndex, countIndex, separator) {
      if (!Number.isInteger(termIndex) || termIndex < 0)
        throw new RangeError("termIndex must be a non-negative integer");
      if (!Number.isInteger(countIndex) || countIndex < 0)
        throw new RangeError("countIndex must be a non-negative integer");
      if (corpus.charCodeAt(0) === 65279)
        corpus = corpus.substring(1);
      const staging = new SuggestionStage(16384);
      const lines = corpus.split(/\r?\n/);
      const minParts = Math.max(termIndex, countIndex) + 1;
      for (const line of lines) {
        if (!line)
          continue;
        const lineParts = separator !== void 0 ? line.split(separator) : line.split(/\s+/);
        if (lineParts.length >= minParts) {
          const key = lineParts[termIndex];
          const count = parseInt(lineParts[countIndex], 10);
          if (!isNaN(count)) {
            this.createDictionaryEntry(key, count, staging);
          }
        }
      }
      this.commitStaged(staging);
      return true;
    }
    /**
     * Load multiple bigram dictionary entries from a string of bigram/frequency count pairs (one per line).
     * Merges with any dictionary data already loaded.
     */
    loadBigramDictionary(corpus, termIndex, countIndex, separator) {
      if (!Number.isInteger(termIndex) || termIndex < 0)
        throw new RangeError("termIndex must be a non-negative integer");
      if (!Number.isInteger(countIndex) || countIndex < 0)
        throw new RangeError("countIndex must be a non-negative integer");
      if (corpus.charCodeAt(0) === 65279)
        corpus = corpus.substring(1);
      const lines = corpus.split(/\r?\n/);
      const isDefault = separator === void 0;
      const minParts = isDefault ? Math.max(termIndex + 2, countIndex + 1) : Math.max(termIndex, countIndex) + 1;
      for (const line of lines) {
        if (!line)
          continue;
        const lineParts = isDefault ? line.split(/\s+/) : line.split(separator);
        if (lineParts.length >= minParts) {
          const key = isDefault ? lineParts[termIndex] + " " + lineParts[termIndex + 1] : lineParts[termIndex];
          const count = parseInt(lineParts[countIndex], 10);
          if (!isNaN(count)) {
            this.bigrams.set(key, count);
            if (count < this.bigramCountMin)
              this.bigramCountMin = count;
          }
        }
      }
      return true;
    }
    /**
     * Load multiple dictionary words from a string containing plain text.
     * Merges with any dictionary data already loaded.
     */
    createDictionary(corpus) {
      if (corpus.charCodeAt(0) === 65279)
        corpus = corpus.substring(1);
      const staging = new SuggestionStage(16384);
      const lines = corpus.split(/\r?\n/);
      for (const line of lines) {
        for (const key of this.parseWords(line)) {
          this.createDictionaryEntry(key, 1, staging);
        }
      }
      this.commitStaged(staging);
      return true;
    }
    /** Remove all below threshold words from the dictionary. */
    purgeBelowThresholdWords() {
      this.belowThresholdWords = /* @__PURE__ */ new Map();
    }
    /** Commit staged dictionary additions. */
    commitStaged(staging) {
      if (this.deletes === null)
        this.deletes = /* @__PURE__ */ new Map();
      staging.commitTo(this.deletes);
    }
    // ---------- Lookup ----------
    /**
     * Find suggested spellings for a given input word.
     */
    lookup(input, verbosity, maxEditDistance, includeUnknown) {
      const maxED = maxEditDistance ?? this.maxDictionaryEditDistance;
      const unknown = includeUnknown ?? false;
      if (maxED > this.maxDictionaryEditDistance)
        throw new RangeError("maxEditDistance cannot be larger than maxDictionaryEditDistance");
      const suggestions = [];
      const inputLen = input.length;
      if (inputLen - maxED > this.maxDictionaryWordLength) {
        if (unknown && suggestions.length === 0)
          suggestions.push(new SuggestItem(input, maxED + 1, 0));
        return suggestions;
      }
      let suggestionCount = 0;
      const exactCount = this.words.get(input);
      if (exactCount !== void 0) {
        suggestionCount = exactCount;
        suggestions.push(new SuggestItem(input, 0, suggestionCount));
        if (verbosity !== Verbosity.All) {
          if (unknown && suggestions.length === 0)
            suggestions.push(new SuggestItem(input, maxED + 1, 0));
          return suggestions;
        }
      }
      if (maxED === 0) {
        if (unknown && suggestions.length === 0)
          suggestions.push(new SuggestItem(input, maxED + 1, 0));
        return suggestions;
      }
      const hashset1 = /* @__PURE__ */ new Set();
      const hashset2 = /* @__PURE__ */ new Set();
      hashset2.add(input);
      let maxEditDistance2 = maxED;
      let candidatePointer = 0;
      const candidates = [];
      let inputPrefixLen = inputLen;
      if (inputPrefixLen > this.prefixLength) {
        inputPrefixLen = this.prefixLength;
        candidates.push(input.substring(0, inputPrefixLen));
      } else {
        candidates.push(input);
      }
      const distanceComparer = new EditDistance(this.distanceAlgorithm);
      while (candidatePointer < candidates.length) {
        const candidate = candidates[candidatePointer++];
        const candidateLen = candidate.length;
        const lengthDiff = inputPrefixLen - candidateLen;
        if (lengthDiff > maxEditDistance2) {
          if (verbosity === Verbosity.All)
            continue;
          break;
        }
        const dictSuggestions = this.deletes?.get(this.getStringHash(candidate));
        if (dictSuggestions !== void 0) {
          for (let i = 0; i < dictSuggestions.length; i++) {
            const suggestion = dictSuggestions[i];
            const suggestionLen = suggestion.length;
            if (suggestion === input)
              continue;
            if (Math.abs(suggestionLen - inputLen) > maxEditDistance2 || // input and sugg lengths diff > allowed/current best distance
            suggestionLen < candidateLen || // sugg must be for a different delete string, in same bin only because of hash collision
            suggestionLen === candidateLen && suggestion !== candidate)
              continue;
            const suggPrefixLen = Math.min(suggestionLen, this.prefixLength);
            if (suggPrefixLen > inputPrefixLen && suggPrefixLen - candidateLen > maxEditDistance2)
              continue;
            let distance = 0;
            let min = 0;
            if (candidateLen === 0) {
              distance = Math.max(inputLen, suggestionLen);
              if (distance > maxEditDistance2 || hashset2.has(suggestion))
                continue;
              hashset2.add(suggestion);
            } else if (suggestionLen === 1) {
              if (input.indexOf(suggestion[0]) < 0)
                distance = inputLen;
              else
                distance = inputLen - 1;
              if (distance > maxEditDistance2 || hashset2.has(suggestion))
                continue;
              hashset2.add(suggestion);
            } else if (this.prefixLength - maxED === candidateLen && ((min = Math.min(inputLen, suggestionLen) - this.prefixLength) > 1 && input.substring(inputLen + 1 - min) !== suggestion.substring(suggestionLen + 1 - min) || min > 0 && input.charCodeAt(inputLen - min) !== suggestion.charCodeAt(suggestionLen - min) && (input.charCodeAt(inputLen - min - 1) !== suggestion.charCodeAt(suggestionLen - min) || input.charCodeAt(inputLen - min) !== suggestion.charCodeAt(suggestionLen - min - 1)))) {
              continue;
            } else {
              if (verbosity !== Verbosity.All && !this.deleteInSuggestionPrefix(candidate, candidateLen, suggestion, suggestionLen) || hashset2.has(suggestion))
                continue;
              hashset2.add(suggestion);
              distance = distanceComparer.compare(input, suggestion, maxEditDistance2);
              if (distance < 0)
                continue;
            }
            if (distance <= maxEditDistance2) {
              suggestionCount = this.words.get(suggestion);
              const si = new SuggestItem(suggestion, distance, suggestionCount);
              if (suggestions.length > 0) {
                switch (verbosity) {
                  case Verbosity.Closest: {
                    if (distance < maxEditDistance2)
                      suggestions.length = 0;
                    break;
                  }
                  case Verbosity.Top: {
                    if (distance < maxEditDistance2 || suggestionCount > suggestions[0].count) {
                      maxEditDistance2 = distance;
                      suggestions[0] = si;
                    }
                    continue;
                  }
                }
              }
              if (verbosity !== Verbosity.All)
                maxEditDistance2 = distance;
              suggestions.push(si);
            }
          }
        }
        if (lengthDiff < maxED && candidateLen <= this.prefixLength) {
          if (verbosity !== Verbosity.All && lengthDiff >= maxEditDistance2)
            continue;
          for (let i = 0; i < candidateLen; i++) {
            const del = candidate.substring(0, i) + candidate.substring(i + 1);
            if (!hashset1.has(del)) {
              hashset1.add(del);
              candidates.push(del);
            }
          }
        }
      }
      if (suggestions.length > 1)
        suggestions.sort((a, b) => a.compareTo(b));
      if (unknown && suggestions.length === 0)
        suggestions.push(new SuggestItem(input, maxED + 1, 0));
      return suggestions;
    }
    // ---------- LookupCompound ----------
    /**
     * Find suggested spellings for a multi-word input string (supports word splitting/merging).
     */
    lookupCompound(input, editDistanceMax) {
      const maxED = editDistanceMax ?? this.maxDictionaryEditDistance;
      const termList1 = this.parseWords(input);
      let suggestions = [];
      const suggestionParts = [];
      const distanceComparer = new EditDistance(this.distanceAlgorithm);
      let lastCombi = false;
      for (let i = 0; i < termList1.length; i++) {
        suggestions = this.lookup(termList1[i], Verbosity.Top, maxED);
        if (i > 0 && !lastCombi) {
          const suggestionsCombi = this.lookup(termList1[i - 1] + termList1[i], Verbosity.Top, maxED);
          if (suggestionsCombi.length > 0) {
            const best1 = suggestionParts[suggestionParts.length - 1];
            let best2 = new SuggestItem();
            if (suggestions.length > 0) {
              best2 = suggestions[0];
            } else {
              best2.term = termList1[i];
              best2.distance = maxED + 1;
              best2.count = Math.trunc(10 / Math.pow(10, best2.term.length));
            }
            const distance1 = best1.distance + best2.distance;
            if (distance1 >= 0 && (suggestionsCombi[0].distance + 1 < distance1 || suggestionsCombi[0].distance + 1 === distance1 && suggestionsCombi[0].count > best1.count / _SymSpell.N * best2.count)) {
              suggestionsCombi[0].distance++;
              suggestionParts[suggestionParts.length - 1] = suggestionsCombi[0];
              lastCombi = true;
              continue;
            }
          }
        }
        lastCombi = false;
        if (suggestions.length > 0 && (suggestions[0].distance === 0 || termList1[i].length === 1)) {
          suggestionParts.push(suggestions[0]);
        } else {
          let suggestionSplitBest = null;
          if (suggestions.length > 0)
            suggestionSplitBest = suggestions[0];
          if (termList1[i].length > 1) {
            for (let j = 1; j < termList1[i].length; j++) {
              const part1 = termList1[i].substring(0, j);
              const part2 = termList1[i].substring(j);
              const suggestionSplit = new SuggestItem();
              const suggestions1 = this.lookup(part1, Verbosity.Top, maxED);
              if (suggestions1.length > 0) {
                const suggestions2 = this.lookup(part2, Verbosity.Top, maxED);
                if (suggestions2.length > 0) {
                  suggestionSplit.term = suggestions1[0].term + " " + suggestions2[0].term;
                  let distance2 = distanceComparer.compare(termList1[i], suggestionSplit.term, maxED);
                  if (distance2 < 0)
                    distance2 = maxED + 1;
                  if (suggestionSplitBest !== null) {
                    if (distance2 > suggestionSplitBest.distance)
                      continue;
                    if (distance2 < suggestionSplitBest.distance)
                      suggestionSplitBest = null;
                  }
                  suggestionSplit.distance = distance2;
                  const bigramCount = this.bigrams.get(suggestionSplit.term);
                  if (bigramCount !== void 0) {
                    suggestionSplit.count = bigramCount;
                    if (suggestions.length > 0) {
                      if (suggestions1[0].term + suggestions2[0].term === termList1[i]) {
                        suggestionSplit.count = Math.max(suggestionSplit.count, suggestions[0].count + 2);
                      } else if (suggestions1[0].term === suggestions[0].term || suggestions2[0].term === suggestions[0].term) {
                        suggestionSplit.count = Math.max(suggestionSplit.count, suggestions[0].count + 1);
                      }
                    } else if (suggestions1[0].term + suggestions2[0].term === termList1[i]) {
                      suggestionSplit.count = Math.max(suggestionSplit.count, Math.max(suggestions1[0].count, suggestions2[0].count) + 2);
                    }
                  } else {
                    suggestionSplit.count = Math.min(this.bigramCountMin, Math.trunc(suggestions1[0].count / _SymSpell.N * suggestions2[0].count));
                  }
                  if (suggestionSplitBest === null || suggestionSplit.count > suggestionSplitBest.count)
                    suggestionSplitBest = suggestionSplit;
                }
              }
            }
            if (suggestionSplitBest !== null) {
              suggestionParts.push(suggestionSplitBest);
            } else {
              const si = new SuggestItem();
              si.term = termList1[i];
              si.count = Math.trunc(10 / Math.pow(10, si.term.length));
              si.distance = maxED + 1;
              suggestionParts.push(si);
            }
          } else {
            const si = new SuggestItem();
            si.term = termList1[i];
            si.count = Math.trunc(10 / Math.pow(10, si.term.length));
            si.distance = maxED + 1;
            suggestionParts.push(si);
          }
        }
      }
      const suggestion = new SuggestItem();
      let countProduct = _SymSpell.N;
      let s = "";
      for (const si of suggestionParts) {
        s += si.term + " ";
        countProduct *= si.count / _SymSpell.N;
      }
      suggestion.count = Math.trunc(countProduct);
      suggestion.term = s.trimEnd();
      suggestion.distance = distanceComparer.compare(input, suggestion.term, 2147483647);
      return [suggestion];
    }
    // ---------- WordSegmentation ----------
    /**
     * WordSegmentation divides a string into words by inserting missing spaces at the appropriate positions.
     * Misspelled words are corrected and do not affect segmentation.
     * Existing spaces are allowed and considered for optimum segmentation.
     */
    wordSegmentation(input, maxEditDistance, maxSegmentationWordLength) {
      const maxED = maxEditDistance ?? this.maxDictionaryEditDistance;
      const maxSegLen = maxSegmentationWordLength ?? this.maxDictionaryWordLength;
      input = input.normalize("NFKC").replace(/\u002D/g, "");
      if (input.length === 0 || maxSegLen === 0) {
        return { segmentedString: "", correctedString: "", distanceSum: 0, probabilityLogSum: 0 };
      }
      const arraySize = Math.min(maxSegLen, input.length);
      const compositions = new Array(arraySize);
      let circularIndex = -1;
      for (let j = 0; j < input.length; j++) {
        const imax = Math.min(input.length - j, maxSegLen);
        for (let i = 1; i <= imax; i++) {
          let part = input.substring(j, j + i);
          let separatorLength = 0;
          let topEd = 0;
          let topProbabilityLog = 0;
          let topResult = "";
          if (/\s/.test(part[0])) {
            part = part.substring(1);
          } else {
            separatorLength = 1;
          }
          topEd += part.length;
          part = part.replace(/ /g, "");
          topEd -= part.length;
          const results = this.lookup(part.toLowerCase(), Verbosity.Top, maxED);
          if (results.length > 0) {
            topResult = results[0].term;
            if (part.length > 0 && part[0] === part[0].toUpperCase() && part[0] !== part[0].toLowerCase()) {
              topResult = topResult[0].toUpperCase() + topResult.substring(1);
            }
            topEd += results[0].distance;
            topProbabilityLog = Math.log10(results[0].count / _SymSpell.N);
          } else {
            topResult = part;
            topEd += part.length;
            topProbabilityLog = Math.log10(10 / (_SymSpell.N * Math.pow(10, part.length)));
          }
          const destinationIndex = (i + circularIndex) % arraySize;
          if (j === 0) {
            compositions[destinationIndex] = {
              segmentedString: part,
              correctedString: topResult,
              distanceSum: topEd,
              probabilityLogSum: topProbabilityLog
            };
          } else if (i === maxSegLen || // replace values if better probabilityLogSum, if same edit distance OR one space difference
          (compositions[circularIndex].distanceSum + topEd === compositions[destinationIndex].distanceSum || compositions[circularIndex].distanceSum + separatorLength + topEd === compositions[destinationIndex].distanceSum) && compositions[destinationIndex].probabilityLogSum < compositions[circularIndex].probabilityLogSum + topProbabilityLog || // replace values if smaller edit distance
          compositions[circularIndex].distanceSum + separatorLength + topEd < compositions[destinationIndex].distanceSum) {
            if (topResult.length === 1 && isPunctuation(topResult) || topResult.length === 2 && topResult.startsWith("\u2019")) {
              compositions[destinationIndex] = {
                segmentedString: compositions[circularIndex].segmentedString + part,
                correctedString: compositions[circularIndex].correctedString + topResult,
                distanceSum: compositions[circularIndex].distanceSum + topEd,
                probabilityLogSum: compositions[circularIndex].probabilityLogSum + topProbabilityLog
              };
            } else {
              compositions[destinationIndex] = {
                segmentedString: compositions[circularIndex].segmentedString + " " + part,
                correctedString: compositions[circularIndex].correctedString + " " + topResult,
                distanceSum: compositions[circularIndex].distanceSum + separatorLength + topEd,
                probabilityLogSum: compositions[circularIndex].probabilityLogSum + topProbabilityLog
              };
            }
          }
        }
        circularIndex++;
        if (circularIndex === arraySize)
          circularIndex = 0;
      }
      return compositions[circularIndex];
    }
    // ---------- Private helpers ----------
    // check whether all delete chars are present in the suggestion prefix in correct order
    deleteInSuggestionPrefix(delete_, deleteLen, suggestion, suggestionLen) {
      if (deleteLen === 0)
        return true;
      if (this.prefixLength < suggestionLen)
        suggestionLen = this.prefixLength;
      let j = 0;
      for (let i = 0; i < deleteLen; i++) {
        const delChar = delete_.charCodeAt(i);
        while (j < suggestionLen && delChar !== suggestion.charCodeAt(j))
          j++;
        if (j === suggestionLen)
          return false;
      }
      return true;
    }
    // create a non-unique wordlist from sample text
    parseWords(text) {
      const matches = text.toLowerCase().match(/['\u2019\p{L}\p{N}\p{M}]+/gu);
      if (!matches)
        return [];
      return matches;
    }
    // inexpensive and language independent: only deletes, no transposes + replaces + inserts
    edits(word, editDistance, deleteWords) {
      editDistance++;
      if (word.length > 1) {
        for (let i = 0; i < word.length; i++) {
          const delete_ = word.substring(0, i) + word.substring(i + 1);
          if (!deleteWords.has(delete_)) {
            deleteWords.add(delete_);
            if (editDistance < this.maxDictionaryEditDistance)
              this.edits(delete_, editDistance, deleteWords);
          }
        }
      }
      return deleteWords;
    }
    editsPrefix(key) {
      const hashSet = /* @__PURE__ */ new Set();
      if (key.length <= this.maxDictionaryEditDistance)
        hashSet.add("");
      if (key.length > this.prefixLength)
        key = key.substring(0, this.prefixLength);
      hashSet.add(key);
      return this.edits(key, 0, hashSet);
    }
    getStringHash(s) {
      const len = s.length;
      let lenMask = len;
      if (lenMask > 3)
        lenMask = 3;
      let hash = 2166136261 >>> 0;
      for (let i = 0; i < len; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619) >>> 0;
      }
      hash = (hash & this.compactMask) >>> 0;
      hash = (hash | lenMask) >>> 0;
      return hash | 0;
    }
  };
  SymSpell.N = 1024908267229;
  var punctuationRegex = /\p{P}/u;
  function isPunctuation(ch) {
    return punctuationRegex.test(ch);
  }

  // shim-node:node:path
  var resolve = () => "";
  var dirname = () => "";

  // shim-node:node:url
  var fileURLToPath = () => "";

  // node_modules/symspell-ts/dist/defaults.js
  var import_meta = {};
  var __filename = fileURLToPath(import_meta.url);
  var __dirname = dirname(__filename);
  var dataDir = resolve(__dirname, "..", "data");

  // src/lib/keyboard-layout.ts
  var BASE_LAYOUT = {
    "q": [0, 0],
    "w": [0, 1],
    "e": [0, 2],
    "r": [0, 3],
    "t": [0, 4],
    "y": [0, 5],
    "u": [0, 6],
    "i": [0, 7],
    "o": [0, 8],
    "p": [0, 9],
    "a": [1, 0],
    "s": [1, 1],
    "d": [1, 2],
    "f": [1, 3],
    "g": [1, 4],
    "h": [1, 5],
    "j": [1, 6],
    "k": [1, 7],
    "l": [1, 8],
    "\xE7": [1, 9],
    "z": [2, 0],
    "x": [2, 1],
    "c": [2, 2],
    "v": [2, 3],
    "b": [2, 4],
    "n": [2, 5],
    "m": [2, 6]
  };
  var ACCENT_BASE = {
    "\xE1": "a",
    "\xE0": "a",
    "\xE2": "a",
    "\xE3": "a",
    "\xE9": "e",
    "\xEA": "e",
    "\xED": "i",
    "\xF3": "o",
    "\xF4": "o",
    "\xF5": "o",
    "\xFA": "u"
  };
  function resolveKey(ch) {
    const base = ACCENT_BASE[ch] || ch;
    return BASE_LAYOUT[base];
  }
  function keyboardWeight(a, b) {
    const ca = a.toLowerCase();
    const cb = b.toLowerCase();
    if (ca === cb) return 0;
    const pa = resolveKey(ca);
    const pb = resolveKey(cb);
    if (!pa || !pb) return 1;
    const dr = pa[0] - pb[0];
    const dc = pa[1] - pb[1];
    return Math.sqrt(dr * dr + dc * dc);
  }
  function keyboardWeightedDistance(word, candidate) {
    if (word.length !== candidate.length) return Math.abs(word.length - candidate.length);
    let totalWeight = 0;
    for (let i = 0; i < word.length; i++) {
      totalWeight += keyboardWeight(word[i], candidate[i]);
    }
    return totalWeight / word.length;
  }

  // src/workers/spell-worker.ts
  var isWarm = false;
  var suggestEngine = null;
  var suggestInitPromise = null;
  var WORD_REGEX = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+(?:-[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+)*/g;
  function tokenize(text) {
    const tokens = [];
    let m;
    while ((m = WORD_REGEX.exec(text)) !== null) {
      tokens.push({ word: m[0], position: m.index });
    }
    return tokens;
  }
  function isPunctuationOrNumber(word) {
    return /^[\d.,!?;:()\[\]{}\"'«»\-—…\s]+$/.test(word);
  }
  async function initSuggestEngine() {
    if (suggestEngine) return;
    if (suggestInitPromise) return suggestInitPromise;
    suggestInitPromise = (async () => {
      const words = await getAllWords();
      const s = new SymSpell(DistanceAlgorithm.DamerauOSA, 3, 7, 0);
      for (const w of words) {
        s.createDictionaryEntry(w, 1);
      }
      suggestEngine = s;
    })();
    return suggestInitPromise;
  }
  async function getSuggestions(word) {
    const lower = word.toLowerCase();
    if (!suggestEngine) return [];
    const results = suggestEngine.lookup(lower, Verbosity.All, 3);
    const scored = results.map((item) => ({
      word: item.term,
      dist: item.distance,
      keyboardPenalty: keyboardWeightedDistance(lower, item.term.toLowerCase())
    }));
    scored.sort((a, b) => {
      const dDiff = a.dist - b.dist;
      if (dDiff !== 0) return dDiff;
      return a.keyboardPenalty - b.keyboardPenalty;
    });
    return [...new Set(scored.map((s) => s.word))].slice(0, 8);
  }
  async function performSpellCheck(text) {
    const tokens = tokenize(text);
    const checkableTokens = tokens.filter((t) => !isPunctuationOrNumber(t.word));
    if (checkableTokens.length === 0) return [];
    await ensureInit();
    const misspelledTokens = [];
    for (const { word, position } of checkableTokens) {
      const correct = await isWordCorrect(word);
      if (!correct) {
        misspelledTokens.push({ word, position });
      }
    }
    if (misspelledTokens.length === 0) return [];
    await initSuggestEngine();
    const result = await Promise.all(
      misspelledTokens.map(async (t) => ({
        word: t.word,
        position: t.position,
        suggestions: await getSuggestions(t.word)
      }))
    );
    return result;
  }
  self.onmessage = async (e) => {
    const { id, type, text } = e.data;
    try {
      if (type === "warmup") {
        await ensureInit();
        initSuggestEngine().catch(() => {
        });
        isWarm = true;
        const response = { id, type: "warmup-complete" };
        self.postMessage(response);
        return;
      }
      if (type === "check" && text !== void 0) {
        const errors = await performSpellCheck(text);
        const response = { id, type: "result", errors };
        self.postMessage(response);
        return;
      }
    } catch (error) {
      const response = {
        id,
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      };
      self.postMessage(response);
    }
  };
})();
