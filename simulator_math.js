/**
 * simulator_math.js
 * Mathematical calculations and formulas for Synapsis interactive simulators.
 * Pure, tested, and shared across browser UI and automated test suites.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SimulatorMath = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EPSILON = 1e-12;

  /**
   * Calculates Shannon binary entropy H(p) in bits:
   * H(p) = - [ p * log2(p) + (1 - p) * log2(1 - p) ]
   *
   * Analytical boundary limits:
   * lim_{p -> 0} p * log2(p) = 0
   * lim_{p -> 1} (1 - p) * log2(1 - p) = 0
   *
   * Prevents JavaScript 0 * -Infinity = NaN on pure nodes (p=0 or p=1).
   *
   * @param {number} p - Probability of positive class, p in [0, 1].
   * @returns {number} Entropy in bits, in range [0, 1].
   */
  function binaryEntropy(p) {
    if (!Number.isFinite(p) || p < -EPSILON || p > 1 + EPSILON) {
      throw new RangeError(`Probability must be between 0 and 1. Received: ${p}`);
    }
    // Clean numerical tolerance clamping
    if (p < 0) p = 0;
    if (p > 1) p = 1;

    // Exact analytical boundary limits
    if (p === 0 || p === 1) {
      return 0.0;
    }

    const q = 1.0 - p;
    // When p > 0 and q > 0, Math.log2 is strictly finite
    const termP = (p === 0) ? 0.0 : p * Math.log2(p);
    const termQ = (q === 0) ? 0.0 : q * Math.log2(q);
    const h = -(termP + termQ);
    return Math.max(0.0, Math.min(1.0, h));
  }

  /**
   * Calculates Split Information for binary branch weighting w_L in [0, 1].
   * SplitInfo(D) = - [ w_L * log2(w_L) + (1 - w_L) * log2(1 - w_L) ]
   *
   * @param {number} wL - Proportion of samples in left branch, |D_L| / |D|.
   * @returns {number} SplitInfo in bits.
   */
  function binarySplitInfo(wL) {
    if (!Number.isFinite(wL) || wL < -EPSILON || wL > 1 + EPSILON) {
      throw new RangeError(`Branch weight must be between 0 and 1. Received: ${wL}`);
    }
    if (wL < 0) wL = 0;
    if (wL > 1) wL = 1;

    if (wL === 0 || wL === 1) {
      return 0.0;
    }

    const termL = wL * Math.log2(wL);
    const termR = (1.0 - wL) * Math.log2(1.0 - wL);
    return -(termL + termR);
  }

  /**
   * Calculates valid mathematical bounds for left partition positive purity p_L
   * ensuring that 0 <= p_R <= 1 strictly holds under conservation:
   * p = w_L * p_L + (1 - w_L) * p_R  <=>  p_R = (p - w_L * p_L) / (1 - w_L)
   *
   * @param {number} p - Parent positive class proportion, p in [0, 1].
   * @param {number} wL - Left branch weight, wL in (0, 1).
   * @param {boolean} [forSlider=false] - If true, clamps bounds to [0.001, 0.999] for UI sliders.
   * @returns {{min: number, max: number}}
   */
  function getValidPurityBounds(p, wL, forSlider = false) {
    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new RangeError(`Parent probability p must be in [0, 1]. Received: ${p}`);
    }
    if (!Number.isFinite(wL) || wL <= 0 || wL >= 1) {
      throw new RangeError(`Branch weight wL must be in (0, 1). Received: ${wL}`);
    }

    const rawMin = Math.max(0.0, (p - (1.0 - wL)) / wL);
    const rawMax = Math.min(1.0, p / wL);

    if (forSlider) {
      return {
        min: Math.max(0.001, rawMin),
        max: Math.min(0.999, rawMax)
      };
    }

    return { min: rawMin, max: rawMax };
  }

  /**
   * Evaluates ID3 Information Gain, C4.5 Gain Ratio and CART Gini Impurity Reduction
   * for a binary decision tree split. Guaranteed to never return NaN.
   *
   * @param {number} p - Parent node positive class proportion, p in [0, 1].
   * @param {number} wL - Left branch weight, wL in (0, 1).
   * @param {number} pL - Left branch positive class proportion, pL in [0, 1].
   * @returns {object} Split metrics with strictly finite numerical values.
   */
  function calculateEntropySplit(p, wL, pL) {
    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new RangeError(`Parent p must be in [0, 1]. Received: ${p}`);
    }
    if (!Number.isFinite(wL) || wL <= 0 || wL >= 1) {
      throw new RangeError(`Weight wL must be in (0, 1). Received: ${wL}`);
    }
    if (!Number.isFinite(pL) || pL < 0 || pL > 1) {
      throw new RangeError(`Left branch purity pL must be in [0, 1]. Received: ${pL}`);
    }

    const bounds = getValidPurityBounds(p, wL, false);
    let clampedPL = pL;
    if (clampedPL < bounds.min) clampedPL = bounds.min;
    if (clampedPL > bounds.max) clampedPL = bounds.max;

    // Derived right branch purity under exact conservation
    let pR = (p - wL * clampedPL) / (1.0 - wL);
    if (pR < 0.0) pR = 0.0;
    if (pR > 1.0) pR = 1.0;

    // 1. Shannon Entropies (ID3)
    const hD = binaryEntropy(p);
    const hDL = binaryEntropy(clampedPL);
    const hDR = binaryEntropy(pR);
    const hSplit = wL * hDL + (1.0 - wL) * hDR;
    const informationGain = Math.max(0.0, hD - hSplit);

    // 2. C4.5 Split Info & Gain Ratio
    const splitInfo = binarySplitInfo(wL);
    const gainRatio = splitInfo > 1e-9 ? (informationGain / splitInfo) : 0.0;

    // 3. CART Gini Impurities
    const giniD = 2.0 * p * (1.0 - p);
    const giniDL = 2.0 * clampedPL * (1.0 - clampedPL);
    const giniDR = 2.0 * pR * (1.0 - pR);
    const giniSplit = wL * giniDL + (1.0 - wL) * giniDR;
    const giniReduction = Math.max(0.0, giniD - giniSplit);

    return {
      p,
      wL,
      pL: clampedPL,
      pR,
      hD,
      hDL,
      hDR,
      hSplit,
      informationGain,
      splitInfo,
      gainRatio,
      giniD,
      giniDL,
      giniDR,
      giniSplit,
      giniReduction
    };
  }

  return {
    binaryEntropy,
    binarySplitInfo,
    getValidPurityBounds,
    calculateEntropySplit
  };
}));
