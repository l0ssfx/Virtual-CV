const RAG_KNOWLEDGE_BASE = {
    profile: {
        name: "Renaldo Arapi",
        role: "Forward Deployed Data Scientist & AI Systems Engineer",
        education: "Master in Statistics (Laurea Magistrale in Scienze Statistiche) · Alma Mater Studiorum – Università di Bologna (est. 1088)",
        location: "Italy (Operating remote worldwide)",
        email: "renaldo.arapi@live.it",
        github: "https://github.com/l0ssfx",
        cvUrl: "assets/Renaldo_Arapi_CV.pdf",
        summary: "Renaldo Arapi è un Forward Deployed Data Scientist & AI Systems Engineer con Laurea Magistrale in Scienze Statistiche conseguita presso l'Alma Mater Studiorum – Università di Bologna (fondata nel 1088, la più antica del mondo). Combina rigore matematico-statistico (inferenza bayesiana, calibrazione probabilità, feature manifolds) con ingegneria dei sistemi di produzione ad alte prestazioni.",
        whyHire: "Renaldo colma il divario critico tra modellazione statistica complessa e ingegneria software di produzione (bare-metal HPC a 12 min di provisioning, 99.95% uptime, 100% zero-loss su dati bancari, 60+ FPS edge vision, calibrazione probabilistica con ECE <2.4%).",
        skills: [
            "Statistica Matematica & Inferenza Bayesiana",
            "Machine Learning & Calibrazione Probabilistica (XGBoost, SHAP, Optuna)",
            "Deep Learning & Edge Computer Vision (PyTorch, YOLOv8/v11, TensorRT, OpenCV)",
            "Infrastruttura HPC & MLOps (Kubernetes, Rancher, AWX/Ansible, GitLab CI/CD)",
            "Enterprise Data Architecture & SQL Zero-Loss Migration",
            "Python, Polars, FastAPI, Docker, Linux Bare-Metal"
        ]
    },
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
                    label: "[ › Rancher Node Scaling ]",
                    query: "rancher scaling kubernetes nodi cluster quote",
                    response: "In Rancher abbiamo implementato policy di auto-scaling legate alle metriche di utilizzo compute/memoria dei nodi worker. Rancher gestisce il provisioning automatico di nuovi nodi nel cluster Kubernetes quando le simulazioni HPC superano la soglia di carico critico, isolando i job in namespace dedicati con quote di risorse e RBAC granulari per garantire zero interferenze tra team."
                },
                {
                    label: "[ › Flusso Automazione AWX ]",
                    query: "awx ansible automazione playbook provisioning nodi",
                    response: "AWX orchestra playbook Ansible idempotenti per il bootstrap dei nodi bare-metal e virtuali. L'automazione configura la rete ad alta velocità, installa i driver GPU, monta i file system distribuiti e registra il nodo nel cluster senza intervento manuale, riducendo i tempi di provisioning da ore a soli 12 minuti."
                },
                {
                    label: "[ › Pipeline GitLab CI/CD ]",
                    query: "gitlab cicd pipeline gitops test validazione",
                    response: "La pipeline GitLab applica una metodologia GitOps pura: ogni modifica ai playbook Ansible o ai manifest di Rancher passa attraverso test automatici di sintassi, linting e dry-run. Il merge su branch protetti avvia automaticamente il rollout controllato tramite AWX webhook, garantendo tracciabilità totale e audit log conformi agli standard energetici."
                },
                {
                    label: "[ › Ruolo Morpheus CMP ]",
                    query: "morpheus orchestrazione cloud gestione catalogo",
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
                    label: "[ › Zero-Loss Migration Strategy ]",
                    query: "migrazione dati zero loss strategia transazionale sql reconciliation",
                    response: "Abbiamo adottato un'architettura di migrazione multi-stadio: prima una sincronizzazione bulk storica verso tabelle di staging, seguita da micro-batch delta sincronizzati fino al momento del cutover. Ogni blocco di record è stato validato con fingerprint crittografici (MD5/SHA256) confrontati tra sorgente e destinazione, garantendo il 100% di parità senza alcuna perdita di transazioni bancarie."
                },
                {
                    label: "[ › Ottimizzazione Schemi SQL ]",
                    query: "sql schemi database relazionale indici partizionamento query",
                    response: "Gli schemi di destinazione sono stati progettati in forma normale con partizionamento temporale delle tabelle degli eventi (milioni di chiamate e messaggi). Abbiamo ottimizzato indici composti su ID cliente e timestamp, riducendo i tempi di query per il reporting operativo da minuti a sub-secondo."
                },
                {
                    label: "[ › Metriche Dashboard BI ]",
                    query: "dashboard kpi bi contact center fcr sla report",
                    response: "Il dashboard fornisce visualizzazioni statistiche per il management: First Contact Resolution (FCR), distribuzioni delle code di attesa (calcolate per fasce orarie e percentile), tassi di abbandono e varianza di performance degli agenti rispetto agli SLA contrattuali, consentendo il ribilanciamento proattivo dei turni."
                },
                {
                    label: "[ › Compliance GDPR & PSD2 ]",
                    query: "gdpr psd2 compliance regolamentazione privacy crittografia",
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
                    label: "[ › 60+ FPS su Edge GPU ]",
                    query: "fps throughput latenza tensorrt fp16 edge gpu pytorch",
                    response: "Il modello PyTorch è stato esportato in formato ONNX e successivamente compilato con NVIDIA TensorRT applicando quantizzazione a mezza precisione (FP16). Questo ha dimezzato l'occupazione di memoria e sfruttato appieno i Tensor Core della GPU, abbattendo la latenza per singolo frame a 11.2ms."
                },
                {
                    label: "[ › Buffer Video Asincroni OpenCV ]",
                    query: "video streaming opencv buffer producer consumer frame",
                    response: "Abbiamo implementato un'architettura asincrona producer-consumer con ring buffer in memoria bloccata (pinned CUDA memory). La cattura dei frame video tramite OpenCV è completamente disaccoppiata dall'inferenza della rete neurale, eliminando qualsiasi perdita di frame anche durante picchi di risoluzione."
                },
                {
                    label: "[ › Strategie Data Augmentation ]",
                    query: "augmentation albumentations map dataset mosaic hsv",
                    response: "Utilizzando Albumentations, abbiamo applicato mosaic mixup, variazioni di luminosità e saturazione (HSV jitter), blur da movimento e trasformazioni prospettiche casuali. Questo ha aumentato la robustezza del modello alle variazioni di luce ambientale, portando l'mAP@0.5 finale a 0.884."
                }
            ],
            dossierFile: "data/projects/p3-computer-vision.md"
        },
        {
            id: "p4",
            serial: "SYS-04",
            title: "Telco Churn MLOps: Bayesian HPO, Skew Prevention & AWS Serving",
            clientContext: "Telecommunications & Subscription Economics · Open Source Production System",
            domain: "Predictive MLOps & Cloud Architecture",
            domainTag: "stats",
            status: "AWS ECS Fargate Deployed",
            githubUrl: "https://github.com/l0ssfx/Telco-Costumer-Churn-ML",
            stack: ["Python 3.11", "XGBoost 2.0+", "Optuna (Bayesian TPE)", "Great Expectations", "MLflow", "FastAPI + Gradio", "Docker", "AWS ECS Fargate"],
            kpiPrimary: "93.0%",
            kpiPrimaryLabel: "Minority Churn Recall",
            kpiSecondary: "5.9 ms",
            kpiSecondaryLabel: "Inference Latency",
            summary: "Production MLOps pipeline for telco customer churn with asymmetric cost optimization (CAC >> CRC), Great Expectations data contract validation, train-serving skew prevention across 30 dimensions, Optuna Bayesian HPO (tau = 0.35), dual-serving FastAPI & Gradio, and AWS ECS Fargate deployment.",
            topologySteps: [
                { name: "Great Expectations", desc: "Automated schema & statistical contract gates" },
                { name: "Skew Prevention", desc: "Deterministic binary & 30-dim matrix alignment" },
                { name: "Optuna Bayesian HPO", desc: "TPE optimization under asymmetric loss (tau = 0.35)" },
                { name: "Dual-Serving Engine", desc: "FastAPI REST API + Gradio interactive UI" },
                { name: "AWS ECS Fargate", desc: "Serverless container behind Application Load Balancer" }
            ],
            quickPrompts: [
                {
                    label: "[ › Recall 93% & Asymmetric Cost ]",
                    query: "recall 93 costo asimmetrico cac crc threshold 0.35 fn",
                    response: "Nel churn prediction, acquisire un nuovo cliente (CAC) costa da 5 a 20 volte più che trattenerlo (CRC). Per questo abbiamo calibrato la soglia decisionale a tau = 0.35 e applicato un fattore di scala w_pos = 2.76 in XGBoost. Sul test set di holdout (N = 1.409), il modello rileva il 93.0% dei churner effettivi (348 TP su 374), limitando i falsi negativi a soli 26 casi."
                },
                {
                    label: "[ › Prevenzione Train-Serving Skew ]",
                    query: "train serving skew 30 dimensioni feature encoding json reindex",
                    response: "Per evitare discrepanze tra training batch e inferenza online in tempo reale, la pipeline applica mapping dizionari fissi per le feature binarie, one-hot encoding con drop_first=True per le categoriche e una matrice di allineamento dinamico caricata da feature_columns.txt tramite df.reindex(columns=FEATURE_COLS, fill_value=0). Questo garantisce un vettore a 30 dimensioni identico sia per dataset massivi che per singoli payload JSON."
                },
                {
                    label: "[ › Validazione Great Expectations ]",
                    query: "great expectations contratti dati validazione schema drift",
                    response: "Prima dell'addestramento o dell'ingestione, Great Expectations esegue asserzioni rigorose: unicità del customerID, set chiusi di valori ammessi (Contract, InternetService), vincoli di range (tenure tra 0 e 120, MonthlyCharges tra 0 e 200) e coerenza logica (TotalCharges >= MonthlyCharges al 95%). Se il batch viola il contratto, l'ingestione si arresta immediatamente prevenendo data drift e corruzioni silenziose."
                },
                {
                    label: "[ › Architettura AWS ECS Fargate ]",
                    query: "aws ecs fargate alb dual serving fastapi gradio docker",
                    response: "L'applicazione adotta un Dual-Serving pattern: FastAPI eroga l'endpoint REST programmatico ad alta velocità (/predict con schema Pydantic v2), mentre Gradio fornisce un'interfaccia interattiva (/ui) per gli stakeholder. Il container Debian python:3.11-slim è deployato su AWS ECS Fargate (us-east-1, 0.5 vCPU, 1 GB RAM) dietro Application Load Balancer, con capacità di scalare a zero compiti per azzerare i costi quando inattivo."
                }
            ],
            dossierFile: "data/projects/p4-predictive-classification.md"
        }
    ]
};
