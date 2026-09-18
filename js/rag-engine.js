/* === CLIENT-SIDE RAG COPILOT & TERMINAL RETRIEVAL ENGINE === */
class ProjectRagEngine {
    constructor() {
        this.kb = typeof RAG_KNOWLEDGE_BASE !== 'undefined' ? RAG_KNOWLEDGE_BASE : { projects: [] };
        this.terminalOutput = document.getElementById('copilot-terminal-output');
        this.chipsContainer = document.getElementById('copilot-quick-chips');
        this.inputEl = document.getElementById('copilot-query-input');
        this.sendBtn = document.getElementById('copilot-query-btn');
        this.currentProjectId = "p1";
        this.isStreaming = false;
        this.streamTimer = null;

        this.init();
    }

    init() {
        if (this.sendBtn && this.inputEl) {
            this.sendBtn.addEventListener('click', () => this.handleCustomQuery());
            this.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleCustomQuery();
                }
            });
        }
    }

    setActiveProject(projectId) {
        this.currentProjectId = projectId;
        const project = this.kb.projects.find(p => p.id === projectId);
        if (!project) return;

        // Render Quick Query Chips for this project
        if (this.chipsContainer) {
            this.chipsContainer.innerHTML = project.quickPrompts.map((qp, idx) => `
                <button type="button" class="copilot-chip" data-idx="${idx}" title="${qp.label}">
                    ${qp.label}
                </button>
            `).join('');

            this.chipsContainer.querySelectorAll('.copilot-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const idx = parseInt(chip.getAttribute('data-idx'), 10);
                    const prompt = project.quickPrompts[idx];
                    if (prompt) {
                        this.executePrompt(prompt.label.replace('⚡ ', ''), prompt.response, project.dossierFile);
                    }
                });
            });
        }

        // Print system ready line in terminal
        this.printSystemBanner(project);
    }

    printSystemBanner(project) {
        if (!this.terminalOutput) return;
        this.abortStreaming();
        this.terminalOutput.innerHTML = `
            <div class="terminal-line prompt-line">
                <span class="term-user">renaldo@enterprise-hpc</span>:<span class="term-dir">~/projects/${project.id}</span>$ <span class="term-cmd">cat dossier.meta</span>
            </div>
            <div class="terminal-line info-line">
                <span class="term-tag">[SYSTEM INITIALIZED]</span> Active Architecture: <span class="term-highlight">${project.title}</span>
            </div>
            <div class="terminal-line meta-line">
                <span class="term-dim">Document Base: ${project.dossierFile} · Ready for semantic queries.</span>
            </div>
            <div class="terminal-line hint-line">
                <span class="term-arrow">↳</span> Click any query chip above or type an architectural question below:
            </div>
        `;
        this.scrollToBottom();
    }

    handleCustomQuery() {
        if (!this.inputEl) return;
        const query = this.inputEl.value.trim();
        if (!query || this.isStreaming) return;

        this.inputEl.value = '';
        this.searchAndRespond(query);
    }

    searchAndRespond(query) {
        const project = this.kb.projects.find(p => p.id === this.currentProjectId);
        if (!project) return;

        const startTime = performance.now();
        const normalizedQuery = query.toLowerCase();

        // 1. Direct match on quick prompts
        let bestPrompt = null;
        let highestScore = 0;

        project.quickPrompts.forEach(qp => {
            const terms = qp.query.split(' ');
            let score = 0;
            terms.forEach(term => {
                if (normalizedQuery.includes(term)) score += 3;
            });
            if (score > highestScore) {
                highestScore = score;
                bestPrompt = qp;
            }
        });

        let answer = "";
        let citation = project.dossierFile;

        if (bestPrompt && highestScore >= 3) {
            answer = bestPrompt.response;
        } else {
            // 2. Synthesize contextual response based on project data
            const matchedStack = project.stack.filter(s => normalizedQuery.includes(s.toLowerCase()));
            const isHpc = project.id === "p1";
            const isBanking = project.id === "p2";
            const isCv = project.id === "p3";
            const isStats = project.id === "p4";

            if (isHpc) {
                answer = `Per l'infrastruttura HPC in ambito energetico con HPE, abbiamo configurato cluster Kubernetes orchestrati tramite Rancher con nodi bare-metal automatizzati via AWX (Ansible). L'architettura applica GitOps con GitLab CI/CD e governance multi-cloud Morpheus, riducendo i tempi di provisioning da ore a soli 12 minuti con disponibilità operativa del 99.95%.`;
            } else if (isBanking) {
                answer = `Nel progetto di data migration bancaria per il contact center, abbiamo progettato schemi relazionali ottimizzati in SQL partizionati storicamente, gestendo la migrazione con zero perdita dati e riconciliazione basata su fingerprint MD5/SHA256, garantendo piena conformità GDPR e latenza di query sub-secondo.`;
            } else if (isCv) {
                answer = `La pipeline di Computer Vision esegue object detection e segmentazione a 60+ FPS sostenuti su acceleratori edge GPU. Abbiamo impiegato PyTorch con modelli YOLO quantizzati in mezza precisione FP16 tramite NVIDIA TensorRT e buffer video asincroni in OpenCV per una latenza di 11.2ms per frame.`;
            } else if (isStats) {
                answer = `Il sistema di classificazione predittiva gestisce feature ad alta dimensionalità con forte sbilanciamento delle classi (<3%). Abbiamo ottimizzato gradient boosted trees con Bayesian HPO (Optuna), calibrazione isotonica delle probabilità posteriori (ECE < 2.4%) e spiegabilità trasparente locale con TreeSHAP.`;
            } else {
                answer = `Il sistema ${project.serial} (${project.title}) è stato progettato per rispondere a severi requisiti di scalabilità e produzione: stack primario basato su ${project.stack.join(', ')}, validato con rigore quantitativo e metriche deterministiche di performance.`;
            }
        }

        const elapsedMs = Math.max(8, Math.round(performance.now() - startTime + Math.random() * 12));
        this.executePrompt(query, answer, `${citation} (Latency: ${elapsedMs}ms)`);
    }

    executePrompt(queryText, answerText, citation) {
        if (!this.terminalOutput || this.isStreaming) return;
        this.abortStreaming();

        const queryBlock = document.createElement('div');
        queryBlock.className = 'terminal-exchange';
        queryBlock.innerHTML = `
            <div class="terminal-line prompt-line">
                <span class="term-user">renaldo@enterprise-hpc</span>:<span class="term-dir">~/projects/${this.currentProjectId}</span>$ <span class="term-query">${this.escapeHtml(queryText)}</span>
            </div>
            <div class="terminal-line citation-line">
                <span class="term-tag">[RETRIEVED CITATION]</span> <span class="term-cite">${citation}</span>
            </div>
            <div class="terminal-line answer-line">
                <span class="term-answer-stream"></span><span class="term-cursor">█</span>
            </div>
        `;

        this.terminalOutput.appendChild(queryBlock);
        this.scrollToBottom();

        const streamTarget = queryBlock.querySelector('.term-answer-stream');
        const cursor = queryBlock.querySelector('.term-cursor');
        this.streamText(streamTarget, cursor, answerText);
    }

    streamText(targetEl, cursorEl, fullText) {
        this.isStreaming = true;
        let charIndex = 0;
        const speed = 18; // ~55 characters per second

        const step = () => {
            if (charIndex < fullText.length) {
                targetEl.textContent += fullText.charAt(charIndex);
                charIndex++;
                this.scrollToBottom();
                this.streamTimer = setTimeout(step, speed);
            } else {
                this.isStreaming = false;
                if (cursorEl) {
                    cursorEl.classList.add('blink');
                }
            }
        };

        step();
    }

    abortStreaming() {
        if (this.streamTimer) {
            clearTimeout(this.streamTimer);
            this.streamTimer = null;
        }
        this.isStreaming = false;
    }

    scrollToBottom() {
        if (this.terminalOutput) {
            this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
        }
    }

    escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
