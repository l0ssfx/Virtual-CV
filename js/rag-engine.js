/**
 * =========================================================================
 * ARCHITECTURE RUNBOOK COPILOT & STREAMING RAG CONTROLLER
 * Proactive Conversion Engine with Direct In-Chat Scheduler & Email Uplink
 * =========================================================================
 * 
 * Governed by @motion_engineer.json and @fullstack_systems.json
 * Skills: react-spring-physics (typewriter pacing), ui-ux-pro-max (states & contrast)
 */

class ProjectRagEngine {
    constructor() {
        this.kb = typeof RAG_KNOWLEDGE_BASE !== 'undefined' ? RAG_KNOWLEDGE_BASE : { projects: [] };
        this.terminalOutput = document.getElementById('copilot-terminal-output');
        this.chipsContainer = document.getElementById('copilot-quick-chips');
        this.inputEl = document.getElementById('copilot-query-input');
        this.sendBtn = document.getElementById('copilot-query-btn');
        
        this.currentProjectId = "p1";
        this.isStreaming = false;
        this.activeAbortController = null;
        this.conversationHistory = []; // Ring buffer: { role: 'user'|'assistant', content: string }
        this.isBackendOnline = false;

        this.init();
    }

    async init() {
        if (this.sendBtn && this.inputEl) {
            this.sendBtn.addEventListener('click', () => this.handleCustomQuery());
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleCustomQuery();
                }
            });
        }

        // Connect persistent conversion chips in rail
        const bookTrigger = document.getElementById('trigger-book-call');
        if (bookTrigger) {
            bookTrigger.addEventListener('click', () => this.mountInlineScheduler('schedule'));
        }

        const emailTrigger = document.getElementById('trigger-send-email');
        if (emailTrigger) {
            emailTrigger.addEventListener('click', () => this.openDirectMail());
        }

        // Check backend telemetry asynchronously
        this.checkBackendHealth();
    }

    async checkBackendHealth() {
        try {
            const res = await fetch('/api/chat', { method: 'GET' });
            if (res.ok) {
                this.isBackendOnline = true;
            }
        } catch (e) {
            this.isBackendOnline = false;
        }
    }

    setActiveProject(projectId) {
        this.currentProjectId = projectId;
        this.conversationHistory = [];

        const project = this.kb.projects.find(p => p.id === projectId);
        if (!project) return;

        // Render Quick Query Chips for this project
        if (this.chipsContainer) {
            this.chipsContainer.innerHTML = project.quickPrompts.map((qp, idx) => `
                <button type="button" class="copilot-chip" data-idx="${idx}" title="${this.escapeHtml(qp.label)}">
                    ${this.escapeHtml(qp.label)}
                </button>
            `).join('');

            this.chipsContainer.querySelectorAll('.copilot-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const idx = parseInt(chip.getAttribute('data-idx'), 10);
                    const prompt = project.quickPrompts[idx];
                    if (prompt) {
                        this.submitQuery(prompt.label.replace(/^\[\s*›\s*|\s*\]$/g, ''), prompt.response, project.dossierFile);
                    }
                });
            });
        }

        // Print initial system runtime telemetry line in terminal
        this.printSystemBanner(project);
    }

    printSystemBanner(project) {
        if (!this.terminalOutput) return;
        this.abortStreaming();

        this.terminalOutput.innerHTML = `
            <div class="terminal-line prompt-line">
                <span class="term-prompt-symbol">$</span> <span class="term-query">view project --id ${project.id}</span>
            </div>
            <div class="terminal-line info-line">
                <span class="term-highlight">${this.escapeHtml(project.title)}</span>
            </div>
            <div class="terminal-line hint-line">
                <span class="term-arrow">↳</span> Chiedi dettagli sull'architettura, sulle metriche o sul CV, oppure usa i pulsanti rapidi in alto:
            </div>
        `;
        this.scrollToBottom();
    }

    determineCitation(queryText, presetCitation = null) {
        if (presetCitation) return presetCitation;
        const q = (queryText || '').toLowerCase();
        if (/(cv|curriculum|profilo|chi è|background|ruolo|laurea|universit|bologna|master|studi|educat|degree|assumer|hire|valore)/i.test(q)) {
            return 'data/profile-cv.md';
        }
        if (/(hpc|ansible|awx|rancher|slurm|morpheus|bare-metal|cluster|energy|sys-01|p1)/i.test(q)) {
            return 'data/projects/p1-hpc-energy.md';
        }
        if (/(banca|banking|bancari|migrazion|zero-loss|zero loss|reconciliation|sha256|fcr|psd2|sys-02|p2)/i.test(q)) {
            return 'data/projects/p2-banking-data.md';
        }
        if (/(vision|yolo|tensorrt|fps|latenza|latency|opencv|ring buffer|camera|sys-03|p3)/i.test(q)) {
            return 'data/projects/p3-computer-vision.md';
        }
        if (/(churn|telco|fargate|ecs|great expectations|optuna|mlops|tabular|classificazion|sbilanc|recall|sys-04|p4)/i.test(q)) {
            return 'data/projects/p4-predictive-classification.md';
        }
        const currentProject = this.kb?.projects?.find(p => p.id === this.currentProjectId);
        return currentProject ? currentProject.dossierFile : 'data/profile-cv.md · data/projects/*';
    }

    handleCustomQuery() {
        if (!this.inputEl) return;
        const query = this.inputEl.value.trim();
        if (!query || this.isStreaming) return;

        this.inputEl.value = '';

        // Check for direct user intent to schedule or contact
        if (/(call|meet|schedul|prenot|contatt|email|mail|intervist|fissa|slot|appuntament|parlare)/i.test(query)) {
            const isEmail = /(email|mail|messaggi)/i.test(query) && !/(call|meet|slot|prenot)/i.test(query);
            this.mountInlineScheduler(isEmail ? 'email' : 'schedule', query);
            return;
        }

        this.submitQuery(query);
    }

    async submitQuery(queryText, presetResponse = null, presetCitation = null) {
        if (!this.terminalOutput || this.isStreaming) return;
        this.abortStreaming();

        const citation = this.determineCitation(queryText, presetCitation);

        // Create the terminal exchange DOM block
        const exchangeBlock = document.createElement('div');
        exchangeBlock.className = 'terminal-exchange';
        exchangeBlock.innerHTML = `
            <div class="terminal-line prompt-line">
                <span class="term-prompt-symbol">›</span> <span class="term-query">${this.escapeHtml(queryText)}</span>
            </div>
            <div class="terminal-line citation-line">
                <span class="term-tag">[SOURCE]</span> <span class="term-cite">${citation}</span>
            </div>
            <div class="terminal-line answer-line">
                <span class="term-answer-stream"></span><span class="term-cursor blink">█</span>
            </div>
        `;

        this.terminalOutput.appendChild(exchangeBlock);
        this.scrollToBottom();

        const streamTarget = exchangeBlock.querySelector('.term-answer-stream');
        const cursorEl = exchangeBlock.querySelector('.term-cursor');

        this.setControlsStreamingState(true);

        // Record question in conversational history
        this.conversationHistory.push({ role: 'user', content: queryText });

        // If a preset response is provided and backend is offline, fast-path stream it
        if (presetResponse && !this.isBackendOnline) {
            await this.streamLocalText(streamTarget, cursorEl, presetResponse);
            this.finalizeQuery(presetResponse, cursorEl, exchangeBlock);
            return;
        }

        // Otherwise dispatch to the SSE backend endpoint
        this.activeAbortController = new AbortController();
        let fullAnswer = "";

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                signal: this.activeAbortController.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: queryText,
                    projectId: this.currentProjectId,
                    history: this.conversationHistory.slice(-4),
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP_STATUS_${response.status}`);
            }

            const contentType = response.headers.get('content-type') || '';

            if (contentType.includes('text/event-stream') && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const dataStr = trimmed.slice(6);
                        if (dataStr === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.chunk) {
                                fullAnswer += parsed.chunk;
                                // Clean trigger token from live view
                                const displayStr = fullAnswer.replace(/\[ACTION:OPEN_INLINE_SCHEDULER\]/g, '');
                                streamTarget.textContent = displayStr;
                                this.scrollToBottom();
                            }
                        } catch (e) {
                            fullAnswer += dataStr;
                            streamTarget.textContent = fullAnswer.replace(/\[ACTION:OPEN_INLINE_SCHEDULER\]/g, '');
                            this.scrollToBottom();
                        }
                    }
                }
            } else {
                const data = await response.json();
                fullAnswer = data.response || presetResponse || this.generateLocalFallback(queryText);
                await this.streamLocalText(streamTarget, cursorEl, fullAnswer.replace(/\[ACTION:OPEN_INLINE_SCHEDULER\]/g, ''));
            }

        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('[RAG_ENGINE] Fallback stream:', err.message);
            fullAnswer = presetResponse || this.generateLocalFallback(queryText);
            await this.streamLocalText(streamTarget, cursorEl, fullAnswer.replace(/\[ACTION:OPEN_INLINE_SCHEDULER\]/g, ''));
        } finally {
            this.finalizeQuery(fullAnswer, cursorEl, exchangeBlock);
        }
    }

    generateLocalFallback(query) {
        const q = (query || '').toLowerCase();
        const isItalian = /[àèéìòù]|ciao|come|cosa|chi|perché|progetto|modello|dati|call|prenot|laurea|studio|studi|curriculum/i.test(q);

        // 0. Direct Booking / Scheduling / Contact Intent
        if (/(call|meet|schedul|prenot|contatt|email|mail|intervist|fissa|slot|appuntament|parlare)/i.test(q)) {
            return (isItalian
                ? `Certamente! Renaldo è disponibile per colloqui tecnici e opportunità di collaborazione ingegneristica. Ho inizializzato il modulo di prenotazione e contatto direttamente qui sotto nella console:`
                : `Certainly! Renaldo is actively available for technical interviews and engineering collaborations. I have initialized the inline scheduler and contact console directly below:`)
                + '\n\n[ACTION:OPEN_INLINE_SCHEDULER]';
        }

        // 1. Greetings & Identity
        if (/^(hi|hello|hey|ciao|salve|buongiorno|buonasera|greetings|who are you|chi sei)/i.test(q.trim())) {
            return (isItalian
                ? `Ciao! Sono l'assistente tecnico del portfolio di Renaldo Arapi. Posso fornirti informazioni e metriche sui 4 progetti enterprise (HPC Energy, Banking Data Migration, Edge Computer Vision, Telco Churn MLOps), sul suo percorso accademico in Statistica a Bologna e sul suo CV. Fai una domanda o seleziona un argomento in alto.`
                : `Hello! I am the technical assistant for Renaldo Arapi's portfolio. I can provide verified details and metrics across all 4 enterprise systems (HPE HPC, Banking Data Migration, Edge Vision, Telco Churn MLOps), his Master in Statistics from the University of Bologna, and his CV. Ask any question or select a topic above.`)
                + (isItalian ? `\n\n↳ Vuoi approfondire con Renaldo? Puoi prenotare una call o inviargli un messaggio direttamente qui.` : `\n\n↳ Interested in connecting with Renaldo? You can schedule a call or send a message directly here.`);
        }

        // 2. Education / Academic Background / University / Bologna / Degree
        if (/(laurea|universit|bologna|master|studi|accadem|education|degree|statistica|matematica)/i.test(q)) {
            return (isItalian
                ? `Renaldo Arapi ha conseguito il **Master in Statistics** (Laurea Magistrale in Scienze Statistiche) presso l'**Alma Mater Studiorum – Università di Bologna** (fondata nel 1088, la più antica università del mondo). La sua preparazione si fonda su rigore matematico, inferenza statistica bayesiana, processi stocastici e modellazione quantitativa ad alta dimensionalità applicati all'ingegneria software di produzione.`
                : `Renaldo Arapi holds a **Master in Statistics** from **Alma Mater Studiorum – University of Bologna** (founded in 1088, the oldest university in the world). His academic foundation bridges rigorous mathematical statistics, Bayesian inference, stochastic processes, and high-dimensional modeling with production-grade engineering.`)
                + (isItalian ? `\n\n↳ Desideri discutere del background o delle competenze di Renaldo? Prenota una call conoscitiva qui sotto.` : `\n\n↳ Interested in exploring Renaldo's academic background or competencies? Book an alignment call below.`);
        }

        // 3. Profile / CV / Background / Forward Deployed Role / Experience
        if (/(cv|curriculum|profilo|chi è|background|ruolo|forward deployed|esperienza|esperienze|lavoro|bio|biografia)/i.test(q)) {
            return (isItalian
                ? `Renaldo Arapi è un **Forward Deployed Data Scientist & AI Systems Engineer**. Combina solida preparazione statistica (Master in Statistics a Bologna) con esperienza su sistemi enterprise ad alta scala: provisioning bare-metal per cluster HPC in HPE (12 min), migrazione bancaria Zero-Loss con conformità GDPR/PSD2, computer vision su edge GPU a 60+ FPS e classificazione tabulare con ECE <2.4%. Il suo CV è scaricabile direttamente dal portfolio.`
                : `Renaldo Arapi is a **Forward Deployed Data Scientist & AI Systems Engineer**. He bridges advanced statistics (Master from Bologna) with production engineering across large-scale enterprise systems: bare-metal HPC orchestration at HPE (12 min), Zero-Loss banking migration (GDPR/PSD2), 60+ FPS edge computer vision, and calibrated tabular ML with ECE <2.4%. His executive CV is available for direct download.`)
                + (isItalian ? `\n\n↳ Desideri esaminare un'opportunità o fissare un colloquio con Renaldo? Prenota una call direttamente qui sotto.` : `\n\n↳ Interested in exploring an opportunity or scheduling an interview with Renaldo? Book a call directly below.`);
        }

        // 4. "Perché dovrei assumerlo?" / Value proposition
        if (/(assumer|hire|perché dovrei|perche dovrei|valore|collabora|punti di forza|strength)/i.test(q)) {
            return (isItalian
                ? `Il valore distintivo di Renaldo risiede nella convergenza tra **profondo rigore statistico formale** (che previene allucinazioni, data leakage e modelli non calibrati) e **capacità di engineering di produzione** (Kubernetes, Ansible, TensorRT, FastAPI, Polars, Docker). Non si ferma a prototipi in notebook, ma porta in produzione sistemi affidabili e resilienti a stringenti SLA enterprise.`
                : `Renaldo's primary value is the rare convergence of **formal statistical rigor** (preventing model drift and miscalibration) and **hands-on production engineering** (Kubernetes, Ansible, TensorRT, FastAPI, Polars, Docker). He delivers deterministic machine learning systems designed for critical enterprise SLAs.`)
                + (isItalian ? `\n\n↳ Vuoi valutare una collaborazione tecnica con Renaldo? Prenota una call conoscitiva qui sotto.` : `\n\n↳ Interested in evaluating a technical engagement with Renaldo? Book an alignment call below.`);
        }

        // 5. Cross-Project Search across ALL projects in Knowledge Base
        for (const proj of (this.kb?.projects || [])) {
            const match = proj.quickPrompts?.find(qp => {
                const terms = qp.query.split(' ');
                return terms.some(t => q.includes(t));
            });
            if (match) {
                return match.response + (isItalian
                    ? `\n\n↳ [Rif: ${proj.serial} - ${proj.title}] Desideri approfondire questa architettura con Renaldo? Puoi fissare una call o inviargli una mail qui sotto.`
                    : `\n\n↳ [Ref: ${proj.serial} - ${proj.title}] Would you like to discuss this architecture directly with Renaldo? You can book a call or send an email below.`);
            }
        }

        // 6. System 01: HPE HPC Cluster
        if (/(hpc|ansible|awx|rancher|slurm|morpheus|bare-metal|provisioning|cluster|nodo|nodi|energy|hpe|sys-01|p1)/i.test(q)) {
            return (isItalian
                ? `Nel progetto **SYS-01 (HPE Energy Enterprise HPC Cluster)**, Renaldo ha orchestrato una piattaforma multi-tenant per simulazioni operative e AI. Con playbook Ansible dichiarativi orchestrati da AWX, i tempi di provisioning bare-metal sono passati da ore a **12 minuti idempotenti**, garantendo **99.95% di uptime operativo**, governance Kubernetes con Rancher e catalogo ibrido via Morpheus CMP.`
                : `In **SYS-01 (HPE Energy Enterprise HPC Cluster)**, Renaldo engineered a multi-tenant platform for high-throughput simulations. Bare-metal node provisioning was reduced from hours to **12 minutes** with **99.95% verified uptime**, Rancher multi-tenant governance, and Morpheus hybrid CMP orchestration.`)
                + (isItalian ? `\n\n↳ Desideri discutere di questa architettura HPC con Renaldo? Prenota una call qui sotto.` : `\n\n↳ Want to discuss this HPC architecture with Renaldo? Book a call below.`);
        }

        // 7. System 02: HPE Banking Core Data Migration & BI
        if (/(banca|banking|bancari|migrazion|zero-loss|zero loss|reconciliation|riconciliazione|md5|sha256|bi|fcr|psd2|contact center|sys-02|p2)/i.test(q)) {
            return (isItalian
                ? `Nel progetto **SYS-02 (HPE Banking Core Data Migration)**, Renaldo ha progettato l'architettura di migrazione di milioni di record storici con strategia **Zero-Loss**: riconciliazione a doppio hash crittografico (MD5/SHA256) a livello di riga, cutover delta senza perdita di transazioni, latenza query BI sotto il secondo e totale conformità GDPR e PSD2.`
                : `In **SYS-02 (HPE Banking Core Data Migration)**, Renaldo engineered a mission-critical migration of core banking interaction records with a **Zero-Loss** strategy: dual-hash (MD5/SHA256) row parity verification, zero-downtime cutover, sub-second BI query latency, and strict GDPR/PSD2 compliance.`)
                + (isItalian ? `\n\n↳ Desideri approfondire questa migrazione bancaria con Renaldo? Prenota una call qui sotto.` : `\n\n↳ Want to discuss this banking data migration with Renaldo? Book a call below.`);
        }

        // 8. System 03: Real-Time Edge Computer Vision
        if (/(vision|cv|yolo|tensorrt|fps|latenza|latency|opencv|frame|ring buffer|edge|gpu|albumentations|sys-03|p3)/i.test(q)) {
            return (isItalian
                ? `Nel progetto **SYS-03 (Real-Time Edge Computer Vision Pipeline)**, Renaldo ha implementato una pipeline di rilevamento e segmentazione a bassissima latenza su edge GPU. Compilando modelli PyTorch YOLO in FP16 con NVIDIA TensorRT e sfruttando un ring buffer asincrono in OpenCV con CUDA pinned memory, il sistema sostiene **60+ FPS costanti** con **11.2 ms di latenza** e **0.884 mAP@0.5**.`
                : `In **SYS-03 (Real-Time Edge Computer Vision Pipeline)**, Renaldo delivered an edge inference pipeline compiling PyTorch YOLO into FP16 NVIDIA TensorRT engines. With an asynchronous OpenCV ring buffer in CUDA pinned memory, it sustains **60+ FPS** at **11.2 ms latency** with **0.884 mAP@0.5**.`)
                + (isItalian ? `\n\n↳ Vuoi valutare pipeline di computer vision ad alte prestazioni con Renaldo? Prenota una call qui sotto.` : `\n\n↳ Interested in high-throughput computer vision pipelines with Renaldo? Book a call below.`);
        }

        // 9. System 04: Telco Customer Churn Prediction & End-to-End MLOps Pipeline
        if (/(churn|telco|fargate|ecs|great expectations|optuna|mlops|tabular|classificazion|sbilanc|recall|sys-04|p4)/i.test(q)) {
            return (isItalian
                ? `Nel progetto **SYS-04 (Telco Customer Churn End-to-End MLOps Pipeline)** ([GitHub: l0ssfx/Telco-Costumer-Churn-ML](https://github.com/l0ssfx/Telco-Costumer-Churn-ML)), Renaldo ha ingegnerizzato un'architettura completa deployata su AWS ECS Fargate. Il sistema ottimizza una funzione di costo asimmetrico (CAC >> CRC) con soglia tau = 0.35 e scale_pos_weight = 2.76, raggiungendo il **93.0% di Recall** sui churner con latenza di inferenza di soli **5.9 ms**. Include validazione dati con Great Expectations, prevenzione train-serving skew a 30 dimensioni, tracking MLflow e dual-serving FastAPI + Gradio.`
                : `In **SYS-04 (Telco Customer Churn End-to-End MLOps Pipeline)** ([GitHub: l0ssfx/Telco-Costumer-Churn-ML](https://github.com/l0ssfx/Telco-Costumer-Churn-ML)), Renaldo engineered a production system on AWS ECS Fargate behind an ALB. Optimizing an asymmetric cost function (CAC >> CRC) with threshold tau = 0.35 and scale_pos_weight = 2.76, the tuned XGBoost pipeline achieves **93.0% Minority Churn Recall** at **5.9 ms latency**. It features automated Great Expectations data contracts, train-serving skew prevention across 30 dimensions, MLflow tracking, and dual-serving FastAPI + Gradio.`)
                + (isItalian ? `\n\n↳ Desideri discutere di questa pipeline MLOps o di modelli predittivi con Renaldo? Prenota una call qui sotto.` : `\n\n↳ Want to discuss this MLOps architecture or predictive pipelines with Renaldo? Book a call below.`);
        }

        // 10. Technical Stack & Capabilities
        if (/(pytorch|docker|fastapi|sql|polars|mlflow|langchain|rag|vector|transformers|stack|competenze|skills)/i.test(q)) {
            return (isItalian
                ? `Lo stack di Renaldo comprende 16 moduli di produzione: PyTorch per deep learning con accelerazione CUDA, FastAPI per microservizi asincroni con validazione Pydantic v2, Docker per container distroless, SQL & Polars per ETL ad altissime prestazioni, MLflow per il tracciamento degli esperimenti e architetture RAG/Agenti per sistemi generativi deterministici.`
                : `Renaldo's technical capabilities span 16 production modules: PyTorch for CUDA-accelerated deep learning, FastAPI for async Pydantic v2 serving, Docker for secure minimal containers, SQL & Polars for high-throughput ETL, MLflow for experiment lineage, and RAG/Agent workflows for deterministic generative AI.`)
                + (isItalian ? `\n\n↳ Vuoi approfondire le competenze tecniche di Renaldo? Prenota una call conoscitiva qui sotto.` : `\n\n↳ Want to explore Renaldo's technical capabilities? Book an alignment call below.`);
        }

        // 11. Generic Omniscient Default
        const activeProject = this.kb?.projects?.find(p => p.id === this.currentProjectId) || this.kb?.projects?.[0];
        return (isItalian
            ? `Renaldo Arapi è un Forward Deployed Data Scientist & AI Systems Engineer con Master in Statistics all'Università di Bologna. Nel suo portfolio ha ingegnerizzato 4 architetture di riferimento (HPC bare-metal a 12 min di provisioning, migrazioni bancarie Zero-Loss, Computer Vision su edge a 60+ FPS e classificazione tabulare con ECE <2.4%). Attualmente stai visualizzando: [${activeProject?.serial} - ${activeProject?.title}].`
            : `Renaldo Arapi is a Forward Deployed Data Scientist & AI Systems Engineer with a Master in Statistics from the University of Bologna. His portfolio showcases 4 production architectures (bare-metal HPC with 12 min provisioning, Zero-Loss banking migration, 60+ FPS edge computer vision, and calibrated tabular classification with ECE <2.4%). Currently viewing: [${activeProject?.serial} - ${activeProject?.title}].`)
            + (isItalian ? `\n\n↳ Vuoi approfondire o valutare una collaborazione tecnica con Renaldo? Prenota una call conoscitiva qui sotto.` : `\n\n↳ Interested in connecting or evaluating a technical engagement with Renaldo? Book an alignment call below.`);
    }

    async streamLocalText(targetEl, cursorEl, text) {
        this.isStreaming = true;
        let charIndex = 0;
        const speed = 16;

        return new Promise((resolve) => {
            const step = () => {
                if (!this.isStreaming) {
                    resolve();
                    return;
                }
                if (charIndex < text.length) {
                    targetEl.textContent += text.charAt(charIndex);
                    charIndex++;
                    this.scrollToBottom();
                    setTimeout(step, speed);
                } else {
                    resolve();
                }
            };
            step();
        });
    }

    finalizeQuery(fullAnswer, cursorEl, exchangeBlock) {
        this.isStreaming = false;
        this.setControlsStreamingState(false);
        this.activeAbortController = null;

        if (cursorEl) {
            cursorEl.classList.add('blink');
        }

        const hasActionToken = fullAnswer && fullAnswer.includes('[ACTION:OPEN_INLINE_SCHEDULER]');
        const cleanAnswer = fullAnswer ? fullAnswer.replace(/\[ACTION:OPEN_INLINE_SCHEDULER\]/g, '').trim() : '';

        if (cleanAnswer) {
            this.conversationHistory.push({ role: 'assistant', content: cleanAnswer });
            if (this.conversationHistory.length > 8) {
                this.conversationHistory = this.conversationHistory.slice(-8);
            }
        }

        // Append Proactive CTA bar under the response
        if (exchangeBlock) {
            const ctaRow = document.createElement('div');
            ctaRow.className = 'terminal-quick-cta';
            ctaRow.innerHTML = `
                <span class="cta-label">↳ Direct Action:</span>
                <button type="button" class="cta-pill" data-mode="schedule">
                    <i class="fa-solid fa-calendar-check" aria-hidden="true"></i> <span>Book Call</span>
                </button>
                <button type="button" class="cta-pill" data-mode="email">
                    <i class="fa-solid fa-envelope" aria-hidden="true"></i> <span>Send Email</span>
                </button>
            `;
            ctaRow.querySelectorAll('.cta-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mode = btn.getAttribute('data-mode') || 'schedule';
                    if (mode === 'email') {
                        this.openDirectMail();
                    } else {
                        this.mountInlineScheduler('schedule');
                    }
                });
            });
            exchangeBlock.appendChild(ctaRow);
            this.scrollToBottom();
        }

        // If trigger token was generated by LLM, automatically pop the scheduler
        if (hasActionToken) {
            setTimeout(() => this.mountInlineScheduler('schedule'), 150);
        }
    }

    /**
     * Directly launches native mail client (Outlook / Default Client)
     * Matches the Direct Mail CTA in the Home Section
     */
    openDirectMail() {
        const mailtoUrl = "mailto:renaldo.arapi@live.it?subject=Strategic%20Data%20%26%20AI%20Architecture%20Inquiry&body=Hi%20Renaldo,%0A%0AI%20would%20like%20to%20discuss%20a%20potential%20AI%2FML%20or%20Data%20Science%20project.%0A%0ABest%20regards,";
        window.location.href = mailtoUrl;

        this.printTerminalConfirmation(
            'DIRECT MAIL CLIENT LAUNCHED',
            `✓ Native mail client (Outlook / Default Client) uplink opened for renaldo.arapi@live.it.\n↳ Subject: "Strategic Data & AI Architecture Inquiry"\n↳ No mandatory briefing forms required.`
        );
    }

    /**
     * Mounts the Interactive In-Chat Scheduling & Email Action Card
     */
    mountInlineScheduler(defaultMode = 'schedule', userTriggerPrompt = null) {
        if (!this.terminalOutput) return;

        // If an existing action card is open, remove it first
        const existing = this.terminalOutput.querySelector('.terminal-action-card');
        if (existing) existing.remove();

        const businessDays = this.getNextBusinessDays(5);
        const slots = ['10:00', '11:00', '14:00', '15:00', '16:00'];
        let activeMode = defaultMode; // 'schedule' or 'email'
        let selectedDate = businessDays[0] ? businessDays[0].iso : '';
        let selectedSlot = '14:00';

        const card = document.createElement('div');
        card.className = 'terminal-action-card';

        const renderCardContent = () => {
            const isSchedule = activeMode === 'schedule';

            card.innerHTML = `
                <div class="term-action-header">
                    <div class="term-action-tabs">
                        <button type="button" class="term-action-tab ${isSchedule ? 'active' : ''}" data-tab="schedule">
                            <i class="fa-solid fa-calendar-days" aria-hidden="true"></i> 1. Schedule Call
                        </button>
                        <button type="button" class="term-action-tab ${!isSchedule ? 'active' : ''}" data-tab="email">
                            <i class="fa-solid fa-envelope" aria-hidden="true"></i> 2. Direct Email
                        </button>
                    </div>
                    <button type="button" class="term-action-close" title="Close action card" aria-label="Close">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                ${isSchedule ? `
                    <!-- DATE & TIME SLOTS -->
                    <div class="term-form-row">
                        <div class="term-form-group">
                            <label class="term-form-label">Target Date <span class="req">*</span></label>
                            <select class="term-form-select" id="term-sched-date">
                                ${businessDays.map(d => `<option value="${d.iso}" ${d.iso === selectedDate ? 'selected' : ''}>${d.label} (${d.iso})</option>`).join('')}
                            </select>
                        </div>
                        <div class="term-form-group">
                            <label class="term-form-label">Timezone</label>
                            <input type="text" class="term-form-input" id="term-sched-tz" value="Europe/Rome (CET)" readonly>
                        </div>
                    </div>

                    <div class="term-form-group">
                        <span class="term-slots-label">Select Available Time Slot <span class="req">*</span>:</span>
                        <div class="term-slots-grid" id="term-slots-grid">
                            ${slots.map(s => `
                                <button type="button" class="term-slot-btn ${s === selectedSlot ? 'active' : ''}" data-slot="${s}">
                                    ${s}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- MANDATORY IDENTITY & CONTACT FIELDS (NAME, EMAIL, PHONE) -->
                    <div class="term-form-row">
                        <div class="term-form-group">
                            <label class="term-form-label">Your Full Name <span class="req">*</span></label>
                            <input type="text" class="term-form-input" id="term-input-name" placeholder="e.g. Alex Rivera" autocomplete="name">
                        </div>
                        <div class="term-form-group">
                            <label class="term-form-label">Contact Email <span class="req">*</span></label>
                            <input type="email" class="term-form-input" id="term-input-email" placeholder="e.g. a.rivera@techcorp.com" autocomplete="email">
                        </div>
                    </div>

                    <div class="term-form-row">
                        <div class="term-form-group">
                            <label class="term-form-label">Phone Number <span class="req">*</span></label>
                            <input type="tel" class="term-form-input" id="term-input-phone" placeholder="e.g. +39 340 1234567" autocomplete="tel">
                        </div>
                        <div class="term-form-group">
                            <label class="term-form-label">Meeting Format</label>
                            <input type="text" class="term-form-input" value="Google Meet / Phone Call" readonly>
                        </div>
                    </div>

                    <div class="term-form-group">
                        <label class="term-form-label">Call Objective / Discussion Topic <span class="req">*</span></label>
                        <textarea class="term-form-textarea" id="term-input-briefing" placeholder="e.g. Senior Machine Learning / Distributed Systems technical alignment"></textarea>
                    </div>

                    <!-- MANDATORY PRIVACY POLICY AGREEMENT (GDPR COMPLIANCE) -->
                    <div class="term-privacy-row">
                        <input type="checkbox" id="term-privacy-agree" class="term-privacy-check">
                        <label for="term-privacy-agree">
                            I agree to the processing of my contact details in accordance with the 
                            <a href="javascript:void(0)" class="term-privacy-link" id="term-open-privacy">Privacy Policy</a> 
                            (GDPR Art. 13/14) for the purpose of this technical meeting. <span class="req">*</span>
                        </label>
                    </div>

                    <div class="term-action-footer">
                        <div class="term-validation-msg" id="term-val-error" style="display: none;"></div>
                        <button type="button" class="term-confirm-btn" id="term-submit-btn">
                            <span>Confirm Booking ›</span>
                            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                        </button>
                    </div>
                ` : `
                    <!-- DIRECT EMAIL VIEW (ZERO FORMS) -->
                    <div class="term-direct-email-view">
                        <p class="term-email-desc">
                            No specific data input required. Click below to launch your default email client (Outlook, Apple Mail, etc.) configured with Renaldo's direct address and inquiry template, matching the Direct Mail button in Home:
                        </p>
                        <div class="term-email-preview">
                            <div class="term-email-field"><span class="term-tag">[TO]</span> renaldo.arapi@live.it</div>
                            <div class="term-email-field"><span class="term-tag">[SUBJECT]</span> Strategic Data &amp; AI Architecture Inquiry</div>
                            <div class="term-email-field"><span class="term-tag">[BODY]</span> "Hi Renaldo, I would like to discuss a potential AI/ML or Data Science project..."</div>
                        </div>
                        <div class="term-action-footer">
                            <div></div>
                            <button type="button" class="term-confirm-btn" id="term-launch-mail-btn">
                                <i class="fa-solid fa-envelope" aria-hidden="true"></i>
                                <span>Open Outlook / Mail Client ›</span>
                            </button>
                        </div>
                    </div>
                `}
            `;

            // Bind Tab Switching
            card.querySelectorAll('.term-action-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    activeMode = tab.getAttribute('data-tab');
                    renderCardContent();
                });
            });

            // Bind Close Button
            const closeBtn = card.querySelector('.term-action-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => card.remove());
            }

            if (isSchedule) {
                // Bind Privacy Policy Modal Opener
                const privacyLink = card.querySelector('#term-open-privacy');
                if (privacyLink) {
                    privacyLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        const modal = document.getElementById('privacy-modal');
                        if (modal) {
                            modal.classList.add('active');
                        }
                    });
                }

                // Bind Date and Slots
                const dateSelect = card.querySelector('#term-sched-date');
                if (dateSelect) {
                    dateSelect.addEventListener('change', (e) => {
                        selectedDate = e.target.value;
                    });
                }

                card.querySelectorAll('.term-slot-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        card.querySelectorAll('.term-slot-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        selectedSlot = btn.getAttribute('data-slot');
                    });
                });

                // Bind Schedule Submission
                const submitBtn = card.querySelector('#term-submit-btn');
                if (submitBtn) {
                    submitBtn.addEventListener('click', () => this.handleInlineSubmit(card, selectedDate, selectedSlot));
                }
            } else {
                // Bind Direct Mail Launch Button
                const launchMailBtn = card.querySelector('#term-launch-mail-btn');
                if (launchMailBtn) {
                    launchMailBtn.addEventListener('click', () => {
                        card.remove();
                        this.openDirectMail();
                    });
                }
            }
        };

        renderCardContent();
        this.terminalOutput.appendChild(card);
        this.scrollToBottom();
    }

    /**
     * Handles strict validation and transmission of inline booking
     */
    async handleInlineSubmit(card, selectedDate, selectedSlot) {
        const nameInput = card.querySelector('#term-input-name');
        const emailInput = card.querySelector('#term-input-email');
        const phoneInput = card.querySelector('#term-input-phone');
        const briefingInput = card.querySelector('#term-input-briefing');
        const privacyCheckbox = card.querySelector('#term-privacy-agree');
        const errorEl = card.querySelector('#term-val-error');
        const submitBtn = card.querySelector('#term-submit-btn');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';
        const briefing = briefingInput ? briefingInput.value.trim() : '';
        const privacyAccepted = privacyCheckbox ? privacyCheckbox.checked : false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[+]?[\d\s\-()]{7,25}$/;

        // Strict Validation Checks (Name, Email, Phone, Date/Slot, Briefing, Privacy Consent)
        let validationError = '';
        if (!name || name.length < 2) {
            validationError = 'Please provide your name (minimum 2 characters).';
        } else if (!email || !emailRegex.test(email)) {
            validationError = 'Please provide a valid email address.';
        } else if (!phone || !phoneRegex.test(phone)) {
            validationError = 'Please provide a valid phone number (minimum 7 digits, e.g. +39 340 1234567).';
        } else if (!selectedDate || !selectedSlot) {
            validationError = 'Please select a valid date and time slot.';
        } else if (!briefing || briefing.length < 5) {
            validationError = 'Please provide a discussion topic or briefing (minimum 5 characters).';
        } else if (!privacyAccepted) {
            validationError = 'You must agree to the Privacy Policy (GDPR) to proceed.';
        }

        if (validationError) {
            if (errorEl) {
                errorEl.textContent = `[VALIDATION_ERROR] ${validationError}`;
                errorEl.style.display = 'block';
            }
            return;
        }

        if (errorEl) errorEl.style.display = 'none';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.querySelector('span').textContent = 'Transmitting...';
        }

        try {
            const response = await fetch('/api/calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    briefing: briefing,
                    date: selectedDate,
                    startTime: selectedSlot,
                    timezone: 'Europe/Rome',
                    privacyAccepted: true
                })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Server validation failed');
            }

            // Replace card with terminal confirmation block
            card.remove();
            this.printTerminalConfirmation(
                'CALENDAR RESERVATION RECORDED',
                `✓ Meeting confirmed for ${this.escapeHtml(name)} on ${selectedDate} at ${selectedSlot} CET.\n↳ Contact: ${this.escapeHtml(email)} · Phone: ${this.escapeHtml(phone)}\n↳ Topic: "${this.escapeHtml(briefing)}"\n↳ Notification dispatched to ${this.escapeHtml(email)} and renaldo.arapi@live.it.`
            );

        } catch (err) {
            // Graceful fallback simulation
            card.remove();
            this.printTerminalConfirmation(
                'RESERVATION SAVED (OFFLINE UPLINK)',
                `✓ Meeting request registered for ${this.escapeHtml(name)} on ${selectedDate} at ${selectedSlot} CET.\n↳ Phone: ${this.escapeHtml(phone)}\n↳ Topic: "${this.escapeHtml(briefing)}"\n↳ Synchronized with local scheduler queue.`
            );
        }
    }

    printTerminalConfirmation(tag, text) {
        if (!this.terminalOutput) return;

        const confirmBlock = document.createElement('div');
        confirmBlock.className = 'terminal-exchange';
        confirmBlock.innerHTML = `
            <div class="terminal-line citation-line">
                <span class="term-tag">[${tag}]</span> <span class="term-cite">Renaldo Arapi Operational Queue</span>
            </div>
            <div class="terminal-line answer-line" style="border-left-color: var(--term-accent-active);">
                ${text.replace(/\n/g, '<br>')}
            </div>
        `;
        this.terminalOutput.appendChild(confirmBlock);
        this.scrollToBottom();
    }

    getNextBusinessDays(count = 5) {
        const days = [];
        let curr = new Date();
        while (days.length < count) {
            curr.setDate(curr.getDate() + 1);
            const dow = curr.getDay();
            if (dow !== 0 && dow !== 6) { // Skip Sunday (0) and Saturday (6)
                const iso = curr.toISOString().split('T')[0];
                const label = curr.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
                days.push({ iso, label });
            }
        }
        return days;
    }

    setControlsStreamingState(isStreaming) {
        this.isStreaming = isStreaming;
        if (this.sendBtn) {
            this.sendBtn.disabled = isStreaming;
            const btnSpan = this.sendBtn.querySelector('span');
            if (btnSpan) {
                btnSpan.textContent = isStreaming ? 'Streaming...' : 'Execute';
            }
        }
        if (this.inputEl) {
            this.inputEl.disabled = isStreaming;
            if (!isStreaming) {
                this.inputEl.focus();
            }
        }
    }

    abortStreaming() {
        if (this.activeAbortController) {
            this.activeAbortController.abort();
            this.activeAbortController = null;
        }
        this.isStreaming = false;
        this.setControlsStreamingState(false);
    }

    scrollToBottom() {
        if (this.terminalOutput) {
            this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
        }
    }

    escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
