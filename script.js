// Wrap entire script in a DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT DEBUG: DOMContentLoaded fired. Initializing script...");

    // ========================================
    // ===== Global Variables & State =====
    // ========================================
    let xp = 0;
    let level = 1;
    let achievements = [];
    let studied = {};
    let totalQuestions = 0;
    let totalReviewsCompleted = 0;
    let questLog = [];
    let dailyStreak = 0;
    let longestStreak = 0;
    let lastStudyDate = null;
    let lastStudyBurstDate = null;
    let skillPoints = 0;
    let skills = {
        xpBoost: 0,
        reviewMastery: 0,
        acceleratedRecall: 0,
        studyBurst: 0,
        efficientLearner: 0
    };
    let totalSkillLevelsPurchased = 0;
    let masteredSpecialtyCount = 0;
    let currentTheme = 'dark';
    let notificationTimeout = null;

    // --- Audio State Variables ---
    let sfxAudioInitialized = false; // Tracks if Tone.js context is ready for SFX
    let toneJsLoaded = typeof Tone !== 'undefined';
    let sfxSynthsReady = false;    // Tracks if SFX synths are created

    // Daily Tasks state
    let dailyTasks = [];
    let lastTasksGeneratedDate = null;

// Monthly Tasks state
let monthlyTasks = [];
let lastMonthlyTasksGeneratedDate = null; // e.g., "2023-11" (Year-Month)
let monthlyTaskProgress = { // To track progress specific to the current month
    topicsStudiedThisMonthCount: 0,
    reviewsCompletedThisMonthCount: 0,
    questionsAnsweredThisMonthCount: 0,
    levelsGainedThisMonthCount: 0,
    levelAtMonthStart: 0 // Important for 'levelsGainedThisMonthCount'
};

    // ===========================
    // ===== Constants =====
    // ===========================
    const XP_PER_QUESTION = 5;
    const XP_PER_DISEASE = 20;
    const XP_PER_REVIEW_BASE = 10;
    const XP_LEVEL_BASE = 100;
    const XP_LEVEL_QUADRATIC_FACTOR = 10;
    const SKILL_POINTS_PER_LEVEL = 1;
    const BONUS_SP_MILESTONES = { 10: 2, 25: 3, 50: 5, 75: 7, 100: 10 };
    const XP_BOOST_PER_SKILL_POINT = 0.05;
    const REVIEW_MASTERY_XP_PER_POINT = 1;
    const ACCELERATED_RECALL_PERCENT_PER_POINT = 0.02;
    const STUDY_BURST_XP_PER_LEVEL = 10;
    const EFFICIENT_LEARNER_CHANCE_PER_POINT = 0.01;
    const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60, 120, 180];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const SAVE_KEY = 'healersOdysseySave_v11';

    // Daily Login/Streak Rewards
    const XP_PER_DAILY_LOGIN = 25;
    const DAILY_STREAK_BONUS_XP = { 7: 50, 14: 100, 30: 250, 100: 500, 365: 1000 };
    const DAILY_STREAK_BONUS_SP = { 30: 1, 100: 2, 365: 5 };

    // Daily Task Configuration
    const TASK_TYPES = { QUESTIONS: 'questions', REVIEWS: 'reviews', DISEASES: 'diseases', HARD_QUESTIONS: 'hard_questions' };
    const DAILY_TASK_CONFIG = [
         { type: TASK_TYPES.QUESTIONS, desc: 'Solve {target} questions', targets: [10, 15, 20, 25], rewardsXP: [50, 75, 100, 125] },
         { type: TASK_TYPES.REVIEWS, desc: 'Complete {target} reviews', targets: [2, 3, 5], rewardsXP: [60, 90, 150] },
         { type: TASK_TYPES.DISEASES, desc: 'Study {target} new diseases', targets: [1, 2, 3], rewardsXP: [40, 80, 120] },
         { type: TASK_TYPES.HARD_QUESTIONS, desc: 'Solve {target} questions (Challenge)', targets: [30, 40], rewardsXP: [150, 200], rewardSP: 1 }
     ];
    const NUM_DAILY_TASKS = 3;

    // Profile Picture Progression Map (User updated)
    const PROFILE_PICTURES = {
         1: { src: 'https://imgur.com/KaLxLtB.png', title: 'Level 1 Healer' },
         3: { src: 'https://imgur.com/JTzVsSt.png', title: 'Level 3 Apprentice' },
         5: { src: 'https://imgur.com/UObkqeL.png', title: 'Level 5 Adept' },
         7: { src: 'https://imgur.com/V5tMYFB.png', title: 'Level 7 Adept II' },
         10: { src: 'https://imgur.com/1MlNYow.png', title: 'Level 10 Resident' },
         15: { src: 'https://imgur.com/zbbggVS.png', title: 'Level 15 Senior Resident' },
         20: { src: 'https://imgur.com/J7XxWsA.png', title: 'Level 20 Specialist' },
         30: { src: 'https://imgur.com/sdBffnQ.png', title: 'Level 30 Attending' },
         50: { src: 'https://imgur.com/9J0UFd2.png', title: 'Level 50 Chief' },
         75: { src: 'https://imgur.com/n1Bpdoq.png', title: 'Level 75 Legend' },
         100: { src: 'https://imgur.com/RzGkeGM.png', title: 'Level 100 Divine' }
     };

// Monthly Task Configuration
const MONTHLY_TASK_CONFIG = [
    {
        id: 'study_topics_monthly',
        desc: 'Study {target} diseases/topics during this month',
        targets: [50, 100, 200], // Number of topics to study in the current month
        rewardsXP: [750, 1500, 3000],
        rewardsSP: [2, 3, 5],
        metric: 'topicsStudiedThisMonthCount'
    },
    {
        id: 'complete_reviews_monthly',
        desc: 'Complete {target} reviews during this month',
        targets: [40, 80, 120],
        rewardsXP: [600, 1200, 2400],
        rewardsSP: [1, 2, 4],
        metric: 'reviewsCompletedThisMonthCount'
    },
    {
        id: 'answer_questions_monthly',
        desc: 'Solve {target} questions during this month',
        targets: [750, 1500, 3000],
        rewardsXP: [500, 1000, 2000],
        rewardsSP: [1, 2, 3],
        metric: 'questionsAnsweredThisMonthCount'
    },
    {
        id: 'level_ups_monthly',
        desc: 'Gain {target} levels during this month',
        targets: [2, 5, 10], // Gain X levels
        rewardsXP: [1000, 2500, 5000],
        rewardsSP: [3, 5, 7],
        metric: 'levelsGainedThisMonthCount'
    }
];
const NUM_MONTHLY_TASKS_TO_OFFER = 2; // How many monthly tasks to show at a time

    // ==================================
    // ===== DOM Element References =====
    // ==================================
    const bodyEl = document.body;
    const xpValueEl = document.getElementById('xp');
    const xpNeededValueEl = document.getElementById('xpNeeded');
    const levelValueEl = document.getElementById('level');
    const achievementsCountEl = document.getElementById('achievements');
    const questionsTotalValueEl = document.getElementById('questions-total');
    const reviewsTotalValueEl = document.getElementById('reviews-total');
    const dailyStreakValueEl = document.getElementById('daily-streak');
    const longestStreakValueEl = document.getElementById('longest-streak');
    const skillPointsValueEl = document.getElementById('skill-points');
    const skillLevelsTotalValueEl = document.getElementById('skill-levels-total');
    const availableSkillPointsEl = document.getElementById('available-skill-points');
    const xpBarEl = document.getElementById('xpBar');
    const introTextEl = document.getElementById('introText');
    const questionsInputEl = document.getElementById('questions');
    const addQuestionsBtnEl = document.getElementById('add-questions-btn');
    const dailyStudyBtnEl = document.getElementById('dailyStudyBtn');
    const useStudyBurstBtnEl = document.getElementById('use-study-burst-btn');
    const specialtiesContainerEl = document.getElementById('specialties');
    const questLogHeaderEl = document.querySelector('.quest-log h2');
    const questListEl = document.getElementById('questList');
    const questToggleIndicatorEl = document.getElementById('questToggleIndicator');
    const achievementListEl = document.getElementById('achievementList');
    const reviewListEl = document.getElementById('reviewList');
    const resetBtnEl = document.getElementById('resetBtn');
    const resetModalEl = document.getElementById('resetModal');
    const closeResetModalBtnEl = document.getElementById('closeResetModal');
    const confirmResetBtnEl = document.getElementById('confirmReset');
    const cancelResetBtnEl = document.getElementById('cancelReset');
    const notificationModalEl = document.getElementById('notificationModal');
    const notificationMessageEl = document.getElementById('notificationMessage');
    const closeNotificationModalBtnEl = document.getElementById('closeNotificationModal');
    const okNotificationModalBtnEl = document.getElementById('okNotificationModalBtn');
    const musicToggleBtnEl = document.getElementById('musicToggle');
    const themeToggleBtnEl = document.getElementById('themeToggle');
    const profilePictureEl = document.getElementById('pfp');
    const profilePictureTitleEl = document.getElementById('pfp-title');
    const showStatsBtnEl = document.getElementById('showStatsBtn');
    const statsModalEl = document.getElementById('statsModal');
    const closeStatsModalBtnEl = document.getElementById('closeStatsModal');
    const statsContentEl = document.getElementById('stats-content');
    const importExportBtnEl = document.getElementById('importExportBtn');
    const importExportModalEl = document.getElementById('importExportModal');
    const closeImportExportModalBtnEl = document.getElementById('closeImportExportModal');
    const importExportDataEl = document.getElementById('importExportData');
    const copyExportDataBtnEl = document.getElementById('copyExportDataBtn');
    const importDataBtnEl = document.getElementById('importDataBtn');
    const xpBoostLevelEl = document.getElementById('xp-boost-level');
    const buyXpBoostBtnEl = document.getElementById('buy-xp-boost-btn');
    const reviewMasteryLevelEl = document.getElementById('review-mastery-level');
    const buyReviewMasteryBtnEl = document.getElementById('buy-review-mastery-btn');
    const acceleratedRecallLevelEl = document.getElementById('accelerated-recall-level');
    const buyAcceleratedRecallBtnEl = document.getElementById('buy-accelerated-recall-btn');
    const studyBurstLevelEl = document.getElementById('study-burst-level');
    const buyStudyBurstBtnEl = document.getElementById('buy-study-burst-btn');
    const efficientLearnerLevelEl = document.getElementById('efficient-learner-level');
    const buyEfficientLearnerBtnEl = document.getElementById('buy-efficient-learner-btn');
    const dailyTasksDateEl = document.getElementById('dailyTasksDate');
    const dailyTaskListEl = document.getElementById('dailyTaskList');
    const monthlyTasksDateEl = document.getElementById('monthlyTasksDate');
    const monthlyTaskListEl = document.getElementById('monthlyTaskList');
  const specialtySearchInputEl = document.getElementById('specialtySearchInput');
    // --- BGM Audio Element Reference ---
    const bgmAudioElement = document.getElementById('bgmAudio'); // Reference to the <audio> tag in HTML


    // =====================================================
    // ===== Data: Specialties / Achievements =====
    // =====================================================
    /*
 * Massively Expanded Medical Specialties Data
 * Designed for extensive progressive unlocking based on player level.
 * Includes foundational sciences, consolidated pediatrics,
 * specific microbiology agents, and merged Internal Medicine/Family Medicine.
 * Required levels adjusted for a smoother curve towards Level 50+.
 * Contains a significantly larger list of diseases/topics per specialty.
 */
