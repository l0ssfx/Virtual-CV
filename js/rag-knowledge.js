/* === CLIENT-SIDE RAG KNOWLEDGE BASE (4 PRODUCTION SYSTEMS) === */
const RAG_KNOWLEDGE_BASE = {
    projects: [
        {
            id: "p1",
            serial: "SYS-01",
            title: "Enterprise HPC Cluster & Automated Workload Orchestration",
            clientContext: "Hewlett Packard Enterprise (HPE) · Global Energy Enterprise",
            domain: "HPC & MLOps Infrastructure",
            domainTag: "infra",
            status: "Enterprise Production",
            stack: ["Rancher (K8s)", "AWX (Ansible)", "Morpheus", "GitLab CI/CD", "Python", "Linux HPC"],
            kpiPrimary: "12 min",
            kpiPrimaryLabel: "Automated Node Provisioning",
            kpiSecondary: "99.95%",
            kpiSecondaryLabel: "Cluster Simulation Uptime",
            summary: "Multi-tenant High-Performance Computing (HPC) compute orchestration platform built for high-throughput operational simulations and AI compute workloads, automating node provisioning, Kubernetes cluster lifecycle, and GitOps pipelines.",
            topologySteps: [
                { name: "GitLab CI/CD", desc: "Declarative GitOps configuration" },
                { name: "AWX / Ansible", desc: "Automated bare-metal node provisioning" },
                { name: "Rancher K8s", desc: "Cluster orchestration & namespace quotas" },
                { name: "Morpheus CMP", desc: "Multi-cloud resource catalog & brokering" },
                { name: "HPC Slurm / Worker Nodes", desc: "High-throughput simulation execution" }
            ],
            quickPrompts: [
                {
                    label: "⚡ Come hai scalato i nodi con Rancher?",
                    query: "rancher scaling kubernetes nodi cluster",
                    response: "In Rancher abbiamo implementato policy di auto-scaling legate alle metriche di utilizzo compute/memoria dei nodi worker. Rancher gestisce il provisioning automatico di nuovi nodi nel cluster Kubernetes quando le simulazioni HPC superano la soglia di carico critico, isolando i job in namespace dedicati con quote di risorse e RBAC granulari per garantire zero interferenze tra team."
                },
                {
                    label: "⚡ Qual è il flusso di automazione con AWX?",
                    query: "awx ansible automazione playbook provisioning",
                    response: "AWX orchestra playbook Ansible idempotenti per il bootstrap dei nodi bare-metal e virtuali. L'automazione configura la rete ad alta velocità, installa i driver GPU, monta i file system distribuiti e registra il nodo nel cluster senza intervento manuale, riducendo i tempi di provisioning da ore a soli 12 minuti."
                },
                {
                    label: "⚡ Come funziona la pipeline GitLab CI/CD?",
                    query: "gitlab cicd pipeline gitops test",
                    response: "La pipeline GitLab applica una metodologia GitOps pura: ogni modifica ai playbook Ansible o ai manifest di Rancher passa attraverso test automatici di sintassi, linting e dry-run. Il merge su branch protetti avvia automaticamente il rollout controllato tramite AWX webhook, garantendo tracciabilità totale e audit log conformi agli standard energetici."
                },
                {
                    label: "⚡ Che ruolo ha Morpheus nell'architettura?",
                    query: "morpheus orchestrazione cloud gestione",
                    response: "Morpheus funge da piattaforma di Cloud Management Platform (CMP) unificata: fornisce un catalogo self-service per gli scienziati dei dati e ingegneri, permettendo di istanziare ambienti di calcolo complessi su infrastrutture ibride (on-premise e private cloud) con governance automatica del ciclo di vita dei carichi di lavoro."
                }
            ],
            dossierFile: "data/projects/p1-hpc-energy.md"
        },
        {
            id: "p2",
            serial: "SYS-02",
            title: "Banking Core Data Migration & Contact Center Intelligence",
            clientContext: "Hewlett Packard Enterprise (HPE) · Tier-1 Commercial Bank",
            domain: "Enterprise Data Architecture & BI",
            domainTag: "data",
            status: "Enterprise Production",
            stack: ["Advanced SQL", "Relational DBs (Postgres/Oracle)", "Zero-Loss Migration ETL", "BI Telemetry", "Python Checks"],
            kpiPrimary: "100%",
            kpiPrimaryLabel: "Zero-Loss Data Reconciliation",
            kpiSecondary: "< 1s",
            kpiSecondaryLabel: "BI Operational Query Latency",
            summary: "Mission-critical data architecture and historical migration modernizing core banking contact center interactions into a centralized enterprise platform, featuring zero data loss, strict GDPR compliance, and real-time operational BI dashboards.",
            topologySteps: [
                { name: "Legacy DB Silos", desc: "Historical interaction & customer logs" },
                { name: "Staging & Sanitize", desc: "SQL normalization & character conversions" },
                { name: "Reconciliation Gate", desc: "MD5/SHA row hash parity checks" },
                { name: "Modern Banking DB", desc: "Normalized partitioned relational schemas" },
                { name: "Executive BI Dashboard", desc: "FCR & SLA queue distribution telemetry" }
            ],
            quickPrompts: [
                {
                    label: "⚡ Qual è stata la strategia di migrazione zero-loss?",
                    query: "migrazione dati zero loss strategia transazionale sql",
                    response: "Abbiamo adottato un'architettura di migrazione multi-stadio: prima una sincronizzazione bulk storica verso tabelle di staging, seguita da micro-batch delta sincronizzati fino al momento del cutover. Ogni blocco di record è stato validato con fingerprint crittografici (MD5/SHA256) confrontati tra sorgente e destinazione, garantendo il 100% di parità senza alcuna perdita di transazioni bancarie."
                },
                {
                    label: "⚡ Come sono stati ottimizzati gli schemi SQL?",
                    query: "sql schemi database relazionale indici partizionamento",
                    response: "Gli schemi di destinazione sono stati progettati in forma normale con partizionamento temporale delle tabelle degli eventi (milioni di chiamate e messaggi). Abbiamo ottimizzato indici composti su ID cliente e timestamp, riducendo i tempi di query per il reporting operativo da minuti a sub-secondo."
                },
                {
                    label: "⚡ Quali metriche traccia il dashboard del contact center?",
                    query: "dashboard kpi bi contact center fcr sla",
                    response: "Il dashboard fornisce visualizzazioni statistiche per il management: First Contact Resolution (FCR), distribuzioni delle code di attesa (calcolate per fasce orarie e percentile), tassi di abbandono e varianza di performance degli agenti rispetto agli SLA contrattuali, consentendo il ribilanciamento proattivo dei turni."
                },
                {
                    label: "⚡ Come è stata gestita la compliance normativa?",
                    query: "gdpr psd2 compliance regolamentazione privacy",
                    response: "La migrazione ha integrato regole rigorose di anonimizzazione e crittografia per i dati sensibili in conformità con GDPR e direttive bancarie europee (PSD2), garantendo retention period rigorosi e audit trail completi per ogni operazione di trasformazione."
                }
            ],
            dossierFile: "data/projects/p2-banking-data.md"
        },
        {
            id: "p3",
            serial: "SYS-03",
            title: "Real-Time Computer Vision & Edge Inference Pipeline",
            clientContext: "Applied AI & Edge Systems · Autonomous Production System",
            domain: "Computer Vision & Edge Deep Learning",
            domainTag: "cv",
            status: "Production Deployed",
            stack: ["PyTorch", "YOLOv8/v11", "OpenCV", "TensorRT", "FastAPI", "Docker"],
            kpiPrimary: "60+ FPS",
            kpiPrimaryLabel: "Sustained Edge Throughput",
            kpiSecondary: "11.2 ms",
            kpiSecondaryLabel: "Per-Frame Inference Latency",
            summary: "High-throughput end-to-end computer vision pipeline engineered for low-latency multi-class object detection and spatial boundary segmentation on constrained edge GPU accelerators, running at sustained 60+ FPS.",
            topologySteps: [
                { name: "Camera Frame Ingest", desc: "Multi-stream industrial camera input" },
                { name: "OpenCV Ring Buffer", desc: "Asynchronous zero-copy memory ring" },
                { name: "TensorRT FP16 Engine", desc: "Quantized deep neural backbone" },
                { name: "Spatial Categorization", desc: "Bounding box & polygon mask extraction" },
                { name: "FastAPI / Actuator Sinks", desc: "Low-latency control alerts & logging" }
            ],
            quickPrompts: [
                {
                    label: "⚡ Come hai raggiunto 60+ FPS su dispositivi Edge?",
                    query: "fps throughput latenza tensorrt fp16 edge gpu",
                    response: "Il modello PyTorch è stato esportato in formato ONNX e successivamente compilato con NVIDIA TensorRT applicando quantizzazione a mezza precisione (FP16). Questo ha dimezzato l'occupazione di memoria e sfruttato appieno i Tensor Core della GPU, abbattendo la latenza per singolo frame a 11.2ms."
                },
                {
                    label: "⚡ Come gestisci i flussi video multipli senza drop?",
                    query: "video streaming opencv buffer producer consumer",
                    response: "Abbiamo implementato un'architettura asincrona producer-consumer con ring buffer in memoria bloccata (pinned CUDA memory). La cattura dei frame video tramite OpenCV è completamente disaccoppiata dall'inferenza della rete neurale, eliminando qualsiasi perdita di frame anche durante picchi di risoluzione."
                },
                {
                    label: "⚡ Quali strategie di data augmentation hai usato?",
                    query: "augmentation albumentations mAP dataset mosaic",
                    response: "Utilizzando Albumentations, abbiamo applicato mosaic mixup, variazioni di luminosità e saturazione (HSV jitter), blur da movimento e trasformazioni prospettiche casuali. Questo ha aumentato la robustezza del modello alle variazioni di luce ambientale, portando l'mAP@0.5 finale a 0.884."
                }
            ],
            dossierFile: "data/projects/p3-computer-vision.md"
        },
        {
            id: "p4",
            serial: "SYS-04",
            title: "High-Dimensional Classification & Statistical Inference Engine",
            clientContext: "Statistical Learning & Quantitative Modeling · Autonomous Production System",
            domain: "Predictive ML & Statistical Validation",
            domainTag: "stats",
            status: "Production Deployed",
            stack: ["Python", "Scikit-Learn", "XGBoost", "Polars", "SHAP", "Optuna", "FastAPI"],
            kpiPrimary: "0.896",
            kpiPrimaryLabel: "Holdout ROC-AUC",
            kpiSecondary: "< 2.4%",
            kpiSecondaryLabel: "Expected Calibration Error",
            summary: "End-to-end predictive machine learning platform handling high-dimensional, highly imbalanced classification spaces with Polars vectorized ETL, Bayesian hyperparameter tuning, isotonic probability calibration, and localized TreeSHAP explainability.",
            topologySteps: [
                { name: "Polars Vectorized ETL", desc: "Zero-copy feature transformation & encoding" },
                { name: "Optuna HPO", desc: "Bayesian hyperparameter optimization" },
                { name: "XGBoost / LightGBM", desc: "Ensemble gradient boosted trees" },
                { name: "Isotonic Calibration", desc: "Empirical posterior probability alignment" },
                { name: "SHAP Explainability", desc: "Instance-level Shapley attribution telemetry" }
            ],
            quickPrompts: [
                {
                    label: "⚡ Come gestisci lo sbilanciamento estremo delle classi?",
                    query: "sbilanciamento classi focal loss pr auc stratified kfold",
                    response: "Con una classe minoritaria inferiore al 3%, abbiamo sostituito la metrica di accuratezza con la Precision-Recall AUC (PR-AUC). Abbiamo integrato una funzione di costo ponderata (Focal Loss) e adottato Stratified Repeated K-Fold cross-validation, assicurando che ogni partizione di addestramento e test preservasse la distribuzione della popolazione."
                },
                {
                    label: "⚡ Perché è importante la calibrazione delle probabilità?",
                    query: "calibrazione probabilità isotonic platt scaling brier score",
                    response: "I modelli ad albero (come XGBoost) tendono a produrre punteggi estremi e non affidabili come vere probabilità statistiche. Abbiamo applicato l'Isotonic Regression sui punteggi di validazione, riducendo l'Expected Calibration Error sotto il 2.4% e portando il Brier Score da 0.142 a 0.081: fondamentale per impostare soglie di decisione di business precise."
                },
                {
                    label: "⚡ Come spieghi le decisioni del modello agli stakeholder?",
                    query: "shap spiegabilità interpretabilità feature importance",
                    response: "Abbiamo integrato TreeSHAP nell'endpoint di inferenza FastAPI: per ogni predizione erogata, il sistema calcola i valori Shapley locali e genera un grafico waterfall che mostra i 5 fattori che hanno aumentato o diminuito la probabilità del singolo caso, rendendo il modello trasparente e conforme alle richieste di audit."
                }
            ],
            dossierFile: "data/projects/p4-predictive-classification.md"
        }
    ]
};
