export default {
    gaia: {
        name: "Gaia Sector 🌿",
        icon: '🌿',
        order: 1,
        missions: [
            { id: "g1", name: "The Heart's Warning", q: "Primary cause of acute myocardial infarction?", o: ["Coronary artery thrombosis", "Severe asthma attack", "Common cold complications", "Ischemic stroke"], a: "Coronary artery thrombosis", xp: 20 },
            { id: "g2", name: "The Blood Code", q: "Essential vitamin for blood clotting?", o: ["Vitamin K", "Vitamin C", "Vitamin D", "Vitamin B12"], a: "Vitamin K", xp: 20, timeLimit: 20 },
            { id: "g3", name: "First Response Protocol", q: "Initial test for acute chest pain in ER?", o: ["Electrocardiogram (ECG)", "MRI", "CT scan", "Echocardiogram"], a: "Electrocardiogram (ECG)", xp: 25 },
            { id: "g_boss", name: "Heartless Titan", boss: true, hp: 100, playerBaseFocus: 3, rewards: { items: { focusVial: 1 }, currency: 50 }, svgPath: "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z", questions: [
                { easy: { q: "What does 'MI' stand for in STEMI?", o: ["Myocardial Infarction", "Multiple Injuries", "Medical Intervention"], a: "Myocardial Infarction", damage: 25, focusLoss: 1 }, medium: { q: "What does STEMI specifically indicate on an ECG?", o: ["ST segment elevation", "Presence of Q waves", "T wave inversion"], a: "ST segment elevation", damage: 35, focusLoss: 1 }, hard: { q: "Which coronary artery blockage typically causes an anterior STEMI?", o: ["Left Anterior Descending (LAD)", "Right Coronary Artery (RCA)", "Circumflex Artery"], a: "Left Anterior Descending (LAD)", damage: 50, focusLoss: 2 } }
            ], xp: 100 }
        ]
    }
};