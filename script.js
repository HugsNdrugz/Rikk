// --- DOM Element References ---
const splashScreen = document.getElementById('splash-screen');
const gameViewport = document.getElementById('game-viewport');
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');

const newGameBtn = document.getElementById('new-game-btn');
const continueGameBtn = document.getElementById('continue-game-btn');
const restartGameBtn = document.getElementById('restart-game-btn');

const cashDisplay = document.getElementById('cash-display');
const dayDisplay = document.getElementById('day-display'); // Fiends Left
const heatDisplay = document.getElementById('heat-display');
const credDisplay = document.getElementById('cred-display'); 
const finalCredDisplay = document.getElementById('final-cred-display'); 

const eventTicker = document.getElementById('event-ticker'); 

const gameScene = document.getElementById('game-scene');
const knockEffect = document.getElementById('knock-effect');

const rikkPhoneDisplay = document.getElementById('rikk-phone-display');
const chatContainer = document.getElementById('chat-container');
const choicesArea = document.getElementById('choices-area');

const openInventoryBtn = document.getElementById('open-inventory-btn');
const togglePhoneBtn = document.getElementById('toggle-phone-btn'); // New phone toggle button
const inventoryCountDisplay = document.getElementById('inventory-count-display');
const nextCustomerBtn = document.getElementById('next-customer-btn');

const inventoryModal = document.querySelector('#inventory-modal.modal-overlay');
const closeModalBtn = document.querySelector('#inventory-dialog .close-modal-btn');
const inventoryList = document.getElementById('inventory-list');
const modalInventorySlotsDisplay = document.getElementById('modal-inventory-slots-display');

const finalDaysDisplay = document.getElementById('final-days-display');
const finalCashDisplay = document.getElementById('final-cash-display');
const finalVerdictText = document.getElementById('final-verdict-text');

// --- Audio References ---
const doorKnockSound = document.getElementById('door-knock-sound');
const cashSound = document.getElementById('cash-sound');
const deniedSound = document.getElementById('denied-sound');
const chatBubbleSound = document.getElementById('chat-bubble-sound');

// --- Game State Variables ---
let cash = 0;
let fiendsLeft = 0;
let heat = 0;
let streetCred = 0;
let inventory = [];
const MAX_INVENTORY_SLOTS = 10;
let currentCustomer = null; // Will hold the active customer's data for the interaction
let gameActive = false;
let playerSkills = { negotiator: 0, appraiser: 0, lowProfile: 0 };
let activeWorldEvents = []; 
let dayOfWeek = 'Monday';
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

let customersPool = []; // NEW: Pool of potential customers
let nextCustomerId = 1; // For generating unique customer IDs

// --- Game Configuration ---
const CUSTOMER_WAIT_TIME = 1100;
const KNOCK_ANIMATION_DURATION = 1000;
const PHONE_ANIMATION_DURATION = 500;
const SAVE_KEY = 'myNiggaRikkSaveDataV4'; // Incremented for new customer pool structure
const STARTING_CASH = 500;
const MAX_FIENDS = 15;
const SPLASH_SCREEN_DURATION = 2500;
const STARTING_STREET_CRED = 0;
const MAX_HEAT = 100;
const MAX_CUSTOMERS_IN_POOL = 20; // Limit the size of the pool for performance


// --- Item Data Enhancements ---
// MOVED TO data_items.js:
// const ITEM_QUALITY_LEVELS = { ... };
// const ITEM_QUALITY_MODIFIERS = { ... };
// const itemTypes = [ ... ];

// --- Customer Archetypes ---
// MOVED TO data_customers.js:
// const customerArchetypes = { ... };

// --- World Events ---
// MOVED TO data_events.js:
// const possibleWorldEvents = [ ... ];


// --- HANDLER FUNCTIONS ---
// ... (handleStartNewGameClick, handleContinueGameClick, handleRestartGameClick same) ...
function handleStartNewGameClick() { initializeNewGameState(); startGameFlow(); }
function handleContinueGameClick() { if (loadGameState()) { startGameFlow(); } else { displaySystemMessage("System: No saved game found or data corrupted. Starting new game."); initializeNewGameState(); startGameFlow(); } }
function handleRestartGameClick() { initializeNewGameState(); startGameFlow(); }


// --- CORE GAME FUNCTIONS --- 
function initGame() {
    // ... (same) ...
    splashScreen.classList.add('active'); startScreen.classList.remove('active'); gameScreen.classList.remove('active'); endScreen.classList.remove('active');
    setTimeout(() => { splashScreen.classList.remove('active'); splashScreen.style.display = 'none'; startScreen.classList.add('active'); checkForSavedGame(); }, SPLASH_SCREEN_DURATION);
    newGameBtn.addEventListener('click', handleStartNewGameClick); continueGameBtn.addEventListener('click', handleContinueGameClick); restartGameBtn.addEventListener('click', handleRestartGameClick);
    nextCustomerBtn.addEventListener('click', nextFiend); openInventoryBtn.addEventListener('click', openInventoryModal); closeModalBtn.addEventListener('click', closeInventoryModal);
    inventoryModal.addEventListener('click', (e) => { if (e.target === inventoryModal) closeInventoryModal(); });

    // Phone toggle button listener
    togglePhoneBtn.addEventListener('click', () => {
        if (rikkPhoneDisplay.classList.contains('visible')) {
            rikkPhoneDisplay.classList.remove('visible');
            rikkPhoneDisplay.classList.add('docked'); // Or just remove 'visible' if docked is default hidden state via transform
        } else {
            rikkPhoneDisplay.classList.add('visible');
            rikkPhoneDisplay.classList.remove('docked');
        }
    });

    // Initial phone state: hidden (neither 'visible' nor 'docked' implies hidden by default transform)
    rikkPhoneDisplay.classList.remove('visible');
    rikkPhoneDisplay.classList.remove('docked');
    rikkPhoneDisplay.classList.remove('hidden'); // Remove old class if present
    rikkPhoneDisplay.classList.remove('active'); // Remove old class if present
}


function initializeNewGameState() {
    // ... (same) ...
    clearSavedGameState(); cash = STARTING_CASH; fiendsLeft = MAX_FIENDS; heat = 0; streetCred = STARTING_STREET_CRED; inventory = [];
    playerSkills = { negotiator: 0, appraiser: 0, lowProfile: 0 }; activeWorldEvents = []; dayOfWeek = days[0]; gameActive = false; 
    customersPool = []; nextCustomerId = 1; // Reset customer pool
    updateEventTicker();
}

function startGameFlow() {
    // ... (same) ...
    gameActive = true; splashScreen.classList.remove('active'); splashScreen.style.display = 'none'; startScreen.classList.remove('active'); endScreen.classList.remove('active'); gameScreen.classList.add('active');
    // Start with phone docked or fully hidden
    rikkPhoneDisplay.classList.remove('visible');
    rikkPhoneDisplay.classList.add('docked'); // Or remove 'docked' too if default is fully hidden
    updateHUD(); updateInventoryDisplay(); clearChat(); clearChoices(); nextFiend();
}

function endGame(reason) {
    // ... (same) ...
    gameActive = false; gameScreen.classList.remove('active'); endScreen.classList.add('active');
    finalDaysDisplay.textContent = MAX_FIENDS - fiendsLeft; finalCashDisplay.textContent = cash; finalCredDisplay.textContent = streetCred;
    if (reason === "heat") { finalVerdictText.textContent = `The block's too hot, nigga! 5-0 swarming. Heat: ${heat}. Time to ghost.`; finalVerdictText.style.color = "var(--color-error)"; }
    else if (reason === "bankrupt") { finalVerdictText.textContent = "Broke as a joke. Can't hustle on E, fam."; finalVerdictText.style.color = "var(--color-error)"; }
    else { if (cash >= STARTING_CASH * 3 && streetCred > MAX_FIENDS) { finalVerdictText.textContent = "You a certified KINGPIN! The streets whisper your name."; } else if (cash >= STARTING_CASH * 1.5 && streetCred > MAX_FIENDS / 2) { finalVerdictText.textContent = "Solid hustle, G. Made bank and respect."; } else if (cash > STARTING_CASH) { finalVerdictText.textContent = "Made some profit. Not bad for a night's work."; } else if (cash <= STARTING_CASH && streetCred < 0) { finalVerdictText.textContent = "Tough night. Lost dough and respect. This life ain't for everyone."; } else { finalVerdictText.textContent = "Broke even or worse. Gotta step your game up, Rikk."; } finalVerdictText.style.color = cash > STARTING_CASH ? "var(--color-success-green)" : "var(--color-accent-orange)"; }
    rikkPhoneDisplay.classList.remove('visible');
    rikkPhoneDisplay.classList.add('docked'); // Ensure phone is hidden/docked on game end
    clearSavedGameState();
}

