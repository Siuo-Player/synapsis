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
   * Calculates Shannon binary entropy H(p) in bits.
   * Handles boundary limits strictly: lim_{p->0} p*log2(p) = 0 and lim_{p->1} (1-p)*log2(1-p) = 0.
   * Prevents JavaScript 0 * -Infinity = NaN.
   *
   * @param {number} p - Probability of positive class, p in [0, 1].
   * @returns {number} Entropy in bits, in range [0, 1].
   */
  function binaryEntropy(p) {
    if (!Number.isFinite(p) || p < -EPSILON || p > 1 + EPSILON) {
      throw new RangeError(`Probability must be between 0 and 1. Received: ${p}`);
    }
    // Clean clamping against floating-point epsilon
    if (p <= 0 || p >= 1) {
      return 0.0;
    }
    if (p < EPSILON || p > 1 - EPSILON) {
      return 0.0;
    }
    const q = 1.0 - p;
    const termP = p * Math.log2(p);
    const termQ = q * Math.log2(q);
    const h = -(termP + termQ);
    return Math.max(0.0, Math.min(1.0, h));
  }

  /**
   * Calculates Split Information for binary branch weighting w_L in [0, 1].
   *
   * @param {number} wL - Proportion of samples in left branch, |D_L| / |D|.
   * @returns {number} SplitInfo in bits.
   */
  function binarySplitInfo(wL) {
    if (!Number.isFinite(wL) || wL < -EPSILON || wL > 1 + EPSILON) {
      throw new RangeError(`Branch weight must be between 0 and 1. Received: ${wL}`);
    }
    if (wL <= 0 || wL >= 1 || wL < EPSILON || wL > 1 - EPSILON) {
      return 0.0;
    }
    return -(wL * Math.log2(wL) + (1.0 - wL) * Math.log2(1.0 - wL));
  }

  /**
   * Calculates valid mathematical bounds for left partition positive purity p_L
   * ensuring that 0 <= p_R <= 1 strictly holds under conservation:
   * p = w_L * p_L + (1 - w_L) * p_R  <=>  p_R = (p - w_L * p_L) / (1 - w_L)
   *
   * @param {number} p - Parent positive class proportion, p in [0, 1].
   * @param {number} wL - Left branch weight, wL in (0, 1).
   * @returns {{min: number, max: number}}
   */
  function getValidPurityBounds(p, wL) {
    if (wL <= 0 || wL >= 1) {
      return { min: 0.0, max: 1.0 };
    }
    const min = Math.max(0.0, (p - (1.0 - wL)) / wL);
    const max = Math.min(1.0, p / wL);
    return { min, max };
  }

  /**
   * Evaluates ID3 Information Gain, C4.5 Gain Ratio and CART Gini Impurity Reduction
   * for a binary decision tree split. Guaranteed to never return NaN.
   *
   * @param {number} p - Parent node positive class proportion, p in [0, 1].
   * @param {number} wL - Left branch weight, wL in (0, 1).
   * @param {number} pL - Left branch positive class proportion.
   * @returns {object} Split metrics with strictly finite numerical values.
   */
  function calculateEntropySplit(p, wL, pL) {
    if (!Number.isFinite(p) || p < 0 || p > 1) {
      throw new RangeError(`Parent p must be in [0, 1]. Received: ${p}`);
    }
    if (!Number.isFinite(wL) || wL <= 0 || wL >= 1) {
      throw new RangeError(`Weight wL must be in (0, 1). Received: ${wL}`);
    }

    const bounds = getValidPurityBounds(p, wL);
    let clampedPL = pL;
    if (clampedPL < bounds.min) clampedPL = bounds.min;
    if (clampedPL > bounds.max) clampedPL = bounds.max;

    // Derived right branch purity under exact conservation
    let pR = (p - wL * clampedPL) / (1.0 - wL);
    if (pR < 0.0) pR = 0.0;
    if (pR > 1.0) pR = 1.0;

    // 1. Shannon Entropies
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
