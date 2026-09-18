/**
 * =========================================================================
 * ARCHITECTURE RUNBOOK COPILOT - RAG CHAT API ROUTE
 * Vercel Serverless Function & Local Development Runtime
 * =========================================================================
 * 
 * Powered by OpenRouter with strict Grounding in Project Dossiers:
 * - p1: data/projects/p1-hpc-energy.md
 * - p2: data/projects/p2-banking-data.md
 * - p3: data/projects/p3-computer-vision.md
 * - p4: data/projects/p4-predictive-classification.md
 * 
 * Features:
 * 1. Conversational intelligence: Handles greetings and meta questions naturally.
 * 2. Strict grounding: Extracts technical facts strictly from Markdown dossiers.
 * 3. Server-Sent Events (SSE) streaming for real-time typewriter delivery.
 * 4. Resilient fail-safe deterministic fallback if API key is unset or offline.
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// IN-MEMORY OMNISCIENT CORPUS CACHE
// ==========================================
let OMNISCIENT_CORPUS_CACHE = null;

const PROJECT_TITLES = {
    p1: 'HPE Energy Enterprise HPC Cluster & Orchestration',
    p2: 'HPE Banking Data Migration & Reporting Architecture',
    p3: 'Real-Time Edge Computer Vision Pipeline (PyTorch/YOLO)',
    p4: 'Telco Customer Churn Prediction: End-to-End MLOps Pipeline (AWS ECS Fargate)'
};

/**
 * Loads the complete omniscient knowledge base:
 * - Renaldo Arapi Profile & Executive CV
 * - System 01: HPE HPC Cluster
 * - System 02: HPE Banking Migration
 * - System 03: Edge Computer Vision
 * - System 04: Predictive ML & Tabular SOTA
 */
async function loadOmniscientKnowledge() {
    if (OMNISCIENT_CORPUS_CACHE) return OMNISCIENT_CORPUS_CACHE;

    const fileMap = {
        profile: path.join(process.cwd(), 'data', 'profile-cv.md'),
        p1: path.join(process.cwd(), 'data', 'projects', 'p1-hpc-energy.md'),
        p2: path.join(process.cwd(), 'data', 'projects', 'p2-banking-data.md'),
        p3: path.join(process.cwd(), 'data', 'projects', 'p3-computer-vision.md'),
        p4: path.join(process.cwd(), 'data', 'projects', 'p4-predictive-classification.md')
    };

    const corpus = {};
    for (const [key, filePath] of Object.entries(fileMap)) {
        try {
            corpus[key] = await fs.promises.readFile(filePath, 'utf-8');
        } catch (err) {
            console.warn(`[CHAT_API] Warning reading ${filePath}:`, err.message);
            corpus[key] = `# Dossier ${key}\nDocumentation file ${filePath}`;
        }
    }

    OMNISCIENT_CORPUS_CACHE = corpus;
    return corpus;
}

/**
 * Ensures strict alternating role sequence [system?, user, assistant, user, assistant, ..., user]
 * Prevents 400 Bad Request from LLMs that reject duplicate consecutive roles.
 */
function normalizeConversationMessages(systemPrompt, history, currentMessage) {
    const rawList = [];
    if (Array.isArray(history)) {
        for (const item of history) {
            if (!item || !item.content) continue;
            const role = item.role === 'assistant' ? 'assistant' : 'user';
            const content = String(item.content).trim();
            if (content) rawList.push({ role, content });
        }
    }

    // If client pushed current question to history already, pop it so we don't repeat user turn
    const cleanCurr = currentMessage.trim();
    if (rawList.length > 0 && rawList[rawList.length - 1].role === 'user' && rawList[rawList.length - 1].content === cleanCurr) {
        rawList.pop();
    }

    // Coalesce any consecutive messages with identical roles
    const coalesced = [];
    for (const msg of rawList) {
        if (coalesced.length > 0 && coalesced[coalesced.length - 1].role === msg.role) {
            coalesced[coalesced.length - 1].content += '\n\n' + msg.content;
        } else {
            coalesced.push({ role: msg.role, content: msg.content });
        }
    }

    // If the conversation history ends with a 'user' turn, drop it so that our current message is the user turn
    if (coalesced.length > 0 && coalesced[coalesced.length - 1].role === 'user') {
        coalesced.pop();
    }

    // Coalesced history should start with 'user' if it has messages
    while (coalesced.length > 0 && coalesced[0].role !== 'user') {
        coalesced.shift();
    }

    // Append the active user query
    coalesced.push({ role: 'user', content: cleanCurr });

    return [
        { role: 'system', content: systemPrompt },
        ...coalesced
    ];
}