function updateDayOfWeek() { /* ... same ... */ const currentIndex = days.indexOf(dayOfWeek); dayOfWeek = days[(currentIndex + 1) % days.length];}
function triggerWorldEvent() { 
    if (activeWorldEvents.length > 0 && Math.random() < 0.7) return; // Less chance if one is active
    activeWorldEvents = activeWorldEvents.filter(event => event.turnsLeft > 0); 
    // Ensure possibleWorldEvents is defined and has elements before trying to use it
    if (typeof possibleWorldEvents !== 'undefined' && possibleWorldEvents.length > 0 && Math.random() < 0.25 && activeWorldEvents.length === 0) { 
        const eventTemplate = possibleWorldEvents[Math.floor(Math.random() * possibleWorldEvents.length)]; 
        activeWorldEvents.push({ event: eventTemplate, turnsLeft: eventTemplate.duration }); 
    } 
    updateEventTicker(); 
}
function updateEventTicker() { /* ... same ... */ if (activeWorldEvents.length > 0) { const currentEvent = activeWorldEvents[0]; eventTicker.textContent = `Word on the street: ${currentEvent.event.name} (${currentEvent.turnsLeft} turns left)`; } else { eventTicker.textContent = `Word on the street: All quiet... for now. (${dayOfWeek})`; } }
function advanceWorldEvents() { /* ... same ... */ activeWorldEvents.forEach(eventState => { eventState.turnsLeft--; }); activeWorldEvents = activeWorldEvents.filter(eventState => eventState.turnsLeft > 0); }


function nextFiend() {
    // ... (same basic flow) ...
    if (!gameActive) return; if (fiendsLeft <= 0) { endGame("completed"); return; }
    updateDayOfWeek(); advanceWorldEvents(); triggerWorldEvent();
    let heatReduction = 1 + playerSkills.lowProfile; activeWorldEvents.forEach(eventState => { if (eventState.event.effects && eventState.event.effects.heatReductionModifier) { heatReduction *= eventState.event.effects.heatReductionModifier; } });
    heat = Math.max(0, heat - Math.round(heatReduction));
    updateHUD(); clearChat(); clearChoices(); nextCustomerBtn.disabled = true;
    // Phone is initially hidden/docked, made visible by startCustomerInteraction
    rikkPhoneDisplay.classList.remove('visible');
    rikkPhoneDisplay.classList.add('docked');
    playSound(doorKnockSound); knockEffect.textContent = `*${dayOfWeek} hustle... someone's knockin'.*`; knockEffect.classList.remove('hidden'); knockEffect.style.animation = 'none'; void knockEffect.offsetWidth; knockEffect.style.animation = 'knockAnim 0.5s ease-out forwards';
    setTimeout(() => { knockEffect.classList.add('hidden'); startCustomerInteraction(); }, KNOCK_ANIMATION_DURATION);
    saveGameState(); 
}

function calculateItemEffectiveValue(item, purchaseContext = true, customerData = null) {
    // ... (same as previous, ensuring customerArchetype is derived from customerData if present) ...
    let customerArchetype = null;
    if (customerData && customerData.archetypeKey && typeof customerArchetypes !== 'undefined') { // Check customerArchetypes exists
        customerArchetype = customerArchetypes[customerData.archetypeKey];
    }

    let baseValue = purchaseContext ? item.purchasePrice : item.estimatedResaleValue;
    if (!item || !item.itemTypeObj || typeof item.qualityIndex === 'undefined') { console.error("Invalid item structure for value calculation:", item); return baseValue;  }
    
    // Ensure ITEM_QUALITY_MODIFIERS is defined before accessing
    let qualityModifier = 1.0;
    if (typeof ITEM_QUALITY_MODIFIERS !== 'undefined' && ITEM_QUALITY_MODIFIERS[item.itemTypeObj.type]) {
        qualityModifier = ITEM_QUALITY_MODIFIERS[item.itemTypeObj.type][item.qualityIndex] || 1.0;
    }
    
    let effectiveValue = baseValue * qualityModifier;
    if (!purchaseContext && playerSkills.appraiser > 0) { effectiveValue *= (1 + playerSkills.appraiser * 0.05); }
    if (purchaseContext && playerSkills.appraiser > 0) { effectiveValue *= (1 - playerSkills.appraiser * 0.03); }
    activeWorldEvents.forEach(eventState => { const effects = eventState.event.effects; if (effects.allPriceModifier) effectiveValue *= effects.allPriceModifier; if (item.itemTypeObj.type === "DRUG" && effects.drugPriceModifier) effectiveValue *= effects.drugPriceModifier;});
    if (customerArchetype && !purchaseContext) { effectiveValue *= customerArchetype.priceToleranceFactor; }
    return Math.max(5, Math.round(effectiveValue));
}


function generateRandomItem(archetypeData = null) { 
    // Ensure itemTypes is defined
    if (typeof itemTypes === 'undefined' || itemTypes.length === 0) {
        console.error("itemTypes data is not loaded or empty!");
        // Return a fallback item or handle error appropriately
        return { id: "error_item", name: "Error Item", itemTypeObj: { type: "ERROR", heat: 0, description:"Data missing"}, quality: "Unknown", qualityIndex: 0, purchasePrice: 1, estimatedResaleValue: 1, fullDescription: "Data load error." };
    }

    let availableItemTypes = [...itemTypes];
    if (archetypeData && archetypeData.key === "INFORMANT") { availableItemTypes = itemTypes.filter(it => archetypeData.itemPool.includes(it.id)); }
    else if (archetypeData && archetypeData.key === "DESPERATE_FIEND") { availableItemTypes = availableItemTypes.filter(it => it.baseValue < 80 || (it.type === "DRUG" && it.subType !== "PSYCHEDELIC" && it.subType !== "METHAMPHETAMINE")); }
    if (availableItemTypes.length === 0) availableItemTypes = [...itemTypes];

    const selectedType = availableItemTypes[Math.floor(Math.random() * availableItemTypes.length)];
    
    // Ensure ITEM_QUALITY_LEVELS is defined
    const qualityLevelsForType = (typeof ITEM_QUALITY_LEVELS !== 'undefined' && ITEM_QUALITY_LEVELS[selectedType.type]) ? ITEM_QUALITY_LEVELS[selectedType.type] : ["Standard"];
    const qualityIndex = Math.floor(Math.random() * qualityLevelsForType.length);
    const quality = qualityLevelsForType[qualityIndex];
    let basePurchaseValue = selectedType.baseValue + Math.floor(Math.random() * (selectedType.range * 2)) - selectedType.range;
    
    const item = {
      id: selectedType.id, name: selectedType.name, itemTypeObj: selectedType, quality: quality, qualityIndex: qualityIndex,
      description: selectedType.description, uses: selectedType.uses || null, effect: selectedType.effect || null,
    };
    item.fullDescription = `${selectedType.description} This batch is looking ${quality.toLowerCase()}.`;
    
    // Ensure ITEM_QUALITY_MODIFIERS is defined
    let qualityPriceModifier = 1.0;
    if (typeof ITEM_QUALITY_MODIFIERS !== 'undefined' && ITEM_QUALITY_MODIFIERS[selectedType.type]) {
        qualityPriceModifier = ITEM_QUALITY_MODIFIERS[selectedType.type]?.[qualityIndex] || 1.0;
    }
    item.purchasePrice = Math.max(5, Math.round(basePurchaseValue * (0.3 + Math.random() * 0.25) * qualityPriceModifier));
    item.estimatedResaleValue = Math.max(item.purchasePrice + 5, Math.round(basePurchaseValue * (0.7 + Math.random() * 0.35) * qualityPriceModifier));
    return item;
}

