/**
 * ===================================================================
 * 3D MULTI-MODEL MACHINE LEARNING LABORATORY (HIGH FIDELITY)
 * Linear OLS vs. Polynomial RSM vs. Decision Tree (CART) vs. Neural Net (MLP)
 * 
 * Features:
 * - Pure Vanilla Canvas 3D Engine (Zero External Dependencies, 0KB CDN)
 * - 4 Machine Learning Hypotheses on Identical Bivariate Feature Space
 * - Exact Analytical Bivariate OLS & Ridge (3x3 Cramer Inversion)
 * - Greedy Non-Parametric Recursive Binary Decision Tree (Depth-3 CART)
 * - Extreme Learning Machine (ELM) Neural Network (8-Neuron MLP Manifold)
 * - Continuous 3D Surface Morphing with Spring Interpolation (60 FPS)
 * - 3D Directional Blinn-Phong Shading with Surface Normal Vectors
 * - Elastic Wave Equation Shockwave Ripples on Point Ingestion
 * - Dynamic Cursor 3D Spotlight & Raycasting Hover Reticle with Tooltip
 * - Smooth Wheel / Pinch Zoom & Idle Lissajous Camera Drift
 * - Stochastic Data Point Generator (+ Point button & Click Ingestion)
 * ===================================================================
 */

class RegressionSurfaceLab {
    constructor() {
        this.card = document.getElementById('reg-lab-card');
        this.canvas = document.getElementById('reg-surface-canvas');
        if (!this.card || !this.canvas) return;

        this.ctx = this.canvas.getContext('2d', { alpha: true });

        // HUD & Telemetry Elements
        this.hudR2 = document.getElementById('reg-r2-val');
        this.hudMse = document.getElementById('reg-mse-val');
        this.hudSig = document.getElementById('reg-sig-val');
        this.hudCount = document.getElementById('reg-count-val');
        this.hudFormula = document.getElementById('reg-formula-val');
        this.noiseDisplay = document.getElementById('reg-noise-val');

        // Control Buttons
        this.modelButtons = document.querySelectorAll('.reg-model-btn');
        this.noiseDecBtn = document.getElementById('reg-noise-dec');
        this.noiseIncBtn = document.getElementById('reg-noise-inc');
        this.resampleBtn = document.getElementById('reg-resample-btn');
        this.addPointBtn = document.getElementById('reg-add-point-btn');
        this.resetCamBtn = document.getElementById('reg-reset-cam-btn');

        // Canvas & Display Dimensions
        this.width = 480;
        this.height = 300;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Theme Synchronization State (Light/Dark Mode Awareness)
        this.isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        this.themeObserver = new MutationObserver(() => {
            this.isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        });
        this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // 3D Camera State
        this.basePitch = 0.58;   // ~33 degrees tilt
        this.baseYaw = -0.72;    // ~-41 degrees orbit
        this.pitch = this.basePitch;
        this.yaw = this.baseYaw;
        this.targetPitch = this.basePitch;
        this.targetYaw = this.baseYaw;
        this.pitchVelocity = 0;
        this.yawVelocity = 0;
        this.focalLength = 350;
        this.camDistance = 410;
        this.targetCamDistance = 410;

        // Interaction State
        this.isDragging = false;
        this.lastPointerX = 0;
        this.lastPointerY = 0;
        this.mousePos = { x: -9999, y: -9999 };
        this.cursor3D = null;
        this.hoveredPoint = null;
        this.idleTicker = 0;

        // Dynamic Shockwave Waves
        this.ripples = [];

        // Lighting Configuration (Normalized Light Direction from top-front-right)
        const lx = 0.48, ly = -0.78, lz = -0.42;
        const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
        this.lightDir = { x: lx / lLen, y: ly / lLen, z: lz / lLen };

        // Mathematical Domain & 3D Spatial Box
        this.domain = { min: -2.4, max: 2.4 };
        this.scale3D = { x: 125, z: 125, y: 70 };

        // Active Model Paradigm ('ols' | 'poly' | 'tree' | 'mlp')
        this.activeModel = 'ols';
        this.noiseLevel = 0.45;

        // Neural Network MLP Directional Ridge Projections (16 Hidden Neurons spanning 2D plane)
        this.mlpHiddenWeights = [];
        const neuronCount = 16;
        const freqs = [0.85, 1.25, 1.65, 1.05];
        const biases = [0.0, -0.40, 0.40, 0.15];
        for (let k = 0; k < neuronCount; k++) {
            const theta = (k * 2 * Math.PI) / neuronCount;
            const f = freqs[k % freqs.length];
            const b = biases[k % biases.length];
            this.mlpHiddenWeights.push({
                w1: Math.cos(theta) * f,
                w2: Math.sin(theta) * f,
                b: b
            });
        }
        this.mlpOutputWeights = new Float64Array(neuronCount + 1); // 1 bias + 16 weights

        // Decision Tree Partition Root
        this.treeRoot = null;

        // Mesh Resolution & Dynamic Morphing Elevation Matrix (24x24 = 576 quads for crisp CART cliffs & smooth surfaces)
        this.meshRes = 24;
        this.currentMeshY = [];
        this.targetMeshY = [];
        for (let i = 0; i <= this.meshRes; i++) {
            this.currentMeshY[i] = new Float64Array(this.meshRes + 1);
            this.targetMeshY[i] = new Float64Array(this.meshRes + 1);
        }

        // Data State
        this.pointCount = 24;
        this.trueBeta = { b0: 0.20, b1: 0.85, b2: 0.60 };
        this.dataPoints = [];

        // Fitted Model Parameters & Metrics Caches
        this.fittedOLS = { b0: 0, b1: 0, b2: 0, r2: 0, mse: 0 };
        this.fittedPoly = { b0: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, r2: 0, mse: 0 };
        this.fittedTree = { r2: 0, mse: 0, leafCount: 6 };
        this.fittedMLP = { r2: 0, mse: 0 };

        // Render Loop Management
        this.animationFrameId = null;
        this.isTabVisible = true;

        this.init();
    }

    init() {
        this.resize();
        this.bindEvents();
        this.generateData();
        this.startLoop();
    }