const specialties = {
    // --- Level 1: Foundational Sciences & Core Clinical ---
    "Anatomy": {
        diseases: [ // Renamed conceptually to 'topics' or 'systems' in this context
            "Introduction to Gross Anatomy",
            "Anatomical Terminology & Planes",
            "Cell Structure & Function (Anatomy Perspective)",
            "Tissue Types (Epithelial, Connective, Muscle, Nervous)",
            "Integumentary System Anatomy",
            "Skeletal System Anatomy (Basic Bone Structure)",
            "Muscular System Anatomy (Basic Muscle Groups)",
            "Cardiovascular System Anatomy (Heart, Major Vessels)",
            "Respiratory System Anatomy (Lungs, Airways)",
            "Gastrointestinal System Anatomy (Basic Tract)",
            "Renal & Urinary System Anatomy (Kidneys, Bladder)",
            "Nervous System Anatomy (Basic Brain Regions, Spinal Cord)",
            "Endocrine Glands Anatomy (Major Glands)",
            "Lymphatic System Anatomy (Basic)",
            "Reproductive System Anatomy (Basic Male/Female)"
        ],
        "requiredLevel": 1,
        "icon": "🦴"
    },
    "Physiology": {
        diseases: [ // Renamed conceptually to 'topics' or 'systems' in this context
            "Cellular Physiology (Membrane Transport, Action Potentials)",
            "Homeostasis & Feedback Loops",
            "Cardiovascular Physiology (Cardiac Cycle, Blood Pressure Regulation)",
            "Respiratory Physiology (Gas Exchange, Lung Volumes)",
            "Gastrointestinal Physiology (Digestion, Absorption)",
            "Renal & Urinary System Physiology (Filtration, Reabsorption, Secretion)",
            "Neurophysiology (Synaptic Transmission, Neurotransmitters)",
            "Muscle Physiology (Contraction)",
            "Endocrinology Basics (Hormone Action, Major Axes)",
            "Immunology Basics (Innate & Adaptive Immunity Overview)",
            "Blood Physiology (Components, Clotting Basics)",
            "Fluid & Electrolyte Balance (Basic)"
        ],
        "requiredLevel": 1,
        "icon": "🏃‍♀️"
    },
    "Internal Medicine": { // Includes merged Family Medicine topics + expanded IM
        diseases: [
            "Hypertension (Diagnosis & Initial Management)",
            "Type 2 Diabetes Mellitus (Diagnosis & Initial Management)",
            "Hyperlipidemia (Diagnosis & Initial Management)",
            "Coronary Artery Disease (Basic Pathophysiology)",
            "Stable Angina (Initial Management)",
            "Heart Failure (Basic CHF Diagnosis)",
            "Chronic Obstructive Pulmonary Disease (COPD) (Basic Diagnosis & Exacerbations)",
            "Asthma (Basic Diagnosis & Management)",
            "Community-Acquired Pneumonia (Basic Treatment)",
            "Urinary Tract Infection (UTI) (Diagnosis & Treatment)",
            "Iron Deficiency Anemia (Diagnosis)",
            "Depression (Primary Care Diagnosis & Treatment)", // From FM
            "Generalized Anxiety Disorder (Primary Care Diagnosis & Treatment)", // From FM
            "Osteoarthritis (Primary Care Management)", // From FM
            "Osteoporosis (Primary Care Screening & Prevention)", // From FM
            "Obesity Management (Lifestyle & Initial Pharmacotherapy)", // From FM
            "Smoking Cessation Counseling (Methods)", // From FM
            "Seasonal Allergic Rhinitis (Primary Care Management)", // From FM
            "Gastroesophageal Reflux Disease (GERD) (Primary Care Management)", // From FM
            "Acute Bronchitis", // From FM
            "Acute Sinusitis", // From FM
            "Acute Otitis Media (Adult)", // From FM
            "Atopic Dermatitis (Eczema) (Primary Care Management)", // From FM
            "Migraine (Primary Care Management)", // From FM
            "Benign Prostatic Hyperplasia (BPH) (Primary Care Management)", // From FM
            "Chronic Kidney Disease (Basic Staging & Risk Factors)", // From FM
            "Hypothyroidism (Primary Care Diagnosis & Treatment)", // From FM
            "Hyperthyroidism (Primary Care Diagnosis & Treatment)", // From FM
            "Acute Pharyngitis (Diagnosis & Treatment)",
            "Acute Gastroenteritis (Viral & Bacterial Basics)",
            "Common Cold",
            "Influenza (Basic Diagnosis & Treatment)",
            "Cellulitis (Basic Treatment)",
            "Erysipelas",
            "Abscess (Basic Management)",
            "Viral Exanthem (Common Adult)",
            "Mononucleosis (EBV)",
            "Adult Vaccination Schedules (Basic)",
            "Basic Pain Management (NSAIDs, Acetaminophen)",
            "Common Skin Rashes (Overview)",
            "Conjunctivitis (Adult)",
            "Low Back Pain (Initial Evaluation)",
            "Neck Pain (Initial Evaluation)",
            "Common Sprains & Strains",
            "Insomnia (Basic Management)",
            "Fatigue (Initial Evaluation)",
            "Dizziness/Vertigo (Initial Evaluation)",
            "Headache (Tension, Cluster Basics)",
            "Basic Nutrition Assessment",
            "Screening Guidelines (Basic Cancer Screening)"
        ],
        "requiredLevel": 1,
        "icon": "🩺"
    },
    "Pediatrics": { // Consolidated all pediatric topics + expanded
        diseases: [
            "Well-Child Visits (Schedule & Components)",
            "Pediatric Vaccination Schedules",
            "Neonatal Jaundice (Evaluation & Management)",
            "Neonatal Sepsis (Diagnosis & Initial Management)",
            "Respiratory Syncytial Virus (RSV) Infection",
            "Bronchiolitis",
            "Croup (Laryngotracheobronchitis)",
            "Asthma (Pediatric Diagnosis & Management)",
            "Cystic Fibrosis (Diagnosis & Initial Management)",
            "Pneumonia (Pediatric Diagnosis & Treatment)",
            "Otitis Media (Pediatric Diagnosis & Management)",
            "Otitis Externa (Pediatric)",
            "Pharyngitis (Pediatric, Strep Throat)",
            "Tonsillitis (Pediatric)",
            "Conjunctivitis (Pediatric)",
            "Hand, Foot, and Mouth Disease",
            "Fifth Disease (Erythema Infectiosum)",
            "Roseola Infantum",
            "Measles",
            "Rubella (German Measles)",
            "Chickenpox (Varicella)",
            "Mumps",
            "Pertussis (Whooping Cough)",
            "Scarlet Fever",
            "Kawasaki Disease",
            "Febrile Seizures (Management)",
            "Epilepsy (Pediatric Overview)",
            "Meningitis (Pediatric Diagnosis & Management)",
            "Urinary Tract Infection (UTI) (Pediatric)",
            "Enuresis (Bedwetting)",
            "Encopresis",
            "Gastroenteritis (Pediatric)",
            "Constipation (Pediatric)",
            "Gastroesophageal Reflux Disease (GERD) (Pediatric)",
            "Pyloric Stenosis",
            "Intussusception",
            "Appendicitis (Pediatric)",
            "Iron Deficiency Anemia (Pediatric)",
            "Sickle Cell Disease (Pediatric Overview)",
            "Thalassemia (Pediatric Overview)",
            "Acute Lymphoblastic Leukemia (ALL) (Pediatric Overview)",
            "Neuroblastoma (Overview)",
            "Wilms Tumor (Overview)",
            "Failure to Thrive (Evaluation)",
            "Obesity (Pediatric Management)",
            "Type 1 Diabetes Mellitus (Pediatric Diagnosis & Initial Management)",
            "Hypothyroidism (Congenital & Acquired Pediatric)",
            "Growth Hormone Deficiency (Pediatric)",
            "Precocious Puberty",
            "Delayed Puberty",
            "Rickets (Vitamin D Deficiency)",
            "Scoliosis (Pediatric Evaluation)",
            "Developmental Dysplasia of the Hip (DDH)",
            "Legg-Calvé-Perthes Disease",
            "Slipped Capital Femoral Epiphysis (SCFE)",
            "Osteomyelitis (Pediatric)",
            "Septic Arthritis (Pediatric)",
            "Juvenile Idiopathic Arthritis (Overview)",
            "Atopic Dermatitis (Eczema) (Pediatric Management)", // Overlap with IM/Derm
            "Impetigo (Pediatric)", // Overlap with IM/Derm
            "Scabies (Pediatric)", // Overlap with IM/Derm
            "Head Lice",
            "Pinworm Infection",
            "Attention Deficit Hyperactivity Disorder (ADHD) (Pediatric Diagnosis & Management)", // Overlap with Psych
            "Autism Spectrum Disorder (Diagnosis & Early Intervention)", // Overlap with Psych
            "Oppositional Defiant Disorder (ODD)",
            "Conduct Disorder",
            "Pediatric Depression",
            "Pediatric Anxiety Disorders",
            "Eating Disorders (Pediatric)",
            "Child Abuse & Neglect (Recognition)",
            "Sudden Infant Death Syndrome (SIDS) (Risk Factors)",
            "Congenital Heart Disease (Specific Common Types - ASD, VSD, PDA, TOF)",
            "Neonatal Respiratory Distress Syndrome (NRDS)",
            "Transient Tachypnea of the Newborn (TTN)",
            "Meconium Aspiration Syndrome",
            "Retinopathy of Prematurity (ROP)",
            "Cerebral Palsy (Overview)", // Overlap with PM&R
            "Spina Bifida (Overview)", // Overlap with PM&R
            "Hydrocephalus (Pediatric)", // Overlap with Neuro
            "Down Syndrome (Associated Conditions)",
            "Turner Syndrome (Pediatric)", // Overlap with Genetics
            "Fragile X Syndrome (Pediatric)", // Overlap with Genetics
            "Phenylketonuria (PKU) (Pediatric)", // Overlap with Genetics
            "Maple Syrup Urine Disease (MSUD) (Pediatric)", // Overlap with Genetics
            "Galactosemia (Pediatric)", // Overlap with Genetics
            "Tuberous Sclerosis (Pediatric Aspects)", // Overlap with Neuro/Genetics
            "Neurofibromatosis (Pediatric Aspects)", // Overlap with Neuro/Genetics
            "Von Hippel-Lindau Disease (Pediatric Aspects)", // Overlap with Neuro/Genetics
            "Sturge-Weber Syndrome", // Overlap with Neuro/Derm
            "Capillary Malformations (Port-Wine Stains)",
            "Hemangiomas (Pediatric)",
            "Lymphatic Malformations",
            "Vascular Malformations",
            "Pediatric Dermatology (Diaper Rash, Cradle Cap)",
            "Pediatric Ophthalmology (Strabismus, Amblyopia Screening)", // Overlap with Ophtho
            "Pediatric Urology (Undescended Testis, Hypospadias)", // Overlap with Urology
            "Pediatric Otolaryngology (Tonsillectomy/Adenoidectomy Indications)", // Overlap with ENT
            "Pediatric Surgery (Common Procedures)", // Overlap with Gen Surg
            "Pediatric Anesthesia Considerations", // Overlap with Anesthesia
            "Pediatric Rehabilitation (Overview)", // Overlap with PM&R
            "Pediatric Infectious Diseases (Specific Childhood Infections)", // Overlap with ID
            "Pediatric Hematology (Anemias, Bleeding Disorders)", // Overlap with Heme/Onc
            "Pediatric Oncology (Common Childhood Cancers)", // Overlap with Heme/Onc
            "Pediatric Nephrology (Nephrotic Syndrome, HUS)", // Overlap with Nephro
            "Pediatric Endocrinology (Diabetes, Growth Disorders)", // Overlap with Endo
            "Pediatric Gastroenterology (Celiac, IBD, GERD)", // Overlap with GI
            "Pediatric Neurology (Seizures, Developmental Delay)", // Overlap with Neuro
            "Childhood Immunodeficiency Disorders", // Overlap with Allergy/Immuno
            "Pediatric Rheumatology (JIA, SLE)", // Overlap with Rheum
            "Pediatric Orthopedics (Fractures, Deformities)", // Overlap with Ortho
            "Pediatric Psychiatry (ADHD, Autism, Mood Disorders)", // Overlap with Psych
            "Genetic Syndromes (Specific Pediatric Examples)", // Overlap with Genetics
            "Inborn Errors of Metabolism (Pediatric Overview)" // Overlap with Genetics/Biochem
        ],
        "requiredLevel": 1,
        "icon": "👶"
    },

    // --- Level 2-5: Core Clinical & Basic Procedural/Diagnostic ---
    "Biochemistry": {
        diseases: [
            "Carbohydrate Metabolism (Glycolysis, Gluconeogenesis, Glycogenolysis, Glycogenesis)",
            "Krebs Cycle (Citric Acid Cycle)",
            "Oxidative Phosphorylation & Electron Transport Chain",
            "Lipid Metabolism (Fatty Acid Synthesis & Oxidation, Ketogenesis)",
            "Cholesterol Synthesis & Metabolism",
            "Protein Metabolism (Amino Acid Metabolism, Urea Cycle)",
            "Nucleotide Metabolism (Purine & Pyrimidine Synthesis)",
            "Enzyme Function & Regulation",
            "Vitamins & Minerals (Biochemical Roles & Deficiencies)",
            "Acid-Base Balance (Biochemical Buffers)",
            "Hemoglobin Structure & Function",
            "Porphyrin Metabolism (Heme Synthesis)",
            "Connective Tissue Biochemistry (Collagen, Elastin)",
            "Muscle Biochemistry (Muscle Contraction Cycle)",
            "Neurotransmitter Synthesis & Metabolism",
            "Hormone Synthesis & Signaling Pathways",
            "DNA Structure & Replication",
            "RNA Transcription & Translation",
            "Genetic Code & Protein Synthesis",
            "Recombinant DNA Technology (Basic)",
            "Enzyme Kinetics (Michaelis-Menten)",
            "Metabolic Pathways Integration",
            "Inborn Errors of Metabolism (Biochemical Basis)", // Overlap with Genetics/Peds
            "Oxidative Stress & Antioxidants"
        ],
        "requiredLevel": 2,
        "icon": "🧪"
    },
     "Microbiology": { // Specific agents + expanded
        diseases: [
            "Bacterial Structure & Classification (Gram Stain, Morphology)",
            "Bacterial Growth & Metabolism",
            "Bacterial Genetics (Plasmids, Transposons)",
            "Bacterial Pathogenesis (Toxins, Adhesins)",
            "Antibiotic Mechanisms of Action & Resistance",
            "Sterilization, Disinfection, & Antisepsis",
            "Staphylococcus aureus (including MRSA) (Clinical Syndromes)",
            "Staphylococcus epidermidis",
            "Streptococcus pyogenes (Group A Strep) (Clinical Syndromes)",
            "Streptococcus pneumoniae (Clinical Syndromes)",
            "Streptococcus agalactiae (Group B Strep)",
            "Enterococcus species",
            "Bacillus anthracis (Anthrax)",
            "Bacillus cereus",
            "Clostridium perfringens (Gas Gangrene)",
            "Clostridium tetani (Tetanus)",
            "Clostridium botulinum (Botulism)",
            "Clostridioides difficile (C. diff) (Diagnosis & Treatment)", // Expanded
            "Corynebacterium diphtheriae (Diphtheria)",
            "Listeria monocytogenes",
            "Mycobacterium tuberculosis (Diagnosis & Treatment)", // Expanded
            "Mycobacterium leprae (Leprosy)",
            "Nocardia species",
            "Actinomyces species",
            "Neisseria meningitidis (Meningococcal Disease)",
            "Neisseria gonorrhoeae (Gonorrhea)",
            "Escherichia coli (E. coli) (Pathogenic Strains)", // Expanded
            "Shigella species (Shigellosis)",
            "Salmonella species (Typhoid, Gastroenteritis)",
            "Vibrio cholerae (Cholera)",
            "Campylobacter jejuni",
            "Helicobacter pylori",
            "Pseudomonas aeruginosa (Clinical Syndromes)", // Expanded
            "Klebsiella pneumoniae (Clinical Syndromes)", // Expanded
            "Enterobacter species",
            "Serratia marcescens",
            "Proteus species",
            "Bacteroides fragilis",
            "Legionella pneumophila (Legionnaires' Disease)",
            "Bordetella pertussis (Pertussis)", // Expanded
            "Haemophilus influenzae (Type B & Non-typeable)",
            "Francisella tularensis (Tularemia)",
            "Yersinia pestis (Plague)",
            "Pasteurella multocida",
            "Bartonella species (Cat-Scratch Disease)",
            "Brucella species (Brucellosis)",
            "Rickettsia species (Rocky Mountain Spotted Fever)",
            "Orientia tsutsugamushi (Scrub Typhus)",
            "Coxiella burnetii (Q Fever)",
            "Chlamydia trachomatis (Clinical Syndromes)", // Expanded
            "Chlamydia pneumoniae",
            "Chlamydia psittaci (Psittacosis)",
            "Mycoplasma pneumoniae",
            "Ureaplasma urealyticum",
            "Treponema pallidum (Syphilis) (Stages & Treatment)", // Expanded
            "Borrelia burgdorferi (Lyme Disease)", // Expanded
            "Leptospira interrogans (Leptospirosis)",
            "Virion Structure & Classification",
            "Viral Replication Cycles",
            "Antiviral Medications (Mechanisms)",
            "Herpes Simplex Virus (HSV-1, HSV-2) (Clinical Syndromes)", // Expanded
            "Varicella Zoster Virus (VZV) (Chickenpox, Shingles)", // Expanded
            "Cytomegalovirus (CMV)",
            "Epstein-Barr Virus (EBV) (Mononucleosis)", // Expanded
            "Human Herpesvirus 6 & 7 (Roseola)", // Expanded
            "Human Herpesvirus 8 (Kaposi's Sarcoma-Associated Herpesvirus)",
            "Influenza Virus (Types, Antivirals, Vaccines)", // Expanded
            "Parainfluenza Virus",
            "Respiratory Syncytial Virus (RSV)", // Expanded
            "Adenovirus",
            "Rhinovirus (Common Cold)", // Expanded
            "Coronavirus (Common Coronaviruses)",
            "SARS-CoV-2 (COVID-19) (Virology & Variants)", // Expanded
            "Measles Virus (Rubeola)", // Expanded
            "Mumps Virus", // Expanded
            "Rubella Virus (German Measles)", // Expanded
            "Polio Virus",
            "Coxsackievirus (Hand, Foot, Mouth Disease)", // Expanded
            "Echovirus",
            "Hepatitis A Virus (HAV)",
            "Hepatitis B Virus (HBV) (Virology & Treatment)", // Expanded
            "Hepatitis C Virus (HCV) (Virology & Treatment)", // Expanded
            "Hepatitis D Virus (HDV)",
            "Hepatitis E Virus (HEV)",
            "Norovirus",
            "Rotavirus", // Expanded
            "Human Immunodeficiency Virus (HIV) (Virology & Treatment)", // Expanded
            "Human Papillomavirus (HPV) (Types & Associated Diseases)", // Expanded
            "Rabies Virus", // Expanded
            "Influenza Virus (Pandemic Strains)",
            "Arboviruses (Dengue, Zika, West Nile, Chikungunya, Yellow Fever)", // Expanded
            "Ebola Virus Disease (Virology & Management)", // Expanded
            "Zika Virus Infection (Clinical Syndromes)", // Expanded
            "West Nile Virus (Clinical Syndromes)", // Expanded
            "Chikungunya Virus Infection", // Expanded
            "Fungal Structure & Classification",
            "Antifungal Medications (Mechanisms)",
            "Candida species (Candidiasis) (Clinical Syndromes)", // Expanded
            "Aspergillus species (Aspergillosis) (Clinical Syndromes)", // Expanded
            "Cryptococcus neoformans (Cryptococcosis)",
            "Histoplasma capsulatum (Histoplasmosis)",
            "Blastomyces dermatitidis (Blastomycosis)",
            "Coccidioides immitis (Coccidioidomycosis)",
            "Pneumocystis jirovecii (PCP)",
            "Malassezia species (Tinea Versicolor)",
            "Dermatophytes (Tinea Infections)", // Expanded
            "Parasite Classification (Protozoa, Helminths)",
            "Antiparasitic Medications (Mechanisms)",
            "Plasmodium species (Malaria) (Life Cycle & Treatment)", // Expanded
            "Toxoplasma gondii (Toxoplasmosis) (Life Cycle & Treatment)", // Expanded
            "Giardia lamblia (Giardiasis) (Life Cycle & Treatment)", // Expanded
            "Cryptosporidium species (Cryptosporidiosis)", // Expanded
            "Entamoeba histolytica (Amebiasis) (Life Cycle & Treatment)", // Expanded
            "Trichomonas vaginalis (Trichomoniasis)",
            "Trypanosoma species (Sleeping Sickness, Chagas Disease) (Life Cycle & Treatment)", // Expanded
            "Leishmania species (Leishmaniasis)",
            "Schistosoma species (Schistosomiasis) (Life Cycle & Treatment)", // Expanded
            "Taenia species (Tapeworms)",
            "Diphyllobothrium latum (Fish Tapeworm)",
            "Echinococcus species (Hydatid Disease)",
            "Enterobius vermicularis (Pinworm)", // Expanded
            "Ascaris lumbricoides",
            "Hookworms (Necator, Ancylostoma)",
            "Strongyloides stercoralis",
            "Trichinella spiralis (Trichinellosis)",
            "Filarial Worms (Lymphatic Filariasis, Onchocerciasis)",
            "Prions (Creutzfeldt-Jakob Disease, Kuru)", // Expanded
            "Arthropods as Vectors (Mosquitoes, Ticks, Lice)"
        ],
        "requiredLevel": 2,
        "icon": "🦠"
    },
    "Emergency Medicine": {
        diseases: [
            "Approach to the Undifferentiated Patient (ER)",
            "Chest Pain Triage & Initial Management (ER)", // Expanded
            "Acute Coronary Syndrome (ACS) Management (ER)",
            "Stroke Management (Ischemic & Hemorrhagic ER)", // Expanded
            "Transient Ischemic Attack (TIA) (ER Evaluation)", // Expanded
            "Sepsis Management (Early Recognition & Resuscitation)", // Expanded
            "Trauma Resuscitation (ATLS Principles)", // Expanded
            "Cardiac Arrest (ACLS Protocols)", // Expanded
            "Acute Abdomen (ER Evaluation & Differential)", // Expanded
            "Shortness of Breath (ER Evaluation & Differential)", // Expanded
            "Altered Mental Status (ER Evaluation & Differential)", // Expanded
            "Overdose/Toxicology (Common Agents & Antidotes)", // Expanded
            "Diabetic Ketoacidosis (DKA) / Hyperosmolar Hyperglycemic State (HHS) (ER Management)", // Expanded
            "Seizure Management (Status Epilepticus ER)", // Expanded
            "Wound Care & Laceration Repair (Techniques)", // Expanded
            "Fracture & Dislocation Management (Reduction & Immobilization ER)", // Expanded
            "Anaphylaxis (ER Management)", // Expanded
            "Asthma/COPD Exacerbation (ER Management)", // Expanded
            "Syncope (ER Evaluation)", // Expanded
            "Head Injury Evaluation (Concussion to Severe TBI)", // Expanded
            "Burns (Initial Assessment & Management)", // Expanded
            "Environmental Emergencies (Heatstroke, Hypothermia, Frostbite)", // Expanded
            "Airway Management (Intubation, Cricothyroidotomy)",
            "Mechanical Ventilation (Initiation in ER)",
            "Management of Shock (ER Approach)",
            "Resuscitation Fluids & Blood Products",
            "Acute Pulmonary Edema (ER Management)",
            "Pneumothorax (Tension Pneumothorax Management)", // Overlap with Pulm
            "Hemothorax",
            "Cardiac Tamponade (ER Management)", // Overlap with Cardio
            "Aortic Dissection (ER Diagnosis)", // Overlap with Cardio
            "Pulmonary Embolism (ER Diagnosis & Management)", // Overlap with Pulm
            "Deep Vein Thrombosis (DVT) (ER Diagnosis)", // Overlap with IM
            "Acute Kidney Injury (ER Evaluation)", // Overlap with Nephro
            "Electrolyte Emergencies (Severe Hypo/Hyperkalemia, Natremia)", // Overlap with Nephro
            "Acute Urinary Retention (ER Management)", // Overlap with Urology
            "Testicular Torsion (ER Diagnosis)", // Overlap with Urology
            "Acute Vision Loss (ER Evaluation)", // Overlap with Ophtho
            "Acute Hearing Loss (ER Evaluation)", // Overlap with ENT
            "Epistaxis (ER Management)", // Overlap with ENT
            "Foreign Body Aspiration/Ingestion (ER)",
            "Pediatric Emergencies (Fever, Dehydration, Respiratory Distress)", // Overlap with Peds
            "Obstetric Emergencies (Ectopic, PPH ER)", // Overlap with OB/GYN
            "Psychiatric Emergencies (Agitation, Suicidal Ideation)", // Overlap with Psych
            "Acute Pain Management (ER)",
            "Ultrasound (FAST Exam, Basic ER Ultrasound)",
            "Emergency Radiology Interpretation (Basic X-rays, CT Head)", // Overlap with Radiology
            "Mass Casualty Incident Response (Basic Principles)"
        ],
        "requiredLevel": 3,
        "icon": "🚑"
    },
     "General Surgery": {
        diseases: [
            "Preoperative Evaluation & Risk Assessment",
            "Surgical Asepsis & Sterile Technique",
            "Surgical Knots & Suturing Techniques",
            "Wound Healing (Physiology & Complications)",
            "Surgical Site Infection (Prevention & Management)", // Expanded
            "Postoperative Pain Management (Surgical)",
            "Postoperative Complications (Bleeding, DVT, PE, Ileus)",
            "Appendicitis (Surgical Management)", // Expanded
            "Cholecystitis (Surgical Management)", // Expanded
            "Cholelithiasis (Surgical Indications)", // Expanded
            "Inguinal Hernia Repair (Open & Laparoscopic)", // Expanded
            "Ventral & Incisional Hernia Repair",
            "Umbilical Hernia Repair",
            "Gallstones (Surgical Indications)", // Expanded
            "Diverticulitis (Surgical Indications & Management)", // Expanded
            "Hemorrhoids (Surgical Options)", // Expanded
            "Anal Fissure",
            "Anal Fistula",
            "Perforated Peptic Ulcer (Surgical Repair)", // Expanded
            "Small Bowel Obstruction (Surgical Management)", // Expanded
            "Large Bowel Obstruction (Surgical Management)",
            "Volvulus (Surgical Management)",
            "Intussusception (Surgical Management - Pediatric/Adult)", // Overlap with Peds
            "Thyroidectomy (Indications & Risks)", // Expanded
            "Parathyroidectomy (Indications)",
            "Breast Cancer Surgery (Lumpectomy, Mastectomy, Lymph Node Dissection)", // Expanded
            "Benign Breast Disease (Surgical Management)",
            "Colorectal Cancer (Surgical Resection)", // Expanded
            "Diverticulosis (Surgical Indications)",
            "Inflammatory Bowel Disease (Surgical Management - Crohn's, UC)", // Overlap with GI
            "Pancreatitis (Surgical Indications - Necrosis, Abscess)", // Overlap with GI
            "Splenectomy (Indications - Trauma, Hematologic)", // Expanded
            "Liver Resection (Indications)",
            "Abscess Drainage (Surgical Techniques)", // Expanded
            "Pilonidal Disease",
            "Cysts & Lipomas (Excision)",
            "Melanoma (Surgical Excision & Staging)", // Overlap with Derm/HemeOnc
            "Soft Tissue Sarcomas (Surgical Management)", // Overlap with HemeOnc
            "Vascular Surgery (Basic Principles, AAA Repair Overview)", // Overlap with Cardio
            "Trauma Surgery (Initial Assessment & Procedures)", // Overlap with ER
            "Bariatric Surgery (Types & Indications)", // Expanded
            "Esophagectomy (Indications)", // Expanded
            "Whipple Procedure (Pancreaticoduodenectomy)", // Expanded
            "Adrenalectomy (Indications)", // Overlap with Endo
            "Parotidectomy",
            "Submandibular Gland Excision",
            "Neck Dissection (Surgical Oncology)", // Overlap with HemeOnc/ENT
            "Skin Grafting & Flaps (Basic Principles)", // Overlap with Plastic Surgery
            "Management of Surgical Bleeding",
            "Fluid & Electrolyte Management in Surgical Patients",
            "Nutritional Support in Surgical Patients"
        ],
        "requiredLevel": 3,
        "icon": "⚔️"
    },
    "Obstetrics & Gynecology": {
        diseases: [
            "Normal Pregnancy (Physiology & Milestones)",
            "Prenatal Care (Schedule & Components)",
            "Labor & Delivery (Stages & Management)",
            "Cesarean Section (Indications & Procedure)",
            "Postpartum Care",
            "Breastfeeding (Benefits & Challenges)",
            "Preeclampsia (Diagnosis & Management)", // Expanded
            "Eclampsia",
            "HELLP Syndrome",
            "Gestational Diabetes (Screening & Management)", // Expanded
            "Postpartum Hemorrhage (Causes & Management)", // Expanded
            "Placenta Previa",
            "Placental Abruption",
            "Placenta Accreta Spectrum",
            "Ectopic Pregnancy (Diagnosis & Management)", // Expanded
            "Molar Pregnancy (Gestational Trophoblastic Disease)", // Expanded
            "Hyperemesis Gravidarum (Management)", // Expanded
            "Multiple Gestations (Management)", // Expanded
            "Preterm Labor (Diagnosis & Management)", // Expanded
            "Premature Rupture of Membranes (PROM)",
            "Chorioamnionitis",
            "Intrauterine Growth Restriction (IUGR)",
            "Post-Term Pregnancy",
            "Fetal Monitoring (NST, BPP, FHR Interpretation)",
            "Assisted Vaginal Delivery (Forceps, Vacuum)",
            "Shoulder Dystocia (Management)",
            "Umbilical Cord Prolapse",
            "Amniotic Fluid Embolism",
            "Postpartum Depression",
            "Breastfeeding Mastitis", // Expanded
            "Contraception (Methods & Counseling)",
            "Menstrual Cycle (Physiology & Abnormalities)",
            "Amenorrhea (Causes & Evaluation)", // Expanded
            "Dysmenorrhea (Causes & Management)", // Expanded
            "Menorrhagia (Causes & Management)", // Expanded
            "Abnormal Uterine Bleeding (Evaluation)",
            "Polycystic Ovary Syndrome (PCOS) (Diagnosis & Management)", // Expanded
            "Endometriosis (Diagnosis & Management)", // Expanded
            "Uterine Fibroids (Management)", // Expanded
            "Ovarian Cysts (Evaluation & Management)", // Expanded
            "Pelvic Inflammatory Disease (PID) (Diagnosis & Treatment)", // Expanded
            "Vaginitis (Bacterial Vaginosis, Candidiasis, Trichomoniasis)", // Expanded
            "Sexually Transmitted Infections (STIs) (Diagnosis & Treatment)", // Overlap with ID
            "Cervical Dysplasia (Screening & Management - Pap Smear, Colposcopy, LEEP)", // Expanded
            "Uterine Cancer (Overview)",
            "Ovarian Cancer (Overview)", // Expanded
            "Cervical Cancer (Overview)",
            "Vulvar Cancer (Overview)", // Expanded
            "Vaginal Cancer (Overview)",
            "Gestational Trophoblastic Neoplasia (GTN)",
            "Infertility (Evaluation & Basic Treatment)", // Expanded
            "Recurrent Pregnancy Loss (Evaluation)",
            "Menopause (Symptoms & Management)",
            "Hormone Replacement Therapy (Risks & Benefits)",
            "Pelvic Organ Prolapse (Evaluation & Management)",
            "Urinary Incontinence (Gynecologic Aspects)", // Overlap with Urology/Geriatrics
            "Family Planning Counseling",
            "Intimate Partner Violence Screening"
        ],
        "requiredLevel": 3,
        "icon": "🤰"
    },
    "Psychiatry": {
        diseases: [
            "Mental Status Examination (MSE)",
            "Psychiatric Interviewing Techniques",
            "Major Depressive Disorder (Diagnosis, Treatment Options - CBT, SSRIs, etc.)", // Expanded
            "Persistent Depressive Disorder (Dysthymia)",
            "Bipolar Disorder (Types, Mania, Depression Management)", // Expanded
            "Cyclothymic Disorder",
            "Schizophrenia (Diagnosis, Positive/Negative Symptoms, Treatment)", // Expanded
            "Schizoaffective Disorder",
            "Delusional Disorder",
            "Obsessive-Compulsive Disorder (OCD) (Diagnosis & Treatment)", // Expanded
            "Panic Disorder (Diagnosis & Treatment)", // Expanded
            "Agoraphobia",
            "Social Anxiety Disorder (Social Phobia)", // Expanded
            "Specific Phobias",
            "Generalized Anxiety Disorder (GAD) (Diagnosis & Treatment)", // Expanded
            "Post-Traumatic Stress Disorder (PTSD) (Diagnosis & Treatment)", // Expanded
            "Acute Stress Disorder",
            "Adjustment Disorder", // Expanded
            "Somatic Symptom Disorder", // Expanded
            "Illness Anxiety Disorder (Hypochondriasis)",
            "Conversion Disorder (Functional Neurological Symptom Disorder)",
            "Factitious Disorder",
            "Dissociative Identity Disorder",
            "Dissociative Amnesia",
            "Depersonalization/Derealization Disorder",
            "Anorexia Nervosa (Diagnosis & Management)", // Expanded
            "Bulimia Nervosa (Diagnosis & Management)", // Expanded
            "Binge Eating Disorder (BED)", // Expanded
            "Avoidant/Restrictive Food Intake Disorder (ARFID)",
            "Insomnia Disorder (Diagnosis & Management)", // Expanded
            "Hypersomnolence Disorder",
            "Narcolepsy",
            "Circadian Rhythm Sleep-Wake Disorders",
            "Nightmare Disorder",
            "Sleepwalking Disorder",
            "Restless Legs Syndrome",
            "Substance Use Disorder (Alcohol, Opioids, Stimulants, Cannabis) (Diagnosis & Treatment)", // Expanded
            "Substance Intoxication & Withdrawal Syndromes",
            "Gambling Disorder",
            "Internet Gaming Disorder",
            "Personality Disorders (Cluster A, B, C - Specific Examples)", // Expanded
            "Borderline Personality Disorder (Diagnosis & Treatment - DBT)", // Expanded
            "Antisocial Personality Disorder",
            "Narcissistic Personality Disorder",
            "Histrionic Personality Disorder",
            "Obsessive-Compulsive Personality Disorder",
            "Avoidant Personality Disorder",
            "Dependent Personality Disorder",
            "Schizoid Personality Disorder",
            "Schizotypal Personality Disorder",
            "Paranoid Personality Disorder",
            "Delirium (Causes, Diagnosis, Management)", // Expanded
            "Major Neurocognitive Disorder (Dementia - Alzheimer's, Vascular, Lewy Body) (Psychiatric Aspects)", // Expanded
            "Mild Neurocognitive Disorder",
            "Intellectual Disability (Intellectual Developmental Disorder)",
            "Communication Disorders",
            "Autism Spectrum Disorder (Diagnosis & Management)", // Expanded
            "Attention-Deficit Hyperactivity Disorder (ADHD) (Adult Diagnosis & Management)", // Expanded
            "Specific Learning Disorder",
            "Motor Disorders (Developmental Coordination Disorder, Tic Disorders)",
            "Tourette's Disorder",
            "Feeding and Eating Disorders of Infancy or Early Childhood",
            "Elimination Disorders (Enuresis, Encopresis) (Psychiatric Aspect)", // Overlap with Peds/Urology
            "Disruptive Mood Dysregulation Disorder (DMDD)",
            "Oppositional Defiant Disorder (ODD) (Psychiatric Aspect)", // Overlap with Peds
            "Conduct Disorder (Psychiatric Aspect)", // Overlap with Peds
            "Intermittent Explosive Disorder",
            "Kleptomania",
            "Pyromania",
            "Non-Suicidal Self-Injury",
            "Suicidal Ideation & Behavior (Risk Assessment & Management)",
            "Violence Risk Assessment",
            "Catatonia (Diagnosis & Management)", // Expanded
            "Neuroleptic Malignant Syndrome (NMS) (Diagnosis & Management)", // Expanded
            "Serotonin Syndrome (Diagnosis & Management)", // Expanded
            "Antidepressant Discontinuation Syndrome",
            "Electroconvulsive Therapy (ECT) (Indications & Procedure)",
            "Transcranial Magnetic Stimulation (TMS)",
            "Psychotherapy Modalities (CBT, DBT, Psychodynamic, etc.)",
            "Psychopharmacology (Antidepressants, Antipsychotics, Mood Stabilizers, Anxiolytics)",
            "Forensic Psychiatry (Competency, Insanity Defense)",
            "Child & Adolescent Psychiatry (Specific Disorders)", // Overlap with Peds
            "Geriatric Psychiatry (Specific Disorders in Elderly)", // Overlap with Geriatrics
            "Consultation-Liaison Psychiatry (Psychiatric Issues in Medical/Surgical Patients)"
        ],
        "requiredLevel": 4,
        "icon": "🧠"
    },
    "Dermatology": {
        diseases: [
            "Skin Anatomy & Physiology",
            "Lesion Description & Terminology",
            "Acne Vulgaris (Pathogenesis & Management)", // Expanded
            "Rosacea (Types & Management)", // Expanded
            "Perioral Dermatitis",
            "Psoriasis (Types, Pathogenesis & Management)", // Expanded
            "Eczema (Atopic Dermatitis) (Pathogenesis & Management)", // Expanded
            "Contact Dermatitis (Allergic & Irritant)", // Expanded
            "Seborrheic Dermatitis", // Expanded
            "Stasis Dermatitis",
            "Nummular Dermatitis",
            "Dyshidrotic Eczema",
            "Urticaria (Hives) (Causes & Management)", // Expanded
            "Angioedema (Derm Aspect)", // Overlap with Allergy/Immuno
            "Drug Eruptions (Common Types)",
            "Erythema Multiforme",
            "Stevens-Johnson Syndrome (SJS) / Toxic Epidermal Necrolysis (TEN)",
            "Lichen Planus", // Expanded
            "Pityriasis Rosea", // Expanded
            "Melasma (Causes & Treatment)", // Expanded
            "Vitiligo (Pathogenesis & Treatment)", // Expanded
            "Alopecia Areata", // Expanded
            "Androgenetic Alopecia (Male & Female Pattern Baldness)",
            "Telogen Effluvium",
            "Fungal Infections (Tinea Corporis, Pedis, Cruris, Capitis, Unguium)", // Expanded
            "Tinea Versicolor (Malassezia)", // Expanded
            "Candidiasis (Cutaneous)", // Overlap with Micro/ID
            "Viral Warts (Verruca Vulgaris, Plantar Warts, Condyloma Acuminata)", // Expanded
            "Molluscum Contagiosum",
            "Herpes Simplex Virus (HSV) (Cutaneous Manifestations)", // Overlap with Micro/ID
            "Varicella Zoster Virus (VZV) (Shingles) (Cutaneous Manifestations)", // Overlap with Micro/ID
            "Bacterial Skin Infections (Impetigo, Ecthyma, Folliculitis, Furuncles, Carbuncles)", // Overlap with Micro/IM
            "Cellulitis (Derm Aspect)", // Overlap with IM/ID
            "Erysipelas (Derm Aspect)", // Overlap with IM
            "Abscess (Derm Aspect)", // Overlap with IM/Gen Surg
            "Staphylococcus aureus Skin Infections (MRSA)", // Overlap with Micro/ID
            "Streptococcus pyogenes Skin Infections (Erysipelas, Cellulitis)", // Overlap with Micro/ID
            "Scabies (Diagnosis & Treatment)", // Expanded
            "Pediculosis (Lice)", // Expanded
            "Spider Bites (Common)",
            "Insect Bites & Stings (Reactions)",
            "Sunburn & Photosensitivity Reactions",
            "Actinic Keratosis (Premalignant Lesions)", // Expanded
            "Basal Cell Carcinoma (Diagnosis & Treatment)", // Expanded
            "Squamous Cell Carcinoma (Diagnosis & Treatment)", // Expanded
            "Melanoma (Diagnosis, Staging, & Treatment)", // Expanded
            "Dysplastic Nevi",
            "Seborrheic Keratosis", // Expanded
            "Skin Tags (Acrochordons)",
            "Cherry Angiomas",
            "Dermatofibroma",
            "Epidermal Inclusion Cysts",
            "Pilar Cysts",
            "Lipoma (Derm Aspect)", // Overlap with Gen Surg
            "Hidradenitis Suppurativa", // Expanded
            "Bullous Pemphigoid", // Expanded
            "Pemphigus Vulgaris", // Expanded
            "Dermatitis Herpetiformis",
            "Pyoderma Gangrenosum",
            "Necrotizing Fasciitis (Derm Aspect)", // Overlap with Gen Surg/ID/ER
            "Pressure Ulcers (Staging & Prevention) (Derm Aspect)", // Overlap with Geriatrics/PM&R
            "Diabetic Foot Ulcers (Derm Aspect)", // Overlap with Endo/IM
            "Vascular Ulcers (Venous & Arterial) (Derm Aspect)", // Overlap with Cardio/Gen Surg
            "Cryotherapy (Derm Procedures)",
            "Biopsy Techniques (Shave, Punch, Excisional)",
            "Topical Corticosteroids (Potency & Use)",
            "Systemic Therapies in Dermatology (Immunosuppressants, Biologics)"
        ],
        "requiredLevel": 5,
        "icon": "💅"
    },
    "Radiology": {
        diseases: [ // More specific interpretations + expanded
            "Radiographic Physics & Image Formation",
            "Radiation Safety Principles (Detailed)", // Expanded
            "Contrast Media (Types, Risks, Management of Reactions)", // Expanded
            "Chest X-Ray Interpretation (Advanced - Pneumonia Patterns, Effusions, Masses)", // Expanded
            "Abdominal X-Ray Interpretation (Advanced - Obstruction, Ileus, Free Air)", // Expanded
            "Skeletal Radiography (Fracture Classification, Arthritis Findings)",
            "CT Physics & Image Formation",
            "CT Head Interpretation (Trauma, Stroke, Hemorrhage, Mass)", // Expanded
            "CT Chest Interpretation (PE Protocol, Nodules, Masses, ILD)", // Expanded
            "CT Abdomen/Pelvis Interpretation (Appendicitis, Diverticulitis, Stones, Masses)", // Expanded
            "MRI Physics & Image Formation (T1, T2, FLAIR, Diffusion)",
            "MRI Brain Interpretation (Tumors, Stroke, MS, Dementia)", // Expanded
            "MRI Spine Interpretation (Degenerative Disease, Herniated Disc, Cord Lesions)", // Expanded
            "MRI Musculoskeletal Interpretation (Joints, Ligaments, Tendons)", // Overlap with Ortho
            "Ultrasound Physics & Image Formation",
            "Ultrasound Abdomen (Gallstones, Appendicitis, Liver, Kidneys)", // Expanded
            "Ultrasound Pelvis (Gynecologic & Obstetric)", // Overlap with OB/GYN
            "Ultrasound Vascular (DVT, Carotid Doppler)", // Expanded
            "Doppler Ultrasound Principles",
            "Mammography Screening & Interpretation (BIRADS)", // Expanded
            "Fluoroscopy (GI Series, Barium Enema, Voiding Cystourethrogram)", // Expanded
            "Angiography (Coronary, Peripheral, Cerebral) (Interpretation Basics)", // Expanded
            "Nuclear Medicine Physics & Radiopharmaceuticals",
            "PET Scan in Oncology (Indications & Interpretation)", // Expanded
            "Bone Scan in Oncology & Trauma", // Expanded
            "V/Q Scan for Pulmonary Embolism", // Overlap with Pulm
            "DEXA Scan for Osteoporosis (Interpretation)", // Expanded
            "Interventional Radiology (Biopsy, Drainage, Angiography, Embolization, Stenting - Indications & Basics)", // Expanded
            "Pediatric Radiology Considerations", // Overlap with Peds
            "Neuroradiology (Advanced Brain & Spine Imaging)", // Overlap with Neuro
            "Cardiothoracic Radiology (Advanced Chest Imaging)", // Overlap with Cardio/Pulm
            "Abdominal Radiology (Advanced GI/GU Imaging)", // Overlap with GI/Nephro/Urology
            "Musculoskeletal Radiology (Advanced MSK Imaging)", // Overlap with Ortho/Rheum
            "Genitourinary Radiology (Advanced GU Imaging)", // Overlap with Urology/Nephro
            "Breast Imaging (Advanced Mammography, Ultrasound, MRI)", // Overlap with Gen Surg/Onc
            "Emergency Radiology (Trauma Imaging Protocols)", // Overlap with ER
            "Cross-Sectional Anatomy (CT & MRI)"
        ],
        "requiredLevel": 5,
        "icon": "🩻"
    },
    "Pathology": {
        diseases: [ // Systemic Pathology + expanded
            "Autopsy Pathology (Indications & Procedure)",
            "Gross Pathology (Specimen Description)",
            "Histopathology (Tissue Processing & Staining)",
            "Immunohistochemistry (Principles & Applications)",
            "Molecular Pathology (PCR, FISH, Sequencing Basics)",
            "Cardiovascular Pathology (Atherosclerosis, Myocardial Infarction, Valvular Disease)", // Expanded
            "Pulmonary Pathology (Pneumonia, Emphysema, Lung Cancer)", // Expanded
            "Gastrointestinal Pathology (Peptic Ulcers, IBD, Colon Cancer)", // Expanded
            "Hepatic Pathology (Cirrhosis, Hepatitis, Liver Tumors)", // Expanded
            "Renal Pathology (Glomerular Diseases, Tubulointerstitial Nephritis)", // Expanded
            "Endocrine Pathology (Thyroid Nodules & Cancer, Adrenal Lesions)", // Expanded
            "Hematopathology (Leukemia, Lymphoma, Myeloma - Morphology & Classification)", // Expanded
            "Neuropathology (Stroke, Alzheimer's Disease, Brain Tumors)", // Expanded
            "Skin Pathology (Common Benign & Malignant Lesions)", // Expanded
            "Bone & Soft Tissue Pathology (Common Tumors & Lesions)", // Expanded
            "Infectious Disease Pathology (Histologic Findings of Viral, Bacterial, Fungal Infections)", // Expanded
            "Immunopathology (Transplant Rejection, Autoimmune Disease Findings)", // Expanded
            "Cytopathology (Pap Smear Interpretation, Fine Needle Aspiration)", // Expanded
            "Forensic Pathology (Cause & Manner of Death, Trauma Interpretation)", // Expanded
            "Gynecologic Pathology (Cervical Dysplasia, Endometrial Hyperplasia/Cancer)", // Overlap with OB/GYN
            "Urologic Pathology (Prostate Cancer, Bladder Cancer)", // Overlap with Urology
            "Pediatric Pathology (Congenital Anomalies, Childhood Tumors)", // Overlap with Peds
            "Transplant Pathology (Graft Rejection)", // Overlap with Advanced IM/Surg
            "Neoplasia (Grading & Staging)", // Expanded
            "Tumor Markers (Pathology Perspective)",
            "Frozen Section Interpretation",
            "Laboratory Medicine (Clinical Chemistry, Hematology, Microbiology, Blood Bank Basics)"
        ],
        "requiredLevel": 5,
        "icon": "🔬"
    },

    // --- Level 6-15: Major Organ Systems & Expanding Knowledge ---
    "Cardiology": {
        diseases: [
            "Electrocardiogram (ECG) Interpretation (Basic to Advanced)",
            "Acute Coronary Syndrome (ACS) (Diagnosis, Medical & Interventional Management)", // Expanded
            "Stable Angina (Diagnosis & Management)", // Expanded
            "Unstable Angina", // Expanded
            "Acute Myocardial Infarction (MI) (Types, Complications, Management)", // Expanded
            "Heart Failure (Advanced CHF Diagnosis, Classification, Management - HFrEF, HFpEF)", // Expanded
            "Cardiomyopathy (Dilated, Hypertrophic, Restrictive, Arrhythmogenic RV Dysplasia)", // Expanded
            "Valvular Heart Disease (Aortic Stenosis/Regurgitation, Mitral Stenosis/Regurgitation, Tricuspid/Pulmonic Disease) (Diagnosis & Management)", // Expanded
            "Endocarditis (Infectious) (Diagnosis, Management, Complications)", // Expanded
            "Myocarditis (Causes & Management)", // Expanded
            "Pericarditis (Causes & Management)", // Expanded
            "Pericardial Effusion & Tamponade (Diagnosis & Management)", // Expanded
            "Arrhythmias (Supraventricular Tachycardia, Atrial Fibrillation/Flutter, Ventricular Tachycardia/Fibrillation, Bradyarrhythmias)", // Expanded
            "Cardiac Electrophysiology (Mechanisms of Arrhythmias)", // Overlap with Advanced Cardio
            "Pacemakers & Implantable Defibrillators (Indications & Management)",
            "Syncope (Cardiovascular Causes)", // Overlap with ER/Neuro
            "Pulmonary Hypertension (Diagnosis & Management)", // Expanded
            "Aortic Diseases (Aortic Dissection, Aortic Aneurysm) (Diagnosis & Management)", // Expanded
            "Peripheral Artery Disease (PAD) (Diagnosis & Management)",
            "Deep Vein Thrombosis (DVT) (Diagnosis & Management)", // Overlap with IM/ER
            "Pulmonary Embolism (PE) (Diagnosis & Management)", // Overlap with Pulm/ER
            "Hyperlipidemia (Advanced Management, Familial Hypercholesterolemia)", // Expanded
            "Metabolic Syndrome (Cardiovascular Risk)", // Expanded
            "Cardiovascular Risk Assessment (ASCVD Risk Score)",
            "Hypertensive Emergencies & Urgencies (Management)", // Overlap with IM/Nephro/ER
            "Congenital Heart Disease (Adult Presentation)", // Overlap with Peds/Advanced Cardio
            "Pericardial Diseases (Constrictive Pericarditis)", // Overlap with Advanced Cardio
            "Cardiac Tumors (Overview)", // Overlap with Advanced Cardio
            "Sports Cardiology (Athlete's Heart, Sudden Cardiac Death)", // Overlap with Advanced Cardio
            "Cardio-Oncology (Cardiac Effects of Cancer Therapy)", // Overlap with Heme/Onc/Advanced Cardio
            "Cardiac Imaging (Echocardiography, Cardiac MRI, Cardiac CT - Advanced Interpretation)", // Overlap with Radiology/Advanced Cardio
            "Cardiac Catheterization (Coronary Angiography, Hemodynamics)",
            "Interventional Cardiology (PCI, Valvuloplasty, TAVR - Indications & Procedures)", // Overlap with Radiology/Gen Surg/Advanced Cardio
            "Heart Transplantation (Indications & Management)", // Overlap with Advanced IM/Surg
            "Mechanical Circulatory Support (IABP, VADs)", // Overlap with Advanced IM/Critical Care
            "Cardiac Rehabilitation" // Overlap with PM&R
        ],
        "requiredLevel": 6,
        "icon": "❤️"
    },
    "Pulmonology": {
        diseases: [
            "Pulmonary Function Tests (PFTs) (Interpretation)",
            "Arterial Blood Gas (ABG) Interpretation (Pulm Aspect)", // Overlap with Anesthesia/Nephro/ER/Critical Care
            "Chronic Obstructive Pulmonary Disease (COPD) (Advanced Diagnosis, Staging, Management)", // Expanded
            "Asthma (Advanced Diagnosis, Phenotypes, Management)", // Expanded
            "Bronchiectasis (Causes & Management)", // Expanded
            "Cystic Fibrosis (Pulmonary Manifestations & Management)", // Overlap with Peds
            "Pulmonary Embolism (PE) (Diagnosis, Risk Stratification, Treatment)", // Expanded
            "Pulmonary Hypertension (Classification, Diagnosis, Management)", // Expanded
            "Acute Respiratory Distress Syndrome (ARDS) (Pathophysiology & Management)", // Expanded
            "Interstitial Lung Disease (ILD) (Classification, Diagnosis, Management - IPF, Sarcoidosis, Hypersensitivity Pneumonitis)", // Expanded
            "Pneumonia (Advanced Topics - HAP, VAP, Aspiration, Opportunistic)", // Expanded
            "Tuberculosis (Diagnosis, Treatment Regimens, Latent TB)", // Expanded
            "Non-Tuberculous Mycobacteria (NTM)",
            "Pleural Effusion (Causes, Diagnosis, Management)", // Expanded
            "Pneumothorax (Spontaneous, Traumatic, Tension) (Management)", // Expanded
            "Pulmonary Fibrosis (Specific Types & Management)", // Expanded
            "Obstructive Sleep Apnea (OSA) (Diagnosis & Management)", // Expanded
            "Central Sleep Apnea",
            "Hypoventilation Syndromes",
            "Lung Cancer (Screening, Diagnosis, Staging, Treatment - Pulm Aspect)", // Overlap with Heme/Onc/Radiology/Gen Surg
            "Pleural Diseases (Pleurisy, Empyema, Chylothorax)",
            "Mediastinal Masses (Evaluation)",
            "Occupational Lung Diseases (Asbestosis, Silicosis, Coal Worker's Pneumoconiosis)", // Overlap with Prev Med
            "Hypersensitivity Pneumonitis (Causes & Management)", // Expanded
            "Pulmonary Vasculitis (GPA, EGPA) (Pulm Aspect)", // Overlap with Rheum
            "Pulmonary Alveolar Proteinosis",
            "Pulmonary Hemorrhage Syndromes",
            "Bronchoscopy (Indications & Procedures)",
            "Thoracentesis (Procedure & Interpretation)",
            "Chest Tube Insertion & Management",
            "Mechanical Ventilation (Modes & Management)", // Overlap with Anesthesia/Critical Care
            "Non-Invasive Ventilation (BiPAP, CPAP)",
            "Pulmonary Rehabilitation" // Overlap with PM&R
        ],
        "requiredLevel": 7,
        "icon": "🫁"
    },
    "Gastroenterology": {
        diseases: [
            "Esophageal Motility Disorders (Achalasia, Spasms)", // Expanded
            "Gastroesophageal Reflux Disease (GERD) (Advanced Diagnosis & Management)", // Expanded
            "Barrett's Esophagus (Surveillance & Management)", // Expanded
            "Esophageal Varices (Management & Prevention of Bleeding)", // Expanded
            "Peptic Ulcer Disease (Causes - H. pylori, NSAIDs, Zollinger-Ellison; Management)", // Expanded
            "Gastritis (Causes & Management)",
            "Gastroparesis (Causes & Management)", // Expanded
            "Dyspepsia (Evaluation & Management)",
            "Celiac Disease (Diagnosis & Management)", // Expanded
            "Inflammatory Bowel Disease (IBD) (Crohn’s Disease & Ulcerative Colitis - Advanced Diagnosis & Management)", // Expanded
            "Microscopic Colitis",
            "Irritable Bowel Syndrome (IBS) (Diagnosis & Management)", // Expanded
            "Diverticulosis & Diverticulitis (Management)", // Expanded
            "Colorectal Cancer (Screening, Diagnosis, Management - GI Aspect)", // Overlap with Heme/Onc/Gen Surg
            "Colon Polyps (Detection & Management)",
            "GI Bleeding (Upper & Lower - Causes, Localization, Management)", // Expanded
            "Constipation (Advanced Evaluation & Management)", // Expanded
            "Diarrhea (Advanced Evaluation & Management - Infectious, Malabsorptive, Inflammatory)", // Expanded
            "Malabsorption Syndromes (Causes & Diagnosis)",
            "Small Intestinal Bacterial Overgrowth (SIBO)",
            "Pancreatic Insufficiency",
            "Lactose Intolerance",
            "Fructose Malabsorption",
            "Acute Pancreatitis (Causes, Diagnosis, Management, Complications)", // Expanded
            "Chronic Pancreatitis (Causes & Management)", // Expanded
            "Pancreatic Cancer (Overview)", // Overlap with Heme/Onc/Gen Surg
            "Cholelithiasis (Gallstones) (Formation, Symptoms, Management)", // Expanded
            "Cholecystitis (Acute & Chronic) (Diagnosis & Management)", // Expanded
            "Cholangitis (Acute) (Diagnosis & Management)", // Expanded
            "Choledocholithiasis (Common Bile Duct Stones)",
            "Primary Biliary Cholangitis (PBC) (Diagnosis & Management)", // Expanded
            "Primary Sclerosing Cholangitis (PSC)",
            "Cirrhosis (Causes - Viral Hepatitis, Alcohol, NAFLD; Complications - Ascites, SBP, Hepatic Encephalopathy)", // Expanded
            "Chronic Hepatitis B (Advanced Management)", // Expanded
            "Chronic Hepatitis C (Advanced Management)", // Expanded
            "Nonalcoholic Fatty Liver Disease (NAFLD) / NASH (Diagnosis & Management)", // Expanded
            "Alcoholic Liver Disease",
            "Autoimmune Hepatitis",
            "Hemochromatosis",
            "Wilson's Disease",
            "Alpha-1 Antitrypsin Deficiency (Liver Aspect)", // Overlap with Pulm
            "Acute Liver Failure (Causes & Management)", // Expanded
            "Portal Hypertension (Causes & Management)", // Expanded
            "Hepatocellular Carcinoma (HCC) (Surveillance & Management)", // Overlap with Heme/Onc/Radiology/Gen Surg
            "Gastrointestinal Infections (Specific Pathogens & Syndromes)", // Overlap with Micro/ID
            "Clostridioides difficile Infection (GI Aspect)", // Overlap with Micro/ID
            "Food Poisoning (Common Causes)",
            "Endoscopy (EGD, Colonoscopy, ERCP - Indications & Basic Procedures)",
            "Capsule Endoscopy",
            "Esophageal Manometry",
            "pH Monitoring (GI)",
            "Liver Biopsy (Indications & Risks)", // Overlap with Radiology
            "Paracentesis (Procedure)", // Overlap with IR
            "Enteral & Parenteral Nutrition (GI Aspect)" // Overlap with Critical Care
        ],
        "requiredLevel": 8,
        "icon": "🍎"
    },
    "Nephrology": {
        diseases: [
            "Renal Anatomy & Physiology (Detailed)", // Overlap with Anatomy/Physio
            "Glomerular Filtration Rate (GFR) Calculation & Interpretation",
            "Acute Kidney Injury (AKI) (Causes - Pre-renal, Intrinsic, Post-renal; Diagnosis & Management)", // Expanded
            "Chronic Kidney Disease (CKD) (Staging, Causes, Complications, Management)", // Expanded
            "End-Stage Renal Disease (ESRD)",
            "Nephrotic Syndrome (Causes - Minimal Change, FSGS, Membranous; Diagnosis & Management)", // Expanded
            "Nephritic Syndrome (Causes - Post-strep GN, IgA Nephropathy, RPGN; Diagnosis & Management)", // Expanded
            "Glomerulonephritis (Specific Types & Treatment)", // Expanded
            "Acute Interstitial Nephritis (Causes & Management)", // Expanded
            "Chronic Tubulointerstitial Diseases",
            "Polycystic Kidney Disease (PKD) (Autosomal Dominant & Recessive)", // Expanded
            "Alport Syndrome",
            "Fabry Disease (Renal Aspect)", // Overlap with Genetics
            "Renal Calculi (Kidney Stones) (Formation, Types, Medical Management)", // Expanded
            "Urinary Tract Obstruction (Nephro Aspect)", // Overlap with Urology
            "Pyelonephritis (Nephro Aspect)", // Overlap with IM/ID/Urology
            "Electrolyte Disorders (Potassium - Hypo/Hyperkalemia; Sodium - Hypo/Hypernatremia; Calcium - Hypo/Hypercalcemia; Phosphorus, Magnesium)", // Expanded
            "Acid-Base Disorders (Metabolic Acidosis/Alkalosis, Respiratory Acidosis/Alkalosis) (Detailed Interpretation)", // Expanded
            "Hypertension (Nephrology Causes - Renal Artery Stenosis, CKD)", // Expanded
            "Renal Artery Stenosis (Diagnosis & Management)", // Expanded
            "Vasculitis (Renal Manifestations - GPA, MPA, EGPA) (Nephro Aspect)", // Overlap with Rheum
            "Lupus Nephritis (Diagnosis & Management)", // Expanded
            "Diabetic Nephropathy (Prevention & Management)", // Overlap with Endo/IM
            "Hypertensive Nephrosclerosis",
            "Multiple Myeloma (Renal Manifestations)", // Overlap with Heme/Onc
            "Amyloidosis (Renal Manifestations)", // Overlap with Pathology
            "Rhabdomyolysis (Renal Complications)", // Expanded
            "Tumor Lysis Syndrome (Nephro Aspect)", // Overlap with Heme/Onc
            "Contrast-Induced Nephropathy (Prevention & Management)", // Overlap with Radiology
            "Nephrogenic Systemic Fibrosis",
            "Hemodialysis (Principles, Access, Complications)", // Expanded
            "Peritoneal Dialysis (Principles, Access, Complications)", // Expanded
            "Kidney Transplantation (Indications, Evaluation, Immunosuppression, Complications)", // Expanded
            "Continuous Renal Replacement Therapy (CRRT) (Indications & Principles)", // Overlap with Critical Care
            "Drug Dosing in Renal Impairment",
            "Fluid Management in Renal Disease"
        ],
        "requiredLevel": 9,
        "icon": "🧪"
    },
    "Endocrinology": {
        diseases: [
            "Hypothalamic-Pituitary Axis (Physiology)", // Overlap with Physio
            "Thyroid Gland Physiology & Function Tests",
            "Hypothyroidism (Advanced Diagnosis & Management)", // Expanded
            "Hyperthyroidism (Causes - Graves', Toxic Adenoma; Diagnosis & Management)", // Expanded
            "Thyroid Storm (Diagnosis & Management)", // Expanded
            "Myxedema Coma (Diagnosis & Management)", // Expanded
            "Thyroid Nodules (Evaluation & Management)", // Expanded
            "Thyroid Cancer (Types & Management)", // Expanded
            "Adrenal Gland Physiology & Function Tests",
            "Adrenal Insufficiency (Primary - Addison's Disease; Secondary/Tertiary) (Diagnosis & Management)", // Expanded
            "Adrenal Crisis (Diagnosis & Management)",
            "Cushing’s Syndrome (Causes - Pituitary Adenoma, Adrenal Adenoma, Ectopic ACTH; Diagnosis & Management)", // Expanded
            "Hyperaldosteronism (Primary & Secondary) (Diagnosis & Management)", // Expanded
            "Pheochromocytoma (Diagnosis & Management)", // Expanded
            "Adrenal Masses (Incidentalomas)",
            "Pituitary Gland Physiology & Function Tests",
            "Pituitary Adenomas (Types - Prolactinoma, Acromegaly, Cushing's Disease, Non-functioning) (Diagnosis & Management)", // Expanded
            "Acromegaly (Diagnosis & Management)", // Expanded
            "Diabetes Insipidus (Central & Nephrogenic) (Diagnosis & Management)", // Expanded
            "Syndrome of Inappropriate Antidiuretic Hormone (SIADH) (Causes & Management)", // Expanded
            "Growth Hormone Deficiency (Adult) (Diagnosis & Management)", // Expanded
            "Growth Disorders (Pediatric Endocrinology)", // Overlap with Peds
            "Diabetes Mellitus (Type 1 & Type 2 - Advanced Pathophysiology, Complications, Management)", // Expanded
            "Diabetic Ketoacidosis (DKA) (Endo Aspect)", // Overlap with IM/ER/Critical Care
            "Hyperosmolar Hyperglycemic State (HHS) (Endo Aspect)", // Overlap with IM/ER/Critical Care
            "Diabetic Nephropathy (Endo Aspect)", // Overlap with Nephro/IM
            "Diabetic Retinopathy (Endo Aspect)", // Overlap with Ophtho
            "Diabetic Neuropathy (Endo Aspect)", // Overlap with Neuro/PM&R
            "Diabetic Foot Ulcers (Endo Aspect)", // Overlap with Derm/IM
            "Hypoglycemia (Causes & Management)",
            "Insulin Therapy (Types & Regimens)",
            "Oral Hypoglycemic Agents (Mechanisms & Use)",
            "Non-Insulin Injectable Agents (GLP-1 RAs, GIP/GLP-1 RAs)",
            "Continuous Glucose Monitoring (CGM)",
            "Insulin Pumps",
            "Pancreatic Islet Cell Transplantation",
            "Parathyroid Gland Physiology & Function Tests",
            "Primary Hyperparathyroidism (Diagnosis & Management)", // Expanded
            "Secondary & Tertiary Hyperparathyroidism",
            "Hypoparathyroidism (Causes & Management)", // Expanded
            "Calcium & Phosphorus Metabolism Disorders", // Overlap with Nephro
            "Vitamin D Metabolism & Deficiency", // Overlap with Nephro/IM/Peds
            "Metabolic Bone Diseases (Osteoporosis - Advanced Management, Osteomalacia)", // Overlap with IM/Ortho/Rheum/Geriatrics
            "Paget's Disease of Bone",
            "Multiple Endocrine Neoplasia (MEN) Syndromes", // Overlap with Genetics/Heme/Onc
            "Carcinoid Syndrome",
            "VIPoma, Glucagonoma, Insulinoma",
            "Reproductive Endocrinology (Infertility, PCOS, Menopause - Advanced)", // Overlap with OB/GYN
            "Disorders of Sexual Development (DSD)", // Overlap with Peds/Genetics
            "Adrenal Androgen Excess (Hirsutism, Virilization)"
        ],
        "requiredLevel": 10,
        "icon": "🧬"
    },
    "Neurology": {
        diseases: [
            "Neurological Examination (Detailed)",
            "Neuroanatomy (Detailed Clinical Correlations)", // Expanded
            "Neurophysiology (EEG, Evoked Potentials, NCS/EMG - Principles)", // Overlap with PM&R
            "Stroke (Ischemic & Hemorrhagic - Advanced Pathophysiology, Diagnosis, Acute Management, Secondary Prevention)", // Expanded
            "Transient Ischemic Attack (TIA) (Advanced Evaluation & Management)", // Expanded
            "Intracranial Hemorrhage (Subarachnoid, Intraparenchymal, Epidural, Subdural)",
            "Subarachnoid Hemorrhage (Aneurysmal SAH Management)",
            "Seizures & Epilepsy (Classification, Diagnosis, Antiepileptic Drugs, Status Epilepticus Management)", // Expanded
            "Migraine (Advanced Pathophysiology & Management)", // Expanded
            "Headache Syndromes (Cluster, Tension, Trigeminal Neuralgia, Medication Overuse)", // Expanded
            "Multiple Sclerosis (Diagnosis, Types, Disease-Modifying Therapies)", // Expanded
            "Other Demyelinating Diseases (ADEM, NMOSD)", // Expanded
            "Parkinson's Disease (Diagnosis, Pathophysiology, Management)", // Expanded
            "Other Movement Disorders (Essential Tremor, Dystonia, Chorea, Ataxia)", // Expanded
            "Huntington's Disease",
            "Alzheimer's Disease (Pathophysiology, Diagnosis, Management)", // Expanded
            "Other Dementias (Vascular, Lewy Body, Frontotemporal, CJD)", // Expanded
            "Amyotrophic Lateral Sclerosis (ALS) (Diagnosis & Management)", // Expanded
            "Other Motor Neuron Diseases",
            "Myasthenia Gravis (Diagnosis & Management)", // Expanded
            "Lambert-Eaton Myasthenic Syndrome",
            "Guillain-Barré Syndrome (GBS) (Diagnosis & Management)", // Expanded
            "Chronic Inflammatory Demyelinating Polyneuropathy (CIDP)",
            "Peripheral Neuropathies (Causes - Diabetic, Nutritional, Toxic, Inflammatory; Diagnosis & Management)", // Expanded
            "Mononeuropathies (Carpal Tunnel, Ulnar Neuropathy, Peroneal Neuropathy)",
            "Radiculopathy (Cervical, Lumbar)", // Overlap with Ortho/PM&R
            "Myopathy (Causes - Inflammatory, Muscular Dystrophies, Metabolic)",
            "Muscular Dystrophies (Duchenne, Becker, Myotonic) (Neurology Aspect)", // Overlap with Peds/Genetics/PM&R
            "Mitochondrial Disorders (Neurology Aspect)", // Overlap with Genetics/Biochem/Advanced IM
            "Lysosomal Storage Diseases (Neurology Aspect)", // Overlap with Genetics/Biochem/Advanced IM
            "Spinal Cord Lesions (Trauma, Compression, Transverse Myelitis)", // Overlap with Ortho/PM&R
            "Brain Tumors (Classification, Diagnosis, Management - Neurology Aspect)", // Overlap with Heme/Onc/Radiology/Gen Surg
            "Spinal Cord Tumors",
            "Meningitis (Bacterial, Viral, Fungal) (Diagnosis & Management)", // Expanded
            "Encephalitis (Causes & Management)", // Expanded
            "Abscess (Brain Abscess)", // Overlap with ID/Neurosurgery
            "Prion Diseases (CJD) (Neurology Aspect)", // Overlap with Micro/Pathology
            "Neuro-Ophthalmology (Optic Neuritis, Papilledema, Visual Field Defects)", // Overlap with Ophtho
            "Neuro-Otology (Vertigo, Dizziness - Neurologic Causes)", // Overlap with ENT
            "Sleep Disorders (Neurology Aspect - Narcolepsy, RLS)", // Overlap with Psych
            "Autonomic Neuropathy",
            "Channelopathies (Neurology)",
            "Neurogenetics (Specific Syndromes - Huntington's, Fragile X, etc.)", // Overlap with Genetics
            "Pediatric Neurology (Specific Disorders - Cerebral Palsy, Duchenne, Seizure Syndromes)", // Overlap with Peds/Advanced Neuro
            "Geriatric Neurology (Dementia, Parkinson's, Stroke in Elderly)", // Overlap with Geriatrics/Advanced Neuro
            "Neurocritical Care (Management of Severe Neurologic Injury/Illness)", // Overlap with Critical Care/Advanced Neuro
            "Neuroimaging Interpretation (Advanced CT, MRI, PET, fMRI)", // Overlap with Radiology/Advanced Neuro
            "Lumbar Puncture (Procedure & CSF Analysis)",
            "Deep Brain Stimulation (DBS) (Indications & Procedure)", // Overlap with Neurosurgery/Advanced Neuro
            "Stroke Thrombectomy (Indications & Procedure)", // Overlap with ER/Radiology/Advanced Neuro
            "Intracranial Pressure Monitoring & Management" // Overlap with Neurosurgery/Critical Care
        ],
        "requiredLevel": 11,
        "icon": "🧠"
    },
    "Anesthesiology": {
        diseases: [
            "Preoperative Assessment & Optimization (Detailed)", // Expanded
            "ASA Physical Status Classification",
            "Airway Management Techniques (LMA, Video Laryngoscopy, Fiberoptic Intubation)", // Expanded
            "General Anesthesia (Inhalational & Intravenous Agents, Monitoring)", // Expanded
            "Regional Anesthesia (Epidural, Spinal, Peripheral Nerve Blocks - Techniques & Complications)", // Expanded
            "Local Anesthesia (Pharmacology, Toxicity - LAST)", // Expanded
            "Monitored Anesthesia Care (MAC)",
            "Sedation (Procedural Sedation, ICU Sedation)", // Expanded
            "Anesthetic Pharmacology (Opioids, Benzodiazepines, Neuromuscular Blockers, Reversal Agents)",
            "Malignant Hyperthermia (Recognition & Management)", // Expanded
            "Anesthetic Drug Reactions (Allergy, Anaphylaxis)", // Expanded
            "Postoperative Pain Control (Multimodal Analgesia)", // Expanded
            "Postoperative Nausea and Vomiting (PONV) (Prevention & Management)", // Expanded
            "Postoperative Cognitive Dysfunction (POCD) / Delirium (Anesthesia Aspect)", // Overlap with Psych/Geriatrics
            "Intraoperative Monitoring (ECG, BP, SpO2, EtCO2, BIS)",
            "Hemodynamic Monitoring (Invasive & Non-Invasive - Arterial Line, CVP, PA Catheter)", // Expanded
            "Fluid Management (Intraoperative & Postoperative)",
            "Blood Transfusion (Indications & Complications)", // Overlap with Heme/Onc
            "Perioperative Management of Coagulopathy",
            "Temperature Management (Hypothermia, Hyperthermia)",
            "Airway Fire Management (Prevention & Response)", // Expanded
            "Transesophageal Echocardiography (TEE) (Basic Use in Anesthesia)", // Expanded
            "Pediatric Anesthesia Considerations (Specific Agents & Techniques)", // Expanded
            "Geriatric Anesthesia Considerations (Specific Agents & Techniques)", // Expanded
            "Anesthesia for Specific Surgeries (Cardiac, Neuro, Thoracic, Abdominal)",
            "Crisis Resource Management (CRM) in Anesthesia",
            "Anesthesia Machine & Ventilator (Basic Function)",
            "Acute Pain Service (Role & Management)",
            "Chronic Pain Management (Anesthesia Role)", // Overlap with PM&R
            "Anesthesia for Trauma Patients", // Overlap with ER/Gen Surg
            "Anesthesia for Obstetric Patients", // Overlap with OB/GYN
            "Anesthesia for Patients with Coexisting Diseases (Cardiac, Pulmonary, Renal, Hepatic)"
        ],
        "requiredLevel": 12,
        "icon": "💉"
    },
    "Radiology": {
        diseases: [ // More specific interpretations + expanded
            "CT Physics & Image Formation (Advanced)",
            "MRI Physics & Image Formation (Advanced Sequences)",
            "Ultrasound Physics & Image Formation (Advanced Doppler)",
            "Nuclear Medicine Physics & Radiopharmaceuticals (Advanced)",
            "Radiation Biology & Effects",
            "Contrast Media (Advanced Considerations)",
            "Chest X-Ray Interpretation (Pathological Patterns - Consolidation, Interstitial, Nodule, Mass, Cavity)", // Expanded
            "Abdominal X-Ray Interpretation (Detailed Bowel Gas Patterns, Calcifications, Masses)", // Expanded
            "Skeletal Radiography (Trauma, Arthritis, Tumors, Metabolic Bone Disease)", // Expanded
            "CT Head Interpretation (Detailed Stroke Imaging, Tumors, Infection, Hydrocephalus)", // Expanded
            "CT Chest Interpretation (Detailed PE, Aortic Pathology, Mediastinal Masses, ILD Patterns)", // Expanded
            "CT Abdomen/Pelvis Interpretation (Detailed Organ Pathology, Cancer Staging, Inflammatory Conditions)", // Expanded
            "MRI Brain Interpretation (Detailed Tumors, Infection, MS Lesions, Dementia Patterns)", // Expanded
            "MRI Spine Interpretation (Detailed Disc Pathology, Spinal Stenosis, Tumors, Infection)", // Expanded
            "MRI Musculoskeletal Interpretation (Ligament/Tendon Tears, Cartilage Injury, Bone Tumors)", // Expanded
            "Ultrasound Abdomen (Detailed Organ Evaluation, Ascites, Abscesses)", // Expanded
            "Ultrasound Pelvis (Detailed Gynecologic & Obstetric Pathology)", // Expanded
            "Ultrasound Vascular (Detailed DVT Evaluation, Carotid Stenosis, Aneurysms)", // Expanded
            "Doppler Ultrasound (Advanced Applications)",
            "Mammography Interpretation (Detailed Calcifications, Masses, Architectural Distortion)", // Expanded
            "Breast Ultrasound & MRI (Indications & Interpretation)", // Overlap with Gen Surg/Onc
            "Fluoroscopy (Advanced GI Studies, Swallowing Studies, Joint Injections)", // Expanded
            "Angiography (Coronary, Peripheral, Cerebral - Detailed Interpretation)", // Expanded
            "Interventional Radiology (Detailed Procedures - Embolization, Stenting, Ablation, TIPS, IVC Filter)", // Expanded
            "PET Scan (Advanced Oncology, Neurology, Cardiology Applications)", // Expanded
            "Bone Scan (Advanced Interpretation)", // Expanded
            "V/Q Scan (Advanced Interpretation)", // Expanded
            "Pediatric Radiology (Specific Conditions & Imaging Modalities)", // Expanded
            "Neuroradiology (Advanced Techniques & Pathology)", // Expanded
            "Cardiothoracic Radiology (Advanced Cardiac & Pulmonary Imaging)", // Expanded
            "Abdominal Radiology (Advanced GI/GU Pathology)", // Expanded
            "Musculoskeletal Radiology (Advanced Trauma, Arthritis, Tumors)", // Expanded
            "Genitourinary Radiology (Advanced Renal, Bladder, Prostate Imaging)", // Expanded
            "Emergency Radiology (Advanced Trauma & Acute Condition Imaging)", // Expanded
            "Cross-Sectional Anatomy (Advanced CT & MRI)", // Expanded
            "Artificial Intelligence (AI) in Radiology (Basic Concepts)",
            "Teleradiology"
        ],
        "requiredLevel": 13,
        "icon": "🩻"
    },
     "Pathology": {
        diseases: [ // Systemic Pathology + expanded
            "Autopsy Pathology (Detailed Findings)", // Expanded
            "Gross Pathology (Advanced Specimen Description)", // Expanded
            "Histopathology (Advanced Staining Techniques)", // Expanded
            "Immunohistochemistry (Advanced Applications)", // Expanded
            "Molecular Pathology (Advanced Techniques & Interpretation)", // Expanded
            "Cytogenetics (Karyotyping, FISH)", // Overlap with Genetics
            "Flow Cytometry (Principles & Applications)",
            "Cardiovascular Pathology (Congenital Heart Defects, Cardiomyopathies, Valvular Prostheses)", // Expanded
            "Pulmonary Pathology (ILD Patterns, Pulmonary Hypertension Pathology, Lung Transplant Pathology)", // Expanded
            "Gastrointestinal Pathology (Pre-malignant Lesions, IBD Pathology, Liver Transplant Pathology)", // Expanded
            "Hepatic Pathology (Specific Viral Hepatitis Findings, NAFLD Spectrum, Liver Tumors)", // Expanded
            "Renal Pathology (Specific Glomerular Disease Patterns, Renal Transplant Pathology)", // Expanded
            "Endocrine Pathology (Pituitary Adenomas, Adrenal Hyperplasia/Tumors)", // Expanded
            "Hematopathology (Detailed Leukemia, Lymphoma, Myeloma Subtypes & Diagnostics)", // Expanded
            "Coagulation Disorders (Laboratory Testing)", // Overlap with Heme/Onc
            "Neuropathology (Neurodegenerative Diseases, CNS Infections, Pediatric Neuropathology)", // Expanded
            "Skin Pathology (Specific Inflammatory Dermatoses, Complex Tumors)", // Expanded
            "Bone & Soft Tissue Pathology (Specific Tumor Types)", // Expanded
            "Infectious Disease Pathology (Histologic Patterns of Response)", // Expanded
            "Immunopathology (Autoimmune Disease Pathology in Specific Organs)", // Expanded
            "Cytopathology (Advanced Cytology - FNA, Effusions)", // Expanded
            "Forensic Pathology (Specific Injury Patterns, Toxicology Interpretation)", // Expanded
            "Gynecologic Pathology (Endometrial, Ovarian, Cervical Cancer Pathology)", // Expanded
            "Urologic Pathology (Prostate, Bladder, Renal Cancer Pathology)", // Expanded
            "Pediatric Pathology (Specific Childhood Diseases & Tumors)", // Expanded
            "Transplant Pathology (Detailed Rejection Grading)", // Expanded
            "Neoplasia (Molecular Basis of Cancer, Tumor Microenvironment)", // Expanded
            "Tumor Markers (Pathology & Lab Aspects)", // Expanded
            "Frozen Section Interpretation (Advanced)", // Expanded
            "Laboratory Management & Quality Control",
            "Blood Banking & Transfusion Medicine (Laboratory Aspects)", // Overlap with Heme/Onc
            "Clinical Chemistry (Advanced Interpretation of Labs)", // Overlap with IM/Nephro/Endo
            "Clinical Microbiology (Laboratory Identification Methods)", // Overlap with Micro/ID
            "Clinical Hematology (Advanced CBC Interpretation, Coagulation Studies)", // Overlap with Heme/Onc
            "Point-of-Care Testing"
        ],
        "requiredLevel": 14,
        "icon": "🔬"
    },
     "Genetics": {
        diseases: [
            "DNA Structure, Replication, Transcription, Translation (Review)", // Overlap with Biochem
            "Chromosomal Abnormalities (Detailed Syndromes - Trisomies, Monosomies, Deletions, Duplications)", // Expanded
            "Single Gene Disorders (Autosomal Dominant, Autosomal Recessive, X-linked, Mitochondrial Inheritance Patterns)", // Expanded
            "Hardy-Weinberg Principle",
            "Linkage & Recombination",
            "Gene Mapping Techniques",
            "Mitochondrial Disorders (Genetics & Clinical Presentation)", // Expanded
            "Imprinting Disorders (Prader-Willi, Angelman)", // Expanded
            "Triplet Repeat Expansion Disorders (Huntington's, Fragile X, Myotonic Dystrophy)", // Expanded
            "Genetic Counseling Principles (Risk Assessment, Communication, Ethical Issues)", // Expanded
            "Prenatal Screening (NIPT, Maternal Serum Screening) & Diagnosis (Amniocentesis, CVS)", // Expanded
            "Carrier Screening (Common Conditions - CF, SMA, Tay-Sachs)", // Expanded
            "Newborn Screening Programs",
            "Hereditary Cancer Syndromes (BRCA1/2, Lynch Syndrome, FAP, Li-Fraumeni)", // Expanded
            "Pharmacogenetics (Drug Metabolism Enzymes, Drug Response Variants)", // Expanded
            "Gene Therapy (Viral Vectors, CRISPR-Cas9)", // Expanded
            "Genetic Testing Technologies (PCR, Sanger Sequencing, Next-Generation Sequencing, Microarrays)", // Expanded
            "Epigenetics (DNA Methylation, Histone Modification)",
            "Mendelian vs. Complex Inheritance",
            "Mitochondrial Disorders (Genetics Aspect)", // Expanded
            "Lysosomal Storage Diseases (Genetics & Clinical Presentation)", // Expanded
            "Peroxisomal Disorders",
            "Inborn Errors of Metabolism (Genetic Basis & Diagnosis)", // Expanded
            "Connective Tissue Disorders (Marfan, Ehlers-Danlos - Genetics)", // Overlap with Rheum/Ortho/Cardio
            "Skeletal Dysplasias (Genetics)", // Overlap with Ortho/Peds
            "Neurogenetics (Specific Disorders - ALS, Parkinson's, Alzheimer's - Genetic Forms)", // Expanded
            "Cardiogenetics (Hereditary Cardiomyopathies, Channelopathies)", // Overlap with Cardio
            "Renal Genetics (PKD, Alport, Fabry)", // Overlap with Nephro
            "Endocrine Genetics (MEN Syndromes, Congenital Adrenal Hyperplasia)", // Overlap with Endo
            "Immunogenetics (HLA System, Immunodeficiency Syndromes)", // Overlap with Allergy/Immuno
            "Cancer Genetics (Somatic vs. Germline Mutations)", // Overlap with Heme/Onc
            "Genetic Syndromes with Multiple Organ Involvement (Neurofibromatosis, Tuberous Sclerosis, Von Hippel-Lindau)", // Expanded
            "Ethical, Legal, and Social Implications (ELSI) of Genetics" // Overlap with Ethics
        ],
        "requiredLevel": 15,
        "icon": "🧬"
    },


    // --- Level 16-30: Specialized & Cross-System Fields ---
    "Infectious Diseases": {
        diseases: [
            "Principles of Antimicrobial Stewardship",
            "Antibiotic Resistance Mechanisms",
            "Healthcare-Associated Infections (HAIs) (Prevention & Management)",
            "Infections in Immunocompromised Hosts (HIV, Transplant, Chemotherapy)", // Expanded
            "Fever of Unknown Origin (FUO) (Evaluation)",
            "Sepsis (Advanced Pathophysiology & Management)", // Expanded
            "Septic Shock (Management)", // Overlap with Critical Care/ER
            "Endocarditis (Infectious) (Advanced Management)", // Expanded
            "Osteomyelitis (Diagnosis & Management)", // Expanded
            "Septic Arthritis (Diagnosis & Management)", // Overlap with Ortho/Rheum
            "Cellulitis & Erysipelas (Advanced Management)", // Expanded
            "Necrotizing Fasciitis (Diagnosis & Management)", // Expanded
            "Clostridioides difficile Infection (Advanced Treatment & Prevention)", // Expanded
            "Tuberculosis (Extrapulmonary TB, Drug-Resistant TB Management)", // Expanded
            "Non-Tuberculous Mycobacteria (NTM) (Advanced)", // Expanded
            "HIV/AIDS (Advanced Antiretroviral Therapy, Opportunistic Infections)", // Expanded
            "Hepatitis B (Advanced Antiviral Therapy)", // Expanded
            "Hepatitis C (Advanced Antiviral Therapy)", // Expanded
            "Malaria (Diagnosis, Treatment of Specific Species, Prevention)", // Expanded
            "Dengue Fever (Diagnosis & Management)", // Expanded
            "Zika Virus Infection (Clinical Syndromes & Prevention)", // Expanded
            "Ebola Virus Disease (Management & Containment)", // Expanded
            "Lyme Disease (Stages & Treatment)", // Expanded
            "Tick-borne Illnesses (Anaplasmosis, Ehrlichiosis, Rocky Mountain Spotted Fever)", // Overlap with Micro
            "West Nile Virus (Clinical Syndromes)", // Expanded
            "Chikungunya Virus Infection", // Expanded
            "Rabies (Post-exposure Prophylaxis & Management)", // Expanded
            "Influenza (Antiviral Resistance, Pandemic Preparedness)", // Expanded
            "COVID-19 (Advanced Management, Long COVID)", // Expanded
            "Sexually Transmitted Infections (STIs) (Advanced Diagnosis & Management - Syphilis, Gonorrhea, Chlamydia, HSV, HPV, HIV)", // Expanded
            "Fungal Infections (Systemic Mycoses - Histoplasmosis, Blastomycosis, Coccidioidomycosis, Cryptococcosis)", // Expanded
            "Aspergillosis (Invasive & Allergic)",
            "Candidiasis (Invasive)",
            "Pneumocystis Jirovecii Pneumonia (PCP)", // Expanded
            "Parasitic Infections (Advanced Diagnosis & Treatment - Amebiasis, Giardiasis, Schistosomiasis, Tapeworms, Roundworms)", // Expanded
            "Travel Medicine (Vaccinations, Prophylaxis, Post-Travel Evaluation)", // Expanded
            "Tropical Diseases (Leishmaniasis, Trypanosomiasis, Filarial Infections)", // Expanded
            "Vaccine-Preventable Diseases (Epidemiology & Control)", // Overlap with Prev Med/Peds
            "Infection Control & Epidemiology",
            "Outbreak Investigation",
            "Bioterrorism Agents (Recognition & Initial Response)",
            "Post-Exposure Prophylaxis (PEP) (HIV, Hepatitis, Rabies)",
            "Prophylactic Antibiotics (Surgical, Medical Indications)",
            "Antimicrobial Susceptibility Testing (Interpretation)" // Overlap with Micro/Pathology
        ],
        "requiredLevel": 16,
        "icon": "🦠"
    },
    "Rheumatology": {
        diseases: [
            "Immunology (Advanced - B Cells, T Cells, Cytokines, Complement)", // Overlap with Physio/Allergy/Immuno
            "Autoimmunity (Mechanisms & Pathogenesis)", // Overlap with Allergy/Immuno
            "Rheumatoid Arthritis (Advanced Pathogenesis, Diagnosis, Disease-Modifying Therapies, Complications)", // Expanded
            "Systemic Lupus Erythematosus (SLE) (Diagnosis, Organ Manifestations, Management)", // Expanded
            "Sjogren's Syndrome (Diagnosis & Management)", // Expanded
            "Systemic Sclerosis (Scleroderma) (Types, Organ Involvement, Management)", // Expanded
            "Polymyalgia Rheumatica (PMR) (Diagnosis & Management)", // Expanded
            "Giant Cell Arteritis (Temporal Arteritis) (Diagnosis & Management)", // Expanded
            "Takayasu Arteritis",
            "Polyarteritis Nodosa (PAN)", // Expanded
            "Granulomatosis with Polyangiitis (GPA) (Wegener's)", // Expanded
            "Microscopic Polyangiitis (MPA)", // Expanded
            "Eosinophilic Granulomatosis with Polyangiitis (EGPA) (Churg-Strauss)", // Expanded
            "Other Vasculitides (Cryoglobulinemic, IgA Vasculitis)", // Expanded
            "Psoriatic Arthritis (Diagnosis & Management)", // Expanded
            "Ankylosing Spondylitis (Diagnosis & Management)", // Expanded
            "Other Spondyloarthropathies (Reactive Arthritis, Enteropathic Arthritis)", // Expanded
            "Gout (Acute & Chronic Management, Urate-Lowering Therapy)", // Expanded
            "Pseudogout (CPPD Disease)", // Expanded
            "Calcium Hydroxyapatite Deposition Disease (CHADD)",
            "Osteoarthritis (Pathogenesis, Diagnosis, Medical Management)", // Expanded
            "Fibromyalgia (Diagnosis & Management)", // Expanded
            "Polymyositis & Dermatomyositis (Diagnosis & Management)",
            "Inclusion Body Myositis",
            "Scleroderma (Systemic Sclerosis) (Advanced)", // Expanded
            "Mixed Connective Tissue Disease (MCTD)", // Expanded
            "Undifferentiated Connective Tissue Disease (UCTD)",
            "Antiphospholipid Syndrome (APS)",
            "Sarcoidosis (Rheumatologic Manifestations)", // Overlap with Pulm/IM
            "Amyloidosis (Rheumatologic Manifestations)", // Overlap with Pathology/IM
            "Osteoporosis (Diagnosis, Risk Factors, Advanced Management)", // Expanded
            "Septic Arthritis (Diagnosis & Management)", // Expanded
            "Crystal-Induced Arthritis (Other)",
            "Lyme Arthritis (Rheum Aspect)", // Overlap with ID
            "Rheumatic Fever",
            "Juvenile Idiopathic Arthritis (JIA) (Advanced Management)", // Overlap with Peds
            "Pediatric Rheumatologic Diseases (Specific Types)", // Overlap with Peds
            "Immunosuppressive Medications (DMARDs, Biologics - Indications & Side Effects)",
            "Corticosteroids (Use & Side Effects in Rheum)",
            "Joint Aspiration & Injection (Procedure)", // Overlap with Ortho/PM&R
            "Autoantibody Testing (ANA, RF, Anti-CCP, ANCA, etc.) (Interpretation)", // Overlap with Pathology/Lab Med
            "Synovial Fluid Analysis (Interpretation)", // Overlap with Pathology/Lab Med
            "Musculoskeletal Ultrasound (Rheumatology Use)", // Overlap with Radiology
            "Rheumatologic Emergencies (Spinal Cord Compression in AS, Vasculitic Crisis)"
        ],
        "requiredLevel": 18,
        "icon": "🦾"
    },
    "Hematology/Oncology": {
        diseases: [
            "Hematopoiesis (Physiology)", // Overlap with Physio
            "Blood Cell Morphology (Normal & Abnormal)", // Overlap with Pathology
            "Anemia (Classification, Diagnosis, Management - Microcytic, Macrocytic, Normocytic)",
            "Iron Deficiency Anemia (Advanced)", // Expanded
            "Megaloblastic Anemia (B12, Folate Deficiency)",
            "Anemia of Chronic Disease",
            "Hemolytic Anemias (Intrinsic & Extrinsic Causes - G6PD, Sickle Cell, Thalassemia, Autoimmune Hemolytic Anemia)", // Expanded
            "Aplastic Anemia (Diagnosis & Management)", // Expanded
            "Myelodysplastic Syndrome (MDS) (Diagnosis & Management)", // Expanded
            "Myeloproliferative Neoplasms (CML, PV, ET, MF)",
            "Acute Lymphoblastic Leukemia (ALL) (Diagnosis & Treatment)", // Expanded
            "Acute Myeloid Leukemia (AML) (Diagnosis & Treatment)", // Expanded
            "Chronic Lymphocytic Leukemia (CLL) (Diagnosis & Treatment)", // Expanded
            "Chronic Myelogenous Leukemia (CML) (Diagnosis & Treatment)", // Expanded
            "Hodgkin Lymphoma (Diagnosis, Staging, Treatment)", // Expanded
            "Non-Hodgkin Lymphoma (Subtypes, Diagnosis, Staging, Treatment)", // Expanded
            "Multiple Myeloma (Diagnosis, Staging, Treatment)", // Expanded
            "Plasma Cell Disorders (MGUS, Smoldering Myeloma)",
            "Amyloidosis (Hematologic Aspects)", // Overlap with Pathology/IM/Nephro/Cardio
            "Bleeding Disorders (Platelet Disorders, Coagulation Factor Deficiencies)",
            "Immune Thrombocytopenic Purpura (ITP) (Diagnosis & Management)", // Expanded
            "Thrombotic Thrombocytopenic Purpura (TTP) / Hemolytic Uremic Syndrome (HUS) (Adult) (Diagnosis & Management)", // Expanded
            "Disseminated Intravascular Coagulation (DIC) (Diagnosis & Management)", // Expanded
            "Heparin-Induced Thrombocytopenia (HIT) (Diagnosis & Management)", // Expanded
            "Hemophilia (Diagnosis & Management)", // Expanded
            "Von Willebrand Disease (Diagnosis & Management)", // Expanded
            "Hypercoagulable States (Thrombophilia - Factor V Leiden, Prothrombin Gene Mutation, Antithrombin Deficiency, Protein C/S Deficiency, APS)", // Expanded
            "Thrombosis (Venous & Arterial) (Heme Aspect)", // Overlap with Cardio/Pulm/IM/ER
            "Anticoagulation (Heparin, Warfarin, DOACs - Indications & Management)", // Expanded
            "Antiplatelet Therapy (Aspirin, Clopidogrel, etc.)",
            "Blood Banking & Transfusion Medicine (Blood Types, Crossmatching, Transfusion Reactions)", // Expanded
            "Hematopoietic Stem Cell Transplantation (Bone Marrow Transplant) (Indications, Procedure, Complications)", // Expanded
            "Cellular Therapy (CAR-T, etc.) (Indications & Principles)", // Expanded
            "Tumor Biology (Genetics of Cancer, Metastasis)", // Overlap with Pathology/Genetics
            "Cancer Staging Systems (TNM)",
            "Principles of Cancer Treatment (Surgery, Radiation, Chemotherapy, Targeted Therapy, Immunotherapy)", // Expanded
            "Chemotherapy (Specific Agents, Mechanisms, Side Effects, Management)", // Expanded
            "Radiation Therapy (Principles & Side Effects)", // Expanded
            "Targeted Therapy in Cancer (Specific Agents & Targets)", // Expanded
            "Immunotherapy in Cancer (Checkpoint Inhibitors, CAR-T) (Advanced)", // Expanded
            "Oncologic Emergencies (Spinal Cord Compression, SVC Syndrome, Neutropenic Fever, Tumor Lysis Syndrome)", // Expanded
            "Management of Cancer Pain (Oncology Aspect)", // Overlap with Palliative Care
            "Palliative Care in Oncology", // Overlap with Palliative Care
            "Cancer Genetics (Germline & Somatic Testing)", // Overlap with Genetics/Pathology
            "Lung Cancer (Subtypes, Staging, Treatment)", // Expanded
            "Breast Cancer (Subtypes, Staging, Treatment)", // Expanded
            "Colorectal Cancer (Subtypes, Staging, Treatment)", // Expanded
            "Prostate Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Pancreatic Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Ovarian Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Gastric Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Liver Cancer (HCC, Cholangiocarcinoma) (Diagnosis, Staging, Treatment)", // Expanded
            "Cervical Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Esophageal Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Bladder Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Renal Cell Carcinoma (Diagnosis, Staging, Treatment)", // Expanded
            "Head & Neck Cancer (Diagnosis, Staging, Treatment)", // Expanded
            "Sarcoma (Diagnosis, Staging, Treatment)", // Expanded
            "Brain Tumors (Primary & Metastatic) (Oncologic Management)", // Expanded
            "Skin Cancer (Melanoma, BCC, SCC - Oncologic Management)", // Overlap with Derm/Gen Surg
            "Pediatric Oncology (Specific Childhood Cancers - ALL, Neuroblastoma, Wilms)", // Overlap with Peds
            "Cancer Screening Guidelines (Oncology Perspective)", // Overlap with Prev Med
            "Survivorship Care in Oncology",
            "Oncologic Imaging Interpretation (CT, PET, MRI)", // Overlap with Radiology
            "Bone Marrow Biopsy (Procedure & Interpretation)", // Overlap with Pathology
            "Lymph Node Biopsy (Procedure & Interpretation)", // Overlap with Gen Surg/Pathology
            "Paraneoplastic Syndromes"
        ],
        "requiredLevel": 20,
        "icon": "🎗️"
    },
    "Orthopedics": {
        diseases: [
            "Musculoskeletal Anatomy (Detailed - Bones, Joints, Muscles, Ligaments, Tendons)", // Overlap with Anatomy
            "Fracture Healing (Physiology & Factors Affecting)",
            "Fracture Classification Systems (Salter-Harris, Gustilo-Anderson)",
            "Fracture Management (Reduction, Casting, Splinting, Internal Fixation, External Fixation)", // Expanded
            "Specific Fractures (Upper Extremity, Lower Extremity, Spine, Pelvis)",
            "Osteoarthritis (Advanced Pathogenesis, Diagnosis, Surgical Management - Arthroplasty)", // Expanded
            "Rheumatoid Arthritis (Orthopedic Manifestations & Surgical Options)", // Overlap with Rheum
            "Septic Arthritis (Diagnosis & Surgical Management)", // Expanded
            "Osteomyelitis (Diagnosis & Surgical Management)", // Expanded
            "Ligament Injuries (ACL, PCL, MCL, LCL Tears - Diagnosis & Surgical Repair/Reconstruction)", // Expanded
            "Tendon Injuries (Rotator Cuff Tears, Achilles Tendon Rupture - Diagnosis & Surgical Repair)", // Expanded
            "Meniscal Tears (Diagnosis & Surgical Management - Arthroscopy)", // Expanded
            "Cartilage Injuries (Diagnosis & Management)",
            "Joint Dislocation (Reduction Techniques & Management)", // Expanded
            "Spinal Stenosis (Causes, Diagnosis, Surgical Options - Laminectomy, Fusion)", // Expanded
            "Herniated Disc (Cervical & Lumbar) (Orthopedic Management)", // Overlap with Neuro/PM&R
            "Spondylolisthesis & Spondylolysis",
            "Scoliosis (Diagnosis & Surgical Correction)", // Expanded
            "Kyphosis",
            "Low Back Pain (Orthopedic Causes & Management)", // Overlap with IM/PM&R/Neuro
            "Neck Pain (Orthopedic Causes & Management)", // Overlap with IM/PM&R/Neuro
            "Shoulder Impingement Syndrome",
            "Rotator Cuff Tendinopathy", // Expanded
            "Lateral & Medial Epicondylitis (Tennis/Golfer's Elbow)",
            "Carpal Tunnel Syndrome (Diagnosis & Surgical Release)", // Expanded
            "Trigger Finger",
            "De Quervain's Tenosynovitis",
            "Ganglion Cyst",
            "Plantar Fasciitis (Orthopedic Management)", // Expanded
            "Achilles Tendinopathy",
            "Bunions (Hallux Valgus)",
            "Stress Fracture (Diagnosis & Management)", // Expanded
            "Compartment Syndrome (Diagnosis & Surgical Management - Fasciotomy)", // Expanded
            "Osteonecrosis (Avascular Necrosis) (Causes & Management)", // Expanded
            "Osteochondritis Dissecans",
            "Bone Tumors (Benign & Malignant - Osteosarcoma, Ewing Sarcoma, Metastatic Disease) (Orthopedic Management)", // Overlap with Heme/Onc/Radiology
            "Soft Tissue Tumors (Orthopedic Management)", // Overlap with Gen Surg/Heme/Onc
            "Pediatric Orthopedics (Specific Conditions - DDH, SCFE, Legg-Calvé-Perthes, Osgood-Schlatter)", // Expanded
            "Clubfoot (Talipes Equinovarus)",
            "Developmental Flatfoot",
            "Cerebral Palsy (Orthopedic Management)", // Overlap with Peds/PM&R
            "Spina Bifida (Orthopedic Management)", // Overlap with Peds/PM&R
            "Amputation (Surgical Technique & Postoperative Care)", // Overlap with Gen Surg
            "Prosthetics & Orthotics (Orthopedic Prescription)", // Overlap with PM&R
            "Sports Medicine (Specific Injuries & Rehabilitation Principles)", // Overlap with PM&R
            "Arthroplasty (Total Joint Replacement - Hip, Knee, Shoulder)", // Expanded
            "Arthroscopy (Joint Scopy Procedures)", // Expanded
            "Spine Surgery (Fusion, Decompression)", // Expanded
            "Hand Surgery (Fractures, Tendon Injuries, Nerve Compression)",
            "Foot & Ankle Surgery",
            "Orthopedic Trauma (Complex Fractures, Polytrauma Management)", // Overlap with ER/Gen Surg
            "Rehabilitation after Orthopedic Surgery", // Overlap with PM&R
            "Orthopedic Imaging Interpretation (X-ray, CT, MRI)", // Overlap with Radiology
            "Bone Biopsy (Procedure & Interpretation)", // Overlap with Radiology/Pathology
            "Joint Injection & Aspiration (Procedure)" // Overlap with Rheum/PM&R
        ],
        "requiredLevel": 22,
        "icon": "🦴"
    },
    "Urology": {
        diseases: [
            "Renal & Urinary System Anatomy (Detailed)", // Overlap with Anatomy
            "Benign Prostatic Hyperplasia (BPH) (Diagnosis & Advanced Management - Medical & Surgical)", // Expanded
            "Prostate Cancer (Diagnosis, Staging, Management - Surgical, Radiation, Hormonal)", // Expanded
            "PSA Screening (Indications & Interpretation)",
            "Bladder Cancer (Diagnosis, Staging, Management - TURBT, Cystectomy)", // Expanded
            "Kidney Stones (Urolithiasis) (Formation, Types, Medical & Surgical Management - ESWL, Ureteroscopy, PCNL)", // Expanded
            "Urinary Tract Obstruction (Causes & Management)", // Expanded
            "Pyelonephritis (Urology Management)", // Expanded
            "Cystitis (Bacterial & Interstitial)", // Expanded
            "Urethritis (Causes & Treatment)",
            "Epididymitis & Orchitis",
            "Prostatitis (Types & Management)",
            "Testicular Cancer (Diagnosis, Staging, Management - Orchiectomy, Chemotherapy)", // Expanded
            "Scrotal Masses (Evaluation)",
            "Varicocele (Diagnosis & Management)", // Expanded
            "Hydrocele (Diagnosis & Management)", // Expanded
            "Spermatocele",
            "Undescended Testis (Cryptorchidism) (Diagnosis & Management)", // Expanded
            "Testicular Torsion (Diagnosis & Surgical Management)", // Overlap with ER
            "Erectile Dysfunction (Causes, Evaluation, & Treatment)", // Expanded
            "Peyronie's Disease",
            "Priapism (Management)", // Expanded
            "Male Infertility (Evaluation & Treatment)",
            "Female Urinary Incontinence (Stress, Urge, Overflow) (Urology Evaluation & Management)", // Expanded
            "Pelvic Organ Prolapse (Urology Aspect)", // Overlap with OB/GYN
            "Neurogenic Bladder (Causes & Management)", // Expanded
            "Hematuria (Evaluation - Cystoscopy, Imaging)", // Expanded
            "Proteinuria (Urology Aspect)", // Overlap with Nephro
            "Renal Cell Carcinoma (Diagnosis, Staging, Management - Nephrectomy)", // Expanded
            "Upper Tract Urothelial Carcinoma",
            "Adrenal Masses (Urology Aspect)", // Overlap with Endo/Gen Surg
            "Pediatric Urology (Specific Conditions - Hypospadias, Epispadias, Vesicoureteral Reflux, Ureteropelvic Junction Obstruction)", // Overlap with Peds
            "Urologic Trauma (Kidney, Bladder, Urethral Injury)", // Overlap with ER/Gen Surg
            "Urologic Procedures (Cystoscopy, TURP, TURBT, Nephrectomy, Prostatectomy)",
            "Urologic Imaging (CT Urogram, Ultrasound, Cystogram)", // Overlap with Radiology
            "Urodynamic Studies (Indications & Interpretation)",
            "Management of Urostomies & Catheters"
        ],
        "requiredLevel": 24,
        "icon": "💧"
    },
    "Ophthalmology": {
        diseases: [
            "Eye Anatomy & Physiology (Detailed)", // Overlap with Anatomy/Physio
            "Visual Acuity Testing",
            "Slit Lamp Examination (Technique & Findings)",
            "Fundoscopy (Technique & Interpretation)",
            "Intraocular Pressure Measurement (Tonometry)",
            "Refractive Errors (Myopia, Hyperopia, Astigmatism, Presbyopia) (Diagnosis & Correction)", // Expanded
            "Cataracts (Types, Diagnosis, Surgical Management - Phacoemulsification)", // Expanded
            "Glaucoma (Types - Open-Angle, Angle-Closure; Pathophysiology, Diagnosis, Medical & Surgical Management)", // Expanded
            "Macular Degeneration (Dry & Wet) (Diagnosis & Treatment - Anti-VEGF)", // Expanded
            "Diabetic Retinopathy (Stages, Screening, Treatment - Laser, Anti-VEGF)", // Expanded
            "Retinal Detachment (Types, Diagnosis, Surgical Management)", // Expanded
            "Retinal Vascular Occlusions (Central/Branch Retinal Artery/Vein Occlusion) (Diagnosis & Management)", // Expanded
            "Uveitis (Anterior, Intermediate, Posterior) (Causes & Management)", // Expanded
            "Scleritis & Episcleritis", // Expanded
            "Keratitis (Bacterial, Viral, Fungal) (Causes & Treatment)", // Expanded
            "Corneal Ulcer (Causes & Treatment)", // Expanded
            "Dry Eye Syndrome (Causes & Management)", // Expanded
            "Blepharitis (Types & Management)", // Expanded
            "Chalazion & Hordeolum (Stye) (Management)", // Expanded
            "Orbital Cellulitis",
            "Preseptal vs. Orbital Cellulitis",
            "Conjunctivitis (Bacterial, Viral, Allergic) (Diagnosis & Management)", // Expanded
            "Strabismus (Types & Management)", // Expanded
            "Amblyopia (Lazy Eye) (Diagnosis & Management)", // Expanded
            "Optic Neuritis (Causes & Management)", // Expanded
            "Papilledema (Causes & Evaluation)", // Expanded
            "Visual Field Defects (Causes & Interpretation)", // Overlap with Neuro
            "Neuro-Ophthalmology (Specific Conditions)", // Overlap with Neuro
            "Retinopathy of Prematurity (ROP) (Ophtho Management)", // Expanded
            "Pediatric Ophthalmology (Specific Conditions - Congenital Cataracts, Glaucoma, Retinoblastoma)", // Overlap with Peds
            "Ocular Trauma (Chemical Burns, Globe Rupture, Orbital Fractures)", // Overlap with ER/Gen Surg
            "Chemical Eye Burns (Management)",
            "Globe Rupture (Management)",
            "Orbital Fractures (Ophtho Aspect)", // Overlap with ER/ENT/Gen Surg
            "Giant Cell Arteritis (Ocular Manifestations)", // Overlap with Rheum
            "Thyroid Eye Disease (Graves' Ophthalmopathy) (Diagnosis & Management)", // Overlap with Endo
            "Neurofibromatosis (Ocular Manifestations)", // Overlap with Neuro/Genetics
            "Tuberous Sclerosis (Ocular Manifestations)", // Overlap with Neuro/Genetics
            "Von Hippel-Lindau Disease (Ocular Manifestations)", // Overlap with Neuro/Genetics
            "Intraocular Tumors (Melanoma, Metastases)", // Overlap with Heme/Onc/Radiology
            "Ophthalmic Procedures (Laser Photocoagulation, Vitrectomy, Scleral Buckle)",
            "Ophthalmic Imaging (OCT, Fundus Photography, Fluorescein Angiography)", // Overlap with Radiology
            "Contact Lens Complications",
            "Low Vision Rehabilitation" // Overlap with PM&R
        ],
        "requiredLevel": 26,
        "icon": "👁️"
    },
    "Otolaryngology (ENT)": {
        diseases: [
            "Ear Anatomy & Physiology (Detailed)", // Overlap with Anatomy/Physio
            "Nose & Sinus Anatomy & Physiology (Detailed)", // Overlap with Anatomy/Physio
            "Throat & Larynx Anatomy & Physiology (Detailed)", // Overlap with Anatomy/Physio
            "Audiometry (Interpretation)",
            "Tympanometry (Interpretation)",
            "Otitis Media (Acute & Chronic) (Diagnosis & Management)", // Expanded
            "Otitis Externa (Causes & Management)", // Expanded
            "Mastoiditis (Diagnosis & Management)",
            "Cholesteatoma (Diagnosis & Surgical Management)", // Expanded
            "Tympanic Membrane Perforation (Causes & Management)",
            "Otosclerosis (Diagnosis & Management)", // Expanded
            "Hearing Loss (Conductive, Sensorineural, Mixed) (Causes & Evaluation)", // Expanded
            "Sudden Sensorineural Hearing Loss (SSNHL)",
            "Tinnitus (Causes & Management)", // Expanded
            "Vertigo & Dizziness (ENT Causes - BPPV, Meniere's, Labyrinthitis, Vestibular Neuritis)", // Expanded
            "Meniere’s Disease (Diagnosis & Management)", // Expanded
            "Labyrinthitis (Diagnosis & Management)", // Expanded
            "Vestibular Neuritis",
            "Acoustic Neuroma (Vestibular Schwannoma) (Diagnosis & Management)", // Expanded
            "Sinusitis (Acute & Chronic) (Diagnosis & Management)", // Expanded
            "Nasal Polyps (Causes & Management)", // Expanded
            "Allergic Rhinitis (ENT Aspect)", // Overlap with IM/Allergy/Immuno
            "Non-Allergic Rhinitis",
            "Epistaxis (Causes & Management)", // Expanded
            "Deviated Nasal Septum (Diagnosis & Management)", // Expanded
            "Nasal Fractures",
            "Pharyngitis (Causes & Management)", // Expanded
            "Tonsillitis (Causes & Management)", // Expanded
            "Peritonsillar Abscess (Diagnosis & Management)",
            "Retropharyngeal Abscess",
            "Laryngitis (Causes & Management)", // Expanded
            "Vocal Cord Nodules & Polyps (Diagnosis & Management)", // Expanded
            "Laryngeal Papillomatosis",
            "Dysphagia (Causes & Evaluation - Swallowing Studies)", // Expanded
            "Hoarseness (Causes & Evaluation)",
            "Sleep Apnea (ENT Surgical Options - UPPP, etc.)", // Overlap with Pulm
            "Head & Neck Cancer (Oral Cavity, Pharynx, Larynx, Salivary Glands, Thyroid) (Diagnosis, Staging, Management - Surgery, Radiation, Chemotherapy)", // Expanded
            "Salivary Gland Disorders (Sialadenitis, Sialolithiasis, Tumors)",
            "Neck Masses (Evaluation)",
            "Thyroid Nodules & Cancer (ENT Surgical Management)", // Overlap with Endo/Gen Surg
            "Parathyroid Adenoma (ENT Surgical Management)", // Overlap with Endo/Gen Surg
            "Tracheostomy (Indications, Procedure, Management)", // Expanded
            "Subglottic Stenosis",
            "Zenker’s Diverticulum (Diagnosis & Management)", // Expanded
            "Epiglottitis (Pediatric & Adult) (Management)", // Expanded
            "Foreign Body Aspiration/Ingestion (ENT Aspect)", // Overlap with ER/Peds/Pulm/GI
            "Temporal Bone Fracture (ENT Aspect)", // Expanded
            "Barotrauma (Ear & Sinus)", // Expanded
            "Eustachian Tube Dysfunction", // Expanded
            "Cochlear Implants (Indications & Procedure)",
            "Hearing Aids (Types & Fitting)",
            "ENT Imaging Interpretation (CT Sinus, CT Temporal Bone, MRI Head/Neck)", // Overlap with Radiology
            "Endoscopic Sinus Surgery (Indicology & Procedure)",
            "Tonsillectomy & Adenoidectomy (Indications & Procedure)", // Expanded
            "Myringotomy & Tube Insertion (Procedure)",
            "Septoplasty & Rhinoplasty",
            "Management of Airway Emergencies (ENT Aspect)", // Overlap with ER/Anesthesia/Critical Care
            "Pediatric ENT (Specific Conditions)", // Overlap with Peds
            "Facial Trauma (ENT Aspect)" // Overlap with ER/Gen Surg/Plastic Surgery
        ],
        "requiredLevel": 28,
        "icon": "👂"
    },
    "Physical Medicine & Rehabilitation (PM&R)": {
        diseases: [
            "Principles of Rehabilitation Medicine",
            "Functional Assessment Tools",
            "Assistive Devices (Canes, Walkers, Wheelchairs - Prescription & Training)", // Expanded
            "Prosthetics & Orthotics (Prescription & Management)", // Expanded
            "Stroke Rehabilitation (Motor, Sensory, Cognitive, Communication Deficits)", // Expanded
            "Spinal Cord Injury Rehab (Classification, Functional Outcomes, Management of Complications)", // Expanded
            "Traumatic Brain Injury Rehab (Cognitive, Behavioral, Motor Deficits)", // Expanded
            "Amputation Rehabilitation (Prosthetic Training, Pain Management)", // Expanded
            "Musculoskeletal Pain (Back/Neck Pain - Non-Surgical Management, Injections, Therapy)", // Expanded
            "Sports Injuries Rehab (Specific Injury Protocols)", // Expanded
            "Neuropathic Pain Management (Pharmacologic & Non-Pharmacologic)", // Expanded
            "Spasticity Management (Pharmacologic, Botulinum Toxin, Intrathecal Baclofen Pump)", // Expanded
            "Electrodiagnostic Medicine (EMG/NCS - Principles & Interpretation)", // Expanded
            "Peripheral Nerve Injuries (Rehab)", // Overlap with Neuro/Ortho
            "Myopathy (Rehab)", // Overlap with Neuro
            "Muscular Dystrophies (Rehab)", // Overlap with Peds/Genetics/Neuro
            "Cerebral Palsy (Rehab Management)", // Expanded
            "Spina Bifida (Rehab Management)", // Expanded
            "Multiple Sclerosis (Rehab Management)", // Overlap with Neuro
            "Parkinson's Disease (Rehab Management)", // Overlap with Neuro
            "Post-Polio Syndrome (Management)", // Expanded
            "Chronic Pain Syndromes (Complex Regional Pain Syndrome, Fibromyalgia - Rehab Approach)", // Overlap with Rheum
            "Osteoarthritis (Non-Surgical & Post-Surgical Rehab)", // Overlap with Ortho
            "Rheumatoid Arthritis (Rehab Management)", // Overlap with Rheum
            "Burn Rehabilitation", // Overlap with ER/Gen Surg
            "Cardiac Rehabilitation (Phases & Components)", // Expanded
            "Pulmonary Rehabilitation (Indications & Components)", // Expanded
            "Cancer Rehabilitation (Addressing Cancer Treatment Side Effects)", // Expanded
            "Pediatric Rehabilitation (Specific Childhood Conditions)", // Expanded
            "Geriatric Rehabilitation (Falls Prevention, Frailty Management)", // Overlap with Geriatrics/Prev Med
            "Vestibular Rehabilitation (for Dizziness/Vertigo)", // Overlap with ENT/Neuro
            "Speech and Language Pathology (Role in Rehab)",
            "Occupational Therapy (Role in Rehab)",
            "Physical Therapy (Role in Rehab)",
            "Recreational Therapy (Role in Rehab)",
            "Vocational Rehabilitation",
            "Disability Evaluation & Impairment Rating",
            "Injections (Trigger Point, Joint, Nerve Block - PM&R)", // Overlap with Ortho/Rheum/Anesthesia
            "Spinal Cord Stimulation (Indications & Management)", // Overlap with Neurosurgery/Anesthesia
            "Intrathecal Drug Delivery Systems (Pain/Spasticity)", // Overlap with Neurosurgery/Anesthesia
            "Rehabilitation Psychology"
        ],
        "requiredLevel": 30,
        "icon": "🏃‍♀️" // Using same icon as Physio, maybe find a wheelchair? ♿
    },

    // --- Level 31-40: Specialized Contexts & Advanced Topics ---
    "Preventive Medicine": {
        diseases: [
            "Epidemiology (Basic Principles - Incidence, Prevalence, Study Designs)",
            "Biostatistics (Basic Concepts)",
            "Health Behavior Change Models",
            "Adult Vaccination Schedules (Detailed)", // Expanded
            "Pediatric Vaccination Schedules (Review)", // Overlap with Peds
            "Cancer Screening Guidelines (Detailed Recommendations - Colonoscopy, Mammography, Pap Smear, Low-Dose CT for Lung, PSA Debate)", // Expanded
            "Cardiovascular Disease Prevention (Risk Factor Modification - Diet, Exercise, Lipids, BP)", // Overlap with IM/Cardio
            "Smoking Cessation Programs (Pharmacotherapy & Behavioral Interventions)", // Expanded
            "Obesity Prevention Strategies (Public Health & Individual)", // Expanded
            "Diabetes Prevention Programs (Lifestyle & Pharmacotherapy)", // Overlap with IM/Endo
            "Injury Prevention Strategies (Motor Vehicle Safety, Falls Prevention, Violence Prevention)", // Expanded
            "Occupational Health Hazards (Identification, Assessment, Control - Chemical, Physical, Biological, Ergonomic)", // Expanded
            "Environmental Exposure Counseling (Air Pollution, Water Quality, Toxins)", // Expanded
            "Travel Medicine Advice (Specific Destinations, Diseases, Prophylaxis)", // Expanded
            "Immunizations for Travelers",
            "Infection Control in Healthcare Settings", // Overlap with ID
            "Outbreak Investigation (Steps)", // Overlap with ID
            "Public Health Surveillance",
            "Screening for Infectious Diseases (HIV, Hepatitis, STIs)", // Overlap with ID
            "Screening for Mental Health Conditions (Depression, Anxiety)", // Overlap with Psych
            "Screening for Substance Use Disorders", // Overlap with Psych
            "Lead Poisoning Prevention (Screening & Management)", // Expanded
            "UV Exposure Counseling & Skin Cancer Prevention", // Overlap with Derm
            "Water Fluoridation Safety (Prev Med Aspect)", // Expanded
            "Fall Prevention in Elderly (Comprehensive Programs)", // Expanded
            "Alcohol Use Disorder Screening & Brief Intervention (AUDIT-C, CAGE)", // Expanded
            "Drug Use Screening (DAST)",
            "Intimate Partner Violence Screening (Prev Med Aspect)", // Overlap with OB/GYN
            "Child Abuse & Neglect Prevention", // Overlap with Peds
            "Adolescent Health Screening",
            "Women's Health Screening (Beyond Cancer - Bone Density, Domestic Violence)", // Overlap with OB/GYN
            "Men's Health Screening (Beyond Cancer - AAA, Depression)", // Overlap with IM/Urology
            "Geriatric Screening (Cognitive Impairment, Falls, Functional Status)", // Overlap with Geriatrics
            "Health Promotion Strategies",
            "Behavioral Economics in Health",
            "Health Policy & Advocacy (Basic Concepts)",
            "Global Health Challenges (Prev Med Perspective)", // Overlap with Global Health
            "Disaster Preparedness & Response (Public Health Role)"
        ],
        "requiredLevel": 32,
        "icon": "⚕️"
    },
    "Allergy & Immunology": {
        diseases: [
            "Immunology (Advanced - Cytokines, Chemokines, Cell Signaling, Immune Tolerance)", // Expanded
            "Hypersensitivity Reactions (Type I, II, III, IV - Mechanisms & Examples)",
            "Allergic Rhinitis (Advanced Pathogenesis, Diagnosis, Management - Immunotherapy)", // Expanded
            "Allergic Conjunctivitis",
            "Allergic Asthma (Immunologic Mechanisms)", // Overlap with Pulm
            "Food Allergies (Diagnosis - Oral Food Challenge, Management, Anaphylaxis Prevention)", // Expanded
            "Eosinophilic Esophagitis (EoE) (Diagnosis & Management)", // Expanded
            "Drug Allergies (Classification, Diagnosis - Skin Testing, Challenge, Management)", // Expanded
            "Insect Sting Allergy (Diagnosis & Management)",
            "Anaphylaxis (Pathophysiology, Recognition, Advanced Management)", // Expanded
            "Angioedema (Hereditary & Acquired) (Causes & Management)", // Expanded
            "Urticaria (Chronic Spontaneous Urticaria)", // Overlap with Derm
            "Mast Cell Disorders (Mastocytosis, MCAS)", // Expanded
            "Severe Combined Immunodeficiency (SCID)",
"Chronic mucocutaneous candidiasis",
"Selective IgA deficiency",
"Wiskott-Aldrich syndrome",
"Ataxia-Telangiectasia",
"Chediak-Higashi syndrome",
"DiGeorge Syndrome (Thymic Hypoplasia)",
"Hyper-IgE Syndrome (Job Syndrome)",
"X-linked Agammaglobulinemia (Bruton’s Agammaglobulinemia)",
"Common Variable Immunodeficiency (CVID)",
"Hyper-IgM Syndrome",
"Chronic Granulomatous Disease (CGD)",
"Myeloperoxidase Deficiency (MPO Deficiency)",
"C3 Deficiency",
"C5–C9 (Membrane Attack Complex) Deficiencies",
"C1 Esterase Inhibitor Deficiency (Hereditary Angioedema)",
            "Secondary Immunodeficiency (Causes - HIV, Malignancy, Immunosuppression)", // Expanded
            "Autoimmune Principles (Advanced Pathogenesis - Breakdown of Self-Tolerance)", // Expanded
            "Autoantibody Testing (Interpretation)", // Overlap with Rheum/Pathology
            "Immunotherapy (Allergy Shots - Mechanisms, Indications, Risks)", // Expanded
            "Biologic Agents in Allergic & Immunologic Diseases (Mechanisms & Use)", // Overlap with Rheum/Derm/GI/Pulm
            "Transplantation Immunology (HLA Typing, Rejection Mechanisms, GVHD)", // Overlap with Advanced IM/Surg
            "Immunosuppression (Pharmacology & Management)", // Overlap with Advanced IM/Surg/Nephro/Rheum/HemeOnc
            "Vaccine Immunology (Mechanisms of Action, Adjuvants)", // Overlap with Prev Med/Micro/ID
            "Immunomodulatory Therapies (IVIG, Plasmapheresis)", // Overlap with HemeOnc/Neuro/Rheum/Nephro
            "Allergy Testing (Skin Prick, Intradermal, Patch Testing, Specific IgE - Interpretation)", // Expanded
            "Pulmonary Function Tests in Allergic Disease", // Overlap with Pulm
            "Immunologic Evaluation (Flow Cytometry, Lymphocyte Proliferation, Cytokine Assays)" // Overlap with Pathology/Lab Med
        ],
        "requiredLevel": 5,
        "icon": "🤧"
    },
    "Geriatrics": {
        diseases: [
            "Physiology of Aging (Organ System Changes)",
            "Geriatric Assessment (Comprehensive Geriatric Assessment - CGA)",
            "Frailty (Assessment & Management)", // Expanded
            "Polypharmacy (Medication Review & Deprescribing)", // Expanded
            "Atypical Presentations of Illness in Elderly (Myocardial Infarction, Infection, Depression)", // Expanded
            "Falls in Elderly (Risk Factors, Evaluation, Prevention)", // Expanded
            "Delirium in Elderly (Causes, Diagnosis, Management)", // Expanded
            "Major Neurocognitive Disorder (Dementia - Alzheimer's, Vascular, Lewy Body, Frontotemporal) (Geriatric Diagnosis & Management)", // Expanded
            "Mild Neurocognitive Disorder (MCI)",
            "Behavioral and Psychological Symptoms of Dementia (BPSD)",
            "Depression in Elderly (Diagnosis & Management)", // Expanded
            "Anxiety Disorders in Elderly",
            "Sleep Disorders in Elderly (Insomnia, Sleep Apnea, RLS) (Geriatric Aspect)", // Expanded
            "Urinary Incontinence in Elderly (Types, Causes, Management)", // Expanded
            "Fecal Incontinence in Elderly",
            "Constipation in Elderly",
            "Malnutrition in Elderly (Causes, Assessment, Management)", // Expanded
            "Pressure Ulcers (Risk Assessment, Staging, Prevention, Treatment)", // Expanded
            "Osteoporosis (Geriatric Diagnosis & Management)", // Overlap with IM/Ortho/Rheum
            "Osteoarthritis (Geriatric Management)", // Overlap with IM/Ortho/Rheum
            "Pain Management in Elderly (Challenges & Strategies)", // Overlap with Palliative Care/PM&R
            "Functional Decline (Causes & Rehabilitation)", // Overlap with PM&R
            "Sarcopenia & Cachexia",
            "Sensory Impairments (Vision, Hearing) (Geriatric Impact)", // Overlap with Ophtho/ENT
            "Oral Health in Elderly",
            "Foot Care in Elderly",
            "Driving Safety in Elderly",
            "Elder Abuse & Neglect (Recognition & Reporting)", // Expanded
            "Financial Exploitation of Elderly",
            "Advance Care Planning (ACP) (Facilitating Discussions)", // Expanded
            "Goals of Care Discussions (Geriatric Context)", // Overlap with Palliative Care/Ethics
            "Hospice & Palliative Care (Indications in Elderly)", // Overlap with Palliative Care
            "Caregiver Support (Geriatric Aspect)", // Expanded
            "Transitions of Care (Hospital to Home/Rehab/Nursing Facility)",
            "Ethical Issues in Geriatrics (Capacity, Surrogate Decision Making)", // Overlap with Ethics
            "Specific Infections in Elderly (UTI, Pneumonia, Sepsis)", // Overlap with IM/ID
            "Cardiovascular Disease in Elderly (Atypical Presentations, Management Considerations)", // Overlap with Cardio/IM
            "Diabetes Management in Elderly (Goals & Challenges)", // Overlap with Endo/IM
            "Cancer Screening & Treatment in Elderly (Decision Making)", // Overlap with Heme/Onc/Prev Med
            "Rehabilitation in Elderly (Post-Stroke, Post-Fracture)", // Overlap with PM&R
            "Immunizations in Elderly (Influenza, Pneumococcal, Shingles)", // Overlap with Prev Med
            "Social Isolation & Loneliness in Elderly"
        ],
        "requiredLevel": 36,
        "icon": "👵"
    },
     "Palliative Care": {
        diseases: [
            "Philosophy & Principles of Palliative Care",
            "Total Pain (Physical, Psychological, Social, Spiritual)",
            "Pain Assessment (Tools & Techniques)",
            "Opioid Analgesics (Pharmacology, Titration, Side Effects, Management)", // Expanded
            "Adjuvant Analgesics (Neuropathic Pain Agents, Bisphosphonates)", // Expanded
            "Interventional Pain Management (Nerve Blocks, Spinal Pumps) (Palliative Aspect)", // Overlap with Anesthesia/PM&R
            "Symptom Management (Nausea, Vomiting, Dyspnea, Constipation, Fatigue, Anorexia, Cachexia, Delirium)", // Expanded
            "Nausea & Vomiting in Palliative Care (Causes & Management)", // Expanded
            "Dyspnea in Palliative Care (Causes & Management)", // Expanded
            "Constipation in Palliative Care (Causes & Management)", // Expanded
            "Anorexia & Cachexia in Palliative Care (Management)", // Expanded
            "Delirium in Palliative Care (Diagnosis & Management)", // Expanded
            "Psychological Distress (Anxiety, Depression) in Palliative Care", // Overlap with Psych
            "Spiritual Distress in Palliative Care", // Expanded
            "Communication Skills (Breaking Bad News, Discussing Prognosis, Goals of Care Discussions)", // Expanded
            "Advance Directives (Types - Living Will, Durable Power of Attorney for Healthcare; Discussion & Documentation)", // Expanded
            "Goals of Care Discussions (Palliative Context)", // Expanded
            "Prognostication in Serious Illness", // Expanded
            "Hospice Care (Eligibility Criteria, Services, Philosophy)", // Expanded
            "Palliative Sedation (Indications & Ethical Considerations)",
            "Withdrawal of Life-Sustaining Treatment (Ethical & Practical Considerations)", // Overlap with Ethics/Critical Care
            "Grief & Bereavement (Normal vs. Complicated Grief)", // Expanded
            "Caregiver Support (Assessment & Resources)", // Expanded
            "Ethical Dilemmas in End-of-Life Care (Futility, DNR, Assisted Dying Debate)", // Expanded
            "Cultural & Religious Considerations in Palliative Care",
            "Pediatric Palliative Care (Specific Considerations)", // Overlap with Peds
            "Palliative Care in Specific Diseases (Cancer, Heart Failure, COPD, Dementia, Neurological Diseases)", // Overlap with Heme/Onc, Cardio, Pulm, Geriatrics, Neuro
            "Non-Malignant Pain Management (Palliative Aspect)", // Overlap with PM&R
            "Role of the Interdisciplinary Team in Palliative Care",
            "Pain Crisis Management"
        ],
        "requiredLevel": 38,
        "icon": "🕊️"
    },
     "Medical Ethics": { // New specialty for high levels + expanded
        diseases: [ // Renamed conceptually to 'Principles' or 'Cases'
            "Principles of Biomedical Ethics (Autonomy, Beneficence, Non-maleficence, Justice) (Advanced Application)", // Expanded
            "Informed Consent (Capacity Assessment, Voluntariness, Disclosure Standards)", // Expanded
            "Surrogate Decision Making (Hierarchy, Standards)",
            "Confidentiality & Privacy (HIPAA, Exceptions)", // Expanded
            "Conflicts of Interest in Medicine", // Expanded
            "Medical Futility & Withdrawal of Treatment (Definitions & Ethical Arguments)", // Expanded
            "Resource Allocation in Healthcare (Micro, Meso, Macro Allocation)", // Expanded
            "Ethics in Research (IRB Review, Equipoise, Vulnerable Populations)", // Expanded
            "Ethics in Genetics (Genetic Testing, Screening, Privacy, Discrimination)", // Expanded
            "Ethics in Pediatrics (Assent, Best Interest Standard, Parental Authority Limits)", // Expanded
            "Ethics in Psychiatry (Involuntary Commitment, Competency to Refuse Treatment)", // Expanded
            "Ethics in End-of-Life Care (DNR, AND, Palliative Sedation, Assisted Dying Debate)", // Expanded
            "Professionalism & Boundaries (Physician-Patient Relationship)", // Expanded
            "Reporting Impaired or Incompetent Colleagues", // Expanded
            "Medical Error Disclosure",
            "Justice in Healthcare (Access, Disparities, Social Determinants of Health)",
            "Ethics of Vaccination", // Overlap with Prev Med/ID
            "Ethics of Organ Transplantation (Allocation, Living Donation)", // Overlap with Advanced IM/Surg
            "Ethics of Reproductive Technologies (IVF, Surrogacy)", // Overlap with OB/GYN
            "Ethics of Conscience in Medicine",
            "Ethical Issues in Public Health Emergencies (Quarantine, Resource Triage)", // Overlap with Prev Med
            "Ethics Consultation (Process & Role)",
            "Moral Distress in Healthcare Professionals",
            "Case Studies in Medical Ethics (Analysis & Resolution)"
        ],
        "requiredLevel": 40,
        "icon": "⚖️"
    },

    // --- Level 41-50+: Advanced Topics & Sub-Subspecialties ---
    // Instead of adding many new small specialties, we can add more
    // advanced/rare diseases or topics to existing large specialties.
    // Examples below add more depth to existing areas.

    "Internal Medicine (Advanced)": { // Example of adding depth
        diseases: [
             "Diabetic Ketoacidosis (DKA) (Advanced Management & Complications)", // Expanded
             "Hyperosmolar Hyperglycemic State (HHS) (Advanced Management & Complications)", // Expanded
             "Acute Liver Failure (Advanced Management, Transplant Considerations)", // Expanded
             "Acute Pancreatitis (Advanced Management, Necrotizing Pancreatitis)", // Expanded
             "Acute Kidney Injury (AKI) (Advanced Nephro Evaluation & Management)", // Expanded
             "Sepsis (Advanced Critical Care Management, Organ Support)", // Expanded
             "Anaphylaxis (Advanced Management, Biphasic Reactions)", // Expanded
             "Delirium (Advanced Management in Complex Patients)", // Expanded
             "Vasculitis (Advanced Diagnosis & Management of Specific Types)", // Expanded
             "Amyloidosis (Diagnosis & Management of Systemic Types)", // Expanded
             "Sarcoidosis (Diagnosis & Management of Multi-organ Involvement)", // Expanded
             "Hemophagocytic Lymphohistiocytosis (HLH) (Diagnosis & Management)", // Expanded
             "Porphyrias (Diagnosis & Acute Management)", // Expanded
             "Lysosomal Storage Diseases (Adult Presentation, Management)", // Expanded
             "Mitochondrial Disorders (Adult Presentation, Management)", // Expanded
             "Inborn Errors of Metabolism (Adult Presentation, Management)", // Expanded
             "Connective Tissue Diseases (Rare Variants, Overlap Syndromes)", // Overlap with Rheum
             "Immunodeficiency Disorders (Adult Presentation, Management)", // Overlap with Allergy/Immuno
             "Complex Fluid & Electrolyte Disorders", // Overlap with Nephro/Critical Care
             "Complex Acid-Base Disorders", // Overlap with Nephro/Critical Care
             "Nutritional Deficiencies (Advanced Diagnosis & Management)",
             "Enteral & Parenteral Nutrition (Advanced Management)", // Overlap with GI/Critical Care
             "Toxicology (Specific Poisonings & Management)", // Overlap with ER/Critical Care
             "Environmental Illnesses (High Altitude, Diving, Envenomations)", // Overlap with ER/Prev Med
             "Tropical Diseases (Advanced Diagnosis & Management)", // Overlap with ID
             "Travel Medicine (Complex Cases)", // Overlap with ID/Prev Med
             "Undiagnosed Illness (Approach)",
             "Perioperative Medicine (Advanced Risk Assessment & Management)", // Overlap with Anesthesia/Gen Surg
             "Hospital Medicine (Complex Patient Management)",
             "Consultation Medicine (Managing Medical Issues in Surgical/Psychiatric Patients)" // Overlap with Psych/Gen Surg
        ],
        "requiredLevel": 42, // Unlocks more advanced topics within IM
        "icon": "🏥" // Using a similar icon
    },
    "Cardiology (Advanced)": {
         diseases: [
             "Electrocardiogram (ECG) Interpretation (Expert Level)",
             "Cardiac Electrophysiology (Arrhythmia Mechanisms, Ablation Procedures, EP Studies)", // Expanded
             "Advanced Heart Failure Management (Mechanical Circulatory Support, Heart Transplant - Indications & Management)", // Expanded
             "Pulmonary Hypertension (Advanced Diagnosis & Management - Specific Therapies)", // Expanded
             "Adult Congenital Heart Disease (Specific Lesions & Management)", // Expanded
             "Pericardial Diseases (Constrictive Pericarditis, Effusive-Constrictive Pericarditis)", // Expanded
             "Cardiac Tumors (Diagnosis & Management)", // Expanded
             "Sports Cardiology (Advanced Evaluation & Management)", // Expanded
             "Cardio-Oncology (Advanced Management of Cardiac Toxicities)", // Expanded
             "Cardiac Imaging (Advanced Echocardiography - TEE, Stress Echo; Cardiac MRI, Cardiac CT - Advanced Interpretation)", // Expanded
             "Cardiac Catheterization (Advanced Hemodynamics, PCI Techniques)", // Expanded
             "Interventional Cardiology (Complex Coronary Interventions, Structural Heart Disease - TAVR, Mitraclip, ASD/VSD Closure)", // Expanded
             "Peripheral Artery Disease (Advanced Diagnosis & Interventional Management)", // Expanded
             "Venous Disease (Chronic Venous Insufficiency, Varicose Veins)",
             "Aortic Diseases (Advanced Imaging & Surgical/Endovascular Management)", // Overlap with Radiology/Gen Surg/Vascular Surgery
             "Pulmonary Embolism (Advanced Management - Thrombolysis, Embolectomy)", // Overlap with Pulm/ER/IR
             "Hypertrophic Cardiomyopathy (Advanced Management - Septal Reduction)", // Expanded
             "Arrhythmogenic RV Dysplasia (ARVD)",
             "Channelopathies (Long QT, Brugada, CPVT)", // Overlap with Neuro/Genetics
             "Cardiac Sarcoidosis", // Overlap with Pulm/Rheum/IM
             "Cardiac Amyloidosis", // Overlap with Pathology/IM/Nephro/Rheum
             "Hypertension (Resistant Hypertension, Secondary Causes - Advanced Evaluation)", // Overlap with IM/Nephro/Endo
             "Cardiovascular Genetics (Specific Syndromes)", // Overlap with Genetics
             "Cardiac Rehabilitation (Advanced Programs)" // Overlap with PM&R
         ],
        "requiredLevel": 44,
        "icon": "❤️"
    },
    "Hematology/Oncology (Advanced)": {
         diseases: [
             "Hematopoietic Stem Cell Transplantation (Advanced - Allogeneic vs. Autologous, GVHD Management)", // Expanded
             "Cellular Therapy (CAR-T, TCR-T, TILs - Advanced Concepts)", // Expanded
             "Molecular Diagnostics in Oncology (NGS Panels, Liquid Biopsies - Interpretation)", // Expanded
             "Cancer Genetics (Somatic & Germline Mutations, Genetic Counseling)", // Expanded
             "Rare Hematologic Malignancies (Hairy Cell Leukemia, Myeloma Subtypes)", // Expanded
             "Coagulation Disorders (Advanced Diagnosis & Management - DIC, TTP, Hemophilia, VWD)", // Expanded
             "Thrombosis & Anticoagulation (Advanced Management in Complex Patients)", // Expanded
             "Transfusion Medicine (Advanced - Component Therapy, Apheresis, Transfusion Reactions)", // Expanded
             "Oncologic Emergencies (Advanced Management)", // Expanded
             "Management of Cancer Pain (Advanced Techniques)", // Expanded
             "Palliative Care in Oncology (Advanced Integration)", // Expanded
             "Immunotherapy in Cancer (Management of Immune-Related Adverse Events)", // Expanded
             "Targeted Therapy in Cancer (Resistance Mechanisms)", // Expanded
             "Clinical Trials in Oncology (Design & Interpretation)",
             "Pediatric Hematology (Advanced Topics)", // Overlap with Peds
             "Pediatric Oncology (Advanced Topics)", // Overlap with Peds
             "Neuro-Oncology (Advanced Management)", // Overlap with Neuro
             "Cardio-Oncology (Advanced Management)", // Overlap with Cardio
             "Hematologic Pathology (Advanced Morphology & Flow Cytometry)", // Overlap with Pathology
             "Oncologic Imaging Interpretation (Advanced PET/CT, MRI)", // Overlap with Radiology
             "Bone Marrow Biopsy (Advanced Interpretation)", // Expanded
             "Lymph Node Biopsy (Advanced Interpretation)", // Expanded
             "Paraneoplastic Syndromes (Advanced Diagnosis & Management)", // Expanded
             "Cancer Survivorship (Advanced Issues)",
             "Oncologic Ethics (Resource Allocation, Experimental Therapies)", // Overlap with Ethics
             "Cancer Epidemiology & Prevention (Oncology Aspect)", // Overlap with Prev Med
             "Psycho-Oncology (Psychiatric Issues in Cancer Patients)", // Overlap with Psych
             "Fertility Preservation in Cancer Patients"
         ],
        "requiredLevel": 46,
        "icon": "🎗️"
    },
    "Neurology (Advanced)": {
         diseases: [
             "Neurocritical Care (Advanced Management of Stroke, TBI, Status Epilepticus, SAH)", // Expanded
             "Movement Disorders (Advanced Management - DBS, Pump Therapies)", // Expanded
             "Dementia (Specific Subtypes - CJD, FTD, Prion Diseases; Research & Novel Therapies)", // Expanded
             "Epilepsy (Surgical Management, Vagal Nerve Stimulation, Advanced EEG Interpretation)", // Expanded
             "Neuromuscular Disorders (Advanced Diagnosis - Muscle Biopsy, Genetic Testing; Management)", // Expanded
             "Neuroimmunology (Advanced Demyelinating Diseases, Autoimmune Encephalitis, Myelitis)", // Expanded
             "Neurogenetics (Specific Rare Syndromes, Gene Therapy Approaches)", // Expanded
             "Pediatric Neurology (Advanced Topics - Childhood Epilepsy Syndromes, Neurometabolic Disorders)", // Expanded
             "Neuro-Oncology (Advanced Diagnosis & Management of Brain/Spinal Tumors)", // Expanded
             "Neuroimaging (Advanced Techniques - fMRI, DTI, Perfusion Imaging; Interpretation)", // Expanded
             "Interventional Neurology (Stroke Thrombectomy, Aneurysm Coiling/Clipping - Advanced)", // Expanded
             "Headache Syndromes (Advanced & Refractory Management)", // Expanded
             "Sleep Disorders (Advanced Polysomnography Interpretation, Management)", // Expanded
             "Autonomic Neuropathy (Evaluation & Management)", // Expanded
             "Channelopathies (Neurology - Advanced Genetics & Management)", // Expanded
             "Neuro-Ophthalmology (Advanced Conditions - Optic Neuropathies, Ocular Motility Disorders)", // Expanded
             "Neuro-Otology (Advanced Balance Disorders, Central Vertigo)", // Expanded
             "Neuropsychology (Assessment & Interpretation)", // Overlap with Psych
             "Neurorehabilitation (Advanced Strategies)", // Overlap with PM&R
             "Ethics in Neurology (End-of-Life, Capacity, Genetic Testing)", // Overlap with Ethics
             "Neuroepidemiology", // Overlap with Prev Med
             "Neuropathology (Advanced Interpretation)", // Overlap with Pathology
             "Neuropharmacology (Advanced Drug Interactions & Side Effects)", // Overlap with Pharm
             "Management of Intracranial Pressure (Advanced Techniques)", // Expanded
             "Cerebral Vasculitis" // Overlap with Rheum
         ],
        "requiredLevel": 48,
        "icon": "🧠"
    },
     "Critical Care Medicine": { // New specialty integrating knowledge from many areas + expanded
        diseases: [
            "Respiratory Failure (Acute & Chronic) (Advanced Mechanical Ventilation Strategies - ARDSNet, APRV)", // Expanded
            "Hemodynamic Monitoring (Advanced Invasive Monitoring - PA Catheter, Arterial Waveform Analysis)", // Expanded
            "Management of Shock (Advanced Management of Septic, Cardiogenic, Hypovolemic, Neurogenic, Anaphylactic Shock)", // Expanded
            "Acute Kidney Injury in ICU (CRRT Indications & Management)", // Expanded
            "ICU Delirium & Sedation (Assessment & Management Strategies)", // Expanded
            "Pain Management in ICU", // Overlap with Palliative Care/Anesthesia
            "Nutrition in Critically Ill (Enteral vs. Parenteral, Specific Needs)", // Expanded
            "Infection Prevention in ICU (CLABSI, CAUTI, VAP Prevention Bundles)", // Expanded
            "Management of Sepsis (Advanced Resuscitation & Organ Support)", // Expanded
            "Endocrine Emergencies in ICU (Adrenal Crisis, Thyroid Storm, DKA/HHS)", // Expanded
            "Gastrointestinal Bleeding in ICU (Management)", // Overlap with GI
            "Acute Liver Failure in ICU (Management)", // Overlap with GI/Advanced IM
            "Acute Pancreatitis in ICU (Management)", // Overlap with GI/Advanced IM
            "Hematologic Emergencies in ICU (DIC, TTP, HIT)", // Overlap with Heme/Onc
            "Neurologic Emergencies in ICU (Status Epilepticus, SAH, TBI, Ischemic Stroke)", // Overlap with Neuro/ER
            "Cardiovascular Emergencies in ICU (Cardiogenic Shock, Arrhythmias, Hypertensive Crisis)", // Overlap with Cardio/ER
            "Pulmonary Emergencies in ICU (ARDS, Status Asthmaticus, Massive PE)", // Overlap with Pulm/ER
            "Toxicology in ICU (Specific Poisonings & Management)", // Overlap with ER/Advanced IM
            "Environmental Emergencies in ICU (Severe Hypothermia, Heatstroke)", // Overlap with ER/Prev Med
            "Trauma Management in ICU (Post-Resuscitation Care)", // Overlap with ER/Gen Surg
            "Burn Management in ICU", // Overlap with ER/Gen Surg/Derm
            "Post-Intensive Care Syndrome (PICS) (Recognition & Management)", // Expanded
            "Ethical Considerations in ICU (Withdrawal of Support, DNR, Resource Allocation)", // Expanded
            "Communication with Families in ICU",
            "Management of Airway Emergencies (Advanced Techniques)", // Overlap with ER/Anesthesia/ENT
            "Transport of Critically Ill Patients",
            "Ultrasound in ICU (POINT-OF-CARE Ultrasound - POCUS)", // Overlap with Radiology/ER
            "Management of Coagulopathy in ICU", // Overlap with Heme/Onc
            "Immunosuppression Management in ICU", // Overlap with Allergy/Immuno/Advanced IM
            "Management of Overdose & Withdrawal in ICU", // Overlap with Psych/ER
            "Invasive Procedures in ICU (Central Lines, Arterial Lines, Chest Tubes, Paracentesis, Thoracentesis)", // Overlap with Gen Surg/Radiology/Pulm/GI/Nephro
            "Sedation & Paralysis in ICU", // Overlap with Anesthesia
            "Monitoring in ICU (Advanced Hemodynamic, Neurologic, Respiratory Monitoring)" // Expanded
        ],
        "requiredLevel": 50,
        "icon": "🚨" // Or a lung/heart combo?
    },
     "Global Health": { // New specialty for high levels
        diseases: [ // Renamed conceptually to 'Topics' or 'Challenges'
            "Global Burden of Disease (Communicable vs Non-Communicable)",
            "Social Determinants of Health (Global Perspective)",
            "Health Disparities (Global)",
            "Epidemiology (Global Health Applications)", // Overlap with Prev Med
            "Vaccine-Preventable Diseases (Global Eradication Efforts - Polio, Smallpox)", // Overlap with Prev Med/ID/Peds
            "HIV/AIDS (Global Epidemiology & Control)", // Overlap with ID
            "Tuberculosis (Global Epidemiology & Control)", // Overlap with ID
            "Malaria (Global Epidemiology & Control)", // Overlap with ID
            "Tropical Diseases (Neglected Tropical Diseases - NTDs)", // Overlap with ID
            "Maternal & Child Health (Global Challenges)", // Overlap with OB/GYN/Peds
            "Nutrition (Global Malnutrition & Obesity)", // Overlap with IM/Peds/Endo
            "Water & Sanitation (Global Health Impact)", // Overlap with Prev Med
            "Environmental Health (Climate Change, Pollution - Global Impact)", // Overlap with Prev Med
            "Health Systems (Different Models Globally)",
            "Healthcare Financing (Global)",
            "Access to Medicines (Global Challenges)",
            "Global Health Organizations (WHO, NGOs)",
            "Humanitarian Aid & Disaster Response (Global Health Role)", // Overlap with ER/Prev Med
            "Infectious Disease Outbreaks (Global Surveillance & Response)", // Overlap with ID/Prev Med
            "Non-Communicable Diseases (NCDs) (Global Epidemiology & Prevention)", // Overlap with Prev Med/Cardio/Endo/HemeOnc etc.
            "Mental Health (Global Burden & Stigma)", // Overlap with Psych
            "Injury Prevention (Global)", // Overlap with Prev Med
            "Ethics in Global Health (Resource Allocation, Research Ethics)", // Overlap with Ethics
            "Migration & Health",
            "Refugee Health",
            "Travel Medicine (Global Health Context)", // Overlap with ID/Prev Med
            "Emerging Infectious Diseases (Global Preparedness)", // Overlap with ID/Prev Med
            "One Health (Human, Animal, Environmental Health Link)"
        ],
        "requiredLevel": 50,
        "icon": "🌍"
    },
     "Medical Education": { // New specialty for high levels - focuses on teaching/learning
        diseases: [ // Renamed conceptually to 'Concepts' or 'Methods'
            "Principles of Adult Learning",
            "Medical Curriculum Design",
            "Teaching Methods (Lectures, Small Groups, Bedside Teaching)",
            "Assessment in Medical Education (MCQs, OSCEs, Portfolios)",
            "Feedback & Evaluation (Giving & Receiving)",
            "Simulation in Medical Education",
            "Interprofessional Education",
            "Learning Theories (Cognitivism, Constructivism)",
            "Educational Technology in Medicine",
            "Mentoring & Coaching in Medicine",
            "Curriculum Evaluation",
            "Residency & Fellowship Training (Structure)",
            "Continuing Medical Education (CME)",
            "Evidence-Based Medical Education",
            "Teaching Clinical Reasoning",
            "Teaching Communication Skills",
            "Teaching Professionalism",
            "Teaching Medical Ethics", // Overlap with Ethics
            "Teaching Patient Safety",
            "Teaching Quality Improvement",
            "Learning Styles & Preferences",
            "Remediation in Medical Education",
            "Educational Research (Methodology Basics)"
        ],
        "requiredLevel": 50,
        "icon": "🎓"
    },
    // You can continue adding more diseases/topics to existing specialties
    // or add new, very niche specialties beyond Level 50 as needed.
    // Examples: Forensic Medicine, Undersea & Hyperbaric Medicine, Aerospace Medicine,
    // Specific Surgical Subspecialties (e.g., Cardiothoracic Surgery, Neurosurgery),
    // Specific Medical Sub-subspecialties (e.g., Transplant Hepatology, Interventional Pulmonology).

};

  
    /*
 * Supercharged Game Achievements Data
 * Includes icons and descriptions for a wide range of achievements
 * based on player level, questions answered, diseases/topics studied,
 * reviews completed, streaks, skill progression, specialty mastery,
 * daily tasks, and other milestones.
 * Features deeper tiers, combination mastery, and more challenging goals.
 */