function selectOrGenerateCustomerFromPool() {
    // Ensure customerArchetypes is defined
    if (typeof customerArchetypes === 'undefined' || Object.keys(customerArchetypes).length === 0) {
        console.error("customerArchetypes data is not loaded or empty!");
        return { id: `customer_error_${nextCustomerId++}`, name: "Error Customer", archetypeKey: "ERROR_ARCHETYPE", mood: "neutral", cashOnHand: 50, preferredDrugSubTypes: [], addictionLevel: {}, hasMetRikkBefore: false, lastInteractionWithRikk: null, patience: 3, loyalty: 0, maxLoyalty: 0 };
    }

    // Chance for Competitor Scout
    const isNotFirstCustomer = fiendsLeft < MAX_FIENDS;
    const lastCustomerWasScout = currentCustomer && currentCustomer.archetypeKey === "COMPETITOR_SCOUT";
    let scoutChance = 0;
    if (isNotFirstCustomer && !lastCustomerWasScout && customerArchetypes.COMPETITOR_SCOUT) {
        scoutChance = fiendsLeft > 10 ? 0.15 : 0.10;
    }

    if (Math.random() < scoutChance) {
        const scoutArchetypeData = customerArchetypes.COMPETITOR_SCOUT;
        const scoutCustomer = {
            id: `customer_${nextCustomerId++}`,
            name: scoutArchetypeData.baseName,
            archetypeKey: "COMPETITOR_SCOUT",
            mood: scoutArchetypeData.initialMood || "probing",
            cashOnHand: 0, // Not relevant
            hasMetRikkBefore: customersPool.some(c => c.archetypeKey === "COMPETITOR_SCOUT"), // Has Rikk met *a* scout before?
            lastInteractionWithRikk: null,
            patience: 5, // Higher patience as they are observing
            loyalty: 0, // Not applicable
            maxLoyalty: 0, // Not applicable
        };
        // Add to pool so 'hasMetRikkBefore' can be true for future scouts, but scouts might not be typical "returning" customers.
        if (customersPool.length < MAX_CUSTOMERS_IN_POOL) {
            customersPool.push({...scoutCustomer, uniqueIdForPool: scoutCustomer.id }); // Ensure it's a copy if modifying later
        } else {
            customersPool[Math.floor(Math.random() * MAX_CUSTOMERS_IN_POOL)] = {...scoutCustomer, uniqueIdForPool: scoutCustomer.id};
        }
        console.log("Competitor's Scout generated:", scoutCustomer.name);
        return scoutCustomer;
    }

    // Try to pick a returning customer from the pool (e.g., 30% chance if pool has customers and not a scout)
    const nonScoutPool = customersPool.filter(c => c.archetypeKey !== "COMPETITOR_SCOUT");
    if (nonScoutPool.length > 0 && Math.random() < 0.3) {
        const returningCustomer = nonScoutPool[Math.floor(Math.random() * nonScoutPool.length)];
        returningCustomer.hasMetRikkBefore = true; // They are returning
        returningCustomer.cashOnHand = Math.floor(Math.random() * (customerArchetypes[returningCustomer.archetypeKey].priceToleranceFactor * 80)) + 20;
        if (Math.random() < 0.2) returningCustomer.mood = ["neutral", "antsy", "irritable"][Math.floor(Math.random()*3)];

        // Ensure loyalty for returning REGULAR_JOE
        if (returningCustomer.archetypeKey === "REGULAR_JOE") {
            if (returningCustomer.loyalty === undefined) {
                returningCustomer.loyalty = customerArchetypes.REGULAR_JOE.loyalty !== undefined ? customerArchetypes.REGULAR_JOE.loyalty : 0;
            }
            if (returningCustomer.maxLoyalty === undefined) {
                returningCustomer.maxLoyalty = customerArchetypes.REGULAR_JOE.maxLoyalty !== undefined ? customerArchetypes.REGULAR_JOE.maxLoyalty : 5;
            }
        }
        console.log("Returning customer:", returningCustomer.name, "Mood:", returningCustomer.mood, "Loyalty:", returningCustomer.loyalty);
        return returningCustomer;
    }

    // Generate a new non-scout customer
    let archetypeKeys = Object.keys(customerArchetypes).filter(key => key !== "COMPETITOR_SCOUT");
    if (archetypeKeys.length === 0) { // Fallback if only scout exists, though unlikely
        archetypeKeys = Object.keys(customerArchetypes);
    }
    const selectedArchetypeKey = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
    const archetypeData = customerArchetypes[selectedArchetypeKey];

    let customerName = archetypeData.baseName;
    // Ensure nextCustomerId is used correctly if needed for naming, or remove if not.
    // For REGULAR_JOE, the name is static "Chill Chad" as per its definition, so no need to append nextCustomerId.
    if (archetypeData.key !== "REGULAR_JOE" && (archetypeData.baseName.includes("Fiend") || archetypeData.baseName.includes("Joe"))) { // Modified "Joe" to be more generic if other "Joe" types exist
        customerName += ` ${nextCustomerId}`;
    } else if (archetypeData.baseName.includes("Informant")) { // This implies Informant might have varied names
        customerName = ["Whispers", "Eyes on Street", "The Rat", "Silent Tip"][Math.floor(Math.random()*4)];
    } else if (archetypeData.baseName.includes("Roller")) { // This implies Roller might have varied names
        customerName = ["Mr. Big", "Ms. Lavish", "The Whale", "Gold Digger"][Math.floor(Math.random()*4)];
    }
    // If it's REGULAR_JOE, customerName remains archetypeData.baseName ("Chill Chad")

    const newCustomer = {
        id: `customer_${nextCustomerId++}`, // Unique ID for tracking
        name: customerName,
        archetypeKey: selectedArchetypeKey,
        // loyaltyToRikk: 0, // Old generic loyalty, will be replaced by specific archetype data
        mood: archetypeData.initialMood || "neutral",
        cashOnHand: Math.floor(Math.random() * (archetypeData.priceToleranceFactor * 100)) + 30, // Cash varies by tolerance
        preferredDrugSubTypes: archetypeData.preferredDrugSubTypes || [],
        addictionLevel: {}, // { STIMULANT: 0.1, OPIATE: 0.05 }
        hasMetRikkBefore: false,
        lastInteractionWithRikk: null,
        patience: 3 + Math.floor(Math.random()*3),
        // Initialize loyalty for REGULAR_JOE specifically
        loyalty: (selectedArchetypeKey === "REGULAR_JOE") ? (archetypeData.loyalty !== undefined ? archetypeData.loyalty : 0) : 0,
        maxLoyalty: (selectedArchetypeKey === "REGULAR_JOE") ? (archetypeData.maxLoyalty !== undefined ? archetypeData.maxLoyalty : 5) : 0,
    };

    // This block for returning customers was moved up and modified to exclude scouts initially.
    // The following logic for adding new customers to the pool remains.

    if (customersPool.length < MAX_CUSTOMERS_IN_POOL) {
        customersPool.push(newCustomer);
    } else {
        // If replacing, ensure the new customer also gets loyalty if it's REGULAR_JOE
        // This part of the logic might need review if REGULAR_JOE is frequently replaced.
        // For now, the newCustomer object already has loyalty initialized.
        customersPool[Math.floor(Math.random() * MAX_CUSTOMERS_IN_POOL)] = newCustomer;
    }
    console.log("New customer generated:", newCustomer.name, "Archetype:", newCustomer.archetypeKey, "Loyalty:", newCustomer.loyalty);
    return newCustomer;
}