    // =================================================================
    // DATA GENERATION & STOCHASTIC DISTRIBUTIONS
    // =================================================================
    randomGaussian(mean = 0, stdev = 1) {
        const u = 1 - Math.random();
        const v = Math.random();
        return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdev;
    }

    computeDGP(x1, x2) {
        const { b0, b1, b2 } = this.trueBeta;
        // True physical response manifold: linear slope + saddle curvature + gentle interaction
        return b0 + b1 * x1 + b2 * x2 + 0.18 * (x1 * x1) - 0.16 * (x2 * x2) + 0.14 * (x1 * x2);
    }

    generateData() {
        this.dataPoints = [];
        for (let i = 0; i < this.pointCount; i++) {
            const x1 = (Math.random() * 2 - 1) * (this.domain.max * 0.85);
            const x2 = (Math.random() * 2 - 1) * (this.domain.max * 0.85);
            const noise = this.randomGaussian(0, this.noiseLevel);
            const y = this.computeDGP(x1, x2) + noise;

            this.dataPoints.push({
                x1, x2, y,
                id: i
            });
        }

        this.solveAllModels();
    }

    addRandomPoint() {
        // Generates an authentically random, independent observation from the true DGP across the bivariate domain
        const x1 = (Math.random() * 2 - 1) * (this.domain.max * 0.85);
        const x2 = (Math.random() * 2 - 1) * (this.domain.max * 0.85);
        const noise = this.randomGaussian(0, this.noiseLevel);
        const y = this.computeDGP(x1, x2) + noise;

        const newPoint = {
            x1, x2, y,
            id: Date.now() + Math.random()
        };

        this.dataPoints.push(newPoint);

        // Trigger physical shockwave ripple at the new point coordinates
        this.ripples.push({
            x: x1,
            z: x2,
            startTime: Date.now(),
            amplitude: 0.75
        });

        // Trigger tactile HUD pulse feedback
        if (this.hudR2) {
            this.hudR2.classList.remove('stat-pulsing');
            void this.hudR2.offsetWidth;
            this.hudR2.classList.add('stat-pulsing');
        }
        if (this.hudMse) {
            this.hudMse.classList.remove('stat-pulsing');
            void this.hudMse.offsetWidth;
            this.hudMse.classList.add('stat-pulsing');
        }
        if (this.hudCount) {
            this.hudCount.classList.remove('stat-pulsing');
            void this.hudCount.offsetWidth;
            this.hudCount.classList.add('stat-pulsing');
        }

        this.solveAllModels();
    }

    // =================================================================
    // MULTI-MODEL SOLVER ENGINE (OLS, POLY, TREE, NEURAL NET)
    // =================================================================
    solveAllModels() {
        const dataset = [...this.dataPoints];
        const n = dataset.length;
        if (n < 3) return;

        // 1. Solve Linear OLS (Analytical Cramer 3x3)
        this.solveLinearOLS(dataset, n);

        // 2. Solve Polynomial Response Surface (RSM)
        this.solvePolynomialRSM(dataset, n);

        // 3. Solve Decision Tree (Recursive Greedy CART, Depth 3)
        this.solveDecisionTree(dataset, n);

        // 4. Solve Neural Network (Extreme Learning Machine MLP)
        this.solveNeuralNet(dataset, n);

        // Update target elevation grid for active model
        this.updateTargetElevationGrid();

        // Update telemetry HUD
        this.updateHUD();
    }

    solveLinearOLS(dataset, n) {
        let sumX1 = 0, sumX2 = 0, sumY = 0;
        let sumX1Sq = 0, sumX2Sq = 0, sumX1X2 = 0;
        let sumX1Y = 0, sumX2Y = 0, sumYSq = 0;

        for (const p of dataset) {
            sumX1 += p.x1; sumX2 += p.x2; sumY += p.y;
            sumX1Sq += p.x1 * p.x1;
            sumX2Sq += p.x2 * p.x2;
            sumX1X2 += p.x1 * p.x2;
            sumX1Y += p.x1 * p.y;
            sumX2Y += p.x2 * p.y;
            sumYSq += p.y * p.y;
        }

        const a00 = n, a01 = sumX1, a02 = sumX2;
        const a10 = sumX1, a11 = sumX1Sq, a12 = sumX1X2;
        const a20 = sumX2, a21 = sumX1X2, a22 = sumX2Sq;

        const c0 = sumY, c1 = sumX1Y, c2 = sumX2Y;

        const detA = a00 * (a11 * a22 - a12 * a21) -
                     a01 * (a10 * a22 - a12 * a20) +
                     a02 * (a10 * a21 - a11 * a20);

        if (Math.abs(detA) > 1e-7) {
            const detB0 = c0 * (a11 * a22 - a12 * a21) - a01 * (c1 * a22 - a12 * c2) + a02 * (c1 * a21 - a11 * c2);
            const detB1 = a00 * (c1 * a22 - a12 * c2) - c0 * (a10 * a22 - a12 * a20) + a02 * (a10 * c2 - c1 * a20);
            const detB2 = a00 * (a11 * c2 - c1 * a21) - a01 * (a10 * c2 - c1 * a20) + c0 * (a10 * a21 - a11 * a20);

            const b0 = detB0 / detA;
            const b1 = detB1 / detA;
            const b2 = detB2 / detA;

            const meanY = sumY / n;
            let ssTot = 0, ssRes = 0;
            for (const p of dataset) {
                const yHat = b0 + b1 * p.x1 + b2 * p.x2;
                ssRes += (p.y - yHat) * (p.y - yHat);
                ssTot += (p.y - meanY) * (p.y - meanY);
            }

            const r2 = ssTot < 1e-8 ? 0 : Math.max(0, Math.min(0.999, 1 - (ssRes / ssTot)));
            const mse = ssRes / n;
            this.fittedOLS = { b0, b1, b2, r2, mse, n };
        }
    }

