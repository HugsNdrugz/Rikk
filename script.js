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
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active');
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
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active');
    updateHUD(); updateInventoryDisplay(); clearChat(); clearChoices(); nextFiend();
}

function endGame(reason) {
    // ... (same) ...
    gameActive = false; gameScreen.classList.remove('active'); endScreen.classList.add('active');
    finalDaysDisplay.textContent = MAX_FIENDS - fiendsLeft; finalCashDisplay.textContent = cash; finalCredDisplay.textContent = streetCred;
    if (reason === "heat") { finalVerdictText.textContent = `The block's too hot, nigga! 5-0 swarming. Heat: ${heat}. Time to ghost.`; finalVerdictText.style.color = "var(--color-error)"; }
    else if (reason === "bankrupt") { finalVerdictText.textContent = "Broke as a joke. Can't hustle on E, fam."; finalVerdictText.style.color = "var(--color-error)"; }
    else { if (cash >= STARTING_CASH * 3 && streetCred > MAX_FIENDS) { finalVerdictText.textContent = "You a certified KINGPIN! The streets whisper your name."; } else if (cash >= STARTING_CASH * 1.5 && streetCred > MAX_FIENDS / 2) { finalVerdictText.textContent = "Solid hustle, G. Made bank and respect."; } else if (cash > STARTING_CASH) { finalVerdictText.textContent = "Made some profit. Not bad for a night's work."; } else if (cash <= STARTING_CASH && streetCred < 0) { finalVerdictText.textContent = "Tough night. Lost dough and respect. This life ain't for everyone."; } else { finalVerdictText.textContent = "Broke even or worse. Gotta step your game up, Rikk."; } finalVerdictText.style.color = cash > STARTING_CASH ? "var(--color-success-green)" : "var(--color-accent-orange)"; }
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active'); clearSavedGameState();
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
    rikkPhoneDisplay.classList.remove('active'); setTimeout(() => rikkPhoneDisplay.classList.add('hidden'), PHONE_ANIMATION_DURATION);
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
        // Return a fallback customer or handle error
        return { id: `customer_error_${nextCustomerId++}`, name: "Error Customer", archetypeKey: "ERROR_ARCHETYPE", loyaltyToRikk: 0, mood: "neutral", cashOnHand: 50, preferredDrugSubTypes: [], addictionLevel: {}, hasMetRikkBefore: false, lastInteractionWithRikk: null, patience: 3 };
    }

    // Try to pick a returning customer from the pool (e.g., 30% chance if pool has customers)
    if (customersPool.length > 0 && Math.random() < 0.3) {
        const returningCustomer = customersPool[Math.floor(Math.random() * customersPool.length)];
        returningCustomer.hasMetRikkBefore = true; // They are returning
        returningCustomer.cashOnHand = Math.floor(Math.random() * (customerArchetypes[returningCustomer.archetypeKey].priceToleranceFactor * 80)) + 20;
        if (Math.random() < 0.2) returningCustomer.mood = ["neutral", "antsy", "irritable"][Math.floor(Math.random()*3)];

        console.log("Returning customer:", returningCustomer.name, "Mood:", returningCustomer.mood);
        return returningCustomer;
    }

    // Generate a new customer
    const archetypeKeys = Object.keys(customerArchetypes);
    const selectedArchetypeKey = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
    const archetypeData = customerArchetypes[selectedArchetypeKey];

    let customerName = archetypeData.baseName;
    if (archetypeData.baseName.includes("Fiend") || archetypeData.baseName.includes("Joe")) {
        customerName += ` ${nextCustomerId}`;
    } else if (archetypeData.baseName.includes("Informant")) {
        customerName = ["Whispers", "Eyes on Street", "The Rat", "Silent Tip"][Math.floor(Math.random()*4)];
    } else if (archetypeData.baseName.includes("Roller")) {
        customerName = ["Mr. Big", "Ms. Lavish", "The Whale", "Gold Digger"][Math.floor(Math.random()*4)];
    }


    const newCustomer = {
        id: `customer_${nextCustomerId++}`,
        name: customerName,
        archetypeKey: selectedArchetypeKey,
        loyaltyToRikk: 0,
        mood: archetypeData.initialMood || "neutral",
        cashOnHand: Math.floor(Math.random() * (archetypeData.priceToleranceFactor * 100)) + 30, // Cash varies by tolerance
        preferredDrugSubTypes: archetypeData.preferredDrugSubTypes || [],
        addictionLevel: {}, // { STIMULANT: 0.1, OPIATE: 0.05 }
        hasMetRikkBefore: false,
        lastInteractionWithRikk: null,
        patience: 3 + Math.floor(Math.random()*3),
    };

    if (customersPool.length < MAX_CUSTOMERS_IN_POOL) {
        customersPool.push(newCustomer);
    } else {
        customersPool[Math.floor(Math.random() * MAX_CUSTOMERS_IN_POOL)] = newCustomer;
    }
    console.log("New customer generated:", newCustomer.name, "Archetype:", newCustomer.archetypeKey);
    return newCustomer;
}