/*
/*
* =====================================================
* ===== REVISED Game Achievements Data (May 9 v3) =====
* =====================================================
* Disease study achievement tiers adjusted for reasonable targets
* based on estimated current content (~1500 topics).
* Added missing descriptions.
* Other achievements remain the same from previous version.
*/

// Object mapping achievement names to their display icons
const achievementIcons = {
    // Core Progression (Disease Study - REVISED Tiers & Names)
    "First Blood": "🩸",          // Study 1
    "Novice Diagnostician": "🔰", // Study 5
    "Persistent Scholar": "📚",   // Study 25
    "Domain Discoverer": "🔑",     // Study 50 (New Name)
    "Dedicated Healer": "💪",     // Study 100
    "Topic Collector": "🎒",      // Study 250
    "Syllabus Surveyor": "🗺️",    // Study 500
    "Compendium Compiler": "📖", // Study 750 (Adjusted)
    "Knowledge Architect": "🏛️", // Study 1000 (Adjusted)
    "Scholarly Sage": "🧙",      // Study 1250 (New Tier & Adjusted)
    "Lore Master": "📜",         // Study 1500 (Adjusted)
    "All Topics Studied": "💯",   // Study every topic

    // Level Milestones (Unchanged from previous)
    "Clinical Apprentice": "🩺", "Medical Intern": "👨‍⚕️", "Adept Healer": "🧪", "Resident of Remedies": "🏥",
    "Senior Resident": "🧑‍⚕️", "Attending Physician": "👩‍⚕️", "Grand Healer": "🏅", "World-Class Diagnostician": "🔍",
    "Epic Healer": "🔥", "Chief of Medicine": "🥇", "Legendary Scholar": "🏆", "Supreme Healer": "🌟",
    "Mythical Medic": "🐉", "Timeless Scholar": "⏳", "Divine Insight": "💡", "Transcendent Healer": "✨",
    "Cosmic Physician": "🪐", "Master of the Universe": "🌌", "Dimensional Doctor": "🌀",
    "Celestial Clinician": "✨", "Ascended Healer": "🕊️", "Omni-Level Master": "💯",

    // Question Milestones (Unchanged from previous)
    "Quiz Knight": "🛡️", "Exam Overcomer": "📖", "Skillful Scholar": "📜", "Marathon of Medicine": "🏃‍♂️",
    "Century of Cures": "🗞️", "Knowledge Seeker": "🧐", "Question Conqueror": "🎯", "Trivia Titan": "🧠",
    "Fact Finder": "🔍", "Endless Learner": "♾️", "Question Accumulator": "📦",
    "Data Miner": "⛏️", "Query King": "👑", "Infinite Intellect": "💡",

    // Review Milestones (Unchanged from previous)
    "Review Rookie": "🧐", "Review Enthusiast": "🤓", "Review Veteran": "🧐", "Review Virtuoso": "🧑‍🏫",
    "Review Legend": "👑", "Memory Master": "🧠", "Recall Champion": "⏱️", "Retention Rockstar": "🎸",
    "Spaced Repetition Sage": "📅", "Eternal Reviewer": "🔄", "Review Addict": "🔁",
    "Recall King": "👑", "Memory Monarch": "🏰", "Infinite Retention": "♾️", "Review Grandmaster": "🎓",

    // Streak Milestones (Unchanged from previous)
    "Streak Starter": "🔥", "Streak Master": "🏹", "Dedicated Disciple": "🗓️", "Daily Devotee": "🔥",
    "Centennial Streak": "💯", "Bicentennial Believer": "🕊️", "Annual Achiever": "📅", "Consistent Contributor": "✅",
    "Habitual Healer": "🧘", "Unbreakable Streak": "🔗", "Streak Conqueror": "🏆", "Eternal Flame": "🔥",
    "Daily Ritualist": "🧘", "Streak of Legend": "📜", "Streak Immortal": "♾️",

    // Skill Milestones (Unchanged from previous)
    "First SP Spent": "✨", "Skill Master": "🌟", "Review Adept": "🧐", "Recall Expert": "⏱️",
    "Burst Believer": "💥", "Efficient Expert": "⚡", "Peak Performance": "🚀", "Total Skill Enthusiast": "➕",
    "Skill Collector": "💎", "Master of Many Skills": "🏆", "Ultimate Skill Mastery": "💯",
    "Skill Grandmaster": "👑", "Skill Omniscient": "🌌", "Skill Sage": "🧙", "XP Boost Master": "⬆️",
    "Review Mastery Master": "🧠", "Accelerated Recall Master": "⏱️", "Study Burst Master": "💥",
    "Efficient Learner Master": "⚡", "All Skills Maxed": "🏅",

    // Specialty Mastery (Specific Specialties - Unchanged from previous)
    "Anatomy Expert": "🦴", "Physiology Pro": "🏃‍♀️", "Biochem Buff": "🧪", "Micro Mastermind": "🦠",
    "Pharm Fanatic": "💊", "Pathology Pioneer": "🔬", "ER Enthusiast": "🚑", "Surgical Samurai": "⚔️",
    "OB/GYN Oracle": "🤰", "Psychiatry Prodigy": "🧠", "Dermatology Dynamo": "💅", "Radiology Rockstar": "🩻",
    "Cardiology Conqueror": "❤️", "Pulmonology Pro": "🫁", "GI Guru": "🍎", "Nephron Master": "🧪",
    "Endocrine Expert": "🧬", "Neurology Ninja": "🧠", "Anesthesia Ace": "💉", "Genetics Genius": "🧬",
    "Infectious Intellect": "🦠", "Rheum Ruler": "🦾", "Heme/Onc Hero": "🎗️", "Ortho Overlord": "🦴",
    "Urology Virtuoso": "💧", "Ophthalmology Oracle": "👁️", "ENT Expert": "👂", "PM&R Pro": "♿",
    "Prev Med Pro": "⚕️", "Allergy Alleviator": "🤧", "Geriatric Guru": "👵", "Palliative Pro": "🕊️",
    "Ethics Expert": "⚖️", "Critical Care Commander": "🚨", "Global Health Guru": "🌍", "Medical Educator": "🎓",
    "Advanced IM Master": "🏥", "Advanced Cardio Master": "💖", "Advanced Heme/Onc Master": "🩸", "Advanced Neuro Master": "💡",

    // Specialty Mastery (Tiered - Unchanged from previous)
    "Specialty Explorer": "🧭", "Specialty Collector": "🎒", "Specialty Aficionado": "🧐",
    "Specialty Connoisseur": "🧐", "Specialty Master": "⭐", "Specialty Grandmaster": "🌟",
    "Specialty Omniscient": "✨", "Specialty Polymath": "🧠", "Specialty Sovereign": "👑",
    "Specialty Legend": "🏆", "Specialty Divine": "🌌", "All Specialties Unlocked": "🗝️",

    // Combination Mastery (Unchanged from previous)
    "Foundational Five": "🧱", "Core Clinical Quartet": "🩺", "Organ System Savant": "⚙️",
    "Surgical Suite Star": "🔪", "Sensory Specialists": "👀", "Mind & Body Master": "🧘",
    "Infection Fighter": "🛡️", "Cancer Crusader": "🦀", "Autoimmune Authority": "🛡️",
    "High-Level Harmonizer": "⚖️", "Advanced Integrator": "🔗", "Global Guru": "🌐",
    "Foundational Master": "🏛️",

    // Daily Task Achievements (Unchanged from previous)
    "Task Taker": "✅", "Task Completer": "☑️", "Daily Task Master": "🎯", "Consistent Tasker": "🗓️",
    "Task Champion": "🏅", "Daily Duty": "💯", "Task Veteran": "🎖️", "Task Grandmaster": "🏆",
    "Perfect Week": "📅", "Perfect Month": "🗓️", "Task Streak": "🔥", "Task Legend": "👑",

    // Review Efficiency / Streak (Unchanged from previous)
    "Perfect Review": "✔️", "Review Streak Starter": "🔥", "Review Streak Master": "🔥", "Review Streak Addict": "🔥",
    "Flawless Recall": "🎯", "Master Reviewer": "🎯", "Perfect Streak": "💯", "Review Marathon": "🏃",
    "Review Spree": "💨", "Review Blitz": "⚡", "Review Due Flood": "🌊", "Empty Review List": "🧹",

    // Other Milestones / Challenges (Unchanged from previous)
    "Boss Slayer": "⚔️", "Music Lover": "🎵", "Theme Thinker": "🎨", "Data Exporter": "📤",
    "Data Importer": "📥", "Fresh Start": "🔄", "XP Spurt": "🚀", "Level Skip": "🚀",
    "Skill Point Hoarder": "💰", "Maxed Out Skill": "⭐", "XP Overload": "📈", "Ultimate Completionist": "🏁",
    "Stat Checker": "📊", "Tinkerer": "⚙️", "Archivist": "💾", "Burst User": "💥"
};