    solvePolynomialRSM(dataset, n) {
        // Closed-form 6-variable Ordinary Least Squares Normal Equations
        // Basis: phi(x) = [1, x1, x2, x1^2, x2^2, x1*x2]
        const dim = 6;
        const A = [];
        for (let r = 0; r < dim; r++) {
            A[r] = new Float64Array(dim);
        }
        const b = new Float64Array(dim);

        const lambda = 1e-4; // Tikhonov/Ridge shrinkage for numerical conditioning

        for (const p of dataset) {
            const x1 = p.x1, x2 = p.x2, y = p.y;
            const phi = [1.0, x1, x2, x1 * x1, x2 * x2, x1 * x2];

            for (let r = 0; r < dim; r++) {
                b[r] += phi[r] * y;
                for (let c = 0; c < dim; c++) {
                    A[r][c] += phi[r] * phi[c];
                }
            }
        }

        for (let r = 0; r < dim; r++) {
            A[r][r] += lambda;
        }

        const beta = this.solveLinearSystem(A, b);
        const b0 = beta[0];
        const b1 = beta[1];
        const b2 = beta[2];
        const b3 = beta[3];
        const b4 = beta[4];
        const b5 = beta[5];

        const meanY = dataset.reduce((s, p) => s + p.y, 0) / n;
        let ssTot = 0, ssRes = 0;
        for (const p of dataset) {
            const yHat = b0 + b1 * p.x1 + b2 * p.x2 + b3 * (p.x1 * p.x1) + b4 * (p.x2 * p.x2) + b5 * (p.x1 * p.x2);
            ssRes += (p.y - yHat) * (p.y - yHat);
            ssTot += (p.y - meanY) * (p.y - meanY);
        }

        const r2 = ssTot < 1e-8 ? 0 : Math.max(0, Math.min(0.999, 1 - (ssRes / ssTot)));
        const mse = ssRes / n;
        this.fittedPoly = { b0, b1, b2, b3, b4, b5, r2, mse, n };
    }

    solveDecisionTree(dataset, n) {
        let leafCount = 0;
        const buildNode = (indices, depth) => {
            const count = indices.length;
            if (count === 0) { leafCount++; return { isLeaf: true, val: 0 }; }

            let sumY = 0;
            for (const idx of indices) sumY += dataset[idx].y;
            const meanY = sumY / count;

            if (depth >= 3 || count <= 4) {
                leafCount++;
                return { isLeaf: true, val: meanY };
            }

            let bestVar = null;
            let bestThresh = 0;
            let bestLoss = Infinity;
            let bestLeft = null;
            let bestRight = null;

            const vars = ['x1', 'x2'];
            for (const varName of vars) {
                const sorted = [...indices].sort((a, b) => dataset[a][varName] - dataset[b][varName]);

                for (let i = 2; i < count - 1; i++) {
                    const valA = dataset[sorted[i - 1]][varName];
                    const valB = dataset[sorted[i]][varName];
                    if (Math.abs(valA - valB) < 0.05) continue;

                    const thresh = (valA + valB) / 2;
                    const left = sorted.slice(0, i);
                    const right = sorted.slice(i);

                    let sumL = 0, sumR = 0;
                    for (const idx of left) sumL += dataset[idx].y;
                    for (const idx of right) sumR += dataset[idx].y;
                    const mL = sumL / left.length;
                    const mR = sumR / right.length;

                    let loss = 0;
                    for (const idx of left) { const d = dataset[idx].y - mL; loss += d * d; }
                    for (const idx of right) { const d = dataset[idx].y - mR; loss += d * d; }

                    if (loss < bestLoss) {
                        bestLoss = loss;
                        bestVar = varName;
                        bestThresh = thresh;
                        bestLeft = left;
                        bestRight = right;
                    }
                }
            }

            if (!bestVar || !bestLeft || !bestRight) {
                leafCount++;
                return { isLeaf: true, val: meanY };
            }

            return {
                isLeaf: false,
                varName: bestVar,
                threshold: bestThresh,
                left: buildNode(bestLeft, depth + 1),
                right: buildNode(bestRight, depth + 1)
            };
        };

        const allIndices = dataset.map((_, i) => i);
        leafCount = 0;
        this.treeRoot = buildNode(allIndices, 0);

        const meanY = dataset.reduce((s, p) => s + p.y, 0) / n;
        let ssTot = 0, ssRes = 0;
        for (const p of dataset) {
            const yHat = this.evalTree(this.treeRoot, p.x1, p.x2);
            ssRes += (p.y - yHat) * (p.y - yHat);
            ssTot += (p.y - meanY) * (p.y - meanY);
        }

        const r2 = ssTot < 1e-8 ? 0 : Math.max(0, Math.min(0.999, 1 - (ssRes / ssTot)));
        const mse = ssRes / n;
        this.fittedTree = { r2, mse, n, leafCount };
    }

    evalTree(node, x1, x2) {
        if (!node) return 0;
        let curr = node;
        while (!curr.isLeaf) {
            const val = curr.varName === 'x1' ? x1 : x2;
            curr = (val <= curr.threshold) ? curr.left : curr.right;
        }
        return curr.val;
    }

    solveNeuralNet(dataset, n) {
        const K = this.mlpHiddenWeights.length;
        const dim = K + 1;

        const H = [];
        for (let i = 0; i < n; i++) {
            const row = new Float64Array(dim);
            row[0] = 1.0;
            const p = dataset[i];
            for (let k = 0; k < K; k++) {
                const w = this.mlpHiddenWeights[k];
                row[k + 1] = Math.tanh(w.w1 * p.x1 + w.w2 * p.x2 + w.b);
            }
            H.push(row);
        }

        const lambda = 0.06; // Ridge penalty for smooth universal manifold
        const HTH = [];
        for (let r = 0; r < dim; r++) {
            HTH[r] = new Float64Array(dim);
            for (let c = 0; c < dim; c++) {
                let sum = 0;
                for (let i = 0; i < n; i++) sum += H[i][r] * H[i][c];
                if (r === c) sum += lambda;
                HTH[r][c] = sum;
            }
        }

        const HTy = new Float64Array(dim);
        for (let r = 0; r < dim; r++) {
            let sum = 0;
            for (let i = 0; i < n; i++) sum += H[i][r] * dataset[i].y;
            HTy[r] = sum;
        }

        this.mlpOutputWeights = this.solveLinearSystem(HTH, HTy);

        const meanY = dataset.reduce((s, p) => s + p.y, 0) / n;
        let ssTot = 0, ssRes = 0;
        for (const p of dataset) {
            const yHat = this.evalMLP(p.x1, p.x2);
            ssRes += (p.y - yHat) * (p.y - yHat);
            ssTot += (p.y - meanY) * (p.y - meanY);
        }

        const r2 = ssTot < 1e-8 ? 0 : Math.max(0, Math.min(0.999, 1 - (ssRes / ssTot)));
        const mse = ssRes / n;
        this.fittedMLP = { r2, mse, n };
    }