function generateCustomerInteractionData() {
    const customerData = selectOrGenerateCustomerFromPool(); // This now handles loyalty init for REGULAR_JOE

    // Ensure loyalty and maxLoyalty are part of customerData if it's REGULAR_JOE
    // This is more of a safeguard or for older save compat if not handled in selectOrGenerateCustomerFromPool fully
    if (customerData.archetypeKey === "REGULAR_JOE") {
        if (customerData.loyalty === undefined) {
            customerData.loyalty = customerArchetypes.REGULAR_JOE.loyalty !== undefined ? customerArchetypes.REGULAR_JOE.loyalty : 0;
        }
        if (customerData.maxLoyalty === undefined) {
            customerData.maxLoyalty = customerArchetypes.REGULAR_JOE.maxLoyalty !== undefined ? customerArchetypes.REGULAR_JOE.maxLoyalty : 5;
        }
    }

    if (typeof customerArchetypes === 'undefined' || !customerArchetypes[customerData.archetypeKey]) {
        console.error("customerArchetypes not loaded or archetypeKey invalid:", customerData.archetypeKey);
        currentCustomer = {
            data: customerData, name: customerData.name || "Error Customer",
            dialogue: [{ speaker: "narration", text: "Error: Customer type undefined." }],
            choices: [{ text: "OK", outcome: { type: "acknowledge_error" } }],
            itemContext: null, archetypeKey: "ERROR_ARCHETYPE", mood: "neutral"
        };
        return;
    }
    const archetype = customerArchetypes[customerData.archetypeKey];

    let dialogue = [];
    let choices = [];
    let itemContext = null;

    // Handle COMPETITOR_SCOUT interaction setup
    if (customerData.archetypeKey === "COMPETITOR_SCOUT") {
        dialogue.push({ speaker: "customer", text: archetype.greeting(customerData, null) });
        dialogue.push({ speaker: "rikk", text: "(This dude ain't here to shop... gotta play this smart.) 'Depends who's asking. What's your interest?'" });
        dialogue.push({ speaker: "customer", text: archetype.dialogueVariations.askForInfoContinuation });

        choices.push({ text: "Play Dumb: 'Just hustlin'.'", outcome: { type: "scout_interaction", choice_type: "decline" } });
        choices.push({ text: "Vague: 'Good stuff, fair prices.'", outcome: { type: "scout_interaction", choice_type: "vague" } });
        choices.push({ text: "Mislead: 'Tell 'em I'm king of Blue Magic.'", outcome: { type: "scout_interaction", choice_type: "false_info" } }); // Corrected example
        choices.push({ text: "Be Real: 'Moving Green Crack, used phones.'", outcome: { type: "scout_interaction", choice_type: "true_info" } }); // Corrected example
        itemContext = null;
    } else {
        // Existing logic for other customer types
        let greetingText = archetype.greeting(customerData, null); // Initial greeting
        dialogue.push({ speaker: "customer", text: greetingText });

        let customerWillOfferItemToRikk = false;
        if (archetype.sellsOnly) {
            customerWillOfferItemToRikk = true;
        } else if (archetype.buyPreference && !archetype.sellPreference) { // Archetype only buys, never sells to Rikk (e.g. Snitch)
             customerWillOfferItemToRikk = false;
        } else if (archetype.sellPreference && !archetype.buyPreference) { // Archetype only sells (e.g. Informant already handled by sellsOnly)
            customerWillOfferItemToRikk = true;
        }
        else {
            let baseChanceToOfferItem = 0.30;
        if (inventory.length === 0) { baseChanceToOfferItem = 0.75; }
        else if (inventory.length < 2) { baseChanceToOfferItem = 0.60; }
        else if (inventory.length < 4) { baseChanceToOfferItem = 0.40; }
        else if (inventory.length >= MAX_INVENTORY_SLOTS - 2) { baseChanceToOfferItem = 0.10; }

            if (inventory.length === 0) { baseChanceToOfferItem = 0.75; }
            else if (inventory.length < 2) { baseChanceToOfferItem = 0.60; }
            else if (inventory.length < 4) { baseChanceToOfferItem = 0.40; }
            else if (inventory.length >= MAX_INVENTORY_SLOTS - 2) { baseChanceToOfferItem = 0.10; }

            if (Math.random() < baseChanceToOfferItem) {
                customerWillOfferItemToRikk = true;
            } else if (customerData.cashOnHand < 25 && Math.random() < 0.5) {
                customerWillOfferItemToRikk = true;
            }
        }

        if (customerWillOfferItemToRikk && inventory.length < MAX_INVENTORY_SLOTS && archetype.sellPreference && archetype.sellPreference(generateRandomItem(archetype))) { // Customer offers to sell to Rikk
            itemContext = generateRandomItem(archetype);
            // Ensure the generated item matches sell preference if specified, otherwise, it might be an item they wouldn't sell.
            // This check is a bit late, ideally, generateRandomItem should be more context-aware for sellers.
            // For now, if it doesn't match, we can fallback to them wanting to buy, or end interaction.
            // Simplified: assume generateRandomItem for a selling customer is something they'd sell.

            if (!archetype.sellsOnly && itemContext.qualityIndex > 1 && Math.random() < 0.6) { // e.g. REGULAR_JOE might try to offload slightly worse stuff
                itemContext.qualityIndex = Math.max(0, itemContext.qualityIndex - 1);
            const qualityLevelsForType = (typeof ITEM_QUALITY_LEVELS !== 'undefined' && ITEM_QUALITY_LEVELS[itemContext.itemTypeObj.type]) ? ITEM_QUALITY_LEVELS[itemContext.itemTypeObj.type] : ["Standard"];
            itemContext.quality = qualityLevelsForType[itemContext.qualityIndex];
        }

        const customerDemandsPrice = calculateItemEffectiveValue(itemContext, true, customerData);
        const itemNameForDialogue = itemContext.name.split("'")[1] || itemContext.name.split(" ")[1] || itemContext.name;

        // --- ENHANCED DIALOGUE: Customer Offering to Sell ---
        let offerText = "";
        switch(customerData.mood) {
            case "paranoid":
                offerText = `(Whispering, glancing around) Psst, Rikk! I... uh... *found* this ${itemContext.quality} ${itemNameForDialogue}. It's probably not bugged. Much. You want it for, say, $${customerDemandsPrice}? **Quick, before the pigeons report us!**`;
                break;
            case "happy": // Could be manic happy or genuinely pleased to have something to sell
                offerText = `Rikk, my man! Your lucky day! I've got this absolute *gem* - a ${itemContext.quality} ${itemNameForDialogue}! Fresh off the... well, never mind where it's from! Call it $${customerDemandsPrice} and it's yours! **It's practically radiating good vibes... or something.**`;
                break;
            case "angry":
                offerText = `Look, Rikk, I ain't got time for games. Got this ${itemContext.quality} ${itemNameForDialogue}. It's worth $${customerDemandsPrice}, take it or leave it. **And don't even think about lowballing me, my patience is thinner than cheap toilet paper.**`;
                break;
            default: // Neutral, desperate, chill, etc.
                offerText = `Yo Rikk, check it. Got this ${itemContext.quality} ${itemNameForDialogue}. Solid piece. How's $${customerDemandsPrice} sound? **It's a steal, man, practically fell into my lap... from a very tall truck.**`;
        }
        dialogue.push({ speaker: "customer", text: offerText });
            dialogue.push({ speaker: "rikk", text: `Word? A ${itemContext.quality} ${itemNameForDialogue} for $${customerDemandsPrice}, you say? **The streets are talkin', let's see if this piece sings the right tune.** Let me peep it...` });

            if (cash >= customerDemandsPrice) {
                choices.push({ text: `Cop it ($${customerDemandsPrice})`, outcome: { type: "buy_from_customer", item: itemContext, price: customerDemandsPrice } });
            } else {
                if (archetype.dialogueVariations?.lowCashRikk) {
                    dialogue.push({ speaker: "rikk", text: archetype.dialogueVariations.lowCashRikk(customerData.mood) || `(Sighs) $${customerDemandsPrice} is a bit rich for my blood right now, fam.` });
                } else {
                    dialogue.push({ speaker: "rikk", text: `(Sighs) $${customerDemandsPrice} is a bit rich for my blood right now, fam.` });
                }
                choices.push({ text: `Cop it (Need $${customerDemandsPrice - cash} more)`, outcome: { type: "buy_from_customer", item: itemContext, price: customerDemandsPrice }, disabled: true });
            }
            // Add new Haggle choice if Rikk is buying
            if (!archetype.negotiationResists) {
                choices.push({ text: "Haggle for Lower Price", outcome: { type: "haggle_price", direction: "rikk_buys", item: itemContext, originalPrice: customerDemandsPrice } });
            }
            choices.push({ text: "Nah, I'm straight on that.", outcome: { type: "decline_offer_to_buy", item: itemContext } });

        } else if (inventory.length > 0 && archetype.buyPreference && typeof archetype.buyPreference === 'function' && inventory.some(invItem => archetype.buyPreference(invItem)) ) { // Customer wants to buy from Rikk (and Rikk has items they might want)
            let potentialItemsToSell = inventory.filter(invItem => archetype.buyPreference(invItem));
            if (potentialItemsToSell.length === 0) { // Fallback if no preferred items, offer anything (or handle differently)
                 potentialItemsToSell = inventory;
            }

            if (customerData.preferredDrugSubTypes && customerData.preferredDrugSubTypes.length > 0 && Math.random() < 0.7) {
                const preferredItems = potentialItemsToSell.filter(invItem =>
                invItem.itemTypeObj.type === "DRUG" && customerData.preferredDrugSubTypes.includes(invItem.itemTypeObj.subType)
            );
            if (preferredItems.length > 0) potentialItemsToSell = preferredItems;
        }
        if (potentialItemsToSell.length === 0) potentialItemsToSell = inventory;

        itemContext = potentialItemsToSell[Math.floor(Math.random() * potentialItemsToSell.length)];

        // Update initial greeting if it was generic
        // Ensure archetype and customerData are available for greeting
        if (archetype && customerData && dialogue.length > 0 && dialogue[0].text) {
            const firstDialogueText = dialogue[0].text.toLowerCase();
            const needsGreetingUpdate = (
                (archetype.key === "DESPERATE_FIEND" && (firstDialogueText.includes('fix') || firstDialogueText.includes('quiet the demons'))) ||
                (archetype.key === "HIGH_ROLLER" && (firstDialogueText.includes('product') || firstDialogueText.includes('exquisite diversions'))) ||
                (archetype.key === "REGULAR_JOE" && (firstDialogueText.includes('something decent') || firstDialogueText.includes('unwind with') || firstDialogueText.includes('the usual vibe'))) || // Added generic check
                (archetype.key === "SNITCH" && (firstDialogueText.includes('noteworthy') || firstDialogueText.includes('exciting')))
            );
            if (dialogue.length === 1 && needsGreetingUpdate) {
                dialogue[0].text = archetype.greeting(customerData, itemContext);
            }
        }

        const rikkBaseSellPrice = calculateItemEffectiveValue(itemContext, false, null);
        let customerOfferPrice = Math.round(rikkBaseSellPrice * archetype.priceToleranceFactor);
        customerOfferPrice = Math.max(itemContext.purchasePrice + Math.max(5, Math.round(itemContext.purchasePrice * 0.15)), customerOfferPrice);
        customerOfferPrice = Math.min(customerOfferPrice, customerData.cashOnHand);

        const itemNameForDialogue = itemContext.name.split("'")[1] || itemContext.name.split(" ")[1] || itemContext.name;

        // --- ENHANCED DIALOGUE: Customer Asking to Buy ---
        let askText = "";
        switch(customerData.mood) {
            case "paranoid":
                askText = `(Eyes darting) Rikk, you got that ${itemContext.quality} ${itemNameForDialogue}, right? **I need it. The walls are looking at me funny.** I can scrape together $${customerOfferPrice}. Just... make it quick. **I think my shadow's got a tail.**`;
                break;
            case "happy":
                askText = `Rikk, my friend, my confidant, my dealer of delights! That beautiful ${itemContext.quality} ${itemNameForDialogue} you got – how's $${customerOfferPrice} sound for a taste of paradise? **My brain's throwing a party and that's the guest of honor!**`;
                break;
            case "angry":
                askText = `Alright Rikk, cut the crap. That ${itemContext.quality} ${itemNameForDialogue}. I know you got it. $${customerOfferPrice}. **Don't make me ask twice, I'm already seeing red and it ain't the good kind.**`;
                break;
            default: // Neutral, desperate, chill, nosy etc.
                askText = `So, Rikk, about that ${itemContext.quality} ${itemNameForDialogue}... Word is you got the hookup. I'm thinking $${customerOfferPrice} is fair, right? **Let's make a deal before my existential dread kicks in.**`;
        }
        dialogue.push({ speaker: "customer", text: askText });
            dialogue.push({ speaker: "rikk", text: `This ${itemContext.quality} ${itemNameForDialogue} you speak of? **The one that whispers sweet nothings to the fiends and promises of grandeur to the ballers?** Street value is $${rikkBaseSellPrice}. You're offering $${customerOfferPrice}, huh? **Interesting proposal...**` });

            if (customerData.cashOnHand >= customerOfferPrice) {
                choices.push({ text: `Serve 'em ($${customerOfferPrice})`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice } });
            } else {
                choices.push({ text: `Serve 'em ($${customerOfferPrice}) (They Broke!)`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice }, disabled: true });
            }

            // New Haggle button logic for Rikk Selling (replaces old negotiate_sell type)
            if (!archetype.negotiationResists && rikkBaseSellPrice > customerOfferPrice) {
                 choices.push({ text: "Haggle for Higher Price", outcome: { type: "haggle_price", direction: "rikk_sells", item: itemContext, originalPrice: customerOfferPrice, rikkTargetPrice: rikkBaseSellPrice } });
            }

            // Social negotiation choices for REGULAR_JOE
            if (customerData.archetypeKey === "REGULAR_JOE" && rikkBaseSellPrice > customerOfferPrice &&
                customerData.mood !== "angry" && customerData.mood !== "annoyed") {
                choices.push({ text: `Intimidate (Aim $${rikkBaseSellPrice})`, outcome: { type: "negotiate_social", style: "intimidate", item: itemContext, rikkTargetPrice: rikkBaseSellPrice, customerInitialOffer: customerOfferPrice } });
                choices.push({ text: `Charm (Aim $${rikkBaseSellPrice})`, outcome: { type: "negotiate_social", style: "charm", item: itemContext, rikkTargetPrice: rikkBaseSellPrice, customerInitialOffer: customerOfferPrice } });
            }

            choices.push({ text: "Kick rocks, chump.", outcome: { type: "decline_offer_to_sell", item: itemContext } });

        } else { // Rikk has nothing they want/can buy, or customer didn't offer anything Rikk wants/can buy.
            let emptyStashText = "";
        switch(customerData.mood) {
            case "paranoid":
                emptyStashText = `(Shakes head slowly) Damn, fam. The well is dry. **Not a crumb, not a speck. Even my dust bunnies are on strike.** Can't help ya. **Maybe try... meditation? Or screaming into a pillow?**`;
                break;
            case "angry":
                emptyStashText = `Stash is tapped, G. **Nothin' here but echoes and disappointment.** Come back later, maybe the hustle gods will bless me. **Or maybe I'll just take up knitting.**`;
                break;
            default:
                emptyStashText = `Whoa there, eager beaver! Stash is lookin' like a ghost town right now. **Bare as a baby's bottom.** Gotta re-up before I can serve. **Patience, young grasshopper.**`;
        }
            if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "customer") {
                dialogue.push({ speaker: "rikk", text: emptyStashText });
            } else if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "rikk") {
                dialogue[dialogue.length -1].text = emptyStashText;
            } else {
                dialogue.push({ speaker: "rikk", text: emptyStashText });
            }
            choices.push({ text: "Aight, peace. Hit me up.", outcome: { type: "acknowledge_empty_stash" } });
        }
    } // End of non-scout interaction setup

    currentCustomer = {
            data: customerData, // This now includes loyalty/maxLoyalty for REGULAR_JOE
        name: customerData.name,
        dialogue,
        choices,
        itemContext,
        archetypeKey: customerData.archetypeKey,
        mood: customerData.mood,
            // Note: currentCustomer.data will be the reference to customerData from the pool or new
        interactionConcluded: false // Initialize for fiendsLeft tracking
    };
}