// Object mapping achievement names to their descriptions (NOW COMPLETE)
const achievementDescriptions = {
    // Core Progression (Disease Study - REVISED Tiers & Names)
    "First Blood": "Study your first disease or topic.",
    "Novice Diagnostician": "Study 5 different diseases or topics.",
    "Persistent Scholar": "Study 25 different diseases or topics.",
    "Domain Discoverer": "Study 50 different diseases or topics.",
    "Dedicated Healer": "Study 100 different diseases or topics.",
    "Topic Collector": "Study 250 different diseases or topics.",
    "Syllabus Surveyor": "Study 500 different diseases or topics.",
    "Compendium Compiler": "Study 750 different diseases or topics.",
    "Knowledge Architect": "Study 1000 different diseases or topics.",
    "Scholarly Sage": "Study 1250 different diseases or topics.",
    "Lore Master": "Study 1500 different diseases or topics.",
    "All Topics Studied": "Study every single topic in the game.",
    "Omniscient Oracle": "Study 20,000 different diseases or topics.", // Kept high one just in case

    // Level Milestones (Unchanged from previous)
    "Clinical Apprentice": "Reach Level 2.", "Medical Intern": "Reach Level 3.", "Adept Healer": "Reach Level 5.",
    "Resident of Remedies": "Reach Level 8.", "Senior Resident": "Reach Level 12.", "Attending Physician": "Reach Level 15.",
    "Grand Healer": "Reach Level 20.", "World-Class Diagnostician": "Reach Level 25.", "Epic Healer": "Reach Level 30.",
    "Chief of Medicine": "Reach Level 35.", "Legendary Scholar": "Reach Level 40.", "Supreme Healer": "Reach Level 45.",
    "Mythical Medic": "Reach Level 50.", "Timeless Scholar": "Reach Level 60.", "Divine Insight": "Reach Level 75.",
    "Transcendent Healer": "Reach Level 90.", "Cosmic Physician": "Reach Level 100.", "Master of the Universe": "Reach Level 150.",
    "Dimensional Doctor": "Reach Level 200.", "Celestial Clinician": "Reach Level 250.", "Ascended Healer": "Reach Level 300.",
    "Omni-Level Master": "Reach Level 500.",

    // Question Milestones (Unchanged from previous)
    "Quiz Knight": "Answer 50 questions.", "Exam Overcomer": "Answer 200 questions.", "Skillful Scholar": "Answer 500 questions.",
    "Marathon of Medicine": "Answer 1000 questions.", "Century of Cures": "Answer 2000 questions.", "Knowledge Seeker": "Answer 5000 questions.",
    "Question Conqueror": "Answer 10,000 questions.", "Trivia Titan": "Answer 25,000 questions.", "Fact Finder": "Answer 50,000 questions.",
    "Endless Learner": "Answer 100,000 questions.", "Question Accumulator": "Answer 250,000 questions.", "Data Miner": "Answer 500,000 questions.",
    "Query King": "Answer 1,000,000 questions.", "Infinite Intellect": "Answer 2,500,000 questions.",

    // Review Milestones (Unchanged from previous)
    "Review Rookie": "Complete your first review.", "Review Enthusiast": "Complete 10 reviews.", "Review Veteran": "Complete 50 reviews.",
    "Review Virtuoso": "Complete 100 reviews.", "Review Legend": "Complete 200 reviews.", "Memory Master": "Complete 500 reviews.",
    "Recall Champion": "Complete 1000 reviews.", "Retention Rockstar": "Complete 2500 reviews.", "Spaced Repetition Sage": "Complete 5000 reviews.",
    "Eternal Reviewer": "Complete 10,000 reviews.", "Review Addict": "Complete 15,000 reviews.", "Recall King": "Complete 20,000 reviews.",
    "Memory Monarch": "Complete 25,000 reviews.", "Infinite Retention": "Complete 50,000 reviews.", "Review Grandmaster": "Complete 7500 reviews.",

    // Streak Milestones (Unchanged from previous)
    "Streak Starter": "Achieve a 1-day study streak (Log in!).", "Streak Master": "Achieve a 7-day study streak.", "Dedicated Disciple": "Achieve a 14-day study streak.",
    "Daily Devotee": "Achieve a 30-day study streak.", "Centennial Streak": "Achieve a 100-day study streak.", "Bicentennial Believer": "Achieve a 200-day study streak.",
    "Annual Achiever": "Achieve a 365-day study streak.", "Consistent Contributor": "Achieve a 500-day study streak.", "Habitual Healer": "Achieve a 750-day study streak.",
    "Unbreakable Streak": "Achieve a 1000-day study streak.", "Streak Conqueror": "Achieve a 1250-day study streak.", "Streak Immortal": "Achieve a 1500-day study streak.",
    "Eternal Flame": "Achieve a 2000-day study streak.", "Daily Ritualist": "Achieve a 2500-day study streak.", "Streak of Legend": "Achieve a 3000-day study streak.",

    // Skill Milestones (Unchanged from previous)
    "First SP Spent": "Spend your first Skill Point.", "Skill Master": "Reach Level 5 in any single skill.", "Review Adept": "Upgrade the 'Review Mastery' skill at least once.",
    "Recall Expert": "Upgrade the 'Accelerated Recall' skill at least once.", "Burst Believer": "Upgrade the 'Study Burst' skill at least once.", "Efficient Expert": "Upgrade the 'Efficient Learner' skill at least once.",
    "Peak Performance": "Reach Level 10 (Max) in any skill.", "Total Skill Enthusiast": "Reach a total of 10 skill levels across all skills.", "Skill Collector": "Reach a total of 25 skill levels across all skills.",
    "Master of Many Skills": "Reach a total of 50 skill levels across all skills.", "Ultimate Skill Mastery": "Reach a total of 100 skill levels across all skills.", "Skill Grandmaster": "Reach a total of 150 skill levels across all skills.",
    "Skill Omniscient": "Reach a total of 200 skill levels across all skills.", "Skill Sage": "Reach a total of 250 skill levels across all skills.", "XP Boost Master": "Reach the maximum level in the 'XP Boost' skill.",
    "Review Mastery Master": "Reach the maximum level in the 'Review Mastery' skill.", "Accelerated Recall Master": "Reach the maximum level in the 'Accelerated Recall' skill.", "Study Burst Master": "Reach the maximum level in the 'Study Burst' skill.",
    "Efficient Learner Master": "Reach the maximum level in the 'Efficient Learner' skill.", "All Skills Maxed": "Reach the maximum level in all available skills.",

    // Specialty Mastery (Specific Specialties - Unchanged from previous)
    "Anatomy Expert": "Master the Anatomy specialty.", "Physiology Pro": "Master the Physiology specialty.", "Biochem Buff": "Master the Biochemistry specialty.",
    "Micro Mastermind": "Master the Microbiology specialty.", "Pharm Fanatic": "Master the Pharmacology specialty.", "Pathology Pioneer": "Master the Pathology specialty.",
    "ER Enthusiast": "Master the Emergency Medicine specialty.", "Surgical Samurai": "Master the General Surgery specialty.", "OB/GYN Oracle": "Master the Obstetrics & Gynecology specialty.",
    "Psychiatry Prodigy": "Master the Psychiatry specialty.", "Dermatology Dynamo": "Master the Dermatology specialty.", "Radiology Rockstar": "Master the Radiology specialty.",
    "Cardiology Conqueror": "Master the Cardiology specialty.", "Pulmonology Pro": "Master the Pulmonology specialty.", "GI Guru": "Master the Gastroenterology specialty.",
    "Nephron Master": "Master the Nephrology specialty.", "Endocrine Expert": "Master the Endocrinology specialty.", "Neurology Ninja": "Master the Neurology specialty.",
    "Anesthesia Ace": "Master the Anesthesiology specialty.", "Genetics Genius": "Master the Genetics specialty.", "Infectious Intellect": "Master the Infectious Diseases specialty.",
    "Rheum Ruler": "Master the Rheumatology specialty.", "Heme/Onc Hero": "Master the Hematology/Oncology specialty.", "Ortho Overlord": "Master the Orthopedics specialty.",
    "Urology Virtuoso": "Master the Urology specialty.", "Ophthalmology Oracle": "Master the Ophthalmology specialty.", "ENT Expert": "Master the Otolaryngology (ENT) specialty.",
    "PM&R Pro": "Master the Physical Medicine & Rehabilitation specialty.", "Prev Med Pro": "Master the Preventive Medicine specialty.", "Allergy Alleviator": "Master the Allergy & Immunology specialty.",
    "Geriatric Guru": "Master the Geriatrics specialty.", "Palliative Pro": "Master the Palliative Care specialty.", "Ethics Expert": "Master the Medical Ethics specialty.",
    "Critical Care Commander": "Master the Critical Care Medicine specialty.", "Global Health Guru": "Master the Global Health specialty.", "Medical Educator": "Master the Medical Education specialty.",
    "Advanced IM Master": "Master the Internal Medicine (Advanced) specialty.", "Advanced Cardio Master": "Master the Cardiology (Advanced) specialty.", "Advanced Heme/Onc Master": "Master the Hematology/Oncology (Advanced) specialty.",
    "Advanced Neuro Master": "Master the Neurology (Advanced) specialty.",

    // Specialty Mastery (Tiered - Unchanged from previous)
    "Specialty Explorer": "Master 3 different specialties.", "Specialty Collector": "Master 5 different specialties.", "Specialty Aficionado": "Master 10 different specialties.",
    "Specialty Connoisseur": "Master 15 different specialties.", "Specialty Master": "Master 20 different specialties.", "Specialty Grandmaster": "Master 25 different specialties.",
    "Specialty Omniscient": "Master 30 different specialties.", "Specialty Polymath": "Master 35 different specialties.", "Specialty Sovereign": "Master 40 different specialties.",
    "Specialty Legend": "Master 45 different specialties.", "Specialty Divine": "Master 50 different specialties.", "All Specialties Unlocked": "Reach the level required to unlock every specialty.",

    // Combination Mastery (Unchanged from previous)
    "Foundational Five": "Master Anatomy, Physiology, Biochemistry, Microbiology, and Pharmacology.", "Core Clinical Quartet": "Master Internal Medicine, Pediatrics, Emergency Medicine, and General Surgery.",
    "Organ System Savant": "Master all major organ system specialties (Cardiology, Pulmonology, Gastroenterology, Nephrology, Endocrinology, Neurology).", "Surgical Suite Star": "Master General Surgery, Orthopedics, and Urology.",
    "Sensory Specialists": "Master Ophthalmology and Otolaryngology (ENT).", "Mind & Body Master": "Master Psychiatry and Physical Medicine & Rehabilitation (PM&R).", "Infection Fighter": "Master Microbiology and Infectious Diseases.",
    "Cancer Crusader": "Master Hematology/Oncology and Pathology.", "Autoimmune Authority": "Master Rheumatology and Allergy & Immunology.", "High-Level Harmonizer": "Master Critical Care Medicine, Palliative Care, and Medical Ethics.",
    "Advanced Integrator": "Master all 'Advanced' specialties (Internal Medicine, Cardiology, Heme/Onc, Neurology).", "Global Guru": "Master Global Health and Preventive Medicine.", "Foundational Master": "Master all Level 1-3 foundational sciences.",

    // Daily Task Achievements (Unchanged from previous)
    "Task Taker": "Complete your first Daily Task.", "Task Completer": "Complete 5 Daily Tasks.", "Daily Task Master": "Complete all Daily Tasks in a single day.",
    "Consistent Tasker": "Complete all Daily Tasks for 3 consecutive days.", "Task Champion": "Complete 25 Daily Tasks.", "Daily Duty": "Complete 100 Daily Tasks.",
    "Task Veteran": "Complete 250 Daily Tasks.", "Task Grandmaster": "Complete 500 Daily Tasks.", "Perfect Week": "Complete all Daily Tasks for 7 consecutive days.",
    "Perfect Month": "Complete all Daily Tasks for 30 consecutive days.", "Task Streak": "Complete all Daily Tasks for 60 consecutive days.", "Task Legend": "Complete all Daily Tasks for 100 consecutive days.",

    // Review Efficiency / Streak (Unchanged from previous)
    "Perfect Review": "Complete a review exactly on the day it is due.", "Review Streak Starter": "Complete at least one review for 3 consecutive days.", "Review Streak Master": "Complete at least one review for 7 consecutive days.",
    "Review Streak Addict": "Complete at least one review for 30 consecutive days.", "Flawless Recall": "Successfully complete 10 consecutive reviews without missing their due dates.", "Master Reviewer": "Successfully complete 50 consecutive reviews without missing their due dates.",
    "Perfect Streak": "Successfully complete 100 consecutive reviews without missing their due dates.", "Review Marathon": "Complete 10 reviews in a single day.", "Review Spree": "Complete 25 reviews in a single day.",
    "Review Blitz": "Complete 50 reviews in a single day.", "Review Due Flood": "Have 10 or more reviews due at the same time.", "Empty Review List": "Clear all currently due reviews.",

    // Other Milestones / Challenges (Unchanged from previous)
    "Boss Slayer": "Face your first Boss Battle (Level Milestone).", "Music Lover": "Toggle the background music on.", "Theme Thinker": "Change the light/dark theme.",
    "Data Exporter": "Export your save data.", "Data Importer": "Import save data.", "Fresh Start": "Use the reset feature.",
    "XP Spurt": "Gain 1000 XP from a single action.", "Level Skip": "Gain enough XP from a single action to level up multiple times.", "Skill Point Hoarder": "Accumulate 50 unspent Skill Points.",
    "Maxed Out Skill": "Reach the maximum level in any skill.", "XP Overload": "Gain XP when your XP bar is already full (before leveling up).", "Ultimate Completionist": "Unlock every other achievement.",
    "Stat Checker": "View the detailed statistics modal 10 times.", "Tinkerer": "Toggle the light/dark theme 20 times.", "Archivist": "Use the Import/Export function 5 times.",
    "Burst User": "Use the Study Burst skill for the first time."
};





    // ============================================================== //
    // ===== CORRECTED Audio Handling (HTML Audio + SFX) ===== //
    // ============================================================== //

    // --- SFX Setup (Requires User Interaction Still) ---
    let synth, achievementSynth, errorSynth, skillSynth; // Variables for SFX synths

    function initializeSfxAudio() { // RENAMED from initializeAudio
        if (sfxAudioInitialized || !toneJsLoaded) return;
        console.log("AUDIO_DEBUG: Setting up Tone.start listener for SFX...");
        let initializing = false;

        const startSfx = () => {
            if (initializing || sfxAudioInitialized) return;
            initializing = true;
            console.log("AUDIO_DEBUG: User interaction detected, trying Tone.start() for SFX...");
            Tone.start().then(() => {
                console.log("AUDIO_DEBUG: Tone.start() successful for SFX.");
                sfxAudioInitialized = true; // Mark Tone.js context as ready FOR SFX
                // Create SFX synths
                try {
                    console.log("AUDIO_DEBUG: Creating SFX Synths...");
                    // Use your actual synth configurations here if different
                    synth = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.2 } }).toDestination();
                    achievementSynth = new Tone.Synth({ oscillator: { type: "triangle8" }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.5 } }).toDestination();
                    errorSynth = new Tone.Synth({ oscillator: { type: "square" }, volume: -12, envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 } }).toDestination();
                    skillSynth = new Tone.Synth({ oscillator: { type: "sawtooth" }, volume: -9, envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination();
                    sfxSynthsReady = true; // Mark SFX synths as ready
                    console.log("AUDIO_DEBUG: SFX Synths created.");
                } catch (e) { console.error("AUDIO_DEBUG: Error creating SFX synths:", e); sfxSynthsReady = false; }
                // Remove listeners
                document.body.removeEventListener('click', startSfxWrapper, { capture: true });
                document.body.removeEventListener('keypress', startSfxWrapper, { capture: true });
                document.body.removeEventListener('touchstart', startSfxWrapper, { capture: true });
            }).catch(e => {
                console.error("AUDIO_DEBUG: Tone.start() failed for SFX:", e);
                 showNotification("Could not initialize SFX audio context.", 5000); // Added showNotification
                initializing = false;
            });
        };
        const startSfxWrapper = () => { startSfx(); };
        // Add interaction listeners (removed on success)
        document.body.addEventListener('click', startSfxWrapper, { capture: true, once: true });
        document.body.addEventListener('keypress', startSfxWrapper, { capture: true, once: true });
        document.body.addEventListener('touchstart', startSfxWrapper, { capture: true, once: true });
    }

    // --- Keep SFX Play Function ---
     function playSound(soundType) {
         // Use the renamed state variables
         if (!sfxAudioInitialized || !sfxSynthsReady || !synth) {
             console.log(`SOUND_DEBUG: SFX not ready, skipping sound: ${soundType}`);
             return;
         }
         // Ensure Tone is ready
         if (typeof Tone === 'undefined' || !Tone?.now) {
             console.warn("SOUND_DEBUG: Tone object not fully ready.");
             return;
         }
         const now = Tone.now();
         try {
             let targetSynth = synth;
             if (soundType === 'achievement' && achievementSynth) targetSynth = achievementSynth;
             else if (soundType === 'skillUp' && skillSynth) targetSynth = skillSynth;
             else if (soundType === 'error' && errorSynth) targetSynth = errorSynth;
             // Check if the target synth actually exists before using it
             else if (!targetSynth) { console.warn("SOUND_DEBUG: Target SFX synth not available for " + soundType); return; }

             // Trigger the sound
             switch (soundType) { /* Keep all the cases */
                case 'levelUp': targetSynth.triggerAttackRelease("C4", "8n", now); targetSynth.triggerAttackRelease("E4", "8n", now + 0.1); targetSynth.triggerAttackRelease("G4", "8n", now + 0.2); targetSynth.triggerAttackRelease("C5", "4n", now + 0.3); break;
                case 'diseaseCheck': targetSynth.triggerAttackRelease("A4", "16n", now); break;
                case 'achievement': targetSynth.triggerAttackRelease("G5", "2n", now); break;
                case 'skillUp': targetSynth.triggerAttackRelease("D5", "16n", now); targetSynth.triggerAttackRelease("A5", "8n", now + 0.1); break;
                case 'error': targetSynth.triggerAttackRelease("C3", "8n", now); break;
                case 'taskComplete': targetSynth.triggerAttackRelease("B4", "16n", now); targetSynth.triggerAttackRelease("D5", "16n", now + 0.1); targetSynth.triggerAttackRelease("G5", "8n", now + 0.2); break;
                default: console.warn(`Unknown sound type: ${soundType}`);
             }
         } catch (e) { console.error(`Error playing SFX "${soundType}":`, e); }
     }


    // --- Function to Play/Pause the HTML <audio> element --- ADDED
    function toggleBackgroundMusicHtmlAudio() {
        // Check if the HTML element exists first
        if (!bgmAudioElement) {
            console.error("BGM ERROR: HTML Audio Element #bgmAudio not found!");
            showNotification("Error: BGM player element missing in HTML.", 4000);
            if (musicToggleBtnEl) {
                 musicToggleBtnEl.textContent = "🎵 Error";
                 musicToggleBtnEl.disabled = true;
                 musicToggleBtnEl.title = "BGM Element Missing";
             }
            return;
        }

        try {
            if (bgmAudioElement.paused) {
                console.log("BGM DEBUG: Attempting to play HTML audio...");
                // .play() returns a Promise which might reject if interaction is needed
                const playPromise = bgmAudioElement.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        // Success
                        console.log("BGM DEBUG: Playback started via HTML audio.");
                        if (musicToggleBtnEl) { // Check button exists
                            musicToggleBtnEl.textContent = "🎵 Pause";
                            musicToggleBtnEl.title = "Pause Background Music";
                        }
                    }).catch(error => {
                        // Failure (likely needs interaction or file issue)
                        console.error("BGM ERROR: HTML audio .play() failed:", error);
                        if (error.name === 'NotAllowedError') {
                             showNotification("Browser blocked autoplay. Tap button again.", 4000);
                        } else if (error.name === 'NotSupportedError') {
                             showNotification("Audio format/file error. Check console.", 4000);
                        } else {
                             showNotification("Could not play BGM. Check console.", 4000);
                        }
                        // Ensure button reflects paused state on error
                         if (musicToggleBtnEl) {
                            musicToggleBtnEl.textContent = "🎵 Play";
                            musicToggleBtnEl.title = "Play Background Music";
                         }
                    });
                } else { // Fallback if no promise
                     if (musicToggleBtnEl) {
                         musicToggleBtnEl.textContent = "🎵 Pause";
                         musicToggleBtnEl.title = "Pause Background Music";
                     }
                }
            } else {
                // If playing, pause it
                bgmAudioElement.pause();
                console.log("BGM DEBUG: Playback paused via HTML audio.");
                 if (musicToggleBtnEl) {
                    musicToggleBtnEl.textContent = "🎵 Play";
                    musicToggleBtnEl.title = "Play Background Music";
                 }
            }
        } catch (e) {
            // Catch synchronous errors during play/pause attempt
            console.error("BGM ERROR: Sync error during HTML audio play/pause:", e);
            showNotification("Error controlling BGM.", 4000);
             if (musicToggleBtnEl) {
                musicToggleBtnEl.textContent = "🎵 Error";
                musicToggleBtnEl.title = "Playback Error";
             }
        }
    }

    // --- Main Music Toggle Button Function --- ADDED
    // This is the function called by the event listener at the bottom of the script
    function toggleMusic() {
    // ADDED LINES: Try to init SFX if not already done
    if (!sfxAudioInitialized && toneJsLoaded) {
        initializeSfxAudio(); 
    }
    // --- The old check block above this line was removed ---

    console.log("AUDIO_DEBUG: Calling HTML audio toggle function.");
    toggleBackgroundMusicHtmlAudio(); 

    // Grant achievement only if playback likely started
    if (bgmAudioElement && !bgmAudioElement.paused){
        checkAchievement("Music Lover");
    }
}

    // ===== END CORRECTED Audio Handling =====


    // ========================================
    // ===== Utility Functions ================
    // ========================================
    function getTodayDateString() {
         const today = new Date();
         const year = today.getFullYear();
         const month = String(today.getMonth() + 1).padStart(2, '0');
         const day = String(today.getDate()).padStart(2, '0');
         return `${year}-${month}-${day}`;
     }
