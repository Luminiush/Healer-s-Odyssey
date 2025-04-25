export default {
    chrono: {
        name: "Chrono Labs ⏳",
        icon: '⏳',
        order: 3,
        unlocksAfter: 'neuro',
        missions: [
            { id: "c1", name: "Temporal Echoes", q: "What cellular process involving chromosome end shortening is linked to aging?", o: ["Mitosis", "Meiosis", "Telomere Shortening", "Apoptosis"], a: "Telomere Shortening", xp: 30 },
            { id: "c2", name: "Half-Life Protocols", q: "Approximate biological half-life of caffeine in most adults?", o: ["30 minutes", "1-2 hours", "4-6 hours", "24 hours"], a: "4-6 hours", xp: 30, timeLimit: 15 },
            { id: "c_boss", name: "Temporal Anomaly", boss: true, hp: 150, playerBaseFocus: 2, rewards: { currency: 100, items: { hintToken: 1 } }, svgPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", questions: [
                { easy: { q: "Is Progeria related to aging?", o: ["Yes", "No"], a: "Yes", damage: 40, focusLoss: 1 }, medium: { q: "Progeria is caused by a mutation in which gene?", o: ["LMNA", "FBN1", "CFTR"], a: "LMNA", damage: 50, focusLoss: 1 }, hard: { q: "The abnormal protein produced in Progeria affects the structure of what cellular component?", o: ["Mitochondria", "Cell membrane", "Nuclear envelope"], a: "Nuclear envelope", damage: 70, focusLoss: 2 } }
            ], xp: 150 }
        ]
    }
};