function generateCustomerInteractionData() {
    const customerData = selectOrGenerateCustomerFromPool();
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
    let greetingText = archetype.greeting(customerData, null); // Initial greeting
    dialogue.push({ speaker: "customer", text: greetingText });

    // --- REVISED LOGIC FOR DECIDING IF CUSTOMER SELLS TO RIKK ---
    let customerWillOfferItemToRikk = false;
    if (archetype.sellsOnly) {
        customerWillOfferItemToRikk = true;
    } else {
        let baseChanceToOfferItem = 0.30;
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
    // --- END OF REVISED LOGIC ---

    if (customerWillOfferItemToRikk && inventory.length < MAX_INVENTORY_SLOTS) { // Customer offers to sell to Rikk
        itemContext = generateRandomItem(archetype);
        if (!archetype.sellsOnly && itemContext.qualityIndex > 1 && Math.random() < 0.6) {
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
        // --- END OF ENHANCED DIALOGUE ---

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
        choices.push({ text: "Nah, I'm straight on that.", outcome: { type: "decline_offer_to_buy", item: itemContext } });

    } else if (inventory.length > 0) { // Customer wants to buy from Rikk (and Rikk has items)
        let potentialItemsToSell = inventory.filter(invItem => archetype.buyPreference ? archetype.buyPreference(invItem) : true);
        if (customerData.preferredDrugSubTypes && customerData.preferredDrugSubTypes.length > 0 && Math.random() < 0.7) {
            const preferredItems = potentialItemsToSell.filter(invItem =>
                invItem.itemTypeObj.type === "DRUG" && customerData.preferredDrugSubTypes.includes(invItem.itemTypeObj.subType)
            );
            if (preferredItems.length > 0) potentialItemsToSell = preferredItems;
        }
        if (potentialItemsToSell.length === 0) potentialItemsToSell = inventory;

        itemContext = potentialItemsToSell[Math.floor(Math.random() * potentialItemsToSell.length)];

        // Update initial greeting if it was generic
        const firstDialogueText = dialogue[0].text.toLowerCase();
        const needsGreetingUpdate = (
            (archetype.key === "DESPERATE_FIEND" && (firstDialogueText.includes('fix') || firstDialogueText.includes('quiet the demons'))) ||
            (archetype.key === "HIGH_ROLLER" && (firstDialogueText.includes('product') || firstDialogueText.includes('exquisite diversions'))) ||
            (archetype.key === "REGULAR_JOE" && (firstDialogueText.includes('something decent') || firstDialogueText.includes('unwind with'))) ||
            (archetype.key === "SNITCH" && (firstDialogueText.includes('noteworthy') || firstDialogueText.includes('exciting'))) // Snitch might also have generic opener
        );
        if (dialogue.length === 1 && needsGreetingUpdate) {
            dialogue[0].text = archetype.greeting(customerData, itemContext);
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
        // --- END OF ENHANCED DIALOGUE ---

        if (customerData.cashOnHand >= customerOfferPrice) {
            choices.push({ text: `Serve 'em ($${customerOfferPrice})`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice } });
        } else {
            choices.push({ text: `Serve 'em ($${customerOfferPrice}) (They Broke!)`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice }, disabled: true });
        }

        if (!archetype.negotiationResists && rikkBaseSellPrice > customerOfferPrice + 10 && customerData.cashOnHand >= Math.round((rikkBaseSellPrice + customerOfferPrice) / 1.9)) {
            const hagglePrice = Math.min(customerData.cashOnHand, Math.round((rikkBaseSellPrice + customerOfferPrice) / 1.9));
            choices.push({ text: `Haggle (Aim $${hagglePrice})`, outcome: { type: "negotiate_sell", item: itemContext, proposedPrice: hagglePrice, originalOffer: customerOfferPrice } });
        }
        choices.push({ text: "Kick rocks, chump.", outcome: { type: "decline_offer_to_sell", item: itemContext } });

    } else { // Rikk has nothing, and customer didn't offer to sell.
        // --- ENHANCED DIALOGUE: Rikk's Empty Stash ---
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
        // Update Rikk's line if the initial greeting was already pushed
        if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "customer") {
            dialogue.push({ speaker: "rikk", text: emptyStashText });
        } else if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "rikk") {
             // This case should be rare if greeting logic is correct, but as a fallback:
            dialogue[dialogue.length -1].text = emptyStashText; // Overwrite Rikk's previous line
        } else { // Should not happen if greeting always pushes first
            dialogue.push({ speaker: "rikk", text: emptyStashText });
        }

        choices.push({ text: "Aight, peace. Hit me up.", outcome: { type: "acknowledge_empty_stash" } });
        // --- END OF ENHANCED DIALOGUE ---
    }

    currentCustomer = {
        data: customerData,
        name: customerData.name,
        dialogue,
        choices,
        itemContext,
        archetypeKey: customerData.archetypeKey,
        mood: customerData.mood
    };
}