function getYearMonthString() {
     const today = new Date();
     const year = today.getFullYear();
     const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
     return `${year}-${month}`; // <-- CORRECTED LINE
 }
    function calculateXpNeededForLevel(level) {
         if (level <= 0) return XP_LEVEL_BASE;
         return XP_LEVEL_BASE * level + XP_LEVEL_QUADRATIC_FACTOR * level * level;
     }
    function getCurrentXpBoostMultiplier() {
         return 1 + (skills.xpBoost * XP_BOOST_PER_SKILL_POINT);
     }
    function getCurrentReviewXpBonus() {
         return skills.reviewMastery * REVIEW_MASTERY_XP_PER_POINT;
     }
    function getCurrentReviewIntervalMultiplier() {
        // Use optional chaining for safety in case elements don't exist yet
        const maxLevel = parseInt(buyAcceleratedRecallBtnEl?.dataset?.maxLevel ?? '0');
        const maxReduction = maxLevel * ACCELERATED_RECALL_PERCENT_PER_POINT;
        const currentReduction = Math.min(skills.acceleratedRecall * ACCELERATED_RECALL_PERCENT_PER_POINT, maxReduction);
        return 1 - currentReduction;
     }
    function getStudyBurstXp() {
         if (skills.studyBurst <= 0) return 0;
         return skills.studyBurst * STUDY_BURST_XP_PER_LEVEL;
     }
    function getEfficientLearnerChance() {
         const maxLevel = parseInt(buyEfficientLearnerBtnEl?.dataset?.maxLevel ?? '0');
         const maxChance = maxLevel * EFFICIENT_LEARNER_CHANCE_PER_POINT;
         return Math.min(skills.efficientLearner * EFFICIENT_LEARNER_CHANCE_PER_POINT, maxChance);
     }
    function gainXP(baseAmount) {
         if (baseAmount <= 0) return 0;
         const boostedAmount = Math.ceil(baseAmount * getCurrentXpBoostMultiplier());
         xp += boostedAmount;
         checkLevelUp(); // Check for level up after gaining XP
         return boostedAmount;
     }
     function gainSP(amount) {
         if (amount === 0) return;
         skillPoints += amount;
         console.log(`SP Change: ${amount > 0 ? '+' : ''}${amount}. New total: ${skillPoints}`);
         // UI update happens via updateStatsUI called elsewhere
     }
     function updateStatsUI() {
         // Ensure elements exist before updating
         if (xpValueEl) xpValueEl.textContent = xp;
         const xpNeeded = calculateXpNeededForLevel(level);
         if (xpNeededValueEl) xpNeededValueEl.textContent = xpNeeded;
         if (levelValueEl) levelValueEl.textContent = level;
         if (achievementsCountEl) achievementsCountEl.textContent = achievements.length;
         if (questionsTotalValueEl) questionsTotalValueEl.textContent = totalQuestions;
         if (reviewsTotalValueEl) reviewsTotalValueEl.textContent = totalReviewsCompleted;
         if (dailyStreakValueEl) dailyStreakValueEl.textContent = dailyStreak;
         if (longestStreakValueEl) longestStreakValueEl.textContent = longestStreak;
         if (skillPointsValueEl) skillPointsValueEl.textContent = skillPoints;
         if (skillLevelsTotalValueEl) skillLevelsTotalValueEl.textContent = totalSkillLevelsPurchased;
         if (availableSkillPointsEl) availableSkillPointsEl.textContent = skillPoints; // Show available SP

         if (xpBarEl) {
             const percent = xpNeeded > 0 ? Math.min((xp / xpNeeded) * 100, 100) : (xp > 0 ? 100 : 0); // Handle level 0 case or 0 XP needed
             xpBarEl.style.width = percent + "%";
             xpBarEl.textContent = `${Math.floor(percent)}%`;
             xpBarEl.classList.toggle('full', percent >= 100);
         }

         // Update skills - pass button element for dataset access
         // Added checks for elements existing before calling updateSkillUI
         if (xpBoostLevelEl && buyXpBoostBtnEl) updateSkillUI('xpBoost', xpBoostLevelEl, buyXpBoostBtnEl, (skills.xpBoost * XP_BOOST_PER_SKILL_POINT * 100).toFixed(0));
         if (reviewMasteryLevelEl && buyReviewMasteryBtnEl) updateSkillUI('reviewMastery', reviewMasteryLevelEl, buyReviewMasteryBtnEl, (skills.reviewMastery * REVIEW_MASTERY_XP_PER_POINT));
         if (acceleratedRecallLevelEl && buyAcceleratedRecallBtnEl) updateSkillUI('acceleratedRecall', acceleratedRecallLevelEl, buyAcceleratedRecallBtnEl, (skills.acceleratedRecall * ACCELERATED_RECALL_PERCENT_PER_POINT * 100).toFixed(0));
         if (studyBurstLevelEl && buyStudyBurstBtnEl) updateSkillUI('studyBurst', studyBurstLevelEl, buyStudyBurstBtnEl, getStudyBurstXp());
         if (efficientLearnerLevelEl && buyEfficientLearnerBtnEl) updateSkillUI('efficientLearner', efficientLearnerLevelEl, buyEfficientLearnerBtnEl, (getEfficientLearnerChance() * 100).toFixed(0));

         if (useStudyBurstBtnEl) {
            const today = getTodayDateString();
            useStudyBurstBtnEl.disabled = (skills.studyBurst === 0 || lastStudyBurstDate === today);
            useStudyBurstBtnEl.title = skills.studyBurst === 0 ? "Upgrade Study Burst skill to use" : (lastStudyBurstDate === today ? `Study Burst already used today` : `Gain ${getStudyBurstXp()} XP (once per day)`);
         }
     }
     function updateSkillUI(skillName, levelEl, buttonEl, effectValue) {
         // Check elements and data attributes exist
         if (!levelEl || !buttonEl || !buttonEl.dataset || buttonEl.dataset.maxLevel === undefined || buttonEl.dataset.baseCost === undefined) {
             console.warn(`Missing elements or data attributes for skill UI: ${skillName}`);
             return;
         }
         const currentLevel = skills[skillName];
         const maxLevel = parseInt(buttonEl.dataset.maxLevel);
         const baseCost = parseInt(buttonEl.dataset.baseCost);
         // Ensure baseCost and currentLevel are valid numbers before calculating next cost
         if (isNaN(baseCost) || isNaN(currentLevel)) {
             console.error(`Invalid baseCost or currentLevel for skill ${skillName}`);
             return;
         }
         const nextLevelCost = baseCost + currentLevel;

         // Display Effect Value
         if (skillName === 'xpBoost' || skillName === 'acceleratedRecall' || skillName === 'efficientLearner') {
             levelEl.textContent = `${effectValue}%`;
         } else if (skillName === 'reviewMastery' || skillName === 'studyBurst') {
             levelEl.textContent = `+${effectValue} XP`;
         } else {
             levelEl.textContent = currentLevel;
         }

         // Update Button State
         const costSpan = buttonEl.querySelector('.skill-cost'); // Get cost span element

         if (currentLevel >= maxLevel) {
             buttonEl.disabled = true;
             buttonEl.textContent = "Max Level"; // Set text directly
             if (costSpan) costSpan.remove(); // Remove cost span if it exists
             buttonEl.classList.add('max-level');
         } else {
             buttonEl.disabled = skillPoints < nextLevelCost;
             buttonEl.classList.remove('max-level');
             // Set base text content first, then manage the span
             buttonEl.textContent = "Upgrade ";
             let currentCostSpan = buttonEl.querySelector('.skill-cost'); // Re-check after setting textContent
             if (!currentCostSpan) {
                 currentCostSpan = document.createElement('span');
                 currentCostSpan.className = 'skill-cost';
                 buttonEl.appendChild(currentCostSpan);
             }
             currentCostSpan.textContent = `(Cost: ${nextLevelCost} SP)`;
             currentCostSpan.style.display = 'inline'; // Ensure visible
         }
     }


    // ===========================
    // ===== Save/Load =====
    // ===========================
     function saveProgress() {
         console.log("SAVE_DEBUG: Save progress started.");
         const data = { xp, level, achievements, studied, totalQuestions, totalReviewsCompleted, questLog, dailyStreak, longestStreak, lastStudyDate, lastStudyBurstDate, skillPoints, skills, totalSkillLevelsPurchased, masteredSpecialtyCount, currentTheme, dailyTasks, lastTasksGeneratedDate, monthlyTasks, lastMonthlyTasksGeneratedDate, monthlyTaskProgress };
         try {
             localStorage.setItem(SAVE_KEY, JSON.stringify(data));
             console.log("SAVE_DEBUG: Progress saved successfully to localStorage.");
         }
         catch (e) {
             console.error("SAVE_DEBUG: Failed to save progress to localStorage:", e);
             showNotification("Error: Could not save progress. Storage might be full or disabled.", 0);
         }
     }
     function loadProgress() {
         console.log("LOAD_DEBUG: Load progress started.");
         try {
             const savedDataString = localStorage.getItem(SAVE_KEY);
             if (savedDataString) {
                 console.log("LOAD_DEBUG: Found saved data in localStorage.");
                 const data = JSON.parse(savedDataString);

                 xp = data.xp || 0;
                 level = data.level || 1;
                 achievements = data.achievements || [];
                 studied = data.studied || {};
                 totalQuestions = data.totalQuestions || 0;
                 totalReviewsCompleted = data.totalReviewsCompleted || 0;
                 questLog = data.questLog || [];
                 if (questLog.length > 50) questLog = questLog.slice(0, 50);
                 dailyStreak = data.dailyStreak || 0;
                 longestStreak = data.longestStreak || 0;
                 lastStudyDate = data.lastStudyDate || null;
                 lastStudyBurstDate = data.lastStudyBurstDate || null;
                 skillPoints = data.skillPoints || 0;
                 skills = {
                     xpBoost: data.skills?.xpBoost || 0,
                     reviewMastery: data.skills?.reviewMastery || 0,
                     acceleratedRecall: data.skills?.acceleratedRecall || 0,
                     studyBurst: data.skills?.studyBurst || 0,
                     efficientLearner: data.skills?.efficientLearner || 0
                 };
                 totalSkillLevelsPurchased = data.totalSkillLevelsPurchased || 0;
                 masteredSpecialtyCount = data.masteredSpecialtyCount || 0;
                 currentTheme = data.currentTheme || 'dark';
                 dailyTasks = data.dailyTasks || [];
                 lastTasksGeneratedDate = data.lastTasksGeneratedDate || null;
monthlyTasks = data.monthlyTasks || [];
lastMonthlyTasksGeneratedDate = data.lastMonthlyTasksGeneratedDate || null;
monthlyTaskProgress = data.monthlyTaskProgress || { topicsStudiedThisMonthCount: 0, reviewsCompletedThisMonthCount: 0, questionsAnsweredThisMonthCount: 0, levelsGainedThisMonthCount: 0, levelAtMonthStart: data.level || 1 };
// Ensure levelAtMonthStart is reasonable if loading old save
if (!monthlyTaskProgress.levelAtMonthStart && data.level) {
    monthlyTaskProgress.levelAtMonthStart = data.level;
} else if (!monthlyTaskProgress.levelAtMonthStart) {
    monthlyTaskProgress.levelAtMonthStart = 1;
}
                 console.log("LOAD_DEBUG: Progress loaded successfully.");

             } else {
                 console.log(`LOAD_DEBUG: No saved data found (${SAVE_KEY}). Starting fresh.`);
                 // Reset to defaults if no save data
                 xp = 0; level = 1; achievements = []; studied = {}; totalQuestions = 0;
                 totalReviewsCompleted = 0; questLog = []; dailyStreak = 0; longestStreak = 0;
                 lastStudyDate = null; lastStudyBurstDate = null; skillPoints = 0;
                 skills = { xpBoost: 0, reviewMastery: 0, acceleratedRecall: 0, studyBurst: 0, efficientLearner: 0 };
                 totalSkillLevelsPurchased = 0; masteredSpecialtyCount = 0; currentTheme = 'dark';
                 dailyTasks = []; lastTasksGeneratedDate = null;
monthlyTasks = []; lastMonthlyTasksGeneratedDate = null; monthlyTaskProgress = { topicsStudiedThisMonthCount: 0, reviewsCompletedThisMonthCount: 0, questionsAnsweredThisMonthCount: 0, levelsGainedThisMonthCount: 0, levelAtMonthStart: 1 };
             }
         } catch (e) {
             console.error("LOAD_DEBUG: Failed to load or parse progress:", e);
             showNotification("Error loading save data. Starting fresh or save corrupted.", 5000);
             // Reset to defaults on error
             xp = 0; level = 1; achievements = []; studied = {}; totalQuestions = 0;
             totalReviewsCompleted = 0; questLog = []; dailyStreak = 0; longestStreak = 0;
             lastStudyDate = null; lastStudyBurstDate = null; skillPoints = 0;
             skills = { xpBoost: 0, reviewMastery: 0, acceleratedRecall: 0, studyBurst: 0, efficientLearner: 0 };
             totalSkillLevelsPurchased = 0; masteredSpecialtyCount = 0; currentTheme = 'dark';
             dailyTasks = []; lastTasksGeneratedDate = null;
monthlyTasks = []; lastMonthlyTasksGeneratedDate = null; monthlyTaskProgress = { topicsStudiedThisMonthCount: 0, reviewsCompletedThisMonthCount: 0, questionsAnsweredThisMonthCount: 0, levelsGainedThisMonthCount: 0, levelAtMonthStart: 1 };
         }

         applyTheme(currentTheme);

         for (const spec in studied) { /* ... validation ... */ }
         if (totalSkillLevelsPurchased === 0 && Object.values(skills).some(lvl => lvl > 0)) { /* ... recalc ... */ }
         if (masteredSpecialtyCount === 0 && Object.keys(studied).length > 0) { /* ... recalc ... */ }
     }


    // ========================================
    // ===== Core Logic Functions =====
    // ========================================
    // NOTE: Paste your full core logic functions here
    // Ensure they are complete and correct
    // ========================================
    // ===== Core Logic Functions =====
    // ========================================
    function handleAddQuestions() {
        if (!questionsInputEl) return; // Add check
        const count = parseInt(questionsInputEl.value);
        if (!isNaN(count) && count > 0) {
            const baseXP = count * XP_PER_QUESTION;
            const gainedXpActual = gainXP(baseXP); // gainXP calls checkLevelUp
showXpToast(gainedXpActual, 'Questions'); // Show XP toast
            totalQuestions += count;
            addQuest(`Answered ${count} questions (+${gainedXpActual} XP)`);
            questionsInputEl.value = ""; // Clear input

            updateTaskProgress(TASK_TYPES.QUESTIONS, count);
            updateTaskProgress(TASK_TYPES.HARD_QUESTIONS, count);
            checkQuestionAchievements();
// Monthly Task Update for answering questions
if (getYearMonthString() === lastMonthlyTasksGeneratedDate) {
    monthlyTaskProgress.questionsAnsweredThisMonthCount += count;
    updateActiveMonthlyTasksProgress();
}
            updateAndSave(); // Update UI and save state
        } else {
            playSound('error');
            showNotification("Please enter a valid number of questions (> 0).");
            questionsInputEl.value = ""; // Clear invalid input
        }
    }

    function checkLevelUp() {
        let leveledUp = false;
        let xpNeeded = calculateXpNeededForLevel(level);

        while (xp >= xpNeeded && xpNeeded > 0) {
            xp -= xpNeeded;
            level++;
            leveledUp = true;

            let pointsGainedBase = SKILL_POINTS_PER_LEVEL;
            let bonusSP = BONUS_SP_MILESTONES[level] || 0;
            let totalPointsGained = pointsGainedBase + bonusSP;

            gainSP(totalPointsGained);

            playSound('levelUp');
            addQuest(`Leveled Up! Reached Level ${level} (+${totalPointsGained} Skill Point${totalPointsGained > 1 ? 's' : ''})`);
            if (bonusSP > 0) {
                addQuest(`Level Milestone Reached! +${bonusSP} Bonus Skill Points!`);
                showNotification(`🎉 Level ${level} Milestone! +${bonusSP} Bonus SP! 🎉`, 5000);
            }

            checkLevelAchievements();

            const bossLevels = [10, 20, 50];
            if (bossLevels.includes(level)) {
                triggerBossBattle(`Boss Battle! Level ${level} Exam Challenge!`);
                checkAchievement("Boss Slayer");
            }

            updateProfilePicture();
            updateNarrative(`Leveled up to Level ${level}! Your knowledge deepens...`);

// Monthly Task Update for gaining levels
if (getYearMonthString() === lastMonthlyTasksGeneratedDate) {
    if (level > monthlyTaskProgress.levelAtMonthStart) { // Make sure levelAtMonthStart is set
        monthlyTaskProgress.levelsGainedThisMonthCount = level - monthlyTaskProgress.levelAtMonthStart;
    } else { // This case should ideally not happen if levelAtMonthStart is correctly initialized
        monthlyTaskProgress.levelsGainedThisMonthCount = 0;
    }
    updateActiveMonthlyTasksProgress();
}

            xpNeeded = calculateXpNeededForLevel(level); // Recalculate for next level
        }

        if (leveledUp) {
            renderSpecialties(specialtySearchInputEl ? specialtySearchInputEl.value : ''); // Re-render to show newly unlocked ones
        }
        // No need to call updateStatsUI here, it's handled by gainXP or other callers
        return leveledUp;
    }

    function updateProfilePicture() {
        if (!profilePictureEl || !profilePictureTitleEl) return;
        let currentMilestoneLevel = 1;
        const sortedMilestoneLevels = Object.keys(PROFILE_PICTURES).map(Number).sort((a, b) => a - b);

        for (const milestoneLevel of sortedMilestoneLevels) {
            if (level >= milestoneLevel) {
                currentMilestoneLevel = milestoneLevel;
            } else {
                break;
            }
        }

        const pfpData = PROFILE_PICTURES[currentMilestoneLevel];
        const defaultPfp = 'https://placehold.co/110x110/2a2a2a/f4c430?text=Healer'; // Fallback

        if (pfpData) {
             if (profilePictureEl.src !== pfpData.src) {
                 profilePictureEl.src = pfpData.src;
             }
             profilePictureTitleEl.textContent = pfpData.title || `Level ${level}`;
         } else {
             if (profilePictureEl.src !== defaultPfp) {
                 profilePictureEl.src = defaultPfp;
             }
             profilePictureTitleEl.textContent = `Level ${level}`;
         }
         profilePictureEl.onerror = () => { // Handle image loading errors
            console.error("Error loading profile picture:", profilePictureEl.src);
            profilePictureEl.src = defaultPfp;
            profilePictureEl.onerror = null;
         };
    }

    function handleRecordDailyStudy() {
        const today = getTodayDateString();
        if (lastStudyDate !== today) {
            const now = new Date();
            const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const yesterdayString = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            const loginXPGained = gainXP(XP_PER_DAILY_LOGIN);
            addQuest(`Daily Login Bonus: +${loginXPGained} XP.`);
            showNotification(`☀️ Daily Login Bonus: +${loginXPGained} XP!`);
            checkAchievement("Streak Starter");

            dailyStreak = (lastStudyDate === yesterdayString) ? dailyStreak + 1 : 1;
            lastStudyDate = today;
            if (dailyStreak > longestStreak) {
                longestStreak = dailyStreak;
            }

            addQuest(`Daily Study Recorded. Streak: ${dailyStreak} day(s). Longest: ${longestStreak} day(s).`);

            let milestoneNotification = '';
            if (DAILY_STREAK_BONUS_XP[dailyStreak]) {
                const bonusXp = DAILY_STREAK_BONUS_XP[dailyStreak];
                const actualBonusXp = gainXP(bonusXp);
                addQuest(`Streak Milestone (${dailyStreak} days)! Bonus: +${actualBonusXp} XP.`);
                milestoneNotification += `🔥 Streak Milestone (${dailyStreak} days)! +${actualBonusXp} XP!`;
            }
            if (DAILY_STREAK_BONUS_SP[dailyStreak]) {
                const bonusSp = DAILY_STREAK_BONUS_SP[dailyStreak];
                gainSP(bonusSp);
                addQuest(`Streak Milestone (${dailyStreak} days)! Bonus: +${bonusSp} SP.`);
                milestoneNotification += `${milestoneNotification ? ' &' : '💎 Streak Milestone ('+dailyStreak+' days)!'} +${bonusSp} SP!`;
            }
            if (milestoneNotification) {
                showNotification(milestoneNotification, 5000);
            }

            checkStreakAchievements();
            updateAndSave();
        } else {
            showNotification("Daily study already recorded for today!");
            playSound('error');
        }
    }

    function toggleDisease(specialty, disease, checkbox) {
        if (checkbox.disabled || (studied[specialty] && studied[specialty][disease])) {
            return;
        }

        const now = Date.now();
        studied[specialty] = studied[specialty] || {};
        let xpGainedBase = XP_PER_DISEASE;
        let intervalIndex = 0;
        const procChance = getEfficientLearnerChance();

        if (procChance > 0 && Math.random() < procChance) {
            xpGainedBase *= 2;
            playSound('skillUp');
            addQuest(`⚡ Efficient Learner proc! Bonus XP studying ${disease}!`);
        }

        const intervalDurationMs = REVIEW_INTERVALS_DAYS[intervalIndex] * MS_PER_DAY * getCurrentReviewIntervalMultiplier();
        const nextReviewTime = now + intervalDurationMs;

        studied[specialty][disease] = {
            completedTime: now,
            nextReview: nextReviewTime,
            reviewIntervalIndex: intervalIndex
        };

        checkbox.checked = true;
        checkbox.disabled = true;

        const actualXPGained = gainXP(xpGainedBase);
showXpToast(actualXPGained, 'Disease Studied'); // Show XP toast
        playSound('diseaseCheck');
        const daysToReview = Math.max(1, Math.round(intervalDurationMs / MS_PER_DAY));
        addQuest(`Studied: ${disease} (${specialty}) (+${actualXPGained} XP). Review in ${daysToReview} day(s).`);

        updateTaskProgress(TASK_TYPES.DISEASES, 1);
        checkDiseaseAchievements();
        checkSpecialtyMastery(specialty, true);
// Monthly Task Update for studying topics
if (getYearMonthString() === lastMonthlyTasksGeneratedDate) {
    monthlyTaskProgress.topicsStudiedThisMonthCount++;
    updateActiveMonthlyTasksProgress(); // This will check if any monthly task is completed
}
        updateAndSave();
    }

    function recalculateMasteredSpecialtyCount() {
         let count = 0;
         for (const specName in specialties) {
             const specData = specialties[specName];
             if (level >= specData.requiredLevel && studied[specName] && specData.diseases.every(diseaseName => studied[specName][diseaseName])) {
                 count++;
             }
         }
         masteredSpecialtyCount = count;
         console.log(`Recalculated mastered specialties: ${masteredSpecialtyCount}`);
         updateStatsUI();
     }

    function checkSpecialtyMastery(specialty, justMasteredCheck = false) {
        if (!specialties[specialty]) return;
        const specData = specialties[specialty];
        if (level < specData.requiredLevel) return;

        const allStudied = specData.diseases.every(diseaseName => studied[specialty]?.[diseaseName]);

        if (allStudied) {
            const specialtyAchievementsMap = { "Anatomy": "Anatomy Expert",
    "Physiology": "Physiology Pro",
    "Biochemistry": "Biochem Buff",
    "Microbiology": "Micro Mastermind",
    "Pharmacology": "Pharm Fanatic", // Assuming Pharmacology exists in your `specialties` object. If not, remove.
    "Pathology": "Pathology Pioneer",
    "Emergency Medicine": "ER Enthusiast",
    "General Surgery": "Surgical Samurai",
    "Obstetrics & Gynecology": "OB/GYN Oracle",
    "Psychiatry": "Psychiatry Prodigy",
    "Dermatology": "Dermatology Dynamo",
    "Radiology": "Radiology Rockstar",
    "Cardiology": "Cardiology Conqueror",
    "Pulmonology": "Pulmonology Pro", // Corrected from "Lung Legend"
    "Gastroenterology": "GI Guru",
    "Nephrology": "Nephron Master", // Corrected from "Nephron Master" to itself (was already okay)
    "Endocrinology": "Endocrine Expert",
    "Neurology": "Neurology Ninja",
    "Anesthesiology": "Anesthesia Ace",
    "Genetics": "Genetics Genius", // Corrected from "Gene Genius"
    "Infectious Diseases": "Infectious Intellect",
    "Rheumatology": "Rheum Ruler",
    "Hematology/Oncology": "Heme/Onc Hero",
    "Orthopedics": "Ortho Overlord",
    "Urology": "Urology Virtuoso",
    "Ophthalmology": "Ophthalmology Oracle", // Corrected from "Eye Expert"
    "Otolaryngology (ENT)": "ENT Expert",
    "Physical Medicine & Rehabilitation (PM&R)": "PM&R Pro", // Corrected from "Rehab Rockstar"
    "Preventive Medicine": "Prev Med Pro", // Corrected from "Preventive Pro"
    "Allergy & Immunology": "Allergy Alleviator",
    "Geriatrics": "Geriatric Guru", // Corrected from "Geriatric Genius"
    "Palliative Care": "Palliative Pro",
    "Medical Ethics": "Ethics Expert",
    "Critical Care Medicine": "Critical Care Commander",
    "Global Health": "Global Health Guru",
    "Medical Education": "Medical Educator",
    "Internal Medicine (Advanced)": "Advanced IM Master",
    "Cardiology (Advanced)": "Advanced Cardio Master",
    "Hematology/Oncology (Advanced)": "Advanced Heme/Onc Master",
    "Neurology (Advanced)": "Advanced Neuro Master" };
            const achievementName = specialtyAchievementsMap[specialty];

            if (achievementName && checkAchievement(achievementName)) {
                updateNarrative(`You have mastered the art of ${specialty}!`);
            }
            checkAchievement("Medical Maestro");

            if (justMasteredCheck) {
                 recalculateMasteredSpecialtyCount();
                 if (masteredSpecialtyCount >= 50) checkAchievement("Specialty Divine");
if (masteredSpecialtyCount >= 45) checkAchievement("Specialty Legend");
if (masteredSpecialtyCount >= 40) checkAchievement("Specialty Sovereign");
if (masteredSpecialtyCount >= 35) checkAchievement("Specialty Polymath");
if (masteredSpecialtyCount >= 30) checkAchievement("Specialty Omniscient");
if (masteredSpecialtyCount >= 25) checkAchievement("Specialty Grandmaster");
if (masteredSpecialtyCount >= 20) checkAchievement("Specialty Master");
if (masteredSpecialtyCount >= 15) checkAchievement("Specialty Connoisseur");
if (masteredSpecialtyCount >= 10) checkAchievement("Specialty Aficionado");
if (masteredSpecialtyCount >= 5) checkAchievement("Specialty Collector");
if (masteredSpecialtyCount >= 3) checkAchievement("Specialty Explorer");
                 checkAllSpecialtiesMastered();
                 renderSpecialties(); // Re-render to show mastery star
             }
        }
    }

     function checkAllSpecialtiesMastered() {
         let totalUnlockedSpecialties = 0;
         let masteredUnlockedSpecialties = 0;
         for (const specName in specialties) {
             if (level >= specialties[specName].requiredLevel) {
                 totalUnlockedSpecialties++;
                 if (studied[specName] && specialties[specName].diseases.every(d => studied[specName][d])) {
                     masteredUnlockedSpecialties++;
                 }
             }
         }
         if (totalUnlockedSpecialties > 0 && masteredUnlockedSpecialties === totalUnlockedSpecialties) {
             checkAchievement("Ultimate Healer");
         }
     }

    function checkAchievement(name) {
    if (!achievementDescriptions[name]) {
        console.warn(`Attempted achievement "${name}" with no description.`);
        return false;
    }
    if (!achievements.includes(name)) {
        achievements.push(name);
        achievements.sort();
        playSound('achievement'); // You can create a more distinct sound for this later if you like

        // Standard notification
        showNotification(`🏆 Achievement Unlocked: ${name}`, 4000);

        // ---- START: New Celebration Code ----
        const celebrationOverlay = document.querySelector('.celebration');
        const celebrationContent = document.getElementById('celebration-content');
        if (celebrationOverlay && celebrationContent) {
            const icon = achievementIcons[name] || "🎉";
            celebrationContent.innerHTML = `<span class="math-inline">\{icon\}<br\></span>{name}`; // Display icon and name
            celebrationOverlay.classList.add('show');
            // Hide celebration after a few seconds
            setTimeout(() => {
                celebrationOverlay.classList.remove('show');
            }, 3000); // Display for 3 seconds
        }
        // ---- END: New Celebration Code ----

        addQuest(`Achievement Unlocked: ${name}`);
        updateAchievementsListUI(); // Update the list to show it as unlocked
        updateStatsUI(); // Updates achievement count display
        return true;
    }
    return false;
}

    // Functions to check specific achievement conditions
    function checkQuestionAchievements() {
         if (totalQuestions >= 2000) checkAchievement("Century of Cures"); // Check highest first
         if (totalQuestions >= 1000) checkAchievement("Marathon of Medicine");
         if (totalQuestions >= 500) checkAchievement("Skillful Scholar");
         if (totalQuestions >= 200) checkAchievement("Exam Overcomer");
         if (totalQuestions >= 50) checkAchievement("Quiz Knight");
     }
    function checkLevelAchievements() {
         const levelMilestones =  {
    500: "Omni-Level Master",
    300: "Ascended Healer",
    250: "Celestial Clinician",
    200: "Dimensional Doctor",
    150: "Master of the Universe",
    100: "Cosmic Physician",
    90: "Transcendent Healer",
    75: "Divine Insight",
    60: "Timeless Scholar",
    50: "Mythical Medic",
    45: "Supreme Healer", // Add this if you want a trigger
    40: "Legendary Scholar",
    35: "Chief of Medicine",
    30: "Epic Healer",
    25: "World-Class Diagnostician",
    20: "Grand Healer",
    15: "Attending Physician",
    12: "Senior Resident",
    8: "Resident of Remedies",
    5: "Adept Healer",
    3: "Medical Intern",
    2: "Clinical Apprentice"
};;
         // Check milestones in descending order for efficiency (optional)
         for (const milestoneLevel in levelMilestones) {
            if (level >= parseInt(milestoneLevel)) {
                checkAchievement(levelMilestones[milestoneLevel]);
            }
         }
     }
    function checkDiseaseAchievements() {
         let count = 0;
         for (const spec in studied) {
             if (studied.hasOwnProperty(spec) && typeof studied[spec] === 'object') {
                  count += Object.keys(studied[spec]).length;
             }
         }
         if (count >= 1500) checkAchievement("Lore Master");
    if (count >= 1250) checkAchievement("Scholarly Sage");
    if (count >= 1000) checkAchievement("Knowledge Architect");
    if (count >= 750) checkAchievement("Compendium Compiler");
    if (count >= 500) checkAchievement("Syllabus Surveyor");
    if (count >= 250) checkAchievement("Topic Collector");
    if (count >= 100) checkAchievement("Dedicated Healer");
    if (count >= 50) checkAchievement("Domain Discoverer");
    if (count >= 25) checkAchievement("Persistent Scholar");
    if (count >= 5) checkAchievement("Novice Diagnostician"); // Corrected threshold
    if (count >= 1) checkAchievement("First Blood");
         // Ultimate Healer checked elsewhere
     }
    function checkStreakAchievements() {
        if (dailyStreak >= 365) checkAchievement("Annual Achiever");
        if (dailyStreak >= 200) checkAchievement("Bicentennial Believer");
        if (dailyStreak >= 100) checkAchievement("Centennial Streak");
        if (dailyStreak >= 30) checkAchievement("Daily Devotee");
        if (dailyStreak >= 14) checkAchievement("Dedicated Disciple");
        if (dailyStreak >= 7) checkAchievement("Streak Master");
        if (dailyStreak >= 1) checkAchievement("Streak Starter");
     }
    function checkReviewAchievements() {
        if (totalReviewsCompleted >= 200) checkAchievement("Review Legend");
        if (totalReviewsCompleted >= 100) checkAchievement("Review Virtuoso");
        if (totalReviewsCompleted >= 50) checkAchievement("Review Veteran");
        if (totalReviewsCompleted >= 10) checkAchievement("Review Enthusiast");
        if (totalReviewsCompleted >= 1) checkAchievement("Review Rookie");
     }
     function checkSkillAchievements() {
         if (totalSkillLevelsPurchased >= 250) checkAchievement("Skill Sage");
    if (totalSkillLevelsPurchased >= 200) checkAchievement("Skill Omniscient");
    if (totalSkillLevelsPurchased >= 150) checkAchievement("Skill Grandmaster");
    if (totalSkillLevelsPurchased >= 100) checkAchievement("Ultimate Skill Mastery");
    if (totalSkillLevelsPurchased >= 50) checkAchievement("Master of Many Skills");
    if (totalSkillLevelsPurchased >= 25) checkAchievement("Skill Collector");
    if (totalSkillLevelsPurchased >= 10) checkAchievement("Total Skill Enthusiast");

         // Check for upgrading specific skills at least once
    if (skills.xpBoost >= 1) { /* No specific achievement for "just upgrading once" for XP Boost in your list */ }
    if (skills.reviewMastery >= 1) checkAchievement("Review Adept");
    if (skills.acceleratedRecall >= 1) checkAchievement("Recall Expert");
    if (skills.studyBurst >= 1) checkAchievement("Burst Believer"); // Already called when skill used
    if (skills.efficientLearner >= 1) checkAchievement("Efficient Expert");

    // Check for reaching Level 5 in any single skill
    if (Object.values(skills).some(level => level >= 5)) checkAchievement("Skill Master");

    // Check for reaching Max Level (10) in any single skill
    // This was "Peak Performance", which is correct.
    let isAnySkillMaxedToTen = false;
    const skillButtons = [buyXpBoostBtnEl, buyReviewMasteryBtnEl, buyAcceleratedRecallBtnEl, buyStudyBurstBtnEl, buyEfficientLearnerBtnEl];
    for (const skillName in skills) {
        const buttonEl = skillButtons.find(btn => btn && btn.dataset.skill === skillName);
        if (buttonEl && skills[skillName] >= parseInt(buttonEl.dataset.maxLevel)) { // Assuming maxLevel is 10 for this achievement
            if (parseInt(buttonEl.dataset.maxLevel) === 10) { // Or check specific condition for "Peak Performance"
                 isAnySkillMaxedToTen = true; //This was "Peak Performance"
                 checkAchievement("Peak Performance");
                 break;
            }
        }
    }
     // Check if any skill is maxed (using its own maxLevel from dataset)
    if (skills.xpBoost >= parseInt(buyXpBoostBtnEl?.dataset?.maxLevel || '99')) checkAchievement("XP Boost Master");
    if (skills.reviewMastery >= parseInt(buyReviewMasteryBtnEl?.dataset?.maxLevel || '99')) checkAchievement("Review Mastery Master");
    if (skills.acceleratedRecall >= parseInt(buyAcceleratedRecallBtnEl?.dataset?.maxLevel || '99')) checkAchievement("Accelerated Recall Master");
    if (skills.studyBurst >= parseInt(buyStudyBurstBtnEl?.dataset?.maxLevel || '99')) checkAchievement("Study Burst Master");
    if (skills.efficientLearner >= parseInt(buyEfficientLearnerBtnEl?.dataset?.maxLevel || '99')) checkAchievement("Efficient Learner Master");


    // Check for maxing out ALL skills
    let allSkillsAreMaxed = true;
    for (const skillName in skills) {
        const buttonEl = skillButtons.find(btn => btn && btn.dataset.skill === skillName);
        if (!buttonEl || skills[skillName] < parseInt(buttonEl.dataset.maxLevel)) {
            allSkillsAreMaxed = false;
            break;
        }
    }
    if (allSkillsAreMaxed && Object.keys(skills).length > 0) checkAchievement("All Skills Maxed");

    // Remove checks for "Skill Sovereign", "True Potential", "Skill Dabbler"
}

     function updateAchievementsListUI() {
    if (!achievementListEl) return;
    achievementListEl.innerHTML = ""; // Clear the list first

    // Get all possible achievement names from your achievementDescriptions object
    const allDefinedAchievementNames = Object.keys(achievementDescriptions);

    // Sort them alphabetically for a consistent order
    allDefinedAchievementNames.sort().forEach(achName => {
        const li = document.createElement('li');
        li.classList.add('achievement-item'); // Add a general class for styling all items

        const icon = achievementIcons[achName] || "🏆"; // Get the icon
        const description = achievementDescriptions[achName] || "Tap here to learn how to get this achievement!"; // Get the description

        // Check if the current player has earned this achievement
        // 'achievements' is your array that stores the names of EARNED achievements
        const isEarned = achievements.includes(achName);

        // Add a specific class based on whether it's earned or locked
        if (isEarned) {
            li.classList.add('achievement-unlocked');
        } else {
            li.classList.add('achievement-locked');
        }

        // Create the span for the achievement name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'achievement-name';
        // We will add icons (lock/check) using CSS later
        nameSpan.textContent = `${icon} ${achName}`;
        li.appendChild(nameSpan);

        // Create the span for the achievement description
        const descSpan = document.createElement('span');
        descSpan.className = 'achievement-desc';
        descSpan.textContent = description; // This tells the player how to get it!
        li.appendChild(descSpan);

        achievementListEl.appendChild(li);
    });
}


    // ========================================
    // ===== Render Specialties Function =====
    // ========================================
    // NOTE: Paste your full renderSpecialties function here
    // ========================================
    // ===== Render Specialties Function =====
    // ========================================
    function renderSpecialties(searchTerm = '') {
         if (!specialtiesContainerEl) {
             console.error("Specialties container element (#specialties) not found!");
             return;
         }
         // Store expanded state before clearing (simple example, might need better state management)
         const expandedStates = {};
         specialtiesContainerEl.querySelectorAll('.specialty.is-expanded').forEach(div => {
            // Attempt to get a unique key - using the text content of H3 minus the indicator/star
            const headerText = div.querySelector('h3')?.textContent.split(' ')[1]; // Get the second word (usually the name)
            if (headerText) expandedStates[headerText] = true;
         });

         specialtiesContainerEl.innerHTML = ''; // Clear content

         const sortedSpecialtyNames = Object.keys(specialties).sort((a, b) => {
             const levelA = specialties[a].requiredLevel;
             const levelB = specialties[b].requiredLevel;
             if (levelA !== levelB) { return levelA - levelB; }
             return a.localeCompare(b);
         });

         for (const specName of sortedSpecialtyNames) {
             const specData = specialties[specName];
             const isLocked = level < specData.requiredLevel;
             const specDiv = document.createElement('div');
             specDiv.className = "specialty";
             if (isLocked) { specDiv.classList.add("locked"); }
             const isMastered = !isLocked && specData.diseases.every(diseaseName => studied[specName]?.[diseaseName]);
             if (isMastered) { specDiv.classList.add("mastered"); }

             const header = document.createElement('h3');
             const masteryStar = isMastered ? ' ⭐' : '';
             header.textContent = `${specData.icon || '❓'} ${specName}${masteryStar}`;

             if (isLocked) {
                const lockInfo = document.createElement('span');
                lockInfo.className = 'specialty-lock-info';
                lockInfo.textContent = ` (Requires Level ${specData.requiredLevel} 🔒)`;
                header.appendChild(lockInfo);
                header.style.cursor = 'not-allowed';
                header.onclick = () => { showNotification(`${specName} unlocks at Level ${specData.requiredLevel}.`); playSound('error'); };
             } else {
                const indicator = document.createElement('span');
                indicator.className = 'specialty-toggle-indicator';
                // Restore expanded state
                const shouldBeExpanded = expandedStates[specName]; // Check if this spec was expanded
                indicator.textContent = shouldBeExpanded ? '▼' : '►'; // Set indicator based on state
                if (shouldBeExpanded) specDiv.classList.add('is-expanded'); // Add class if it should be expanded

                header.appendChild(indicator);
                header.style.cursor = 'pointer';
                header.onclick = function() {
                    const parentSpecDiv = this.closest('.specialty');
                    if (!parentSpecDiv) return;
                    parentSpecDiv.classList.toggle('is-expanded');
                    const isExpandedNow = parentSpecDiv.classList.contains('is-expanded');
                    const currentIndicator = this.querySelector('.specialty-toggle-indicator');
                    if (currentIndicator) currentIndicator.textContent = isExpandedNow ? '▼' : '►';
                    // Update stored state if implementing persistence
                    // expandedStates[specName] = isExpandedNow;
                };
             }
             specDiv.appendChild(header);

             if (!isLocked) {
                 const diseaseList = document.createElement('div');
                 diseaseList.className = "diseaseList";

        // ADD THIS LINE BELOW:
        const lowerSearchTerm = searchTerm.trim().toLowerCase(); 

        specData.diseases.forEach(diseaseName => {
                     // ADD THE TWO LINES BELOW:
                const lowerDiseaseName = diseaseName.toLowerCase();
                if (!lowerSearchTerm || lowerDiseaseName.includes(lowerSearchTerm)) {

                    const wrapper = document.createElement('div');
                     wrapper.className = "disease";
                     wrapper.addEventListener('click', (event) => { event.stopPropagation(); }); // Keep stopPropagation

                     const label = document.createElement('label');
                     const input = document.createElement('input');
                     input.type = 'checkbox';
                     const safeSpecName = specName.replace(/[^a-zA-Z0-9]/g, '-');
                     const safeDiseaseName = diseaseName.replace(/[^a-zA-Z0-9]/g, '-');
                     input.id = `chk-${safeSpecName}-${safeDiseaseName}`;
                     input.value = diseaseName;
                     label.htmlFor = input.id;
                     label.style.cursor = 'pointer';

                     const diseaseText = document.createTextNode(` ${diseaseName}`);
                     label.appendChild(input);
                     label.appendChild(diseaseText);
                     wrapper.appendChild(label);

                     const isStudied = studied[specName]?.[diseaseName];
                     if (isStudied) {
                         input.checked = true;
                         input.disabled = true;
                         label.style.cursor = 'default';
                         const rec = studied[specName][diseaseName];
                         const now = Date.now();
                         if (rec.nextReview && now >= rec.nextReview) {
                             const reviewIndicator = document.createElement('span');
                             reviewIndicator.className = 'review-due-indicator';
                             reviewIndicator.textContent = ' (Review Due!)';
                             reviewIndicator.style.color = 'orange';
                             wrapper.appendChild(reviewIndicator);
                         } else if (rec.nextReview) {
                             const nextReviewDate = new Date(rec.nextReview).toLocaleDateString();
                             const daysUntilReview = Math.max(0, Math.ceil((rec.nextReview - now) / MS_PER_DAY));
                             const reviewInfo = document.createElement('span');
                             reviewInfo.className = 'review-info';
                             reviewInfo.textContent = ` (Next: ${nextReviewDate}, ${daysUntilReview}d)`;
                             wrapper.appendChild(reviewInfo);
                         }
                     } else {
                         input.onchange = () => toggleDisease(specName, diseaseName, input);
                     }
                     diseaseList.appendChild(wrapper);
            }
                 });
                 specDiv.appendChild(diseaseList);
             }
             specialtiesContainerEl.appendChild(specDiv);
         }
     }


    // ========================================
    // ===== UI Functions (Non-Audio) =====
    // ========================================
    // NOTE: Paste your full non-audio UI functions here
    // ========================================
    // ===== UI Functions (Non-Audio) =====
    // ========================================
    function addQuest(message) {
         const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
         questLog.unshift({ message, timestamp });
         if (questLog.length > 50) questLog.pop();
         updateQuestLogUI();
     }
    function updateQuestLogUI() {
         if (!questListEl) return;
         questListEl.innerHTML = "";
         questLog.forEach(q => {
             const li = document.createElement('li');
             li.textContent = `[${q.timestamp}] ${q.message}`;
             questListEl.appendChild(li);
         });
     }
    function handleToggleQuestLog() {
         if (!questListEl || !questToggleIndicatorEl) return;
         const parentSection = questListEl.closest('.quest-log');
         const isExpanded = parentSection.classList.contains('expanded');

         if (isExpanded) {
             parentSection.classList.remove('expanded');
             questListEl.style.maxHeight = '0';
             questToggleIndicatorEl.textContent = "►";
         } else {
             parentSection.classList.add('expanded');
             // Set max-height to scroll height for animation
             questListEl.style.maxHeight = questListEl.scrollHeight + "px";
             questToggleIndicatorEl.textContent = "▼";
         }
     }
    function updateNarrative(message) {
         if (!introTextEl) return;
         // Simple fade out/in
         introTextEl.style.opacity = 0;
         setTimeout(() => {
             introTextEl.textContent = message;
             introTextEl.style.opacity = 1;
         }, 300); // Match transition duration if set in CSS
     }