function startCustomerInteraction() {
    generateCustomerInteractionData(); 
    let dialogueIndex = 0;

    // Make phone visible for interaction
    rikkPhoneDisplay.classList.add('visible');
    rikkPhoneDisplay.classList.remove('docked');
    // rikkPhoneDisplay.classList.remove('hidden'); // Ensure old class is not interfering
    // setTimeout(() => rikkPhoneDisplay.classList.add('active'), 50); // Old animation trigger, replace with CSS transitions on .visible

    clearChat(); 

    const displayNext = () => {
        if (dialogueIndex < currentCustomer.dialogue.length) {
            const msg = currentCustomer.dialogue[dialogueIndex];
            displayPhoneMessage(msg.text, msg.speaker);
            dialogueIndex++;
            setTimeout(displayNext, CUSTOMER_WAIT_TIME);
        } else {
            displayChoices(currentCustomer.choices);
        }
    };
    displayNext();
}

function displayPhoneMessage(message, speaker) { playSound(chatBubbleSound); const bubble = document.createElement('div'); bubble.classList.add('chat-bubble', speaker); if (speaker === 'customer' || speaker === 'rikk') { const speakerName = document.createElement('span'); speakerName.classList.add('speaker-name'); speakerName.textContent = (speaker === 'customer' && currentCustomer ? currentCustomer.name : 'Rikk'); bubble.appendChild(speakerName); } const textNode = document.createTextNode(message); bubble.appendChild(textNode); chatContainer.appendChild(bubble); chatContainer.scrollTop = chatContainer.scrollHeight; }
function displaySystemMessage(message) { displayPhoneMessage(message, 'narration'); }
function displayChoices(choices) { choicesArea.innerHTML = ''; choices.forEach(choice => { const button = document.createElement('button'); button.classList.add('choice-button'); button.textContent = choice.text; if (choice.outcome.type.startsWith('decline')) button.classList.add('decline'); button.disabled = choice.disabled || false; if (!choice.disabled) { button.addEventListener('click', () => handleChoice(choice.outcome)); } choicesArea.appendChild(button); }); }