/**
 * Omniscient System Prompt Formulation
 * Grants the Copilot comprehensive mastery of Renaldo's CV, Bologna Master in Statistics,
 * all 16 skills, and all 4 production architectures.
 */
function buildOmniscientSystemPrompt(corpus, activeProjectId) {
    const activeTitle = PROJECT_TITLES[activeProjectId] || 'All Production Architectures';

    return `You are the Interactive Technical Assistant for Renaldo Arapi's portfolio (renaldo.ai).
You possess COMPLETE, AUTHORITATIVE knowledge of Renaldo Arapi's entire professional profile, executive CV, academic foundation (Master in Statistics from Alma Mater Studiorum - Università di Bologna), all 16 core technical capabilities, and ALL 4 enterprise production systems.

CRITICAL DIRECTIVE: COMPLETE OMNISCIENCE ACROSS ALL PROJECTS & CV
=============================================================================
The visitor's viewport is currently focused on: [${activeProjectId}: ${activeTitle}], BUT YOU ARE FULLY OMNISCIENT.
You MUST answer ANY inquiry about:
1. Renaldo's personal identity, background, career vision, and role as a Forward Deployed Data Scientist & AI Systems Engineer.
2. His academic foundation: Master in Statistics (Laurea Magistrale in Scienze Statistiche) from Alma Mater Studiorum – Università di Bologna (est. 1088, oldest university in the world), focusing on high-dimensional feature manifolds, probability calibration, Bayesian modeling, and stochastic processes.
3. His core skills: PyTorch, Scikit-learn, XGBoost/LightGBM, YOLO/TensorRT, RAG architectures, Vector DBs (Chroma/Qdrant), Transformers, LangChain/Agents, FastAPI, Docker, MLflow, SQL & Polars columnar ETL.
4. ANY of his 4 enterprise systems:
   - SYS-01: HPE Energy HPC Cluster & Orchestration (AWX/Ansible bare-metal, Rancher K8s, Slurm, 12 min provisioning, 99.95% uptime).
   - SYS-02: HPE Tier-1 Banking Core Data Migration & BI (Zero-Loss MD5/SHA256 reconciliation, sub-second query latency, GDPR/PSD2).
   - SYS-03: Real-Time Computer Vision & Edge Pipeline (PyTorch, YOLO, FP16 TensorRT, 60+ FPS, 11.2ms latency, OpenCV CUDA ring buffer).
   - SYS-04: Telco Customer Churn Prediction & End-to-End MLOps Pipeline (XGBoost 2.0+, Great Expectations, Optuna Bayesian HPO, 93.0% Minority Churn Recall under asymmetric cost CAC >> CRC, 5.9ms inference latency, Dual-Serving FastAPI/Gradio, AWS ECS Fargate serverless container).
5. Availability, career opportunities, and direct scheduling of a 1-on-1 technical interview or consultation.

COMPLETE KNOWLEDGE BASE CORPUS:
=============================================================================
--- 1. RENALDO ARAPI PROFILE, ACADEMIC CREDENTIALS & CV ---
${corpus.profile}

--- 2. SYSTEM SYS-01: HPE ENERGY HPC CLUSTER & WORKLOAD ORCHESTRATION ---
${corpus.p1}

--- 3. SYSTEM SYS-02: HPE BANKING CORE MIGRATION & BI INTELLIGENCE ---
${corpus.p2}

--- 4. SYSTEM SYS-03: REAL-TIME COMPUTER VISION & EDGE INFERENCE (YOLO/TENSORRT) ---
${corpus.p3}

--- 5. SYSTEM SYS-04: HIGH-DIMENSIONAL CLASSIFICATION & DECISION ENGINE ---
${corpus.p4}
=============================================================================

STRICT BEHAVIORAL DIRECTIVES:
1. GREETINGS & CASUAL INTERACTION:
   Respond cordially and concisely in the exact language used (Italian or English). Introduce yourself as the technical assistant for Renaldo Arapi's portfolio, ready to discuss any of his 4 enterprise systems, his academic background in Statistics from Bologna, or his CV. DO NOT dump random technical code chunks when greeted!

2. ABSOLUTE OMNISCIENCE:
   If the user asks about Renaldo's CV, his studies in Bologna, or a project that is NOT the currently focused UI tab, answer with full mastery and detail using the corpus above.

3. ACCURACY & NO AI HYPE:
   Ground your responses in the exact facts and metrics above (e.g. 12 min provisioning, 99.95% uptime, 100% Zero-Loss reconciliation, 60+ FPS at 11.2ms, ECE <2.4%, Master in Statistics Bologna). Never hallucinate or invent fake metrics.

4. TONE & VOCABULARY:
   Calm, authoritative, mathematically precise, senior engineering tone.

5. LANGUAGE MATCHING:
   Match the user's language: clean, professional Italian if asked in Italian; clean, precise English if asked in English.

6. PROACTIVE CONVERSION DIRECTIVE (PUSHING BEHAVIOR):
   - At the conclusion of your response, politely invite the recruiter, engineering manager, or visitor to schedule a technical alignment call or contact Renaldo.
   - If the user explicitly asks to book a call, schedule a meeting, or contact Renaldo, append the exact trigger token at the very end of your response: [ACTION:OPEN_INLINE_SCHEDULER]`;
}