function showXpToast(xpAmount, sourceText = '') {
    const container = document.getElementById('toast-container');
    if (!container || xpAmount <= 0) {
        return; // Don't show if container missing or no XP gained
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-xp toast-info'; // Basic classes + type

    let message = `+${xpAmount} XP`;
    if (sourceText) {
        message += ` (${sourceText})`;
    }
    toast.textContent = message;

    container.appendChild(toast);

    // Force reflow to enable transition
    void toast.offsetWidth; 

    // Add 'show' class to trigger fade-in/slide-in (defined in your CSS)
    toast.classList.add('show');

    // Set timeout to remove the toast
    const displayDuration = 2500; // How long the toast stays visible (in milliseconds)
    const fadeDuration = 500;     // Should match CSS transition duration for opacity/transform

    setTimeout(() => {
        toast.classList.remove('show'); // Trigger fade-out/slide-out
        setTimeout(() => {
            if (toast.parentNode === container) { // Check if it wasn't already removed
               container.removeChild(toast);
            }
        }, fadeDuration); // Remove from DOM after fade out
    }, displayDuration); 
}
    function updateReviewChecklist() {
         if (!reviewListEl) return;
         reviewListEl.innerHTML = "";
         const now = Date.now();
         let itemsDue = [];

         for (const spec in studied) {
              if (studied.hasOwnProperty(spec)) {
                  for (const dis in studied[spec]) {
                      if (studied[spec].hasOwnProperty(dis)) {
                          const rec = studied[spec][dis];
                          if (rec.nextReview && now >= rec.nextReview) {
                              itemsDue.push({ spec, dis, nextReview: rec.nextReview });
                          }
                      }
                  }
              }
          }

         itemsDue.sort((a, b) => a.nextReview - b.nextReview);

         const reviewSection = reviewListEl.closest('.review-checklist'); // Find parent section

         if (itemsDue.length > 0) {
              itemsDue.forEach(item => {
                  const li = document.createElement('li');
                  li.textContent = `${item.spec} - ${item.dis}`;
                  const btn = document.createElement('button');
                  btn.textContent = "Mark Reviewed";
                  btn.onclick = () => markReviewComplete(item.spec, item.dis);
                  li.appendChild(btn);
                  reviewListEl.appendChild(li);
              });
              if (reviewSection) reviewSection.style.display = 'block'; // Show section
          } else {
              reviewListEl.innerHTML = "<li>No items due for review.</li>";
              if (reviewSection) reviewSection.style.display = 'none'; // Hide section
          }

         renderSpecialties(specialtySearchInputEl ? specialtySearchInputEl.value : ''); // Refresh specialty list to update indicators
     }
     function markReviewComplete(specialty, disease) {
         const now = Date.now();
         if (studied[specialty]?.[disease]) {
             const record = studied[specialty][disease];
             let nextIntervalIndex = Math.min(record.reviewIntervalIndex + 1, REVIEW_INTERVALS_DAYS.length - 1);
             let baseIntervalDays = REVIEW_INTERVALS_DAYS[nextIntervalIndex];
             let actualIntervalMs = baseIntervalDays * MS_PER_DAY * getCurrentReviewIntervalMultiplier();
             let actualIntervalDays = Math.max(1, Math.round(actualIntervalMs / MS_PER_DAY));

             record.nextReview = now + actualIntervalMs;
             record.reviewIntervalIndex = nextIntervalIndex;

             const reviewXPBase = XP_PER_REVIEW_BASE + getCurrentReviewXpBonus();
             const actualXPGained = gainXP(reviewXPBase);
             totalReviewsCompleted++;

             addQuest(`${disease} (${specialty}) reviewed (+${actualXPGained} XP). Next review in ${actualIntervalDays} day(s).`);
             updateTaskProgress(TASK_TYPES.REVIEWS, 1);
             checkReviewAchievements();
// Monthly Task Update for completing reviews
if (getYearMonthString() === lastMonthlyTasksGeneratedDate) {
    monthlyTaskProgress.reviewsCompletedThisMonthCount++;
    updateActiveMonthlyTasksProgress();
}
             updateAndSave();       // Save progress
             updateReviewChecklist(); // Update the review list UI immediately
         } else {
             console.warn(`Attempted to review non-existent record: ${specialty} - ${disease}`);
             playSound('error');
             showNotification("Error: Could not find item to mark as reviewed.");
             updateReviewChecklist(); // Refresh list just in case
         }
     }
     function handleBuySkill(buttonEl) {
         if (!buttonEl || !buttonEl.dataset.skill) return; // Safety check
         const skillName = buttonEl.dataset.skill;
         if (!skills.hasOwnProperty(skillName)) { console.error(`Invalid skill name: ${skillName}`); return; }

         const baseCost = parseInt(buttonEl.dataset.baseCost);
         const maxLevel = parseInt(buttonEl.dataset.maxLevel);
          // Check if values are valid numbers
         if (isNaN(baseCost) || isNaN(maxLevel)) {
             console.error(`Invalid data attributes for button ${skillName}`);
             return;
         }
         const currentLevel = skills[skillName];

         if (currentLevel >= maxLevel) { showNotification("Skill is already at maximum level!"); playSound('error'); return; }

         const cost = baseCost + currentLevel;

         if (skillPoints >= cost) {
             gainSP(-cost);
             skills[skillName]++;
             totalSkillLevelsPurchased++;

             playSound('skillUp');
             const formattedName = skillName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Better formatting
             addQuest(`Upgraded skill: ${formattedName} to Level ${skills[skillName]}. Cost: ${cost} SP.`);
             checkSkillAchievements();
             updateAndSave(); // This will call updateStatsUI which updates the skill display
         } else {
             playSound('error');
             showNotification("Not enough Skill Points!");
         }
     }
     function handleUseStudyBurst() {
         const today = getTodayDateString();
         if (skills.studyBurst <= 0) { playSound('error'); showNotification("Upgrade the Study Burst skill first!"); return; }
         if (lastStudyBurstDate === today) { playSound('error'); showNotification("Study Burst already used today."); return; }

         const xpGainedBase = getStudyBurstXp();
         if (xpGainedBase <= 0) { console.warn("Study burst XP is zero?"); return; }

         const actualXPGained = gainXP(xpGainedBase);
         lastStudyBurstDate = today;
         playSound('skillUp');
         addQuest(`Used Study Burst! Gained ${actualXPGained} XP.`);
         updateAndSave(); // Updates UI (disables button) and saves
     }


    // ========================================
    // ===== Modals =====
    // ========================================
    // NOTE: Paste your full modal functions here
   // ========================================
    // ===== Modals =====
    // ========================================
    function showNotification(message, autoCloseDelay = 4000) {
        // Ensure elements exist
        if (!notificationModalEl || !notificationMessageEl || !okNotificationModalBtnEl) {
            console.error("Notification modal elements not found!");
            alert(message); // Fallback to simple alert
            return;
        }

        if (notificationTimeout) { clearTimeout(notificationTimeout); notificationTimeout = null; }
        notificationMessageEl.textContent = message;
        notificationModalEl.style.display = "block";
        void notificationModalEl.offsetWidth; // Force reflow for animation
        notificationModalEl.classList.add('is-open');

        const manualClose = autoCloseDelay <= 0;
        okNotificationModalBtnEl.style.display = manualClose ? 'inline-block' : 'none';

        if (!manualClose && autoCloseDelay > 0) {
            notificationTimeout = setTimeout(closeNotificationModal, autoCloseDelay);
        }
    }
    function closeNotificationModal() {
        if (!notificationModalEl) return;
        if (notificationTimeout) { clearTimeout(notificationTimeout); notificationTimeout = null; }
        notificationModalEl.classList.remove('is-open');
        setTimeout(() => {
             if (!notificationModalEl.classList.contains('is-open')) {
                 notificationModalEl.style.display = "none";
             }
         }, 300); // Match CSS transition duration
    }
    function triggerBossBattle(message) {
        showNotification(message, 0); // Show indefinitely
        addQuest(message);
    }
    function showStatsModal() {
        if (!statsModalEl || !statsContentEl) return;
        let totalDiseaseCount = 0;
        let studiedDiseaseCount = 0;
        let masteryDetails = '<ul>';
        const sortedSpecNames = Object.keys(specialties).sort((a, b) => specialties[a].requiredLevel - specialties[b].requiredLevel || a.localeCompare(b));

        for (const specName of sortedSpecNames) {
            const specData = specialties[specName];
            const specDiseases = specData.diseases || [];
            const specTotal = specDiseases.length;
            let specStudied = 0;
            let isUnlocked = level >= specData.requiredLevel;

            if (isUnlocked && studied[specName]) {
                specStudied = Object.keys(studied[specName]).length;
            }
            if (isUnlocked) {
                 totalDiseaseCount += specTotal;
                 studiedDiseaseCount += specStudied;
             }

            const masteryPercent = (isUnlocked && specTotal > 0) ? ((specStudied / specTotal) * 100).toFixed(0) : 0;
            const isMastered = isUnlocked && specStudied === specTotal && specTotal > 0;
            const lockStatus = isUnlocked ? '' : ` (🔒 Lvl ${specData.requiredLevel})`;
            const displayPercent = isUnlocked ? `(${masteryPercent}%)` : '';
            const displayCount = isUnlocked ? `${specStudied} / ${specTotal}` : '- / -';
            masteryDetails += `<li style="${!isUnlocked ? 'opacity: 0.6;' : ''}">` +
                              `${specData.icon || ''} ${specName}${lockStatus}: ` +
                              `${displayCount} ${displayPercent} ${isMastered ? '⭐' : ''}` +
                              `</li>`;
        }
        masteryDetails += '</ul>';

        const overallPercent = totalDiseaseCount > 0 ? ((studiedDiseaseCount / totalDiseaseCount) * 100).toFixed(1) : 0;
        statsContentEl.innerHTML = `<p><strong>Overall Progress:</strong> ${studiedDiseaseCount} / ${totalDiseaseCount} Diseases Studied (${overallPercent}%)</p>` +
                                  `<p><strong>Mastered Specialties:</strong> ${masteredSpecialtyCount}</p>` +
                                  `<p><strong>Longest Daily Streak:</strong> ${longestStreak} days</p>` +
                                  `<p><strong>Total Questions Answered:</strong> ${totalQuestions}</p>` +
                                  `<p><strong>Total Reviews Completed:</strong> ${totalReviewsCompleted}</p>` +
                                  `<p><strong>Total Skill Levels Purchased:</strong> ${totalSkillLevelsPurchased}</p>` +
                                  `<hr><p><strong>Specialty Mastery Details:</strong></p>${masteryDetails}`;

        statsModalEl.style.display = 'block';
        void statsModalEl.offsetWidth;
        statsModalEl.classList.add('is-open');
    }
    function closeStatsModal() {
        if (!statsModalEl) return;
        statsModalEl.classList.remove('is-open');
        setTimeout(() => { if (!statsModalEl.classList.contains('is-open')) statsModalEl.style.display = 'none'; }, 300);
    }
    function showImportExportModal() {
        if (!importExportModalEl || !importExportDataEl) return;
         const dataString = localStorage.getItem(SAVE_KEY);
         importExportDataEl.value = dataString || '';
         importExportModalEl.style.display = 'block';
         void importExportModalEl.offsetWidth;
         importExportModalEl.classList.add('is-open');
     }
    function closeImportExportModal() {
        if (!importExportModalEl) return;
        importExportModalEl.classList.remove('is-open');
        setTimeout(() => { if (!importExportModalEl.classList.contains('is-open')) importExportModalEl.style.display = 'none'; }, 300);
    }
    function copyExportData() {
         if (!importExportDataEl || !importExportDataEl.value) {
             showNotification("No save data to copy.", 2000);
             return;
         }
        importExportDataEl.select();
        importExportDataEl.setSelectionRange(0, 99999); // For mobile devices

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(importExportDataEl.value).then(() => {
                    showNotification("Copied save data to clipboard!", 2000);
                }).catch(err => {
                    console.error('Async Clipboard Error: ', err);
                    if (!document.execCommand('copy')) { throw new Error('execCommand failed'); }
                     showNotification("Copied save data! (Fallback)", 2000);
                });
            } else if (document.execCommand('copy')) {
                showNotification("Copied save data! (Legacy)", 2000);
            } else {
                 throw new Error('No copy method supported');
             }
        } catch (err) {
            console.error('Copy Error: ', err);
            showNotification("Failed to auto-copy. Please copy manually.", 4000);
        }
    }
    function importData() {
        if (!importExportDataEl) return;
        const dataString = importExportDataEl.value;
        if (!dataString) { showNotification("Paste your saved data into the text box first.", 3000); playSound('error'); return; }
        try {
            const data = JSON.parse(dataString);
            if (typeof data !== 'object' || data === null || data.xp === undefined || data.level === undefined || data.skills === undefined) {
                throw new Error("Invalid data format.");
            }
            localStorage.setItem(SAVE_KEY, dataString);
            addQuest("Progress imported successfully. Reloading...");
            showNotification("Import successful! Reloading page...", 2500);
            setTimeout(() => location.reload(), 2500);
        } catch (e) {
            console.error("Failed to import data:", e);
            playSound('error');
            showNotification(`Import Failed: ${e.message || 'Invalid data.'}`, 5000);
        }
    }


    // ========================================
    // ===== Theme Handling =====
    // ========================================
    // NOTE: Paste your theme functions here
    // ========================================
    // ===== Theme Handling =====
    // ========================================
    function applyTheme(theme) {
        if (!bodyEl || !themeToggleBtnEl) return; // Safety check
        if (theme === 'light') {
            bodyEl.classList.add('light-mode');
            themeToggleBtnEl.textContent = '🌙';
            themeToggleBtnEl.title = 'Switch to Dark Theme';
        } else { // Default to dark
            bodyEl.classList.remove('light-mode');
            themeToggleBtnEl.textContent = '☀️';
            themeToggleBtnEl.title = 'Switch to Light Theme';
        }
        currentTheme = theme; // Ensure global state matches
    }
    function handleThemeToggle() {
if (!sfxAudioInitialized && toneJsLoaded) {
        initializeSfxAudio(); 
    }
        const newTheme = bodyEl.classList.contains('light-mode') ? 'dark' : 'light';
        applyTheme(newTheme);
        checkAchievement("Theme Thinker");
        saveProgress(); // Save the theme preference
    }


    // ========================================
    // ===== Reset Handling =====
    // ========================================
    // NOTE: Paste your reset functions here
    // ========================================
    // ===== Reset Handling =====
    // ========================================
    function openResetModal() {
        if (!resetModalEl) return;
        resetModalEl.style.display = "block";
        void resetModalEl.offsetWidth;
        resetModalEl.classList.add('is-open');
    }
    function closeResetModal() {
        if (!resetModalEl) return;
        resetModalEl.classList.remove('is-open');
        setTimeout(() => { if (!resetModalEl.classList.contains('is-open')) resetModalEl.style.display = "none"; }, 300);
    }
    function handleConfirmReset() {
        try {
            localStorage.removeItem(SAVE_KEY);
            console.log("Local storage cleared for key:", SAVE_KEY);
            addQuest("Game progress has been reset."); // Add quest log entry
            showNotification("Game Reset! Reloading...", 2000);
            setTimeout(() => location.reload(), 2000);
        } catch (e) {
            console.error("Failed to clear local storage:", e);
            showNotification("Error resetting game. Could not clear save.", 5000);
            closeResetModal();
        }
    }

    // ========================================
    // ===== Update & Save (Simplified) =====
    // ========================================
    // NOTE: Paste your simplified updateAndSave function here
    // ========================================
    // ===== Update & Save (Simplified) =====
    // ========================================
    function updateAndSave() {
        // Call individual UI update functions needed after an action
        updateStatsUI();
        updateAchievementsListUI();
        updateQuestLogUI();
        renderDailyTasksUI();
        renderMonthlyTasksUI(); // Render monthly tasks
        // NOTE: renderSpecialties is called by updateReviewChecklist when needed
        // NOTE: updateReviewChecklist is called by markReviewComplete and init
        saveProgress(); // Save everything after updates
    }

