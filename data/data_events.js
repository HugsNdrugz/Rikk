// data_events.js

const possibleWorldEvents = [
    {
        id: "police_crackdown",
        name: "Police Crackdown!",
        description: "5-0 is swarming the streets! Heat builds faster, and fiends are skittish.",
        duration: 3,
        effects: { heatModifier: 1.5, customerScareChance: 0.2, drugPriceModifier: 0.8 }
    },
    {
        id: "party_weekend",
        name: "It's Party Weekend!",
        description: "Everyone's looking to score! Higher demand for party favors.",
        duration: 2,
        effects: { drugDemandModifier: 1.3, drugPriceModifier: 1.2, specificItemDemand: ["blue_magic", "liquid_giggles", "psy_sunshine"] }
    },
    {
        id: "rival_tension",
        name: "Rival Tension High",
        description: "Word is another crew is making moves. Deals are riskier.",
        duration: 4,
        effects: { heatModifier: 1.2, dealFailChance: 0.1 }
    },
    {
        id: "supply_drought",
        name: "Supply Drought",
        description: "Hard to find good product. Prices are up for what's left.",
        duration: 3,
        effects: { itemScarcity: true, allPriceModifier: 1.15 }
    }
    // You can add more event objects here
];