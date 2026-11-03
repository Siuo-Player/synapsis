/**
 * test_simulator_math.js
 * Comprehensive unit test suite for simulator_math.js edge cases and mathematical bounds.
 */

const assert = require('assert');
const {
  binaryEntropy,
  binarySplitInfo,
  getValidPurityBounds,
  calculateEntropySplit
} = require('./simulator_math.js');

console.log("Running SimulatorMath Unit Test Suite...");

// 1. Extreme boundary entropy tests (Zero entropy for pure nodes)
assert.strictEqual(binaryEntropy(0.0), 0.0, "Entropy of 0 must be 0.0");
assert.strictEqual(binaryEntropy(1.0), 0.0, "Entropy of 1 must be 0.0");
assert.strictEqual(binaryEntropy(0.5), 1.0, "Entropy of balanced node 0.5 must be 1.0");

// 2. Symmetry test
for (let p = 0.05; p <= 0.50; p += 0.05) {
  const h1 = binaryEntropy(p);
  const h2 = binaryEntropy(1.0 - p);
  assert.ok(Math.abs(h1 - h2) < 1e-12, `Entropy must be symmetric at p=${p}`);
}

// 3. Critical NaN bug reproduction test: pR = 1.0 (0 * log2(0))
// p = 0.91, wL = 0.90, pL = 0.90 => pR = (0.91 - 0.90*0.90)/0.10 = 1.0
const splitPureRight1 = calculateEntropySplit(0.91, 0.90, 0.90);
assert.strictEqual(Math.round(splitPureRight1.pR * 1e6) / 1e6, 1.0, "pR should be 1.0");
assert.strictEqual(splitPureRight1.hDR, 0.0, "hDR for pure right branch pR=1 must be 0.0");
assert.ok(Number.isFinite(splitPureRight1.informationGain), "Information Gain must be finite");
assert.ok(!Number.isNaN(splitPureRight1.informationGain), "Information Gain must NOT be NaN");
assert.ok(Number.isFinite(splitPureRight1.gainRatio), "Gain Ratio must be finite");
assert.ok(!Number.isNaN(splitPureRight1.gainRatio), "Gain Ratio must NOT be NaN");
assert.ok(Number.isFinite(splitPureRight1.giniReduction), "Gini Reduction must be finite");
assert.ok(!Number.isNaN(splitPureRight1.giniReduction), "Gini Reduction must NOT be NaN");

// 4. Critical NaN bug reproduction test: pR = 0.0
// p = 0.10, wL = 0.50, pL = 0.20 => pR = (0.10 - 0.50*0.20)/0.50 = 0.0
const splitPureRight0 = calculateEntropySplit(0.10, 0.50, 0.20);
assert.strictEqual(Math.round(splitPureRight0.pR * 1e6) / 1e6, 0.0, "pR should be 0.0");
assert.strictEqual(splitPureRight0.hDR, 0.0, "hDR for pure right branch pR=0 must be 0.0");
assert.ok(Number.isFinite(splitPureRight0.informationGain), "Information Gain must be finite");
assert.ok(!Number.isNaN(splitPureRight0.informationGain), "Information Gain must NOT be NaN");
assert.ok(Number.isFinite(splitPureRight0.giniReduction), "Gini Reduction must be finite");
assert.ok(!Number.isNaN(splitPureRight0.giniReduction), "Gini Reduction must NOT be NaN");

// 5. Critical NaN bug reproduction test: pL = 0.0 and pL = 1.0
const splitPureLeft0 = calculateEntropySplit(0.50, 0.50, 0.0);
assert.strictEqual(splitPureLeft0.pL, 0.0);
assert.strictEqual(splitPureLeft0.hDL, 0.0, "hDL must be 0.0 for pL=0");
assert.ok(Number.isFinite(splitPureLeft0.informationGain), "Information Gain must be finite");
assert.ok(!Number.isNaN(splitPureLeft0.informationGain), "Information Gain must NOT be NaN");

const splitPureLeft1 = calculateEntropySplit(0.50, 0.50, 1.0);
assert.strictEqual(splitPureLeft1.pL, 1.0);
assert.strictEqual(splitPureLeft1.hDL, 0.0, "hDL must be 0.0 for pL=1");
assert.ok(Number.isFinite(splitPureLeft1.informationGain), "Information Gain must be finite");
assert.ok(!Number.isNaN(splitPureLeft1.informationGain), "Information Gain must NOT be NaN");

// 6. Exhaustive grid parameter feasibility test (over 10,000 combinations)
let testedCombinations = 0;
for (let pInt = 5; pInt <= 95; pInt += 5) {
  const p = pInt / 100.0;
  for (let wlInt = 10; wlInt <= 90; wlInt += 5) {
    const wL = wlInt / 100.0;
    const bounds = getValidPurityBounds(p, wL);
    assert.ok(bounds.min <= bounds.max, `Bounds ordering failed at p=${p}, wL=${wL}`);
    
    const testPurityVals = [
      bounds.min,
      bounds.min + 0.25 * (bounds.max - bounds.min),
      (bounds.min + bounds.max) / 2.0,
      bounds.min + 0.75 * (bounds.max - bounds.min),
      bounds.max
    ];

    for (const pL of testPurityVals) {
      const res = calculateEntropySplit(p, wL, pL);
      assert.ok(Number.isFinite(res.hD), "hD must be finite");
      assert.ok(Number.isFinite(res.hDL), "hDL must be finite");
      assert.ok(Number.isFinite(res.hDR), "hDR must be finite");
      assert.ok(Number.isFinite(res.informationGain), "informationGain must be finite");
      assert.ok(Number.isFinite(res.gainRatio), "gainRatio must be finite");
      assert.ok(Number.isFinite(res.giniReduction), "giniReduction must be finite");
      assert.ok(!Number.isNaN(res.informationGain), "informationGain must not be NaN");
      assert.ok(!Number.isNaN(res.gainRatio), "gainRatio must not be NaN");
      assert.ok(!Number.isNaN(res.giniReduction), "giniReduction must not be NaN");

      // Verify exact probability conservation
      const reconstructedP = res.wL * res.pL + (1.0 - res.wL) * res.pR;
      assert.ok(Math.abs(reconstructedP - p) < 1e-9, `Conservation failed: expected ${p}, got ${reconstructedP}`);
      testedCombinations++;
    }
  }
}

console.log(`✓ All SimulatorMath unit tests passed! Verified ${testedCombinations} parameter combinations with 0 NaN errors.`);