// ===========================================
// ===== Monthly Task System Functions =====
// ===========================================

function checkAndGenerateMonthlyTasks() {
    const currentYearMonth = getYearMonthString();
    if (lastMonthlyTasksGeneratedDate !== currentYearMonth) {
        console.log(`MONTHLY_TASK_DEBUG: Generating new monthly tasks for ${currentYearMonth}. Last gen date: ${lastMonthlyTasksGeneratedDate}`);
        generateNewMonthlyTasks(); // This will also reset counters via resetMonthlyTaskCounters
        addQuest("🌟 New Monthly Challenges available!");
        // Save progress will be called by the first action or init
    } else {
        console.log(`MONTHLY_TASK_DEBUG: Monthly tasks for ${currentYearMonth} already generated or loaded.`);
    }
}

function resetMonthlyTaskCountersAndSetDate() {
    monthlyTaskProgress.topicsStudiedThisMonthCount = 0;
    monthlyTaskProgress.reviewsCompletedThisMonthCount = 0;
    monthlyTaskProgress.questionsAnsweredThisMonthCount = 0;
    monthlyTaskProgress.levelsGainedThisMonthCount = 0;
    monthlyTaskProgress.levelAtMonthStart = level; // Capture current level at the start of the month's tasks
    lastMonthlyTasksGeneratedDate = getYearMonthString();
    console.log(`MONTHLY_TASK_DEBUG: Monthly progress counters reset. Level at month start: ${level}`);
}