function handleChoice(outcome) {
    clearChoices();
    let narrationText = "";
    let customerReaction = "";
    let heatChange = 0;
    let credChange = 0;
    
    if (!currentCustomer || !currentCustomer.archetypeKey || !currentCustomer.data || typeof customerArchetypes === 'undefined' || !customerArchetypes[currentCustomer.archetypeKey]) { // Added check for customerArchetypes
        console.error("Critical Error: currentCustomer, archetypeKey, data, or customerArchetypes undefined.", currentCustomer);
        displaySystemMessage("System Error: Customer data missing or type undefined. Ending interaction.");
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME); 
        return; 
    }
    const archetype = customerArchetypes[currentCustomer.archetypeKey]; // Safe now due to check above
    const customerState = currentCustomer.data; // This is the direct reference to the customer object from the pool or the new one.

    let dealSuccess = false;
    let additionalDialogue = []; // For loyalty messages

    // Add this to handle extra cred/heat from social negotiation outcomes
    if (typeof outcome.extraCred !== 'undefined') streetCred += outcome.extraCred;
    if (typeof outcome.extraHeat !== 'undefined') heat += outcome.extraHeat;


    switch (outcome.type) {
        case "buy_from_customer": 
            if (cash >= outcome.price && inventory.length < MAX_INVENTORY_SLOTS) {
                cash -= outcome.price;
                const newItem = {...outcome.item}; inventory.push(newItem); 
                heatChange = newItem.itemTypeObj.heat + (archetype.heatImpact || 0);
                credChange = archetype.credImpactBuy || 0; 
                customerState.mood = "pleased";
                // customerState.loyaltyToRikk += 1; // Old generic loyalty
                dealSuccess = true;
                narrationText = `Scored! Copped "${newItem.name} (${newItem.quality})" for $${outcome.price}.`;
                // customerReaction set later if loyalty applies
                playSound(cashSound);
                if (newItem.effect === "reduce_heat_small") { heat = Math.max(0, heat - 10); narrationText += " That intel should cool things down."; }
                customerState.lastInteractionWithRikk = { type: "rikk_bought", item: newItem.name, outcome: "success" };
            } else if (inventory.length >= MAX_INVENTORY_SLOTS) {
                narrationText = `Stash full, fam! No room.`; customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.stashFull || "Aight then."}"`; playSound(deniedSound);
                customerState.mood = "annoyed";
                // customerState.loyaltyToRikk -=1; // Old generic loyalty
                customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", reason: "stash_full" };
            } else { 
                narrationText = `Not enough cash for that.`; customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkCannotAfford || "Damn, Rikk."}"`; playSound(deniedSound);
                customerState.mood = "disappointed";
                customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", reason: "no_cash" };
            }
            break;

        case "sell_to_customer": 
            const itemIndex = inventory.findIndex(i => i.id === outcome.item.id && i.quality === outcome.item.quality && i.purchasePrice === outcome.item.purchasePrice); 
            if (itemIndex !== -1) {
                const itemSold = inventory.splice(itemIndex, 1)[0];
                cash += outcome.price;
                heatChange = itemSold.itemTypeObj.heat + (archetype.heatImpact || 0);
                credChange = archetype.credImpactSell || 0; 
                customerState.mood = "happy";
                // customerState.loyaltyToRikk += 2; // Old generic loyalty
                dealSuccess = true;

                if (itemSold.itemTypeObj.type === "DRUG" && itemSold.itemTypeObj.addictionChance > 0) {
                    const subType = itemSold.itemTypeObj.subType;
                    customerState.addictionLevel[subType] = (customerState.addictionLevel[subType] || 0) + itemSold.itemTypeObj.addictionChance;
                    if (customerState.addictionLevel[subType] > 0.5 && !customerState.preferredDrugSubTypes.includes(subType)) {
                        customerState.preferredDrugSubTypes.push(subType); 
                    }
                }
                narrationText = `Cha-ching! Flipped "${itemSold.name} (${itemSold.quality})" for $${outcome.price}.`;
                customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkSellsSuccess || "Pleasure."}"`;
                playSound(cashSound);
                customerState.lastInteractionWithRikk = { type: "rikk_sold", item: itemSold.name, outcome: "success" };
            } else { 
                narrationText = `Error: Can't find that item!`; customerReaction = `"${currentCustomer.name}: You playin' me?"`; heatChange = 2; playSound(deniedSound);
                customerState.mood = "angry";
                customerState.lastInteractionWithRikk = { type: "rikk_sell_fail", reason: "item_not_found" };
            }
            break;

        /* OLD "negotiate_sell" case REMOVED */

        case "haggle_price":
            clearChoices();
            let hagglePercent = 0.15; // Try to change price by 15%
            let rikkHagglePrice;

            if (outcome.direction === "rikk_buys") { // Rikk wants to pay less
                rikkHagglePrice = Math.max(5, Math.round(outcome.originalPrice * (1 - hagglePercent)));
                displayPhoneMessage((archetype.dialogueVariations.haggleAttemptRikkBuys || "Hmm, that's a bit steep. How about $X?").replace('$X', '$' + rikkHagglePrice), 'rikk');
            } else { // outcome.direction === "rikk_sells" - Rikk wants customer to pay more
                rikkHagglePrice = Math.round(outcome.originalPrice * (1 + hagglePercent));
                rikkHagglePrice = Math.min(rikkHagglePrice, outcome.rikkTargetPrice); // Don't exceed Rikk's own target street value
                displayPhoneMessage((archetype.dialogueVariations.haggleAttemptRikkSells || "For this quality? I was thinking more like $X.").replace('$X', '$' + rikkHagglePrice), 'rikk');
            }

            let successChance = 0.4; // Base success chance
            successChance += (streetCred / 50); // Approx +0.2 at 10 cred, -0.2 at -10 cred
            successChance -= ((archetype.priceToleranceFactor || 1.0) - 1) * 0.2;
            successChance = Math.max(0.1, Math.min(0.9, successChance)); // Clamp chance

            setTimeout(() => {
                const randomRoll = Math.random();
                let finalPrice;
                let partialMet = false; // Flag to avoid double-processing if partial success falls through to fail-stick-price

                if (randomRoll < successChance) { // Full Success
                    finalPrice = rikkHagglePrice;
                    dealSuccess = true;
                    streetCred += 1;
                    if (outcome.direction === "rikk_buys") {
                        displayPhoneMessage((archetype.dialogueVariations.haggleSuccessCustomerSells || "Sigh... okay, Rikk, for you, $X it is.").replace('$X', '$' + finalPrice), 'customer');
                        handleChoice({ type: "buy_from_customer", item: outcome.item, price: finalPrice });
                    } else { // Rikk sells
                        displayPhoneMessage((archetype.dialogueVariations.haggleSuccessCustomerBuys || "Alright, alright, you drive a hard bargain, Rikk. Deal."), 'customer');
                        handleChoice({ type: "sell_to_customer", item: outcome.item, price: finalPrice });
                    }
                } else if (randomRoll < successChance + 0.3) { // Partial Success
                    let partialPrice; // Define partialPrice here
                    if (outcome.direction === "rikk_buys") {
                        partialPrice = Math.max(rikkHagglePrice + 5, Math.round((outcome.originalPrice + rikkHagglePrice) / 2));
                        if (partialPrice >= outcome.originalPrice - 5 ) {
                            partialMet = false; // Fall through
                        } else {
                            partialMet = true; finalPrice = partialPrice; dealSuccess = true;
                            displayPhoneMessage((archetype.dialogueVariations.hagglePartialSuccessCustomerSells || "No way I'm taking $X, but I could do $Y.").replace('$X', '$' + rikkHagglePrice).replace('$Y', '$' + finalPrice), 'customer');
                            handleChoice({ type: "buy_from_customer", item: outcome.item, price: finalPrice });
                        }
                    } else { // Rikk sells
                        partialPrice = Math.min(rikkHagglePrice - 5, Math.round((outcome.originalPrice + rikkHagglePrice) / 2));
                        if (partialPrice <= outcome.originalPrice + 5) {
                            partialMet = false; // Fall through
                        } else {
                            partialMet = true; finalPrice = partialPrice; dealSuccess = true;
                            displayPhoneMessage((archetype.dialogueVariations.hagglePartialSuccessCustomerBuys || "I can't do $X, but I can meet you at $Y. Take it or leave it.").replace('$X', '$' + rikkHagglePrice).replace('$Y', '$' + finalPrice), 'customer');
                            handleChoice({ type: "sell_to_customer", item: outcome.item, price: finalPrice });
                        }
                    }
                    if (!partialMet) { // Fallthrough to FailStickPrice logic if partial wasn't meaningful
                        displayPhoneMessage((archetype.dialogueVariations.haggleFailStickPrice || "Nah, price is firm, Rikk. $X, take it or leave it.").replace('$X', '$' + outcome.originalPrice), 'customer');
                        if (outcome.direction === "rikk_buys") {
                            displayChoices([ { text: `OK, pay $${outcome.originalPrice}`, outcome: { type: "buy_from_customer", item: outcome.item, price: outcome.originalPrice } }, { text: "Nah, deal's off.", outcome: { type: "decline_offer_to_buy", item: outcome.item } } ]);
                        } else {
                            displayChoices([ { text: `OK, sell for $${outcome.originalPrice}`, outcome: { type: "sell_to_customer", item: outcome.item, price: outcome.originalPrice } }, { text: "Nah, deal's off.", outcome: { type: "decline_offer_to_sell", item: outcome.item } } ]);
                        }
                    }
                } else { // Full Failure
                    if (Math.random() < 0.20) {
                        displayPhoneMessage(archetype.dialogueVariations.haggleFailWalkAway || "You trying to play me? Forget it, I'm out.", 'customer');
                        streetCred -= 1; heat += 1; customerState.mood = "angry";
                        updateHUD(); setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
                    } else {
                        displayPhoneMessage((archetype.dialogueVariations.haggleFailStickPrice || "Nah, price is firm, Rikk. $X, take it or leave it.").replace('$X', '$' + outcome.originalPrice), 'customer');
                        if (outcome.direction === "rikk_buys") {
                            displayChoices([ { text: `OK, pay $${outcome.originalPrice}`, outcome: { type: "buy_from_customer", item: outcome.item, price: outcome.originalPrice } }, { text: "Nah, deal's off.", outcome: { type: "decline_offer_to_buy", item: outcome.item } } ]);
                        } else {
                            displayChoices([ { text: `OK, sell for $${outcome.originalPrice}`, outcome: { type: "sell_to_customer", item: outcome.item, price: outcome.originalPrice } }, { text: "Nah, deal's off.", outcome: { type: "decline_offer_to_sell", item: outcome.item } } ]);
                        }
                    }
                }
                // Only save if new choices are presented (no new handleChoice called and not a walk away)
                if (!dealSuccess && !partialMet && !(randomRoll >= (successChance + 0.3) && Math.random() < 0.20) ) {
                    saveGameState();
                }
                updateHUD();
            }, CUSTOMER_WAIT_TIME);
            return;

        case "decline_offer_to_buy":
            narrationText = "Rikk ain't interested. Told 'em to bounce.";
            customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToBuy || "Your loss, chief."}"`;
            credChange = -1; 
            customerState.mood = "annoyed";
            // customerState.loyaltyToRikk -=1; // Old generic loyalty
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", item: outcome.item.name };
            break;

        case "decline_offer_to_sell":
            narrationText = "That chump change? Rikk sent 'em packing.";
            customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToSell || "Cheap ass..."}"`;
            heatChange = 1; 
            credChange = archetype.key === "DESPERATE_FIEND" ? -2 : (archetype.key === "HIGH_ROLLER" ? 1 : 0); 
            customerState.mood = "angry";
            // customerState.loyaltyToRikk -=2; // Old generic loyalty
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_declined_sell", item: outcome.item.name };
            break;

        case "acknowledge_empty_stash":
            narrationText = "Can't sell what you ain't got. Bad for rep.";
            customerReaction = `"${currentCustomer.name}: Lame. Hit me up when you re-up."`;
            credChange = -1;
            customerState.mood = "disappointed";
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_empty_stash" };
            break;
        case "acknowledge_error":
             narrationText = "System error acknowledged. Moving on...";
            break;
        case "negotiate_social":
            // archetype and customerState are already defined at the top of handleChoice
            clearChoices(); // Clear previous choices like "Serve 'em", "Haggle", etc.

            if (outcome.style === "intimidate") {
                displayPhoneMessage("Rikk puffs his chest, trying to look menacing...", 'rikk');
                let successChance = 0.35 + (streetCred > 10 ? 0.1 : 0) - (streetCred < 0 ? 0.1 : 0);
                playSound(deniedSound); // Re-using denied sound for intimidation attempt

                setTimeout(() => {
                    if (Math.random() < successChance) { // Success
                        displayPhoneMessage("And it works! " + archetype.baseName + " looks spooked.", 'narration');
                        displayPhoneMessage(archetype.dialogueVariations.negotiationIntimidateSuccess(customerState.mood), 'customer');
                        // Proceed to sell at Rikk's target price
                        handleChoice({ type: "sell_to_customer", item: outcome.item, price: outcome.rikkTargetPrice, isSocialContinuation: true, extraCred: 1, extraHeat: 1 });
                    } else { // Failure
                        if (Math.random() < 0.25) { // Customer gets angry and leaves
                            displayPhoneMessage("...but " + archetype.baseName + " ain't having it and storms off!", 'narration');
                            displayPhoneMessage(archetype.dialogueVariations.negotiationIntimidateFailAnger(customerState.mood), 'customer');
                            heat += 2;
                            streetCred -= 2;
                            if (customerState.archetypeKey === "REGULAR_JOE" && customerState.loyalty !== undefined) {
                                customerState.loyalty = Math.max(0, customerState.loyalty - 2); // Lose loyalty
                            }
                            customerState.mood = "angry";
                            updateHUD();
                            setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5); // Interaction ends
                        } else { // Customer stands firm, offers original price
                            displayPhoneMessage("...but " + archetype.baseName + " stands firm. He restates his offer.", 'narration');
                            displayPhoneMessage(archetype.dialogueVariations.negotiationIntimidateFailStandFirm(customerState.mood).replace('X', '$' + outcome.customerInitialOffer), 'customer');
                            streetCred -= 1;
                            customerState.mood = "annoyed";
                            // Present choices to accept original offer or decline fully
                            displayChoices([
                                { text: `OK, take it for $${outcome.customerInitialOffer}`, outcome: { type: "sell_to_customer", item: outcome.item, price: outcome.customerInitialOffer, isSocialContinuation: true } },
                                { text: "Nah, deal's off then.", outcome: { type: "decline_offer_to_sell", item: outcome.item, isSocialContinuation: true } }
                            ]);
                        }
                    }
                    updateHUD(); // Update HUD for immediate changes if any
                    saveGameState(); // Save state as choices might be presented or interaction ended
                }, CUSTOMER_WAIT_TIME);
                return; // Stop further processing in handleChoice for this turn
            } else if (outcome.style === "charm") {
                displayPhoneMessage("Rikk turns on the charm...", 'rikk');
                let successChance = 0.30 + (streetCred > 5 ? 0.1 : 0);
                // playSound(someCharmSound); // Optional: Add a charm sound effect

                setTimeout(() => {
                    if (Math.random() < successChance) { // Success
                        displayPhoneMessage("And it seems to work!", 'narration');
                        displayPhoneMessage(archetype.dialogueVariations.negotiationCharmSuccess(customerState.mood), 'customer');
                        // Proceed to sell at Rikk's target price
                        handleChoice({ type: "sell_to_customer", item: outcome.item, price: outcome.rikkTargetPrice, isSocialContinuation: true, extraCred: 1, extraHeat: 0 });
                    } else { // Failure
                        displayPhoneMessage("...but " + archetype.baseName + " isn't falling for it. He restates his offer.", 'narration');
                        displayPhoneMessage(archetype.dialogueVariations.negotiationCharmFail(customerState.mood).replace('X', '$' + outcome.customerInitialOffer), 'customer');
                        customerState.mood = "neutral"; // Or slightly amused
                        // Present choices to accept original offer or decline fully
                        displayChoices([
                            { text: `Alright, your price: $${outcome.customerInitialOffer}`, outcome: { type: "sell_to_customer", item: outcome.item, price: outcome.customerInitialOffer, isSocialContinuation: true } },
                            { text: "Nah, forget it.", outcome: { type: "decline_offer_to_sell", item: outcome.item, isSocialContinuation: true } }
                        ]);
                    }
                    updateHUD(); // Update HUD for immediate changes if any
                    saveGameState(); // Save state as choices might be presented or interaction ended
                }, CUSTOMER_WAIT_TIME);
                return; // Stop further processing in handleChoice for this turn
            }
             break;
        case "scout_interaction":
            switch (outcome.choice_type) {
                case "decline":
                    narrationText = "Rikk stonewalls the scout.";
                    customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations.rikkDeclinesToShare}"`;
                    heatChange = (archetype.heatImpact || 0) + 2;
                    credChange = -1;
                    break;
                case "vague":
                    narrationText = "Rikk keeps his answers vague.";
                    customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations.rikkSharesVague}"`;
                    heatChange = (archetype.heatImpact || 0) + 1;
                    credChange = 0;
                    break;
                case "false_info":
                    narrationText = "Rikk tries to feed the scout false information.";
                    customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations.rikkSharesFalseInfo}"`;
                    if (Math.random() < 0.4) { // Success
                        narrationText += " He seems to buy it. Might throw your rivals off!";
                        heatChange = (archetype.heatImpact || 0) -1; // Reduced heat for successful deception
                        credChange = 2;
                    } else { // Failure
                        narrationText += " He doesn't look convinced. This could backfire.";
                        heatChange = (archetype.heatImpact || 0) + 3;
                        credChange = -2;
                    }
                    break;
                case "true_info":
                    narrationText = "Rikk shares some real details about his operation.";
                    customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations.rikkSharesTrueInfo}"`;
                    heatChange = (archetype.heatImpact || 0) + 1;
                    credChange = -3; // Sharing info is risky
                    // Future: playerData.rivalKnowledge += 1;
                    break;
            }
            // Common for all scout interactions
            customerState.lastInteractionWithRikk = { type: "scout_probed", choice: outcome.choice_type };
            break;
        default:
            console.error("Unhandled outcome type in handleChoice:", outcome.type);
            narrationText = "System: Action not recognized.";
            break;
    }

    heat = Math.min(MAX_HEAT, Math.max(0, heat + heatChange));
    streetCred += credChange;
    customerState.hasMetRikkBefore = true;
    
    // Decrement fiendsLeft for any interaction that isn't a negotiation continuation OR a social continuation that leads to another choice
    // if (outcome.type !== "negotiate_sell" && outcome.type !== "negotiate_social" && !outcome.isSocialContinuation) {
    //     // fiendsLeft--; // Removed: endCustomerInteraction will handle this.
    // }
    // The logic for fiendsLeft-- is now centralized in endCustomerInteraction.
    
    updateHUD();
    updateInventoryDisplay();

    if (archetype && archetype.postDealEffect) { // Check archetype exists
        archetype.postDealEffect(dealSuccess, customerState);
    }

    // REGULAR_JOE Loyalty Logic
    if (currentCustomer.archetypeKey === "REGULAR_JOE" && dealSuccess && outcome.type !== "negotiate_sell") { // negotiate_sell handles its own loyalty messages
        const previousLoyalty = customerState.loyalty;
        if (customerState.loyalty < customerState.maxLoyalty) {
            customerState.loyalty++;
            if (customerState.loyalty > previousLoyalty && customerState.loyalty < customerState.maxLoyalty) {
                 additionalDialogue.push({ speaker: "customer", text: archetype.dialogueVariations.loyaltyIncrease });
            }
        }

        if (customerState.loyalty === 3 && previousLoyalty < 3) {
            additionalDialogue.push({ speaker: "narration", text: "Chill Chad trusts you more. He's offering better prices!" });
            if (archetype.dialogueVariations.loyalOfferBetterPrice) {
                 additionalDialogue.push({ speaker: "customer", text: archetype.dialogueVariations.loyalOfferBetterPrice(customerState.mood, outcome.type === "buy_from_customer" ? "buy" : "sell") });
            }
            // Apply price bonus for the current deal
            let priceBonus = 0;
            if (outcome.type === "buy_from_customer") { // Rikk is buying, Chad offers more (lower price for Rikk)
                priceBonus = Math.round(outcome.price * 0.05); // Chad wants 5% less
                outcome.price -= priceBonus; // Rikk pays less
                cash += priceBonus; // Correct cash back to Rikk
                narrationText += ` Chad cut you a deal: $${priceBonus} off!`;
            } else if (outcome.type === "sell_to_customer") { // Rikk is selling, Chad offers more
                priceBonus = Math.round(outcome.price * 0.05); // Chad pays 5% more
                outcome.price += priceBonus;
                cash += priceBonus; // Rikk gets more cash
                narrationText += ` Chad threw in an extra $${priceBonus}!`;
            }
        }

        if (customerState.loyalty === customerState.maxLoyalty && previousLoyalty < customerState.maxLoyalty) {
            additionalDialogue.push({ speaker: "narration", text: "Chill Chad is a loyal connect! He's gonna send some business your way." });
            if (archetype.dialogueVariations.loyalBringFriend) {
                additionalDialogue.push({ speaker: "customer", text: archetype.dialogueVariations.loyalBringFriend });
            }
            const referralBonus = Math.floor(Math.random() * 31) + 20; // $20-$50
            cash += referralBonus;
            additionalDialogue.push({ speaker: "narration", text: `Rikk got a $${referralBonus} kickback from Chad's referral!` });
        }
    }
    // End REGULAR_JOE Loyalty Logic

    // Set customer reaction after loyalty logic (as loyalty might influence it or add to it)
    if (!customerReaction) { // If not set by specific outcomes like errors
        if (dealSuccess) {
            if (outcome.type === "buy_from_customer") {
                customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkBuysSuccess || "Good doin' business."}"`;
            } else if (outcome.type === "sell_to_customer") {
                customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkSellsSuccess || "Pleasure."}"`;
            } else if (outcome.type === "negotiate_sell") {
                 customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.negotiationSuccess || "Aight, deal."}"`;
            }
        } else { // Fallback for non-deal success if specific reactions not set
            if (outcome.type === "decline_offer_to_buy") customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToBuy || "Your loss, chief."}"`;
            else if (outcome.type === "decline_offer_to_sell") customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToSell || "Cheap ass..."}"`;
            else if (outcome.type === "acknowledge_empty_stash") customerReaction = `"${currentCustomer.name}: Lame. Hit me up when you re-up."`;
            // other non-deal cases might need default reactions here
        }
    }


    activeWorldEvents.forEach(eventState => { if(eventState.event.effects && eventState.event.effects.heatModifier && heatChange > 0) { if (typeof heatChange === 'number' && typeof eventState.event.effects.heatModifier === 'number') { heat = Math.min(MAX_HEAT, Math.max(0, heat + Math.round(heatChange * (eventState.event.effects.heatModifier -1 ) ) ) ); } } });
    updateHUD();

    setTimeout(() => {
        if (narrationText) displayPhoneMessage(narrationText, 'narration');
        if (customerReaction) displayPhoneMessage(customerReaction, 'customer');
        additionalDialogue.forEach(d => displayPhoneMessage(d.text, d.speaker)); // Display loyalty dialogue
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
    }, CUSTOMER_WAIT_TIME / 2);

    if (heat >= MAX_HEAT) endGame("heat");
    else if (cash < 0 && fiendsLeft > 0 && gameActive) endGame("bankrupt"); // Added gameActive check
}