function startCustomerInteraction() {
    generateCustomerInteractionData(); 
    let dialogueIndex = 0;

    rikkPhoneDisplay.classList.remove('hidden');
    setTimeout(() => rikkPhoneDisplay.classList.add('active'), 50);
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
    const customerState = currentCustomer.data; 

    let dealSuccess = false; 

    switch (outcome.type) {
        case "buy_from_customer": 
            if (cash >= outcome.price && inventory.length < MAX_INVENTORY_SLOTS) {
                cash -= outcome.price;
                const newItem = {...outcome.item}; inventory.push(newItem); 
                heatChange = newItem.itemTypeObj.heat + (archetype.heatImpact || 0);
                credChange = archetype.credImpactBuy || 0; 
                customerState.mood = "pleased"; customerState.loyaltyToRikk += 1; dealSuccess = true;
                narrationText = `Scored! Copped "${newItem.name} (${newItem.quality})" for $${outcome.price}.`;
                customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkBuysSuccess || "Good doin' business."}"`;
                playSound(cashSound);
                if (newItem.effect === "reduce_heat_small") { heat = Math.max(0, heat - 10); narrationText += " That intel should cool things down."; }
                customerState.lastInteractionWithRikk = { type: "rikk_bought", item: newItem.name, outcome: "success" };
            } else if (inventory.length >= MAX_INVENTORY_SLOTS) {
                narrationText = `Stash full, fam! No room.`; customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.stashFull || "Aight then."}"`; playSound(deniedSound);
                customerState.mood = "annoyed"; customerState.loyaltyToRikk -=1;
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
                customerState.mood = "happy"; customerState.loyaltyToRikk += 2; dealSuccess = true;

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

        case "negotiate_sell":
            const negotiateArchetype = archetype; 
            displayPhoneMessage(`Rikk: "Hold up, $${outcome.originalOffer}? Nah, G. I need at least $${outcome.proposedPrice} for this."`, 'rikk');
            setTimeout(() => {
                let successChance = 0.5 + (playerSkills.negotiator * 0.1);
                if (negotiateArchetype.priceToleranceFactor < 0.9) successChance -= 0.15;
                if (negotiateArchetype.priceToleranceFactor > 1.1) successChance += 0.15;
                if (customerState.mood === "annoyed") successChance -= 0.2; 

                let negHeat = 0; let negCred = 0;
                if (Math.random() < successChance) { 
                    const finalPrice = outcome.proposedPrice;
                    const itemToSellIndex = inventory.findIndex(i => i.id === outcome.item.id && i.quality === outcome.item.quality && i.purchasePrice === outcome.item.purchasePrice);
                    if (itemToSellIndex !== -1) {
                        const itemSold = inventory.splice(itemToSellIndex, 1)[0];
                        cash += finalPrice;
                        negHeat = itemSold.itemTypeObj.heat + (negotiateArchetype.heatImpact || 0) + 1; 
                        negCred = (negotiateArchetype.credImpactSell || 0) + 1; 
                        customerState.mood = "impressed"; customerState.loyaltyToRikk +=1; dealSuccess = true;
                         if (itemSold.itemTypeObj.type === "DRUG" && itemSold.itemTypeObj.addictionChance > 0) {
                            const subType = itemSold.itemTypeObj.subType;
                            customerState.addictionLevel[subType] = (customerState.addictionLevel[subType] || 0) + itemSold.itemTypeObj.addictionChance;
                        }
                        displayPhoneMessage(`Success! Sold "${itemSold.name}" for $${finalPrice}.`, 'narration');
                        displayPhoneMessage(`"${currentCustomer.name}: ${negotiateArchetype.dialogueVariations?.negotiationSuccess || "Aight, deal."}"`, 'customer');
                        playSound(cashSound);
                        customerState.lastInteractionWithRikk = { type: "rikk_sold_negotiated", item: itemSold.name, outcome: "success" };
                    }
                } else { 
                    negHeat = 1; negCred = -1; 
                    customerState.mood = "angry"; customerState.loyaltyToRikk -=2;
                    displayPhoneMessage(`They ain't budging. "${negotiateArchetype.dialogueVariations?.negotiationFail || `Take $${outcome.originalOffer} or I walk,`}" they say.`, 'narration');
                    choicesArea.innerHTML = '';
                    const acceptOriginalBtn = document.createElement('button'); acceptOriginalBtn.textContent = `Aight, fine. ($${outcome.originalOffer})`; acceptOriginalBtn.classList.add('choice-button'); acceptOriginalBtn.addEventListener('click', () => handleChoice({ type: "sell_to_customer", item: outcome.item, price: outcome.originalOffer })); choicesArea.appendChild(acceptOriginalBtn);
                    const declineFullyBtn = document.createElement('button'); declineFullyBtn.textContent = `Nah, deal's off.`; declineFullyBtn.classList.add('choice-button', 'decline'); declineFullyBtn.addEventListener('click', () => handleChoice({ type: "decline_offer_to_sell", item: outcome.item })); choicesArea.appendChild(declineFullyBtn);
                    customerState.lastInteractionWithRikk = { type: "rikk_negotiation_failed" };
                    return; 
                }
                heat += negHeat; streetCred += negCred;
                fiendsLeft--; 
                updateHUD(); updateInventoryDisplay();
                setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
            }, 1500);
            return; 

        case "decline_offer_to_buy":
            narrationText = "Rikk ain't interested. Told 'em to bounce.";
            customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToBuy || "Your loss, chief."}"`;
            credChange = -1; 
            customerState.mood = "annoyed"; customerState.loyaltyToRikk -=1;
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", item: outcome.item.name };
            break;

        case "decline_offer_to_sell":
            narrationText = "That chump change? Rikk sent 'em packing.";
            customerReaction = `"${currentCustomer.name}: ${archetype.dialogueVariations?.rikkDeclinesToSell || "Cheap ass..."}"`;
            heatChange = 1; 
            credChange = archetype.key === "DESPERATE_FIEND" ? -2 : (archetype.key === "HIGH_ROLLER" ? 1 : 0); 
            customerState.mood = "angry"; customerState.loyaltyToRikk -=2;
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
        case "acknowledge_error": // Handle the error acknowledgement
             narrationText = "System error acknowledged. Moving on...";
             break;
        default:
            console.error("Unhandled outcome type in handleChoice:", outcome.type);
            narrationText = "System: Action not recognized.";
            break;
    }

    heat = Math.min(MAX_HEAT, Math.max(0, heat + heatChange));
    streetCred += credChange;
    customerState.hasMetRikkBefore = true; 
    
    if (outcome.type !== "negotiate_sell") { 
        fiendsLeft--;
    }
    
    updateHUD();
    updateInventoryDisplay();

    if (archetype && archetype.postDealEffect) { // Check archetype exists
        archetype.postDealEffect(dealSuccess, customerState); 
    }

    activeWorldEvents.forEach(eventState => { if(eventState.event.effects && eventState.event.effects.heatModifier && heatChange > 0) { if (typeof heatChange === 'number' && typeof eventState.event.effects.heatModifier === 'number') { heat = Math.min(MAX_HEAT, Math.max(0, heat + Math.round(heatChange * (eventState.event.effects.heatModifier -1 ) ) ) ); } } });
    updateHUD();

    setTimeout(() => {
        if (narrationText) displayPhoneMessage(narrationText, 'narration');
        if (customerReaction) displayPhoneMessage(customerReaction, 'customer');
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
    }, CUSTOMER_WAIT_TIME / 2);

    if (heat >= MAX_HEAT) endGame("heat");
    else if (cash < 0 && fiendsLeft > 0 && gameActive) endGame("bankrupt"); // Added gameActive check
}

function endCustomerInteraction() {
    // ... (same) ...
    clearChoices(); currentCustomer = null; 
    if (fiendsLeft > 0 && gameActive && heat < MAX_HEAT && cash >=0) { nextCustomerBtn.disabled = false; } 
    else if (gameActive) { nextCustomerBtn.disabled = true; }
    saveGameState();
    if (fiendsLeft <= 0 && gameActive) { setTimeout(()=> endGame("completed"), CUSTOMER_WAIT_TIME); }
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
function openInventoryModal() { /* ... same ... */ inventoryModal.classList.add('active'); rikkPhoneDisplay.classList.remove('active'); rikkPhoneDisplay.classList.add('hidden'); }
function closeInventoryModal() { /* ... same ... */ inventoryModal.classList.remove('active'); if (currentCustomer) { rikkPhoneDisplay.classList.remove('hidden'); rikkPhoneDisplay.classList.add('active'); } }
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