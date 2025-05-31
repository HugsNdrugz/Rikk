// data_items.js

const ITEM_QUALITY_LEVELS = {
    DRUG: ["Stepped On", "Decent Batch", "Pure Fire"],
    STOLEN_GOOD: ["Rough Shape", "Used", "Mint Condition"],
    INFORMATION: ["Basic Intel", "Solid Tip", "Verified Blueprint"],
    TOOL: ["Shoddy", "Standard", "Pro Grade"]
};

const ITEM_QUALITY_MODIFIERS = {
    DRUG: [0.6, 1.0, 1.5],
    STOLEN_GOOD: [0.5, 1.0, 1.8],
    INFORMATION: [0.8, 1.0, 1.3],
    TOOL: [0.7, 1.0, 1.4]
};

const itemTypes = [
    // --- Standard Drugs ---
    { id: "green_crack", name: "Bag of 'Green Crack'", baseValue: 60, range: 20, type: "DRUG", subType: "STIMULANT", heat: 3, description: "Budget-friendly, gets the job done.", effects: ["energy_boost", "jitters"], addictionChance: 0.1 },
    { id: "blue_magic", name: "Few 'Blue Magic' Pills", baseValue: 40, range: 15, type: "DRUG", subType: "PARTY", heat: 2, description: "Small pills, big promises.", effects: ["euphoria", "sociability"], addictionChance: 0.15 },
    { id: "white_pony", name: "Gram of 'White Pony'", baseValue: 100, range: 30, type: "DRUG", subType: "STIMULANT", heat: 5, description: "The uptown special. Potent.", effects: ["focus", "confidence", "paranoia_high_dose"], addictionChance: 0.3 },
    { id: "psy_sunshine", name: "Sheet of 'Psychedelic Sunshine'", baseValue: 150, range: 50, type: "DRUG", subType: "PSYCHEDELIC", heat: 6, description: "A trip to another dimension.", effects: ["visuals", "altered_perception", "anxiety_chance"], addictionChance: 0.05 },
    { id: "liquid_giggles", name: "Vial of 'Liquid Giggles'", baseValue: 80, range: 25, type: "DRUG", subType: "PARTY", heat: 4, description: "Warning: May cause uncontrollable laughter.", effects: ["euphoria", "disinhibition"], addictionChance: 0.2 },
    { id: "afghan_gold", name: "Brick of 'Afghan Gold' (Hash)", baseValue: 250, range: 80, type: "DRUG", subType: "CANNABINOID", heat: 8, description: "Top-shelf import, heavy hitter.", effects: ["relaxation", "hunger", "red_eyes"], addictionChance: 0.08 },
    { id: "lean_syrup", name: "Bottle of 'Lean Back Syrup'", baseValue: 120, range: 40, type: "DRUG", subType: "OPIATE", heat: 5, description: "Slow your roll... way down.", effects: ["sedation", "euphoria_mild", "nausea_chance"], addictionChance: 0.4 },
    { id: "moon_rocks", name: "Nug of 'Moon Rocks'", baseValue: 180, range: 60, type: "DRUG", subType: "CANNABINOID_POTENT", heat: 7, description: "Potent and pricey space weed.", effects: ["intense_relaxation", "couch_lock", "anxiety_high_dose"], addictionChance: 0.12 },
    { id: "synth_spice", name: "Packet of 'Synth Spice'", baseValue: 30, range: 10, type: "DRUG", subType: "SYNTHETIC_CANNABINOID", heat: 4, description: "Cheap, unpredictable, and sketchy.", effects: ["erratic_behavior", "hallucinations_mild", "health_risk"], addictionChance: 0.25 },
    { id: "crystal_clear", name: "Shard of 'Crystal Clear'", baseValue: 200, range: 70, type: "DRUG", subType: "METHAMPHETAMINE", heat: 9, description: "High power, high risk, high paranoia.", effects: ["extreme_energy", "insomnia", "aggression_chance", "psychosis_risk"], addictionChance: 0.6 },
    { id: "pharma_oxy", name: "Few 'Pharma Oxy' Pills", baseValue: 150, range: 50, type: "DRUG", subType: "OPIATE_PRESCRIPTION", heat: 6, description: "Diverted prescription strength painkiller.", effects: ["strong_pain_relief", "euphoria", "drowsiness", "high_overdose_risk"], addictionChance: 0.5 },
    { id: "ketamine_k", name: "Bump of 'Special K'", baseValue: 90, range: 30, type: "DRUG", subType: "DISSOCIATIVE", heat: 5, description: "Enter the K-hole. Or don't.", effects: ["dissociation", "hallucinations", "numbness", "confusion"], addictionChance: 0.1 },
    { id: "nootropics_focus", name: "Bottle of 'FocusMax' Nootropics", baseValue: 70, range: 20, type: "DRUG", subType: "NOOTROPIC", heat: 1, description: "Brain boosters for the grinders. Mostly legal-ish.", effects: ["improved_focus", "slight_energy", "headache_chance"], addictionChance: 0.01 },
    // Stolen Goods
    { id: "used_phone", name: "Slightly-Used Smartphone", baseValue: 90, range: 40, type: "STOLEN_GOOD", heat: 2, description: "Screen's a bit cracked, but it works."},
    { id: "power_tool", name: "Power Tool (No Questions)", baseValue: 70, range: 30, type: "STOLEN_GOOD", heat: 1, description: "Fresh off a 'job site'."},
    { id: "designer_bag", name: "Designer Handbag (Scuffed)", baseValue: 130, range: 60, type: "STOLEN_GOOD", heat: 3, description: "Still got the label, mostly."},
    { id: "premium_liquor", name: "Crate of 'Premium' Liquor", baseValue: 100, range: 40, type: "STOLEN_GOOD", heat: 2, description: "Fell off a truck, you know the vibes."},
    { id: "questionable_jewelry", name: "Jewelry (Questionable Origin)", baseValue: 200, range: 100, type: "STOLEN_GOOD", heat: 4, description: "Shiny, but don't ask where it came from."},
    { id: "hot_laptop", name: "High-End Laptop (Needs Charger)", baseValue: 180, range: 70, type: "STOLEN_GOOD", heat: 3, description: "Top specs, just a little... warm."},
    // Information & Tools
    { id: "info_cops", name: "Intel: Cop Patrol Routes", baseValue: 75, range: 25, type: "INFORMATION", heat: 0, effect: "reduce_heat_small", description: "Know where the 5-0 ain't."},
    { id: "info_rival", name: "Intel: Rival Stash Location", baseValue: 150, range: 50, type: "INFORMATION", heat: 1, effect: "rival_op_chance", description: "Knowledge is power... and profit."},
    { id: "burner_phone", name: "Untraceable Burner Phone", baseValue: 50, range: 10, type: "TOOL", heat: 0, effect: "deal_heat_reduction", uses: 3, description: "Clean calls for dirty deals. Good for 3 uses."},
];