function endCustomerInteraction() {
    if (currentCustomer && !currentCustomer.interactionConcluded) {
        if (fiendsLeft > 0 ) {
             fiendsLeft--;
        }
        currentCustomer.interactionConcluded = true;
    }

    clearChoices();
    currentCustomer = null;

    // Hide/Dock the phone after interaction
    rikkPhoneDisplay.classList.remove('visible');
    rikkPhoneDisplay.classList.add('docked'); // Or just remove 'visible'

    if (fiendsLeft > 0 && gameActive && heat < MAX_HEAT && cash >=0) {
        nextCustomerBtn.disabled = false;
    } else if (gameActive) {
        nextCustomerBtn.disabled = true;
    }
    saveGameState();
    if (fiendsLeft <= 0 && gameActive) {
        setTimeout(()=> endGame("completed"), CUSTOMER_WAIT_TIME);
    }
}

function updateHUD() { /* ... same ... */ cashDisplay.textContent = cash; dayDisplay.textContent = Math.max(0, fiendsLeft); heatDisplay.textContent = heat; credDisplay.textContent = streetCred; }
function updateInventoryDisplay() { 
    inventoryCountDisplay.textContent = inventory.length; modalInventorySlotsDisplay.textContent = `${inventory.length}/${MAX_INVENTORY_SLOTS}`; inventoryList.innerHTML = ''; 
    if (inventory.length === 0) { inventoryList.innerHTML = "<p>Your stash is lookin' sad, Rikk. Bone dry.</p>"; } 
    else { inventory.forEach(item => { 
        const itemDiv = document.createElement('div'); itemDiv.classList.add('inventory-item-card'); 
        const itemName = document.createElement('h4'); itemName.textContent = `${item.name} (${item.quality})`; itemDiv.appendChild(itemName); 
        const itemDetails = document.createElement('p'); itemDetails.classList.add('item-detail'); 
        
        const activeCustomerArchetypeData = (currentCustomer && currentCustomer.archetypeKey && typeof customerArchetypes !== 'undefined') ? customerArchetypes[currentCustomer.archetypeKey] : null;
        const effectiveBuyPrice = calculateItemEffectiveValue(item, true, activeCustomerArchetypeData); 
        const effectiveSellPrice = calculateItemEffectiveValue(item, false, activeCustomerArchetypeData); 
        itemDetails.innerHTML = `Copped: $${item.purchasePrice} <br>Street Val (Buy/Sell): $${effectiveBuyPrice} / $${effectiveSellPrice} <br>Heat: +${item.itemTypeObj.heat} | Type: ${item.itemTypeObj.type} | Sub: ${item.itemTypeObj.subType || 'N/A'}`; 
        if(item.uses) itemDetails.innerHTML += `<br>Uses: ${item.uses}`; 
        itemDiv.appendChild(itemDetails); inventoryList.appendChild(itemDiv); 
    }); } 
}
function openInventoryModal() {
    inventoryModal.classList.add('active');
    // If phone is visible during an interaction, hide it
    if (rikkPhoneDisplay.classList.contains('visible')) {
        rikkPhoneDisplay.classList.remove('visible');
        // Optionally, add a class to remember it was visible
        rikkPhoneDisplay.dataset.wasVisible = 'true';
    }
}
function closeInventoryModal() {
    inventoryModal.classList.remove('active');
    // If phone was visible before inventory and an interaction is still ongoing
    if (rikkPhoneDisplay.dataset.wasVisible === 'true' && currentCustomer) {
        rikkPhoneDisplay.classList.add('visible');
    }
    rikkPhoneDisplay.dataset.wasVisible = 'false'; // Reset flag
}
function clearChat() { /* ... same ... */ chatContainer.innerHTML = ''; }
function clearChoices() { /* ... same ... */ choicesArea.innerHTML = ''; }
function playSound(audioElement) { /* ... same ... */ if (audioElement) { audioElement.currentTime = 0; audioElement.play().catch(e => console.warn("Error playing sound:", e)); } }

