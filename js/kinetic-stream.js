/* === EXECUTIVE SYSTEMS ARCHITECTURE CONSOLE & RAG ORCHESTRATOR === */
class KineticStream {
    constructor() {
        this.rosterList = document.getElementById('systems-roster-list');
        this.consoleWorkspace = document.getElementById('console-workspace');
        
        // Blueprint Elements
        this.bpSerial = document.getElementById('bp-serial');
        this.bpClient = document.getElementById('bp-client');
        this.bpTitle = document.getElementById('bp-title');
        this.bpDomain = document.getElementById('bp-domain');
        this.bpKpiPrimary = document.getElementById('bp-kpi-primary');
        this.bpKpiPrimaryLabel = document.getElementById('bp-kpi-primary-label');
        this.bpKpiSecondary = document.getElementById('bp-kpi-secondary');
        this.bpKpiSecondaryLabel = document.getElementById('bp-kpi-secondary-label');
        this.bpStack = document.getElementById('bp-stack');
        this.bpSummary = document.getElementById('bp-summary');
        this.bpTopologyRail = document.getElementById('bp-topology-rail');

        // Master Projects from Knowledge Base
        this.projects = typeof RAG_KNOWLEDGE_BASE !== 'undefined' ? RAG_KNOWLEDGE_BASE.projects : [];
        this.activeId = "p1";
        this.ragEngine = null;

        this.init();
    }

    init() {
        if (!this.rosterList) return;

        // Initialize RAG Engine
        if (typeof ProjectRagEngine !== 'undefined') {
            this.ragEngine = new ProjectRagEngine();
        }

        this.renderRoster();
        this.selectSystem(this.activeId);
    }

    renderRoster() {
        this.rosterList.innerHTML = this.projects.map((p, idx) => {
            const isActive = p.id === this.activeId;
            return `
                <button type="button" 
                        class="roster-item ${isActive ? 'active' : ''}" 
                        data-id="${p.id}" 
                        role="tab" 
                        aria-selected="${isActive ? 'true' : 'false'}"
                        id="roster-tab-${p.id}"
                        aria-controls="console-workspace">
                    <div class="roster-item-top">
                        <span class="roster-serial">${p.serial}</span>
                        <span class="roster-tag" data-domain="${p.domainTag}">${p.domainTag.toUpperCase()}</span>
                    </div>
                    <div class="roster-item-main">
                        <h4 class="roster-title">${p.title}</h4>
                        <span class="roster-client">${p.clientContext}</span>
                    </div>
                    <div class="roster-notch" aria-hidden="true"></div>
                </button>
            `;
        }).join('');

        this.rosterList.querySelectorAll('.roster-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-id');
                this.selectSystem(pid);
            });
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const pid = btn.getAttribute('data-id');
                    this.selectSystem(pid);
                }
            });
        });
    }

    selectSystem(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        this.activeId = projectId;

        // Update Roster UI State
        this.rosterList.querySelectorAll('.roster-item').forEach(btn => {
            const isMatch = btn.getAttribute('data-id') === projectId;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
        });

        // Update Blueprint View with smooth crossfade
        const blueprintZone = document.getElementById('blueprint-zone');
        if (blueprintZone) {
            blueprintZone.style.opacity = '0.4';
            blueprintZone.style.transform = 'translateY(4px)';
            
            setTimeout(() => {
                this.applyBlueprintData(project);
                blueprintZone.style.transition = 'opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1), transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)';
                blueprintZone.style.opacity = '1';
                blueprintZone.style.transform = 'translateY(0)';
            }, 80);
        } else {
            this.applyBlueprintData(project);
        }

        // Notify RAG Copilot Engine
        if (this.ragEngine) {
            this.ragEngine.setActiveProject(projectId);
        }
    }

    applyBlueprintData(project) {
        if (this.bpSerial) this.bpSerial.textContent = project.serial;
        if (this.bpClient) this.bpClient.textContent = project.clientContext;
        if (this.bpTitle) this.bpTitle.textContent = project.title;
        if (this.bpDomain) this.bpDomain.textContent = project.domain;
        if (this.bpKpiPrimary) this.bpKpiPrimary.textContent = project.kpiPrimary;
        if (this.bpKpiPrimaryLabel) this.bpKpiPrimaryLabel.textContent = project.kpiPrimaryLabel;
        if (this.bpKpiSecondary) this.bpKpiSecondary.textContent = project.kpiSecondary;
        if (this.bpKpiSecondaryLabel) this.bpKpiSecondaryLabel.textContent = project.kpiSecondaryLabel;
        if (this.bpSummary) this.bpSummary.textContent = project.summary;

        // Render Stack Pills
        if (this.bpStack) {
            this.bpStack.innerHTML = project.stack.map(tech => `
                <span class="bp-tech-pill">${tech}</span>
            `).join('');
        }

        // Render Interactive SVG Topology Rail
        if (this.bpTopologyRail && project.topologySteps) {
            this.bpTopologyRail.innerHTML = project.topologySteps.map((step, idx) => {
                const isLast = idx === project.topologySteps.length - 1;
                return `
                    <div class="topo-node ${isLast ? 'terminal-node' : ''}">
                        <div class="node-box">
                            <span class="node-idx">0${idx + 1}</span>
                            <span class="node-name">${step.name}</span>
                            <span class="node-sub">${step.desc}</span>
                        </div>
                        ${!isLast ? `
                            <div class="node-connector" aria-hidden="true">
                                <svg class="connector-svg" width="32" height="12" viewBox="0 0 32 12" fill="none">
                                    <line x1="0" y1="6" x2="26" y2="6" stroke="var(--c-border)" stroke-width="2" stroke-dasharray="3 3"/>
                                    <path d="M24 2L30 6L24 10" fill="var(--c-accent)"/>
                                </svg>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    }
}