function generateNewMonthlyTasks() {
    monthlyTasks = []; // Clear old tasks
    resetMonthlyTaskCountersAndSetDate(); // Reset progress for the new month

    const availableTaskConfigs = [...MONTHLY_TASK_CONFIG];
    const numTasksToGenerate = Math.min(NUM_MONTHLY_TASKS_TO_OFFER, availableTaskConfigs.length);

    for (let i = 0; i < numTasksToGenerate; i++) {
        if (availableTaskConfigs.length === 0) break;

        const configIndex = Math.floor(Math.random() * availableTaskConfigs.length);
        const config = availableTaskConfigs.splice(configIndex, 1)[0]; // Pick and remove

        // For monthly tasks, let's pick the first target tier for simplicity for now
        // Or you could randomize: const targetIndex = Math.floor(Math.random() * config.targets.length);
        const targetIndex = 0; 
        const target = config.targets[targetIndex];
        const rewardXP = config.rewardsXP[targetIndex];
        const rewardSP = config.rewardsSP[targetIndex];
        const description = config.desc.replace('{target}', target);

        const newTask = {
            id: `${config.id}-${target}`, // Unique ID including target
            type: config.type, // Not currently used, but good for future
            description: description,
            target: target,
            progress: 0, // Will be updated from monthlyTaskProgress object
            rewardXP: rewardXP,
            rewardSP: rewardSP,
            completed: false,
            metric: config.metric 
        };
        monthlyTasks.push(newTask);
    }
    console.log("MONTHLY_TASK_DEBUG: Generated monthly tasks:", monthlyTasks);
    updateActiveMonthlyTasksProgress(); // Initialize progress from counters
}

function updateActiveMonthlyTasksProgress() {
    let changed = false;
    monthlyTasks.forEach(task => {
        if (task.completed) return;

        let currentProgressForTask = 0;
        if (task.completed) return; // Skip if already completed

let actualMonthlyProgressValue = 0;
if (task.metric && monthlyTaskProgress[task.metric] !== undefined) {
    actualMonthlyProgressValue = monthlyTaskProgress[task.metric];
}
// Any custom logic for other task types would go here

// Always update the task's progress to reflect the main counter for that metric
if (task.progress !== actualMonthlyProgressValue) {
    task.progress = actualMonthlyProgressValue;
    // If this update alone completes the task, it will be caught below.
    // We don't mark 'changed = true' yet unless it leads to completion.
}

if (task.progress >= task.target && !task.completed) { // Now check for completion
    task.completed = true;
    claimMonthlyTaskReward(task);
    changed = true; // A task was completed, so UI and save are needed
}
    });

    if (changed) { // Only update UI and save if a task was actually completed
        renderMonthlyTasksUI();
        saveProgress();
    }
}

function claimMonthlyTaskReward(task) {
    if (!task) return;
    let rewardMessage = `🎉 Monthly Challenge Complete: ${task.description}. Reward: `;
    let xpGained = 0;
    if (task.rewardXP > 0) {
        xpGained = gainXP(task.rewardXP); // gainXP handles XP boost
        rewardMessage += `+${xpGained} XP`;
    }
    if (task.rewardSP > 0) {
        gainSP(task.rewardSP);
        rewardMessage += `${xpGained > 0 ? ' & ' : ''} +${task.rewardSP} SP`;
    }
    addQuest(rewardMessage);
    showNotification(`🏆 Monthly Challenge: ${task.description}! Reward claimed!`, 5000);
    playSound('achievement'); // Or a new sound for monthly task completion
    updateStatsUI(); // Update SP/XP display
}

function renderMonthlyTasksUI() {
    // console.log("MONTHLY_DEBUG: renderMonthlyTasksUI - STARTING"); // Keep this commented unless debugging
    if (!monthlyTaskListEl || !monthlyTasksDateEl) {
        console.error("MONTHLY_DEBUG: renderMonthlyTasksUI - ERROR: Missing list or date element!"); 
        return; // Exit if elements are missing
    }

    // --- Date Display Logic (Corrected Version) ---
    if (monthlyTasksDateEl) { 
        if (lastMonthlyTasksGeneratedDate) {
            // Attempt to create a date object. lastMonthlyTasksGeneratedDate should be "YYYY-MM"
            const year = parseInt(lastMonthlyTasksGeneratedDate.substring(0, 4));
            const month = parseInt(lastMonthlyTasksGeneratedDate.substring(5, 7)) - 1; // JavaScript months are 0-11

            if (!isNaN(year) && !isNaN(month)) {
                const dateForDisplay = new Date(year, month, 1);
                if (!isNaN(dateForDisplay.getTime())) { // Check if the constructed date is valid
                    monthlyTasksDateEl.textContent = `( ${dateForDisplay.toLocaleString('default', { month: 'long', year: 'numeric' })} )`;
                } else {
                    monthlyTasksDateEl.textContent = "(Date Error B)"; 
                }
            } else {
                monthlyTasksDateEl.textContent = "(Date Error A)"; 
            }
        } else {
            // If no tasks have been generated yet, show current month as placeholder
            const today = new Date();
            monthlyTasksDateEl.textContent = `( ${today.toLocaleString('default', { month: 'long', year: 'numeric' })} )`; 
        }
    }
    // --- End Date Display ---

    monthlyTaskListEl.innerHTML = ""; // Clear the list first

    // console.log(`MONTHLY_DEBUG: renderMonthlyTasksUI - monthlyTasks array length: ${monthlyTasks ? monthlyTasks.length : 'null'}`); // Keep commented unless debugging

    if (!monthlyTasks || monthlyTasks.length === 0) {
        // console.log("MONTHLY_DEBUG: renderMonthlyTasksUI - No monthly tasks to display."); // Keep commented unless debugging
        monthlyTaskListEl.innerHTML = "<li class='placeholder'>No monthly challenges active. Check back on the 1st of the month!</li>";
        return;
    }

    // --- Loop through tasks (With validation and corrected text) ---
    monthlyTasks.forEach((task, index) => {
        // console.log(`MONTHLY_DEBUG: renderMonthlyTasksUI - Processing task index ${index}:`, JSON.stringify(task)); // Keep commented unless debugging

        // **Validation Check**
         if (!task || typeof task.description !== 'string' || typeof task.target !== 'number' || typeof task.progress !== 'number' || typeof task.rewardXP !== 'number' || typeof task.rewardSP !== 'number' || typeof task.completed !== 'boolean') {
              console.error(`MONTHLY_DEBUG: renderMonthlyTasksUI - ERROR: Task at index ${index} has invalid or missing properties! Skipping. Task data:`, JSON.stringify(task));
              return; // Skip this task
         }

        try { 
            const li = document.createElement('li');
            li.classList.add(task.completed ? 'task-complete' : 'task-incomplete');

            // Description
            const descSpan = document.createElement('span');
            descSpan.className = 'task-desc';
            descSpan.textContent = task.description;
            li.appendChild(descSpan);

            // Progress
            const progressSpan = document.createElement('span');
            progressSpan.className = 'task-progress';

            // Use validated numbers
            let currentTaskProgress = task.progress; // Already checked it's a number
            let currentTaskTarget = task.target;   // Already checked it's a number
            const displayProgress = Math.min(currentTaskProgress, currentTaskTarget);
            const targetDisplay = currentTaskTarget; 

            // **Use backticks here!**
            progressSpan.textContent = `[${displayProgress}/${targetDisplay}]`; 
            li.appendChild(progressSpan);

            // Reward
            const rewardSpan = document.createElement('span');
            rewardSpan.className = 'task-reward';
            // Use backticks here too for consistency if needed later, but simple concatenation is fine
            let rewardText = `(${task.rewardXP} XP`; 
            if (task.rewardSP > 0) {
                rewardSpan.classList.add('task-reward-sp'); 
                // Use backticks for the SP part too
                rewardText += ` + ${task.rewardSP} SP`; 
            }
            rewardText += ')';
            if (task.completed) {
                rewardText += ' ✔️';
            }
            rewardSpan.textContent = rewardText;
            li.appendChild(rewardSpan);

            // Append the completed list item
            monthlyTaskListEl.appendChild(li); 
            // console.log(`MONTHLY_DEBUG: renderMonthlyTasksUI - Successfully created and appended li for task index ${index}`); // Keep commented unless debugging

        } catch (error) {
            console.error(`MONTHLY_DEBUG: renderMonthlyTasksUI - ERROR creating list item for task index ${index}:`, error); 
            console.error(`MONTHLY_DEBUG: Faulty task data was:`, JSON.stringify(task)); 
        }
    });
    // console.log("MONTHLY_DEBUG: renderMonthlyTasksUI - FINISHED processing tasks."); // Keep commented unless debugging
}


// ===========================================
// ===== END Monthly Task System Functions =====
// ===========================================

    // ========================================
    // ===== Daily Task System Functions =====
    // ========================================
    // NOTE: Paste your full daily task functions here
    // ========================================
    // ===== Daily Task System Functions =====
    // ========================================
     function checkAndGenerateDailyTasks() {
         const today = getTodayDateString();
         if (lastTasksGeneratedDate !== today) {
             console.log(`TASK_DEBUG: Generating new tasks for ${today}. Last gen date: ${lastTasksGeneratedDate}`);
             generateNewDailyTasks();
             lastTasksGeneratedDate = today;
             addQuest("✨ New Daily Tasks available!");
             // Don't save here, save happens on first action or init
         } else {
             console.log(`TASK_DEBUG: Tasks for ${today} already generated or loaded.`);
         }
     }
     function generateNewDailyTasks() {
         dailyTasks = [];
         const availableTaskConfigs = [...DAILY_TASK_CONFIG];
         const numTasksToGenerate = Math.min(NUM_DAILY_TASKS, availableTaskConfigs.length);

         for (let i = 0; i < numTasksToGenerate; i++) {
              if (availableTaskConfigs.length === 0) break;
              const configIndex = Math.floor(Math.random() * availableTaskConfigs.length);
              const config = availableTaskConfigs[configIndex];
              const targetIndex = Math.floor(Math.random() * config.targets.length);
              const target = config.targets[targetIndex];
              const rewardXP = config.rewardsXP[targetIndex] || config.rewardsXP[0];
              const rewardSP = config.rewardSP || 0;
              const description = config.desc.replace('{target}', target);

              const newTask = { id: `${Date.now()}-${i}`, type: config.type, description: description, target: target, progress: 0, rewardXP: rewardXP, rewardSP: rewardSP, completed: false };
              dailyTasks.push(newTask);
              // Optional: Prevent duplicate task types per day
              // availableTaskConfigs.splice(configIndex, 1);
         }
         console.log("TASK_DEBUG: Generated tasks:", dailyTasks);
         // Don't save here, wait for init/action
     }
     function renderDailyTasksUI() {
         if (!dailyTaskListEl || !dailyTasksDateEl) return;
         dailyTasksDateEl.textContent = `(Resets Daily)`;
         dailyTaskListEl.innerHTML = "";

         if (!dailyTasks || dailyTasks.length === 0) { // Added check for null/undefined
             dailyTaskListEl.innerHTML = "<li>No daily tasks available currently.</li>";
             return;
         }

         dailyTasks.forEach(task => {
             const li = document.createElement('li');
             li.classList.add(task.completed ? 'task-complete' : 'task-incomplete');
             const descSpan = document.createElement('span');
             descSpan.className = 'task-desc';
             descSpan.textContent = task.description;
             li.appendChild(descSpan);
             const progressSpan = document.createElement('span');
             progressSpan.className = 'task-progress';
             let currentTaskProgress = typeof task.progress === 'number' ? task.progress : 0;
let currentTaskTarget = typeof task.target === 'number' ? task.target : 0;

// Ensure progress doesn't exceed target for display, and they are numbers
const displayProgress = Math.min(Number(currentTaskProgress) || 0, Number(currentTaskTarget) || 0);
const targetDisplay = Number(currentTaskTarget) || 0; // Ensure target is a number for display

progressSpan.textContent = `[${displayProgress}/${targetDisplay}]`;
             li.appendChild(progressSpan);
             const rewardSpan = document.createElement('span');
             rewardSpan.className = 'task-reward';
             let rewardText = `(${task.rewardXP} XP`;
             if (task.rewardSP > 0) { rewardSpan.classList.add('task-reward-sp'); rewardText += ` + ${task.rewardSP} SP`; }
             rewardText += ')';
             if (task.completed) { rewardText += ' ✔️'; }
             rewardSpan.textContent = rewardText;
             li.appendChild(rewardSpan);
             dailyTaskListEl.appendChild(li);
         });
     }
     function updateTaskProgress(taskType, amountToAdd) {
         if (amountToAdd <= 0 || !dailyTasks || dailyTasks.length === 0) return;
         let taskUpdated = false;
         let allTasksNowComplete = true;

         dailyTasks.forEach(task => {
             if (!task.completed) {
                 if (task.type === taskType) {
                     const oldProgress = task.progress;
                     task.progress += amountToAdd;
                     if (task.progress >= task.target) {
                         task.progress = task.target;
                         task.completed = true;
                         claimTaskReward(task);
                         playSound('taskComplete');
                         checkAchievement("Task Taker");
                         taskUpdated = true;
                         console.log(`TASK_DEBUG: Task "${task.description}" completed!`);
                     } else if (task.progress > oldProgress) {
                          taskUpdated = true;
                          console.log(`TASK_DEBUG: Progress updated for task "${task.description}" to ${task.progress}/${task.target}`);
                     }
                 }
                  if (!task.completed) { // Check completion status after potential update
                      allTasksNowComplete = false;
                  }
             }
         });

         if (taskUpdated && allTasksNowComplete && dailyTasks.length > 0) { // Ensure there were tasks to complete
              checkAchievement("Task Master");
          }

         if (taskUpdated) {
             renderDailyTasksUI();
             saveProgress(); // Save after progress update
         }
     }
     function claimTaskReward(task) {
         if (!task) return;
         let rewardMessage = `Task Complete: ${task.description}. Reward: `;
         let xpGained = 0;
         if (task.rewardXP > 0) { xpGained = gainXP(task.rewardXP); rewardMessage += `+${xpGained} XP`; }
         if (task.rewardSP > 0) { gainSP(task.rewardSP); rewardMessage += `${xpGained > 0 ? ' &' : ''} +${task.rewardSP} SP`; }
         addQuest(rewardMessage);
         showNotification(`✔️ Task Complete: ${task.description}! Reward claimed!`, 3000);
         updateStatsUI(); // Update stats after claiming reward
     }


    // ========================================
    // ===== Initialization =====
    // ========================================
    // NOTE: Paste your modified init function here
    function init() {
        console.log(`Initializing Healer's Odyssey (${SAVE_KEY})...`);

        // Initialize SFX audio setup listener if Tone.js is loaded
        if (toneJsLoaded) {
             initializeSfxAudio(); // Ensure this calls the correct function
         } else {
             console.error("Tone.js library not loaded! Sound effects disabled.");
             showNotification("Warning: Sound effect library failed to load.", 5000);
             if(musicToggleBtnEl) { musicToggleBtnEl.disabled = true; musicToggleBtnEl.title="SFX Lib Error"; }
         }

        // Ensure BGM element reference exists & set initial button state
        if (!bgmAudioElement) {
             console.error("INIT ERROR: Background music HTML element #bgmAudio not found!");
             if(musicToggleBtnEl) { /* ... set error state ... */ }
        } else if (musicToggleBtnEl) { /* ... set initial button state ... */ }

         // Load progress first
         loadProgress();
         // Generate tasks if needed
         checkAndGenerateDailyTasks();
         checkAndGenerateMonthlyTasks(); // Check and generate monthly tasks
         // Initial UI setup
         renderSpecialties(specialtySearchInputEl ? specialtySearchInputEl.value : '');
         updateProfilePicture();
         updateReviewChecklist();
         updateStatsUI();
         updateAchievementsListUI();
         updateQuestLogUI();
         renderDailyTasksUI();
         renderMonthlyTasksUI(); // Render monthly tasks
         // Save initial state
         saveProgress();

         // Collapse quest log initially
         const questParent = questListEl?.closest('.quest-log');
         if (questParent) questParent.classList.remove('expanded');
         if (questListEl) questListEl.style.maxHeight = '0';
         if (questToggleIndicatorEl) questToggleIndicatorEl.textContent = "►";

updateActiveMonthlyTasksProgress(); // Ensure initial progress syncs from loaded counters

         console.log("Initialization complete.");
     }


    // ========================================
    // ===== Event Listeners =====
    // ========================================
    // NOTE: Ensure ALL your event listeners are included here and are correct
    addQuestionsBtnEl?.addEventListener('click', handleAddQuestions);
    questionsInputEl?.addEventListener('keypress', (event) => { if (event.key === 'Enter') handleAddQuestions(); });
    dailyStudyBtnEl?.addEventListener('click', handleRecordDailyStudy);
    useStudyBurstBtnEl?.addEventListener('click', handleUseStudyBurst);
    questLogHeaderEl?.addEventListener('click', handleToggleQuestLog);
    musicToggleBtnEl?.addEventListener('click', toggleMusic); // Ensure this calls the correct toggleMusic
    themeToggleBtnEl?.addEventListener('click', handleThemeToggle);
    showStatsBtnEl?.addEventListener('click', showStatsModal);
    importExportBtnEl?.addEventListener('click', showImportExportModal);
    resetBtnEl?.addEventListener('click', openResetModal);
    confirmResetBtnEl?.addEventListener('click', handleConfirmReset);
    document.querySelectorAll('.modal').forEach(modal => { /* ... generic close handlers ... */ });
    okNotificationModalBtnEl?.addEventListener('click', closeNotificationModal);
    copyExportDataBtnEl?.addEventListener('click', copyExportData);
    importDataBtnEl?.addEventListener('click', importData);
    buyXpBoostBtnEl?.addEventListener('click', () => handleBuySkill(buyXpBoostBtnEl));
    buyReviewMasteryBtnEl?.addEventListener('click', () => handleBuySkill(buyReviewMasteryBtnEl));
    buyAcceleratedRecallBtnEl?.addEventListener('click', () => handleBuySkill(buyAcceleratedRecallBtnEl));
    buyStudyBurstBtnEl?.addEventListener('click', () => handleBuySkill(buyStudyBurstBtnEl));
    buyEfficientLearnerBtnEl?.addEventListener('click', () => handleBuySkill(buyEfficientLearnerBtnEl));

// --- Modal Close Button Listeners ---
closeResetModalBtnEl?.addEventListener('click', closeResetModal);
cancelResetBtnEl?.addEventListener('click', closeResetModal); // Also close on Cancel

closeNotificationModalBtnEl?.addEventListener('click', closeNotificationModal);
// The OK button already has a listener if needed: okNotificationModalBtnEl?.addEventListener('click', closeNotificationModal);

closeStatsModalBtnEl?.addEventListener('click', closeStatsModal);

closeImportExportModalBtnEl?.addEventListener('click', closeImportExportModal);
// --- End Modal Close Button Listeners ---

// --- Specialty Search Listener ---
specialtySearchInputEl?.addEventListener('input', (event) => {
     // When the user types in the search box, re-render the specialties with the filter
     renderSpecialties(event.target.value); 
});

    // ========================================
    // ===== Start the application =====
    // ========================================
    init();

}); // End DOMContentLoaded listener