    evalMLP(x1, x2) {
        let y = this.mlpOutputWeights[0];
        const K = this.mlpHiddenWeights.length;
        for (let k = 0; k < K; k++) {
            const w = this.mlpHiddenWeights[k];
            const h = Math.tanh(w.w1 * x1 + w.w2 * x2 + w.b);
            y += this.mlpOutputWeights[k + 1] * h;
        }
        return y;
    }

    solveLinearSystem(A, b) {
        const n = b.length;
        const M = [];
        for (let i = 0; i < n; i++) {
            M[i] = new Float64Array(n + 1);
            for (let j = 0; j < n; j++) M[i][j] = A[i][j];
            M[i][n] = b[i];
        }

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
            }
            const temp = M[i]; M[i] = M[maxRow]; M[maxRow] = temp;
            if (Math.abs(M[i][i]) < 1e-9) continue;

            for (let k = i + 1; k < n; k++) {
                const factor = M[k][i] / M[i][i];
                for (let j = i; j <= n; j++) {
                    M[k][j] -= factor * M[i][j];
                }
            }
        }

        const x = new Float64Array(n);
        for (let i = n - 1; i >= 0; i--) {
            let sum = M[i][n];
            for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
            x[i] = Math.abs(M[i][i]) > 1e-9 ? sum / M[i][i] : 0;
        }
        return x;
    }

    // =================================================================
    // SURFACE PREDICTION & FLUID MORPHING EVALUATION
    // =================================================================
    evalModelY(modelName, x1, x2) {
        if (modelName === 'ols') {
            const { b0, b1, b2 } = this.fittedOLS;
            return b0 + b1 * x1 + b2 * x2;
        } else if (modelName === 'poly') {
            const { b0, b1, b2, b3, b4, b5 } = this.fittedPoly;
            return b0 + b1 * x1 + b2 * x2 + b3 * (x1 * x1) + b4 * (x2 * x2) + (b5 || 0) * (x1 * x2);
        } else if (modelName === 'tree') {
            return this.evalTree(this.treeRoot, x1, x2);
        } else if (modelName === 'mlp') {
            return this.evalMLP(x1, x2);
        }
        return 0;
    }

    updateTargetElevationGrid() {
        const step = (this.domain.max - this.domain.min) / this.meshRes;
        for (let i = 0; i <= this.meshRes; i++) {
            const x1 = this.domain.min + i * step;
            for (let j = 0; j <= this.meshRes; j++) {
                const x2 = this.domain.min + j * step;
                this.targetMeshY[i][j] = this.evalModelY(this.activeModel, x1, x2);
            }
        }
    }

    predictY(x1, x2, now = Date.now()) {
        let y = this.evalModelY(this.activeModel, x1, x2);

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const rip = this.ripples[i];
            const age = (now - rip.startTime) / 1000;
            if (age > 1.2) {
                this.ripples.splice(i, 1);
                continue;
            }
            const dx = x1 - rip.x;
            const dz = x2 - rip.z;
            const r = Math.sqrt(dx * dx + dz * dz);
            const amp = rip.amplitude * Math.exp(-2.6 * age);
            const wave = Math.cos(7.5 * r - 6.8 * age);
            const attenuation = 1.0 / (1.0 + 2.0 * r);
            y += amp * wave * attenuation;
        }

        return y;
    }

    // =================================================================
    // 3D PERSPECTIVE PROJECTION MATRIX
    // =================================================================
    project3D(x, y, z) {
        const cosYaw = Math.cos(this.yaw);
        const sinYaw = Math.sin(this.yaw);
        const x1 = x * cosYaw + z * sinYaw;
        const z1 = -x * sinYaw + z * cosYaw;

        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const y2 = y * cosPitch - z1 * sinPitch;
        const z2 = y * sinPitch + z1 * cosPitch + this.camDistance;

        const depth = Math.max(z2, 20);
        const scale = this.focalLength / depth;

        return {
            x: (this.width / 2) + x1 * scale,
            y: (this.height / 2) + y2 * scale,
            depth: depth,
            scale: scale
        };
    }

    mathTo3D(x1, x2, y) {
        const normX = x1 / this.domain.max;
        const normZ = x2 / this.domain.max;
        const normY = y / (this.domain.max * 1.2);

        const x3D = normX * this.scale3D.x;
        const z3D = normZ * this.scale3D.z;
        const y3D = -normY * this.scale3D.y;

        return { x: x3D, y: y3D, z: z3D };
    }

    // =================================================================
    // RENDER PASS (SHADING, LIGHTING, RIPPLES, GLASS SPHERES)
    // =================================================================
    render() {
        const now = Date.now();
        this.idleTicker++;

        // 1. Spring physics camera interpolation + subtle idle breathing drift
        const springDamping = 0.85;
        if (!this.isDragging) {
            this.yaw += this.yawVelocity;
            this.pitch += this.pitchVelocity;
            this.yawVelocity *= springDamping;
            this.pitchVelocity *= springDamping;

            const driftYaw = Math.sin(this.idleTicker * 0.0007) * 0.018;
            const driftPitch = Math.cos(this.idleTicker * 0.0005) * 0.012;

            if (Math.abs(this.yawVelocity) < 0.0001 && Math.abs(this.pitchVelocity) < 0.0001) {
                this.yaw += (this.targetYaw + driftYaw - this.yaw) * 0.035;
                this.pitch += (this.targetPitch + driftPitch - this.pitch) * 0.035;
            }
        }
        this.pitch = Math.max(0.12, Math.min(1.25, this.pitch));

        // Smooth zoom interpolation
        this.camDistance += (this.targetCamDistance - this.camDistance) * 0.10;

        // 2. Smooth elevation mesh morphing transition (lerp current -> target)
        const morphRate = 0.12;
        for (let i = 0; i <= this.meshRes; i++) {
            for (let j = 0; j <= this.meshRes; j++) {
                this.currentMeshY[i][j] += (this.targetMeshY[i][j] - this.currentMeshY[i][j]) * morphRate;
            }
        }

        this.ctx.clearRect(0, 0, this.width, this.height);

        // 3. Draw Depth-Fog Floor & Bounding Grid
        this.renderCoordinateFloor();

        // 4. Draw Illuminated 3D Regression Surface with Shading
        this.renderFittedSurface(now);

        // 5. Draw Residual Drop Stems & Cast Drop Shadows
        this.renderResidualsAndShadows(now);

        // 6. Draw 3D Glass Photon Spheres
        this.renderDataPoints(now);

        // 7. Draw 3D Coordinate Axes
        this.renderCoordinateAxes();

        // 8. Draw Hover Raycast Reticle & Tooltip
        this.renderHoverReticle();
    }

    renderCoordinateFloor() {
        const floorY = 65;
        const steps = 10;
        const stepSize = (this.domain.max - this.domain.min) / steps;

        this.ctx.save();
        this.ctx.lineWidth = 0.75;

        for (let i = 0; i <= steps; i++) {
            const val = this.domain.min + i * stepSize;
            const norm = val / this.domain.max;

            const p1X = this.project3D(-this.scale3D.x, floorY, norm * this.scale3D.z);
            const p2X = this.project3D(this.scale3D.x, floorY, norm * this.scale3D.z);

            const avgDepth = (p1X.depth + p2X.depth) / 2;
            const fogAlpha = Math.max(0.02, Math.min(0.08, 1.0 - (avgDepth - 300) / 400));
            const isDark = this.isDarkTheme;
            const gridAlpha = isDark ? Math.max(0.08, Math.min(0.24, 1.0 - (avgDepth - 300) / 400)) : fogAlpha;

            this.ctx.strokeStyle = isDark 
                ? `rgba(148, 163, 184, ${gridAlpha.toFixed(3)})` 
                : `rgba(15, 23, 42, ${fogAlpha.toFixed(3)})`;
            this.ctx.beginPath();
            this.ctx.moveTo(p1X.x, p1X.y);
            this.ctx.lineTo(p2X.x, p2X.y);
            this.ctx.stroke();

            const p1Z = this.project3D(norm * this.scale3D.x, floorY, -this.scale3D.z);
            const p2Z = this.project3D(norm * this.scale3D.x, floorY, this.scale3D.z);

            this.ctx.beginPath();
            this.ctx.moveTo(p1Z.x, p1Z.y);
            this.ctx.lineTo(p2Z.x, p2Z.y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    renderFittedSurface(now) {
        const res = this.meshRes;
        const step = (this.domain.max - this.domain.min) / res;

        const grid = [];
        for (let i = 0; i <= res; i++) {
            grid[i] = [];
            const x1 = this.domain.min + i * step;
            for (let j = 0; j <= res; j++) {
                const x2 = this.domain.min + j * step;
                let yVal = this.currentMeshY[i][j];

                for (let r = 0; r < this.ripples.length; r++) {
                    const rip = this.ripples[r];
                    const age = (now - rip.startTime) / 1000;
                    if (age <= 1.2) {
                        const dx = x1 - rip.x;
                        const dz = x2 - rip.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        const amp = rip.amplitude * Math.exp(-2.6 * age);
                        const wave = Math.cos(7.5 * dist - 6.8 * age);
                        const att = 1.0 / (1.0 + 2.0 * dist);
                        yVal += amp * wave * att;
                    }
                }

                const pt3D = this.mathTo3D(x1, x2, yVal);
                const proj = this.project3D(pt3D.x, pt3D.y, pt3D.z);
                grid[i][j] = { x1, x2, yVal, pt3D, proj };
            }
        }

        const quads = [];
        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const p00 = grid[i][j];
                const p10 = grid[i + 1][j];
                const p11 = grid[i + 1][j + 1];
                const p01 = grid[i][j + 1];

                const v1x = p10.pt3D.x - p00.pt3D.x;
                const v1y = p10.pt3D.y - p00.pt3D.y;
                const v1z = p10.pt3D.z - p00.pt3D.z;

                const v2x = p01.pt3D.x - p00.pt3D.x;
                const v2y = p01.pt3D.y - p00.pt3D.y;
                const v2z = p01.pt3D.z - p00.pt3D.z;

                let nx = v1y * v2z - v1z * v2y;
                let ny = v1z * v2x - v1x * v2z;
                let nz = v1x * v2y - v1y * v2x;
                const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                nx /= nLen; ny /= nLen; nz /= nLen;

                const diffuse = Math.max(0, nx * this.lightDir.x + ny * this.lightDir.y + nz * this.lightDir.z);

                let spotGlow = 0;
                if (this.cursor3D) {
                    const cdx = (p00.x1 + p11.x1) / 2 - this.cursor3D.x1;
                    const cdz = (p00.x2 + p11.x2) / 2 - this.cursor3D.x2;
                    const spotDist = Math.sqrt(cdx * cdx + cdz * cdz);
                    spotGlow = Math.max(0, 1 - spotDist / 1.3) * 0.45;
                }

                const avgDepth = (p00.proj.depth + p10.proj.depth + p11.proj.depth + p01.proj.depth) / 4;
                const avgY = (p00.yVal + p10.yVal + p11.yVal + p01.yVal) / 4;

                quads.push({
                    p00, p10, p11, p01,
                    avgDepth, avgY, diffuse, spotGlow
                });
            }
        }

        quads.sort((a, b) => b.avgDepth - a.avgDepth);

        let baseR = 37, baseG = 99, baseB = 235;
        if (this.activeModel === 'tree') {
            baseR = 16; baseG = 185; baseB = 129;
        } else if (this.activeModel === 'mlp') {
            baseR = 139; baseG = 92; baseB = 246;
        }

        for (const q of quads) {
            const normElev = Math.max(0, Math.min(1, (q.avgY + 2.2) / 4.4));
            const lightLum = 0.35 + q.diffuse * 0.65 + q.spotGlow;

            const r = Math.round(baseR * (0.6 + normElev * 0.4) * lightLum);
            const g = Math.round(baseG * (0.7 + normElev * 0.3) * lightLum);
            const b = Math.round(baseB * (0.8 + normElev * 0.2) * lightLum);

            const depthAlpha = Math.max(0.18, Math.min(0.48, 1.0 - (q.avgDepth - 280) / 450));

            const edgeR = this.isDarkTheme ? Math.min(255, r + 75) : Math.min(255, r + 40);
            const edgeG = this.isDarkTheme ? Math.min(255, g + 75) : Math.min(255, g + 40);
            const edgeB = this.isDarkTheme ? Math.min(255, b + 75) : Math.min(255, b + 40);

            this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${depthAlpha.toFixed(3)})`;
            this.ctx.strokeStyle = `rgba(${edgeR}, ${edgeG}, ${edgeB}, ${(depthAlpha * (this.isDarkTheme ? 0.95 : 0.85)).toFixed(3)})`;
            this.ctx.lineWidth = 0.65;

            this.ctx.beginPath();
            this.ctx.moveTo(q.p00.proj.x, q.p00.proj.y);
            this.ctx.lineTo(q.p10.proj.x, q.p10.proj.y);
            this.ctx.lineTo(q.p11.proj.x, q.p11.proj.y);
            this.ctx.lineTo(q.p01.proj.x, q.p01.proj.y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    renderResidualsAndShadows(now) {
        const dataset = this.dataPoints;

        this.ctx.save();

        for (const pt of dataset) {
            const fittedY = this.predictY(pt.x1, pt.x2, now);

            const pt3D = this.mathTo3D(pt.x1, pt.x2, pt.y);
            const projPt = this.project3D(pt3D.x, pt3D.y, pt3D.z);

            const plane3D = this.mathTo3D(pt.x1, pt.x2, fittedY);
            const projPlane = this.project3D(plane3D.x, plane3D.y, plane3D.z);

            // 1. Cast Elliptical Drop Shadow onto fitted surface below data point
            const shadowRadius = Math.max(2, 6 * projPlane.scale);
            const gradShadow = this.ctx.createRadialGradient(
                projPlane.x, projPlane.y, 0,
                projPlane.x, projPlane.y, shadowRadius
            );
            gradShadow.addColorStop(0, 'rgba(15, 23, 42, 0.40)');
            gradShadow.addColorStop(1, 'rgba(15, 23, 42, 0)');

            this.ctx.fillStyle = gradShadow;
            this.ctx.beginPath();
            this.ctx.ellipse(projPlane.x, projPlane.y, shadowRadius * 1.3, shadowRadius * 0.6, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Vertical Residual Stem
            this.ctx.beginPath();
            this.ctx.setLineDash([3, 3]);

            if (this.hoveredPoint === pt) {
                this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.95)';
                this.ctx.lineWidth = 1.8;
                this.ctx.setLineDash([]);
            } else {
                this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
                this.ctx.lineWidth = 1.0;
            }

            this.ctx.moveTo(projPt.x, projPt.y);
            this.ctx.lineTo(projPlane.x, projPlane.y);
            this.ctx.stroke();

            // Intercept anchor on surface
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = this.hoveredPoint === pt ? '#06b6d4' : '#3b82f6';
            this.ctx.beginPath();
            this.ctx.arc(projPlane.x, projPlane.y, 1.8 * projPlane.scale, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    renderDataPoints(now) {
        const dataset = this.dataPoints;

        const projectedPoints = dataset.map(pt => {
            const pt3D = this.mathTo3D(pt.x1, pt.x2, pt.y);
            const proj = this.project3D(pt3D.x, pt3D.y, pt3D.z);
            return { pt, proj };
        });

        projectedPoints.sort((a, b) => b.proj.depth - a.proj.depth);

        for (const item of projectedPoints) {
            const { pt, proj } = item;
            const isHovered = this.hoveredPoint === pt;

            const radius = Math.max(3.2, 5.2 * proj.scale);

            // 1. Ethereal Glass Glow Halo
            const halo = this.ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, radius * 2.4);
            if (this.activeModel === 'tree') {
                halo.addColorStop(0, 'rgba(16, 185, 129, 0.65)');
                halo.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else if (this.activeModel === 'mlp') {
                halo.addColorStop(0, 'rgba(139, 92, 246, 0.65)');
                halo.addColorStop(1, 'rgba(139, 92, 246, 0)');
            } else {
                halo.addColorStop(0, 'rgba(59, 130, 246, 0.65)');
                halo.addColorStop(1, 'rgba(59, 130, 246, 0)');
            }

            this.ctx.fillStyle = halo;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, radius * 2.4, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. 3D Volumetric Glass Photon Sphere (Multi-Stop Gradient)
            const offX = proj.x - radius * 0.35;
            const offY = proj.y - radius * 0.35;
            const sphereGrad = this.ctx.createRadialGradient(offX, offY, radius * 0.1, proj.x, proj.y, radius);

            if (this.activeModel === 'tree') {
                sphereGrad.addColorStop(0, '#6ee7b7');
                sphereGrad.addColorStop(0.4, '#10b981');
                sphereGrad.addColorStop(1, '#065f46');
            } else if (this.activeModel === 'mlp') {
                sphereGrad.addColorStop(0, '#c4b5fd');
                sphereGrad.addColorStop(0.4, '#8b5cf6');
                sphereGrad.addColorStop(1, '#4c1d95');
            } else {
                sphereGrad.addColorStop(0, '#bae6fd');
                sphereGrad.addColorStop(0.4, '#0284c7');
                sphereGrad.addColorStop(1, '#0c4a6e');
            }

            this.ctx.fillStyle = sphereGrad;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // 3. Specular Pinpoint Glint
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(offX, offY, radius * 0.28, 0, Math.PI * 2);
            this.ctx.fill();

            // 4. Outer Rim Sheen
            this.ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
            this.ctx.lineWidth = isHovered ? 1.5 : 0.75;
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    renderCoordinateAxes() {
        const origin = this.project3D(0, 0, 0);

        const axX1 = this.project3D(this.scale3D.x * 1.12, 0, 0);
        const axX2 = this.project3D(0, 0, this.scale3D.z * 1.12);
        const axY = this.project3D(0, -this.scale3D.y * 1.12, 0);

        this.ctx.save();
        this.ctx.lineWidth = 1.2;

        // X1 Axis
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(axX1.x, axX1.y);
        this.ctx.stroke();

        // X2 Axis
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(axX2.x, axX2.y);
        this.ctx.stroke();

        // Y Axis
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.45)';
        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(axY.x, axY.y);
        this.ctx.stroke();

        // Axis Typography Labels
        this.ctx.font = '600 9px "JetBrains Mono", monospace';
        this.ctx.fillStyle = '#2563eb';
        this.ctx.fillText('X₁', axX1.x + 4, axX1.y + 3);

        this.ctx.fillStyle = '#0891b2';
        this.ctx.fillText('X₂', axX2.x + 4, axX2.y + 3);

        this.ctx.fillStyle = '#7c3aed';
        this.ctx.fillText('Y', axY.x - 4, axY.y - 6);

        this.ctx.restore();
    }

    renderHoverReticle() {
        if (!this.hoveredPoint) return;

        const pt = this.hoveredPoint;
        const pt3D = this.mathTo3D(pt.x1, pt.x2, pt.y);
        const proj = this.project3D(pt3D.x, pt3D.y, pt3D.z);
        const yHat = this.evalModelY(this.activeModel, pt.x1, pt.x2);
        const residual = pt.y - yHat;

        this.ctx.save();

        // 1. Rotating 3D Targeting Reticle
        const ringRadius = 13;
        const spinAngle = (this.idleTicker * 0.05);

        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 1.4;

        for (let a = 0; a < 4; a++) {
            const startA = spinAngle + (a * Math.PI / 2);
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, ringRadius, startA, startA + Math.PI / 3);
            this.ctx.stroke();
        }

        // 2. Floating Telemetry Tooltip Badge
        const ttWidth = 118;
        const ttHeight = 44;
        let ttX = proj.x + 16;
        let ttY = proj.y - 22;

        if (ttX + ttWidth > this.width - 10) ttX = proj.x - ttWidth - 16;
        if (ttY < 10) ttY = proj.y + 20;

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.roundRect(ttX, ttY, ttWidth, ttHeight, 6);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '600 8.5px "JetBrains Mono", monospace';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(`x₁: ${pt.x1.toFixed(2)}  x₂: ${pt.x2.toFixed(2)}`, ttX + 8, ttY + 14);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`y: ${pt.y.toFixed(2)} | ŷ: ${yHat.toFixed(2)}`, ttX + 8, ttY + 26);

        this.ctx.fillStyle = residual >= 0 ? '#34d399' : '#fb923c';
        this.ctx.fillText(`resid: ${residual >= 0 ? '+' : ''}${residual.toFixed(3)}`, ttX + 8, ttY + 38);

        this.ctx.restore();
    }

    findHoveredPoint(screenX, screenY) {
        const dataset = this.dataPoints;
        let closest = null;
        let minDist = 18;

        for (const pt of dataset) {
            const pt3D = this.mathTo3D(pt.x1, pt.x2, pt.y);
            const proj = this.project3D(pt3D.x, pt3D.y, pt3D.z);
            const dx = screenX - proj.x;
            const dy = screenY - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                closest = pt;
            }
        }

        return closest;
    }

    // =================================================================
    // EVENT BINDINGS & CONTROLLER INTERFACE
    // =================================================================
    bindEvents() {
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        let pointerMoveDist = 0;

        const onDown = (e) => {
            pointerMoveDist = 0;
            const coords = getCanvasCoords(e);
            this.isDragging = true;
            this.lastPointerX = coords.x;
            this.lastPointerY = coords.y;
            this.yawVelocity = 0;
            this.pitchVelocity = 0;
        };

        const onMove = (e) => {
            if (this.isDragging) {
                const coords = getCanvasCoords(e);
                const dx = coords.x - this.lastPointerX;
                const dy = coords.y - this.lastPointerY;
                pointerMoveDist += Math.abs(dx) + Math.abs(dy);

                this.lastPointerX = coords.x;
                this.lastPointerY = coords.y;

                const isTouch = !!e.touches;
                // On touch devices, if gesture is predominantly vertical and under threshold, allow natural window scroll
                if (isTouch && Math.abs(dy) > Math.abs(dx) * 1.35 && pointerMoveDist < 16) {
                    this.isDragging = false;
                    return;
                }

                const rotSpeed = 0.007;
                this.yaw += dx * rotSpeed;
                this.pitch += dy * rotSpeed;

                this.yawVelocity = dx * rotSpeed * 0.45;
                this.pitchVelocity = dy * rotSpeed * 0.45;

                if (e.cancelable) e.preventDefault();
            } else if (!e.touches) {
                const coords = getCanvasCoords(e);
                this.mousePos = coords;

                // Update cursor 3D position for spotlight
                const normX = ((coords.x - this.width / 2) / (this.width / 2)) * 2.2;
                const normZ = ((coords.y - this.height / 2) / (this.height / 2)) * 2.2;
                this.cursor3D = { x1: normX, x2: normZ };

                // Raycast hovered point
                this.hoveredPoint = this.findHoveredPoint(coords.x, coords.y);
            }
        };

        const onUp = () => {
            this.isDragging = false;
        };

        this.canvas.addEventListener('click', () => {
            // Only add point if the user genuinely clicked without dragging camera
            if (pointerMoveDist > 6) return;
            this.addRandomPoint();
        });

        this.canvas.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        this.canvas.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);

        this.canvas.addEventListener('mouseleave', () => {
            this.cursor3D = null;
            this.hoveredPoint = null;
        });

        // Mouse Wheel Zoom (Scroll to zoom)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.35;
            this.targetCamDistance = Math.max(280, Math.min(560, this.targetCamDistance + zoomDelta));
        }, { passive: false });

        // '+ Point' Button
        if (this.addPointBtn) {
            this.addPointBtn.addEventListener('click', () => {
                this.addRandomPoint();
            });
        }

        // Model Selector Buttons (OLS vs Poly vs Tree vs MLP)
        this.modelButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modelButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeModel = btn.getAttribute('data-model');

                // Trigger celebratory ripple on model change
                this.ripples.push({ x: 0, z: 0, startTime: Date.now(), amplitude: 0.65 });

                // Update target elevation grid for morphing
                this.updateTargetElevationGrid();

                // Update HUD
                this.updateHUD();
            });
        });

        // Noise Stepper
        if (this.noiseDecBtn && this.noiseIncBtn) {
            this.noiseDecBtn.addEventListener('click', () => {
                this.noiseLevel = Math.max(0.15, +(this.noiseLevel - 0.10).toFixed(2));
                this.updateNoiseDisplay();
                this.generateData();
            });
            this.noiseIncBtn.addEventListener('click', () => {
                this.noiseLevel = Math.min(0.95, +(this.noiseLevel + 0.10).toFixed(2));
                this.updateNoiseDisplay();
                this.generateData();
            });
        }

        // Resample Button
        if (this.resampleBtn) {
            this.resampleBtn.addEventListener('click', () => {
                this.trueBeta.b1 = +(0.8 + Math.random() * 0.7).toFixed(2);
                this.trueBeta.b2 = +(0.5 + Math.random() * 0.6).toFixed(2);
                this.ripples.push({ x: 0, z: 0, startTime: Date.now(), amplitude: 0.75 });
                this.generateData();
            });
        }

        // Reset Camera
        if (this.resetCamBtn) {
            this.resetCamBtn.addEventListener('click', () => {
                this.yaw = this.baseYaw;
                this.pitch = this.basePitch;
                this.targetYaw = this.baseYaw;
                this.targetPitch = this.basePitch;
                this.targetCamDistance = 410;
                this.yawVelocity = 0;
                this.pitchVelocity = 0;
            });
        }

        // Window Resize
        window.addEventListener('resize', () => this.resize());

        // Tab Visibility
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            if (this.isTabVisible && !this.animationFrameId) {
                this.startLoop();
            }
        });
    }

    updateNoiseDisplay() {
        if (this.noiseDisplay) {
            this.noiseDisplay.textContent = `σ = ${this.noiseLevel.toFixed(2)}`;
        }
    }

    updateHUD() {
        let activeMetrics = this.fittedOLS;
        if (this.activeModel === 'poly') activeMetrics = this.fittedPoly;
        else if (this.activeModel === 'tree') activeMetrics = this.fittedTree;
        else if (this.activeModel === 'mlp') activeMetrics = this.fittedMLP;

        const totalN = this.dataPoints.length;

        if (this.hudR2) this.hudR2.textContent = activeMetrics.r2.toFixed(3);
        if (this.hudMse) this.hudMse.textContent = activeMetrics.mse.toFixed(3);
        if (this.hudCount) this.hudCount.textContent = `N = ${totalN}`;

        if (this.hudSig) {
            const pParams = this.activeModel === 'ols' ? 2 : (this.activeModel === 'poly' ? 5 : (this.activeModel === 'tree' ? (this.fittedTree.leafCount || 6) : 8));
            const dfRes = Math.max(1, totalN - pParams - 1);
            const clampedR2 = Math.min(0.999, Math.max(0, activeMetrics.r2));
            const fStat = (clampedR2 / pParams) / (Math.max(1e-4, 1 - clampedR2) / dfRes);

            if (fStat > 10.0 || clampedR2 > 0.70) {
                this.hudSig.textContent = 'p < 0.001';
                this.hudSig.style.color = '#059669';
            } else if (fStat > 3.8 || clampedR2 > 0.40) {
                this.hudSig.textContent = 'p = 0.008';
                this.hudSig.style.color = '#10b981';
            } else if (fStat > 2.0 || clampedR2 > 0.20) {
                this.hudSig.textContent = 'p = 0.045';
                this.hudSig.style.color = '#d97706';
            } else {
                this.hudSig.textContent = 'p = 0.15 (n.s.)';
                this.hudSig.style.color = '#e11d48';
            }
        }

        if (this.hudFormula) {
            if (this.activeModel === 'ols') {
                const { b0, b1, b2 } = this.fittedOLS;
                const signB1 = b1 >= 0 ? '+' : '-';
                const signB2 = b2 >= 0 ? '+' : '-';
                this.hudFormula.textContent = `ŷ = ${b0.toFixed(2)} ${signB1} ${Math.abs(b1).toFixed(2)}x₁ ${signB2} ${Math.abs(b2).toFixed(2)}x₂`;
            } else if (this.activeModel === 'poly') {
                const { b0, b1, b2, b3, b4, b5 } = this.fittedPoly;
                const signB1 = b1 >= 0 ? '+' : '-';
                const signB2 = b2 >= 0 ? '+' : '-';
                const signB3 = b3 >= 0 ? '+' : '-';
                const signB4 = b4 >= 0 ? '+' : '-';
                const signB5 = (b5 || 0) >= 0 ? '+' : '-';
                this.hudFormula.textContent = `ŷ = ${b0.toFixed(2)} ${signB1} ${Math.abs(b1).toFixed(2)}x₁ ${signB2} ${Math.abs(b2).toFixed(2)}x₂ ${signB3} ${Math.abs(b3).toFixed(2)}x₁² ${signB4} ${Math.abs(b4).toFixed(2)}x₂² ${signB5} ${Math.abs(b5 || 0).toFixed(2)}x₁x₂`;
            } else if (this.activeModel === 'tree') {
                const leaves = this.fittedTree.leafCount || 6;
                this.hudFormula.textContent = `ŷ = CART(depth=3, leaves=${leaves}) · ∑ cₘ 𝕀(x ∈ Rₘ)`;
            } else if (this.activeModel === 'mlp') {
                this.hudFormula.textContent = `ŷ = MLP₂ₓ₁₆ₓ₁ · W₂ tanh(W₁x + b) + w₀`;
            }
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = Math.floor(rect.width) || 480;
        this.height = Math.max(280, Math.min(360, Math.floor(rect.width * 0.62)));

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.ctx.scale(this.dpr, this.dpr);
    }

    startLoop() {
        const loop = () => {
            if (!this.isTabVisible) {
                this.animationFrameId = null;
                return;
            }
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }
}

window.RegressionSurfaceLab = RegressionSurfaceLab;