/**
 * Omniscient Deterministic Fallback Generator
 * Provides exhaustive answers across CV, education, and all 4 projects even when offline.
 */
function generateDeterministicFallback(query, activeProjectId, corpus) {
    const q = (query || '').toLowerCase();
    const isItalian = /[àèéìòù]|ciao|come|cosa|chi|perché|progetto|modello|dati|call|prenot|laurea|studio|studi|curriculum/i.test(q);

    // 0. Direct Booking / Scheduling / Contact Intent Detection
    if (/(call|meet|schedul|prenot|contatt|email|mail|intervist|fissa|slot|appuntament|parlare)/i.test(q)) {
        return (isItalian
            ? `Certamente! Renaldo è disponibile per colloqui tecnici e opportunità di collaborazione ingegneristica. Ho inizializzato il modulo di prenotazione e contatto direttamente qui sotto nella console:`
            : `Certainly! Renaldo is actively available for technical interviews and engineering collaborations. I have initialized the inline scheduler and contact console directly below:`)
            + '\n\n[ACTION:OPEN_INLINE_SCHEDULER]';
    }

    // 1. Greetings & Identity
    if (/^(hi|hello|hey|ciao|salve|buongiorno|buonasera|greetings|who are you|chi sei)/i.test(q.trim())) {
        if (isItalian) {
            return `Ciao! Sono l'assistente tecnico del portfolio di Renaldo Arapi. Posso fornirti qualsiasi dettaglio sul suo percorso accademico (Master in Statistica a Bologna), sul suo CV e sui 4 sistemi di produzione enterprise (HPC Energy, Banking Migration, Edge Computer Vision e Telco Churn MLOps). Puoi farmi qualsiasi domanda tecnica o prenotare una call con Renaldo qui sotto.`;
        }
        return `Hello! I am the technical assistant for Renaldo Arapi's portfolio. I can provide verified details on his academic foundation (Master in Statistics from the University of Bologna), his executive CV, and all 4 enterprise production systems (HPE HPC, Banking Data Migration, Edge Computer Vision, and Telco Churn MLOps). Feel free to ask any question or schedule a call below.`;
    }

    let body = "";

    // 2. Education / Academic Background / University / Bologna / Degree
    if (/(laurea|universit|bologna|master|studi|accadem|education|degree|statistica|matematica)/i.test(q)) {
        body = isItalian
            ? `Renaldo Arapi ha conseguito il **Master in Statistics** (Laurea Magistrale in Scienze Statistiche) presso l'**Alma Mater Studiorum – Università di Bologna** (fondata nel 1088, la più antica università del mondo). La sua preparazione accademica si fonda su rigore matematico, apprendimento statistico, inferenza bayesiana, processi stocastici, modellazione quantitativa ad alta dimensionalità e serie temporali, con l'obiettivo di tradurre la teoria statistica in architetture software deterministiche e scalabili.`
            : `Renaldo Arapi holds a **Master in Statistics** from **Alma Mater Studiorum – University of Bologna** (established in 1088, the oldest university in the world). His academic foundation bridges rigorous mathematical statistics, Bayesian inference, stochastic modeling, high-dimensional feature manifolds, and time series analysis with production-grade software engineering.`;
    }

    // 3. Profile / CV / Background / Forward Deployed Role / Experience
    else if (/(cv|curriculum|profilo|chi è|background|ruolo|forward deployed|esperienza|esperienze|lavoro|bio|biografia)/i.test(q)) {
        body = isItalian
            ? `Renaldo Arapi opera come **Forward Deployed Data Scientist & AI Systems Engineer**. Combina una solida formazione quantitativa (Master in Statistics a Bologna) con esperienza ingegneristica su carichi di calcolo enterprise: dal provisioning bare-metal per cluster HPC in HPE, a migrazioni bancarie Zero-Loss con conformità GDPR/PSD2, fino a pipeline di Computer Vision a 60+ FPS su edge GPU e modelli predittivi con ECE <2.4%. Il suo CV completo è scaricabile direttamente dal portfolio (PDF).`
            : `Renaldo Arapi is a **Forward Deployed Data Scientist & AI Systems Engineer**. He bridges advanced mathematical statistics (Master in Statistics from Bologna) with production engineering across large-scale enterprise workloads: bare-metal HPC orchestration at HPE, Zero-Loss banking migrations with GDPR/PSD2 compliance, 60+ FPS edge computer vision, and high-dimensional calibrated ML. His executive CV is available for direct download in the portfolio.`;
    }

    // 4. "Perché dovrei assumerlo?" / "Should I hire him?" / Valore
    else if (/(assumer|hire|perché dovrei|valore|collabora|punti di forza|strength)/i.test(q)) {
        body = isItalian
            ? `Il valore distintivo di Renaldo risiede nella convergenza tra **profondo rigore statistico formale** (che previene allucinazioni e metriche ingannevoli) e **capacità di engineering di produzione** (Kubernetes, Ansible, TensorRT, FastAPI, Polars, Docker). Non si limita a prototipare modelli in notebook, ma li progetta per resistere a SLA critici di produzione con monitoraggio continuo della calibrazione e del drift.`
            : `Renaldo's primary differentiator is the rare convergence of **deep formal statistical rigor** (preventing model decay and miscalibration) and **hands-on production systems engineering** (Kubernetes, Ansible, TensorRT, FastAPI, Polars, Docker). He delivers deterministic, auditable machine learning systems that withstand enterprise SLAs.`;
    }

    // 5. System 01: HPE Energy HPC Cluster & Orchestration
    else if (/(hpc|ansible|awx|rancher|slurm|morpheus|bare-metal|provisioning|cluster|nodo|nodi|energy|hpe)/i.test(q)) {
        body = isItalian
            ? `Nel progetto **SYS-01 (HPE Energy Enterprise HPC Cluster)**, Renaldo ha orchestrato una piattaforma multi-tenant per simulazioni operative e AI. Con playbook Ansible dichiarativi orchestrati da AWX, i tempi di provisioning bare-metal sono passati da ore a **12 minuti idempotenti**, garantendo **99.95% di uptime operativo**, governance Kubernetes centralizzata con Rancher e catalogo ibrido via Morpheus CMP.`
            : `In **SYS-01 (HPE Energy Enterprise HPC Cluster)**, Renaldo engineered a multi-tenant platform for high-throughput operational simulations. Using idempotent Ansible playbooks orchestrated by AWX, bare-metal node provisioning was reduced from hours down to **12 minutes** with **99.95% verified uptime**, Rancher multi-tenant governance, and Morpheus hybrid CMP orchestration.`;
    }

    // 6. System 02: HPE Banking Core Data Migration & BI
    else if (/(banca|banking|bancari|migrazion|zero-loss|zero loss|reconciliation|riconciliazione|md5|sha256|bi|fcr|psd2|contact center)/i.test(q)) {
        body = isItalian
            ? `Nel progetto **SYS-02 (HPE Banking Core Data Migration)**, Renaldo ha progettato l'architettura di migrazione di milioni di record storici con strategia **Zero-Loss**: riconciliazione a doppio hash crittografico (MD5/SHA256) a livello di riga, cutover delta con zero downtime, latenza query BI sotto il secondo e totale conformità alle normative europee GDPR e PSD2.`
            : `In **SYS-02 (HPE Banking Core Data Migration)**, Renaldo engineered a mission-critical migration of core banking interaction records with a **Zero-Loss** strategy: dual-hash (MD5/SHA256) row parity verification, zero-downtime cutover, sub-second BI query latency, and strict GDPR and PSD2 regulatory compliance.`;
    }

    // 7. System 03: Real-Time Edge Computer Vision (YOLO/TensorRT)
    else if (/(vision|cv|yolo|tensorrt|fps|latenza|latency|opencv|frame|ring buffer|edge|gpu|albumentations)/i.test(q)) {
        body = isItalian
            ? `Nel progetto **SYS-03 (Real-Time Edge Computer Vision Pipeline)**, Renaldo ha implementato una pipeline di rilevamento e segmentazione a bassissima latenza su edge GPU. Compilando modelli PyTorch YOLO in FP16 con NVIDIA TensorRT e sfruttando un ring buffer asincrono a doppio stadio in OpenCV con pinned memory, il sistema sostiene **60+ FPS costanti** con una latenza per frame di soli **11.2 ms** e **0.884 mAP@0.5**.`
            : `In **SYS-03 (Real-Time Edge Computer Vision Pipeline)**, Renaldo delivered an end-to-end edge inference system compiling PyTorch YOLO into FP16 NVIDIA TensorRT engines. Coupled with an asynchronous double-buffered OpenCV ring in CUDA pinned memory, it sustains **60+ FPS** at **11.2 ms latency** with an **0.884 mAP@0.5** under dynamic lighting.`;
    }

    // 8. System 04: Telco Customer Churn MLOps Pipeline & AWS Cloud Serving
    else if (/(churn|telco|fargate|ecs|great expectations|optuna|mlops|tabular|classificazion|sbilanc|recall|sys-04|p4)/i.test(q)) {
        body = isItalian
            ? `Nel progetto **SYS-04 (Telco Customer Churn End-to-End MLOps Pipeline)** ([GitHub: l0ssfx/Telco-Costumer-Churn-ML](https://github.com/l0ssfx/Telco-Costumer-Churn-ML)), Renaldo ha ingegnerizzato un'architettura completa deployata su AWS ECS Fargate dietro Application Load Balancer. Il sistema affronta l'asimmetria economica del churn (CAC >> CRC) calibrando la soglia a tau = 0.35 e w_pos = 2.76, raggiungendo il **93.0% di Recall** sui churner effettivi nel holdout test set con soli 26 falsi negativi e latenza di inferenza di **5.9 ms**. La pipeline integra contratti dati con Great Expectations, prevenzione train-serving skew a 30 dimensioni, tracking MLflow e dual-serving FastAPI + Gradio.`
            : `In **SYS-04 (Telco Customer Churn End-to-End MLOps Pipeline)** ([GitHub: l0ssfx/Telco-Costumer-Churn-ML](https://github.com/l0ssfx/Telco-Costumer-Churn-ML)), Renaldo engineered a production system deployed on AWS ECS Fargate behind an ALB. Optimizing an asymmetric cost function (CAC >> CRC) with decision threshold tau = 0.35 and scale_pos_weight = 2.76, the tuned XGBoost model achieves **93.0% Minority Churn Recall** at **5.9 ms latency**. It features automated Great Expectations data contracts, train-serving skew prevention across 30 dimensions, MLflow tracking, and dual-serving FastAPI + Gradio.`;
    }

    // 9. Specific Technology Stacks (Python, PyTorch, Docker, SQL, etc.)
    else if (/(pytorch|docker|fastapi|sql|polars|mlflow|langchain|rag|vector|transformers)/i.test(q)) {
        body = isItalian
            ? `Lo stack di Renaldo comprende 16 moduli di produzione: PyTorch per deep learning con accelerazione CUDA, FastAPI per microservizi asincroni con validazione Pydantic v2, Docker per container distroless, SQL & Polars per ETL ad altissime prestazioni, MLflow per il tracciamento degli esperimenti e architetture RAG/Agenti per sistemi generativi deterministici.`
            : `Renaldo's technical capabilities span 16 production modules: PyTorch for CUDA-accelerated deep learning, FastAPI for async Pydantic v2 serving, Docker for secure minimal containers, SQL & Polars for high-throughput ETL, MLflow for experiment lineage, and RAG/Agent workflows for deterministic generative AI.`;
    }

    // Default omniscient fallback
    if (!body) {
        body = isItalian
            ? `Renaldo Arapi è un Forward Deployed Data Scientist & AI Systems Engineer con Master in Statistics all'Università di Bologna. Nel suo portfolio ha ingegnerizzato 4 architetture di riferimento: HPC bare-metal a 12 min di provisioning, migrazioni bancarie Zero-Loss, Computer Vision su edge a 60+ FPS e classificazione tabulare con ECE <2.4%.`
            : `Renaldo Arapi is a Forward Deployed Data Scientist & AI Systems Engineer with a Master in Statistics from the University of Bologna. His portfolio showcases 4 production architectures: bare-metal HPC with 12 min provisioning, Zero-Loss banking migration, 60+ FPS edge computer vision, and calibrated tabular classification with ECE <2.4%.`;
    }

    // Proactive conversion invitation
    const proactiveNudge = isItalian
        ? `\n\n↳ Vuoi approfondire questo aspetto o valutare una collaborazione tecnica con Renaldo? Puoi prenotare una call o inviargli un messaggio direttamente qui sotto.`
        : `\n\n↳ Would you like to explore this further or evaluate a collaboration with Renaldo? You can schedule an alignment call or send a direct message below.`;

    return body + proactiveNudge;
}