function saveGameState() {
    if (!gameActive) return;
    const stateToSave = { 
        cash, fiendsLeft, heat, streetCred, inventory, 
        playerSkills, activeWorldEvents, dayOfWeek, 
        customersPool, nextCustomerId 
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
    } catch (e) { console.error("Error saving game state:", e); }
}

function loadGameState() {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
        try {
            const loadedState = JSON.parse(savedData);
            cash = loadedState.cash !== undefined ? loadedState.cash : STARTING_CASH;
            fiendsLeft = loadedState.fiendsLeft !== undefined ? loadedState.fiendsLeft : MAX_FIENDS;
            heat = loadedState.heat !== undefined ? loadedState.heat : 0;
            streetCred = loadedState.streetCred !== undefined ? loadedState.streetCred : STARTING_STREET_CRED;
            inventory = Array.isArray(loadedState.inventory) ? loadedState.inventory : [];
            playerSkills = loadedState.playerSkills || { negotiator: 0, appraiser: 0, lowProfile: 0 };
            activeWorldEvents = Array.isArray(loadedState.activeWorldEvents) ? loadedState.activeWorldEvents : [];
            dayOfWeek = loadedState.dayOfWeek || days[0];
            customersPool = Array.isArray(loadedState.customersPool) ? loadedState.customersPool : []; 
            nextCustomerId = loadedState.nextCustomerId || 1; 
            updateEventTicker();
            return true;
        } catch (e) { console.error("Error parsing saved game state:", e); clearSavedGameState(); return false; }
    }
    return false;
}
function clearSavedGameState() { /* ... same ... */ localStorage.removeItem(SAVE_KEY); }
function checkForSavedGame() { /* ... same ... */ if (localStorage.getItem(SAVE_KEY)) { continueGameBtn.classList.remove('hidden'); } else { continueGameBtn.classList.add('hidden'); } }

document.addEventListener('DOMContentLoaded', initGame);