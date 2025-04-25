export default {
    neuro: {
        name: "Neo-Kyoto Circuits 🧠",
        icon: '🧠',
        order: 2,
        unlocksAfter: 'gaia',
        missions: [
            { id: "n1", name: "Sight and Cortex", q: "Which lobe processes visual info?", o: ["Occipital lobe", "Temporal lobe", "Parietal lobe", "Frontal lobe"], a: "Occipital lobe", xp: 20 },
            { id: "n2", name: "Motor Control Secrets", q: "Parkinson's involves loss of which neurotransmitter?", o: ["Dopamine", "Serotonin", "GABA", "Acetylcholine"], a: "Dopamine", xp: 20 },
            { id: "n3", name: "The Relay Gate", q: "Major relay station for sensory info?", o: ["Thalamus", "Hypothalamus", "Cerebellum", "Amygdala"], a: "Thalamus", xp: 25 },
            { id: "n_boss", name: "The Logic Core", boss: true, hp: 120, playerBaseFocus: 3, rewards: { currency: 75 }, svgPath: "M5 11a7 7 0 1114 0 7 7 0 01-14 0z M4.5 11c0-3.866 3.134-7 7-7s7 3.134 7 7M5 11v2.5a6.5 6.5 0 0013 0V11", questions: [
                { easy: { q: "Which lobe is primarily for planning?", o: ["Frontal", "Temporal", "Occipital"], a: "Frontal", damage: 30, focusLoss: 1 }, medium: { q: "Executive functions like decision-making are most associated with which cortex?", o: ["Prefrontal Cortex", "Motor Cortex", "Somatosensory Cortex"], a: "Prefrontal Cortex", damage: 40, focusLoss: 1 }, hard: { q: "Damage to the dorsolateral prefrontal cortex might impair which specific function?", o: ["Working memory", "Facial recognition", "Hearing"], a: "Working memory", damage: 55, focusLoss: 2 } }
            ], xp: 120 }
        ]
    }
};