/**
 * Streams text to response as Server-Sent Events
 */
async function streamTextResponse(res, text, isFallback = false) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (isFallback) {
        res.setHeader('X-Copilot-Engine', 'Deterministic-Fallback');
    }

    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        // Subtle delay for natural streaming if locally generated
        await new Promise(r => setTimeout(r, 16));
    }

    res.write('data: [DONE]\n\n');
    res.end();
}

// ==========================================
// VERCEL SERVERLESS HANDLER
// ==========================================
module.exports = async function handler(req, res) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        if (res.status) return res.status(204).end();
        res.statusCode = 204;
        return res.end();
    }

    // Health check / GET status
    if (req.method === 'GET') {
        const hasKey = Boolean(process.env.OPENROUTER_API_KEY);
        const payload = {
            status: 'READY',
            service: 'Renaldo.ai Architecture RAG Copilot',
            runtime: 'Node.js',
            openRouterConfigured: hasKey,
            model: process.env.DEFAULT_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/free'
        };
        if (res.status) return res.status(200).json(payload);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify(payload));
    }

    if (req.method !== 'POST') {
        const errPayload = { error: 'Method Not Allowed. Use POST.' };
        if (res.status) return res.status(405).json(errPayload);
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify(errPayload));
    }

    // Parse incoming payload
    let body = req.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            body = {};
        }
    }

    const {
        message = '',
        query = '',
        history = [],
        projectId = 'p1',
        stream = true
    } = body || {};

    const cleanMessage = String(message || query || '').trim();
    if (!cleanMessage) {
        const badReqPayload = { error: 'Missing "message" in request body' };
        if (res.status) return res.status(400).json(badReqPayload);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.end(JSON.stringify(badReqPayload));
    }

    // Load complete omniscient knowledge base (Profile, CV, and all 4 production systems)
    const omniscientCorpus = await loadOmniscientKnowledge();

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.DEFAULT_MODEL || process.env.OPENROUTER_MODEL || 'openrouter/free';

    // If OpenRouter is not configured, execute omniscient deterministic fallback smoothly
    if (!apiKey) {
        console.log(`[CHAT_API] No OPENROUTER_API_KEY found. Executing verified omniscient fallback for [${projectId}].`);
        const fallbackText = generateDeterministicFallback(cleanMessage, projectId, omniscientCorpus);

        if (stream) {
            return streamTextResponse(res, fallbackText, true);
        } else {
            const resp = {
                status: 'SUCCESS',
                engine: 'deterministic-fallback',
                citation: 'data/profile-cv.md · data/projects/*',
                response: fallbackText
            };
            if (res.status) return res.status(200).json(resp);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(resp));
        }
    }

    // Prepare Omniscient OpenRouter request (mastery across CV, education, and all 4 systems)
    const systemPrompt = buildOmniscientSystemPrompt(omniscientCorpus, projectId);
    
    // Format strictly alternating messages: System -> [User, Assistant, ...] -> User
    const openRouterMessages = normalizeConversationMessages(systemPrompt, history, cleanMessage);

    const isBookingIntent = /(call|meet|schedul|prenot|contatt|email|mail|intervist|fissa|slot|appuntament|parlare)/i.test(cleanMessage);

    try {
        console.log(`[CHAT_API] Invoking OpenRouter (${model}) for query: "${cleanMessage.slice(0, 40)}..."`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

        const reqPayload = {
            model: model,
            messages: openRouterMessages,
            temperature: 0.25, // Low temperature for high factual accuracy
            max_tokens: 1000,
            stream: stream
        };

        // If openrouter/free or auto, prioritize conversational LLMs over content safety classifiers (max 3 items)
        if (model === 'openrouter/free' || model === 'openrouter/auto') {
            delete reqPayload.model;
            reqPayload.models = [
                'deepseek/deepseek-v4-flash-0731:free',
                'nvidia/nemotron-3.5-lightning:free',
                'liquid/lfm-2.5-2.6b:free'
            ];
        }

        const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://renaldo.ai',
                'X-Title': 'Renaldo Arapi Architecture Copilot'
            },
            body: JSON.stringify(reqPayload)
        });

        clearTimeout(timeoutId);

        if (!orResponse.ok) {
            const errText = await orResponse.text().catch(() => '');
            console.error(`[CHAT_API] OpenRouter HTTP ${orResponse.status}: ${errText}`);
            // Fallback gracefully instead of failing the client
            const fallbackText = generateDeterministicFallback(cleanMessage, projectId, omniscientCorpus);
            if (stream) {
                return streamTextResponse(res, fallbackText, true);
            } else {
                const resp = {
                    status: 'SUCCESS',
                    engine: 'fallback',
                    citation: 'data/profile-cv.md · data/projects/*',
                    response: fallbackText
                };
                if (res.status) return res.status(200).json(resp);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(JSON.stringify(resp));
            }
        }

        if (stream && orResponse.body) {
            // Forward OpenRouter SSE stream to client
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Access-Control-Allow-Origin', '*');

            const reader = orResponse.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let sseBuffer = '';
            let fullStreamedText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });
                const lines = sseBuffer.split('\n');
                sseBuffer = lines.pop(); // Keep uncompleted line

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') {
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            const deltaContent = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || parsed.choices?.[0]?.text;
                            if (deltaContent) {
                                fullStreamedText += deltaContent;
                                res.write(`data: ${JSON.stringify({ chunk: deltaContent })}\n\n`);
                            }
                        } catch (e) {
                            // Non-JSON SSE chunk forwarded safely
                        }
                    }
                }
            }

            // If nothing was streamed from OpenRouter (e.g. empty output or unsupported chunk type), send verified fallback
            if (!fullStreamedText || fullStreamedText.trim().length === 0) {
                const fallbackText = generateDeterministicFallback(cleanMessage, projectId, omniscientCorpus);
                const words = fallbackText.split(' ');
                for (let i = 0; i < words.length; i++) {
                    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
                    res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                }
                fullStreamedText = fallbackText;
            }

            // If user expressed booking intent and token wasn't already in stream, append it
            if (isBookingIntent && !fullStreamedText.includes('[ACTION:OPEN_INLINE_SCHEDULER]')) {
                res.write(`data: ${JSON.stringify({ chunk: '\n\n[ACTION:OPEN_INLINE_SCHEDULER]' })}\n\n`);
            }

            res.write('data: [DONE]\n\n');
            return res.end();

        } else {
            // Non-streaming JSON response
            const json = await orResponse.json();
            let reply = json.choices?.[0]?.message?.content || generateDeterministicFallback(cleanMessage, projectId, omniscientCorpus);
            if (isBookingIntent && !reply.includes('[ACTION:OPEN_INLINE_SCHEDULER]')) {
                reply += '\n\n[ACTION:OPEN_INLINE_SCHEDULER]';
            }
            const responseData = {
                status: 'SUCCESS',
                engine: 'openrouter',
                citation: 'data/profile-cv.md · data/projects/*',
                response: reply
            };
            if (res.status) return res.status(200).json(responseData);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(responseData));
        }

    } catch (error) {
        console.error('[CHAT_API] Runtime Exception:', error.message);
        // Resilient fallback delivery
        const fallbackText = generateDeterministicFallback(cleanMessage, projectId, omniscientCorpus);
        if (stream) {
            return streamTextResponse(res, fallbackText, true);
        } else {
            const resp = {
                status: 'SUCCESS',
                engine: 'exception-fallback',
                citation: 'data/profile-cv.md · data/projects/*',
                response: fallbackText
            };
            if (res.status) return res.status(200).json(resp);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(resp));
        }
    }
};
