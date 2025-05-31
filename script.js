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
const phoneTitleElement = document.getElementById('phone-title');


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

let customersPool = [];
let nextCustomerId = 1;

// --- Game Configuration ---
const CUSTOMER_WAIT_TIME = 1100;
const KNOCK_ANIMATION_DURATION = 1000;
const PHONE_ANIMATION_DURATION = 500;
const SAVE_KEY = 'myNiggaRikkSaveDataV6'; // Incremented for new dialogue structure
const STARTING_CASH = 500;
const MAX_FIENDS = 15;
const SPLASH_SCREEN_DURATION = 2500;
const STARTING_STREET_CRED = 0;
const MAX_HEAT = 100;
const MAX_CUSTOMERS_IN_POOL = 20;


// --- Helper function to get a random element from an array ---
function getRandomElement(arr) {
    if (!arr || arr.length === 0) return "";
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- HANDLER FUNCTIONS ---
function handleStartNewGameClick() { initializeNewGameState(); startGameFlow(); }
function handleContinueGameClick() { if (loadGameState()) { startGameFlow(); } else { displaySystemMessage("System: No saved game found or data corrupted. Starting new game."); initializeNewGameState(); startGameFlow(); } }
function handleRestartGameClick() { initializeNewGameState(); startGameFlow(); }


// --- CORE GAME FUNCTIONS ---
function initGame() {
    splashScreen.classList.add('active'); startScreen.classList.remove('active'); gameScreen.classList.remove('active'); endScreen.classList.remove('active');
    setTimeout(() => { splashScreen.classList.remove('active'); splashScreen.style.display = 'none'; startScreen.classList.add('active'); checkForSavedGame(); }, SPLASH_SCREEN_DURATION);
    newGameBtn.addEventListener('click', handleStartNewGameClick); continueGameBtn.addEventListener('click', handleContinueGameClick); restartGameBtn.addEventListener('click', handleRestartGameClick);
    nextCustomerBtn.addEventListener('click', nextFiend); openInventoryBtn.addEventListener('click', openInventoryModal); closeModalBtn.addEventListener('click', closeInventoryModal);
    inventoryModal.addEventListener('click', (e) => { if (e.target === inventoryModal) closeInventoryModal(); });
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active');
}

function initializeNewGameState() {
    clearSavedGameState(); cash = STARTING_CASH; fiendsLeft = MAX_FIENDS; heat = 0; streetCred = STARTING_STREET_CRED; inventory = [];
    playerSkills = { negotiator: 0, appraiser: 0, lowProfile: 0 }; activeWorldEvents = []; dayOfWeek = days[0]; gameActive = false;
    customersPool = []; nextCustomerId = 1;
    updateEventTicker();
}

function startGameFlow() {
    gameActive = true; splashScreen.classList.remove('active'); splashScreen.style.display = 'none'; startScreen.classList.remove('active'); endScreen.classList.remove('active'); gameScreen.classList.add('active');
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active');
    updateHUD(); updateInventoryDisplay(); clearChat(); clearChoices(); nextFiend();
}

function endGame(reason) {
    gameActive = false; gameScreen.classList.remove('active'); endScreen.classList.add('active');
    finalDaysDisplay.textContent = MAX_FIENDS - fiendsLeft; finalCashDisplay.textContent = cash; finalCredDisplay.textContent = streetCred;
    if (reason === "heat") { finalVerdictText.textContent = `The block's too hot, nigga! 5-0 swarming. Heat: ${heat}. Time to ghost.`; finalVerdictText.style.color = "var(--color-error)"; }
    else if (reason === "bankrupt") { finalVerdictText.textContent = "Broke as a joke, and empty handed. Can't hustle on E, fam."; finalVerdictText.style.color = "var(--color-error)"; }
    else { if (cash >= STARTING_CASH * 3 && streetCred > MAX_FIENDS) { finalVerdictText.textContent = "You a certified KINGPIN! The streets whisper your name."; } else if (cash >= STARTING_CASH * 1.5 && streetCred > MAX_FIENDS / 2) { finalVerdictText.textContent = "Solid hustle, G. Made bank and respect."; } else if (cash > STARTING_CASH) { finalVerdictText.textContent = "Made some profit. Not bad for a night's work."; } else if (cash <= STARTING_CASH && streetCred < 0) { finalVerdictText.textContent = "Tough night. Lost dough and respect. This life ain't for everyone."; } else { finalVerdictText.textContent = "Broke even or worse. Gotta step your game up, Rikk."; } finalVerdictText.style.color = cash > STARTING_CASH ? "var(--color-success-green)" : "var(--color-accent-orange)"; }
    rikkPhoneDisplay.classList.add('hidden'); rikkPhoneDisplay.classList.remove('active'); clearSavedGameState();
}

function updateDayOfWeek() { const currentIndex = days.indexOf(dayOfWeek); dayOfWeek = days[(currentIndex + 1) % days.length];}
function triggerWorldEvent() {
    if (activeWorldEvents.length > 0 && Math.random() < 0.7) return;
    activeWorldEvents = activeWorldEvents.filter(event => event.turnsLeft > 0);
    if (typeof possibleWorldEvents !== 'undefined' && possibleWorldEvents.length > 0 && Math.random() < 0.25 && activeWorldEvents.length === 0) {
        const eventTemplate = getRandomElement(possibleWorldEvents);
        activeWorldEvents.push({ event: eventTemplate, turnsLeft: eventTemplate.duration });
    }
    updateEventTicker();
}
function updateEventTicker() { if (activeWorldEvents.length > 0) { const currentEvent = activeWorldEvents[0]; eventTicker.textContent = `Word on the street: ${currentEvent.event.name} (${currentEvent.turnsLeft} turns left)`; } else { eventTicker.textContent = `Word on the street: All quiet... for now. (${dayOfWeek})`; } }
function advanceWorldEvents() { activeWorldEvents.forEach(eventState => { eventState.turnsLeft--; }); activeWorldEvents = activeWorldEvents.filter(eventState => eventState.turnsLeft > 0); }

function nextFiend() {
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
    let customerArchetype = null;
    if (customerData && customerData.archetypeKey && typeof customerArchetypes !== 'undefined') {
        customerArchetype = customerArchetypes[customerData.archetypeKey];
    }

    let baseValue = purchaseContext ? item.purchasePrice : item.estimatedResaleValue;
    if (!item || !item.itemTypeObj || typeof item.qualityIndex === 'undefined') { console.error("Invalid item structure for value calculation:", item); return baseValue;  }

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
    if (typeof itemTypes === 'undefined' || itemTypes.length === 0) {
        console.error("itemTypes data is not loaded or empty!");
        return { id: "error_item", name: "Error Item", itemTypeObj: { type: "ERROR", heat: 0, description:"Data missing"}, quality: "Unknown", qualityIndex: 0, purchasePrice: 1, estimatedResaleValue: 1, fullDescription: "Data load error." };
    }

    let availableItemTypes = [...itemTypes];
    if (archetypeData && archetypeData.itemPool && archetypeData.itemPool.length > 0) {
         availableItemTypes = itemTypes.filter(it => archetypeData.itemPool.includes(it.id));
    } else if (archetypeData && archetypeData.key === "DESPERATE_FIEND") {
        availableItemTypes = itemTypes.filter(it => it.baseValue < 80 || (it.type === "DRUG" && it.subType !== "PSYCHEDELIC" && it.subType !== "METHAMPHETAMINE"));
    }
    if (availableItemTypes.length === 0) availableItemTypes = [...itemTypes];

    const selectedType = getRandomElement(availableItemTypes); // Use getRandomElement

    const qualityLevelsForType = (typeof ITEM_QUALITY_LEVELS !== 'undefined' && ITEM_QUALITY_LEVELS[selectedType.type]) ? ITEM_QUALITY_LEVELS[selectedType.type] : ["Standard"];
    const qualityIndex = Math.floor(Math.random() * qualityLevelsForType.length);
    const quality = qualityLevelsForType[qualityIndex];
    let basePurchaseValue = selectedType.baseValue + Math.floor(Math.random() * (selectedType.range * 2)) - selectedType.range;

    const item = {
      id: selectedType.id, name: selectedType.name, itemTypeObj: selectedType, quality: quality, qualityIndex: qualityIndex,
      description: selectedType.description, uses: selectedType.uses || null, effect: selectedType.effect || null,
    };
    item.fullDescription = `${selectedType.description} This batch is looking ${quality.toLowerCase()}.`;

    let qualityPriceModifier = 1.0;
    if (typeof ITEM_QUALITY_MODIFIERS !== 'undefined' && ITEM_QUALITY_MODIFIERS[selectedType.type]) {
        qualityPriceModifier = ITEM_QUALITY_MODIFIERS[selectedType.type]?.[qualityIndex] || 1.0;
    }
    item.purchasePrice = Math.max(5, Math.round(basePurchaseValue * (0.3 + Math.random() * 0.25) * qualityPriceModifier));
    item.estimatedResaleValue = Math.max(item.purchasePrice + 5, Math.round(basePurchaseValue * (0.7 + Math.random() * 0.35) * qualityPriceModifier));
    return item;
}

function selectOrGenerateCustomerFromPool() {
    if (typeof customerArchetypes === 'undefined' || Object.keys(customerArchetypes).length === 0) {
        console.error("customerArchetypes data is not loaded or empty!");
        return { id: `customer_error_${nextCustomerId++}`, name: "Error Customer", archetypeKey: "ERROR_ARCHETYPE", loyaltyToRikk: 0, mood: "neutral", cashOnHand: 50, preferredDrugSubTypes: [], addictionLevel: {}, hasMetRikkBefore: false, lastInteractionWithRikk: null, patience: 3 };
    }

    if (customersPool.length > 0 && Math.random() < 0.35) {
        const returningCustomer = getRandomElement(customersPool);
        returningCustomer.hasMetRikkBefore = true;
        const archetype = customerArchetypes[returningCustomer.archetypeKey];
        if (archetype) {
            returningCustomer.cashOnHand = Math.floor(Math.random() * (archetype.priceToleranceFactor * 90)) + 25;
            const moodRoll = Math.random();
            if (moodRoll < 0.15) returningCustomer.mood = "happy";
            else if (moodRoll < 0.30) returningCustomer.mood = "paranoid";
            else if (moodRoll < 0.45) returningCustomer.mood = "angry";
            else if (archetype.initialMood && moodRoll < 0.7) returningCustomer.mood = archetype.initialMood;
            else { // More variety in default mood for returning customers
                 const possibleMoods = ["neutral", "chill", "desperate", "cautious", "nosy", "arrogant"];
                 returningCustomer.mood = getRandomElement(possibleMoods.filter(m => m !== returningCustomer.mood)); // try not to pick same mood
                 if (!returningCustomer.mood) returningCustomer.mood = "neutral"; // fallback
            }
        } else {
            returningCustomer.cashOnHand = Math.floor(Math.random() * 80) + 20;
            returningCustomer.mood = "neutral";
        }
        console.log("Returning customer:", returningCustomer.name, "New Mood:", returningCustomer.mood);
        return returningCustomer;
    }

    const archetypeKeys = Object.keys(customerArchetypes);
    const selectedArchetypeKey = getRandomElement(archetypeKeys);
    const archetypeData = customerArchetypes[selectedArchetypeKey];
    let customerName = archetypeData.baseName;
    if (!customerName.includes(nextCustomerId.toString())) {
         customerName += ` #${nextCustomerId}`;
    }

    const newCustomer = {
        id: `customer_${nextCustomerId++}`,
        name: customerName,
        archetypeKey: selectedArchetypeKey,
        loyaltyToRikk: Math.floor(Math.random() * 3) -1,
        mood: archetypeData.initialMood || "neutral",
        cashOnHand: Math.floor(Math.random() * (archetypeData.priceToleranceFactor * 100)) + 30,
        preferredDrugSubTypes: [...(archetypeData.preferredDrugSubTypes || [])],
        addictionLevel: {},
        hasMetRikkBefore: false,
        lastInteractionWithRikk: null,
        patience: 3 + Math.floor(Math.random()*3),
    };

    if (customersPool.length < MAX_CUSTOMERS_IN_POOL) {
        customersPool.push(newCustomer);
    } else {
        customersPool[Math.floor(Math.random() * MAX_CUSTOMERS_IN_POOL)] = newCustomer;
    }
    console.log("New customer generated:", newCustomer.name, "Archetype:", newCustomer.archetypeKey, "Initial Mood:", newCustomer.mood);
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
    let greetingText = archetype.greeting(customerData, null);
    dialogue.push({ speaker: "customer", text: greetingText });

    const rikkOpeners = [
        "Aight, I hear ya. What's the word on the street?",
        "Yo. Lay it on me. Business or bullshit?",
        "Speak to Rikk. You buyin', sellin', or just window shoppin'?",
        "Alright, alright, take a chill pill. What's poppin'?",
        "Heard. Don't waste my time. What you got for Rikk, or what you want from him?"
    ];
    if (customerData.mood === "paranoid") {
        dialogue.push({ speaker: "rikk", text: getRandomElement(["Easy there, chief. No one's listening but me and the damn city hum. What's got you spooked?", "Whoa, slow down. You look like you seen a ghost. What's the haps?"]) });
    } else if (customerData.mood === "angry") {
        dialogue.push({ speaker: "rikk", text: getRandomElement(["Whoa, simmer down before you pop a blood vessel. Bad vibes cost extra 'round here. What's the issue?", "Alright, tough guy. Spit it out. My patience ain't unlimited."]) });
    } else if (customerData.mood === "happy") {
        dialogue.push({ speaker: "rikk", text: getRandomElement(["Well, well, look who's grinnin' like a possum eatin' a sweet potato. What's the good news?", "Someone's feelin' good today. Lay some of that sunshine on me. What can Rikk do for ya?"]) });
    }
     else {
        dialogue.push({ speaker: "rikk", text: getRandomElement(rikkOpeners) });
    }

    let customerWillOfferItemToRikk = false;
    if (archetype.sellsOnly) {
        customerWillOfferItemToRikk = true;
    } else {
        let baseChanceToOfferItem = 0.35;
        if (inventory.length === 0) { baseChanceToOfferItem = 0.80; }
        else if (inventory.length <= 1) { baseChanceToOfferItem = 0.65; }
        else if (inventory.length <= 3) { baseChanceToOfferItem = 0.45; }
        else if (inventory.length >= MAX_INVENTORY_SLOTS - 1) { baseChanceToOfferItem = 0.05; }

        if (Math.random() < baseChanceToOfferItem) {
            customerWillOfferItemToRikk = true;
        } else if (customerData.cashOnHand < 20 && Math.random() < 0.6) {
            customerWillOfferItemToRikk = true;
        }
    }

    if (customerWillOfferItemToRikk && inventory.length < MAX_INVENTORY_SLOTS) {
        itemContext = generateRandomItem(archetype);
        if (!archetype.sellsOnly && itemContext.qualityIndex > 1 && Math.random() < 0.6) {
            itemContext.qualityIndex = Math.max(0, itemContext.qualityIndex - 1);
            const qualityLevelsForType = (typeof ITEM_QUALITY_LEVELS !== 'undefined' && ITEM_QUALITY_LEVELS[itemContext.itemTypeObj.type]) ? ITEM_QUALITY_LEVELS[itemContext.itemTypeObj.type] : ["Standard"];
            itemContext.quality = qualityLevelsForType[itemContext.qualityIndex];
        }

        const customerDemandsPrice = calculateItemEffectiveValue(itemContext, true, customerData);
        const itemNameForDialogue = itemContext.name.split("'")[1] || itemContext.name.split(" ")[1] || itemContext.name;

        let offerText = "";
        const genericOffers = [
            `Yo Rikk, peep this. Got a ${itemContext.quality} ${itemNameForDialogue}. How's $${customerDemandsPrice} sound? **Fell off a truck... a very fast, very invisible truck.**`,
            `Check it, Rikk. This ${itemContext.quality} ${itemNameForDialogue} is lookin' for a new home. $${customerDemandsPrice} and it's yours. **No questions asked, right? Unless the question is 'is it hot?' Then the answer is 'maybe a little warm'.**`,
            `Rikk, my man. Scored this ${itemContext.quality} ${itemNameForDialogue}. Figure you can move it. $${customerDemandsPrice}? **Let's make some magic happen, or at least some cash.**`
        ];
        const drugOffers = [
            `Got some ${itemContext.quality} ${itemNameForDialogue} here, Rikk. Fresh...ish. $${customerDemandsPrice} and it'll make someone's night. **Or make 'em question all their life choices. Either way, it's an experience.**`,
            `This ${itemContext.quality} ${itemNameForDialogue} is potent, Rikk. $${customerDemandsPrice}. **Handle with care, or don't. Not my problem after the cash swaps hands.**`
        ];
        const stolenGoodOffers = [
            `Found this ${itemContext.quality} ${itemNameForDialogue} just... lying around. Yeah. $${customerDemandsPrice}? **It's practically begging for a new owner. One with fewer morals, perhaps.**`,
            `This ${itemContext.quality} ${itemNameForDialogue}? Let's just say it's 'pre-liberated'. $${customerDemandsPrice} for you, Rikk. **Don't ask where I got the key, or why the previous owner was crying.**`
        ];

        if (itemContext.itemTypeObj.type === "DRUG") { offerText = getRandomElement(drugOffers); }
        else if (itemContext.itemTypeObj.type === "STOLEN_GOOD") { offerText = getRandomElement(stolenGoodOffers); }
        else { offerText = getRandomElement(genericOffers); }

        if (customerData.mood === "paranoid") offerText = `(Whispering) Rikk, this ${itemContext.quality} ${itemNameForDialogue}... it's clean, I think. Probably. $${customerDemandsPrice}? **But we gotta be quick, the walls are listening and the damn squirrels are taking notes!**`;
        else if (customerData.mood === "happy") offerText = `Rikk! Guess what I got! This sweet ${itemContext.quality} ${itemNameForDialogue}! $${customerDemandsPrice} and it's all yours, buddy! **Today's my lucky day, so it's your lucky day too! Unless it's cursed. Then it's mostly your lucky day.**`;
        else if (customerData.mood === "angry") offerText = `Alright, Rikk. Got this ${itemContext.quality} ${itemNameForDialogue}. Price is $${customerDemandsPrice}. **Take it or leave it, I ain't got all night to haggle with your cheap ass.**`;

        dialogue.push({ speaker: "customer", text: offerText });

        const rikkInspectLines = [
            `Hmm, a ${itemContext.quality} ${itemNameForDialogue}, huh? For $${customerDemandsPrice}? **Street's been whisperin' about stuff like this. Or maybe that's just the tinnitus.** Let me take a look...`,
            `Alright, alright, show me what you got. $${customerDemandsPrice} for this ${itemNameForDialogue}? **Could be somethin', could be trash. Like most things in this city. Only one way to find out.**`,
            `This ${itemNameForDialogue} you're pushin'... $${customerDemandsPrice} is your number? **Smells like opportunity... or a setup. Let's see which way the wind blows.**`
        ];
        dialogue.push({ speaker: "rikk", text: getRandomElement(rikkInspectLines) });

        if (cash >= customerDemandsPrice) {
            choices.push({ text: `Cop it ($${customerDemandsPrice})`, outcome: { type: "buy_from_customer", item: itemContext, price: customerDemandsPrice } });
        } else {
            let rikkNoCashText = "(Damn, stash is low for that.)";
            if (archetype.dialogueVariations?.lowCashRikk) {
                const moodReaction = archetype.dialogueVariations.lowCashRikk(customerData.mood);
                rikkNoCashText = Array.isArray(moodReaction) ? getRandomElement(moodReaction) : moodReaction;
            }
            dialogue.push({ speaker: "rikk", text: `(To self: ${rikkNoCashText}) Customer hears: "Yo, $${customerDemandsPrice} is a bit steep for my pockets right now, G. Wallet's lookin' anorexic."` });
            choices.push({ text: `Cop it (Need $${customerDemandsPrice - cash} more)`, outcome: { type: "buy_from_customer", item: itemContext, price: customerDemandsPrice }, disabled: true });
        }
        choices.push({ text: "Nah, pass on that.", outcome: { type: "decline_offer_to_buy", item: itemContext } });

    } else if (inventory.length > 0) {
        let potentialItemsToSell = inventory.filter(invItem => archetype.buyPreference ? archetype.buyPreference(invItem) : true);
        if (customerData.preferredDrugSubTypes && customerData.preferredDrugSubTypes.length > 0 && Math.random() < 0.7) {
            const preferredItems = potentialItemsToSell.filter(invItem =>
                invItem.itemTypeObj.type === "DRUG" && customerData.preferredDrugSubTypes.includes(invItem.itemTypeObj.subType)
            );
            if (preferredItems.length > 0) potentialItemsToSell = preferredItems;
        }
        if (potentialItemsToSell.length === 0) potentialItemsToSell = inventory;

        itemContext = getRandomElement(potentialItemsToSell);
        const itemNameForDialogue = itemContext.name.split("'")[1] || itemContext.name.split(" ")[1] || itemContext.name;

        // Check if the second to last message was the customer's greeting.
        // dialogue.length-2 because Rikk's opener was just pushed.
        const firstDialogueText = dialogue.length >= 2 ? dialogue[dialogue.length-2].text.toLowerCase() : "";
        const needsGreetingUpdate = (
            (archetype.key === "DESPERATE_FIEND" && (firstDialogueText.includes('fix') || firstDialogueText.includes('quiet the demons'))) ||
            (archetype.key === "HIGH_ROLLER" && (firstDialogueText.includes('product') || firstDialogueText.includes('exquisite diversions'))) ||
            (archetype.key === "REGULAR_JOE" && (firstDialogueText.includes('something decent') || firstDialogueText.includes('unwind with'))) ||
            (archetype.key === "SNITCH" && (firstDialogueText.includes('noteworthy') || firstDialogueText.includes('exciting')))
        );

        if (dialogue.length >= 2 && needsGreetingUpdate && dialogue[0].speaker === "customer") { // Ensure we're updating the *customer's* initial greeting
            dialogue[0].text = archetype.greeting(customerData, itemContext);
        }

        const rikkBaseSellPrice = calculateItemEffectiveValue(itemContext, false, null);
        let customerOfferPrice = Math.round(rikkBaseSellPrice * archetype.priceToleranceFactor);
        customerOfferPrice = Math.max(itemContext.purchasePrice + Math.max(5, Math.round(itemContext.purchasePrice * 0.10)), customerOfferPrice); // Slightly lower min profit
        customerOfferPrice = Math.min(customerOfferPrice, customerData.cashOnHand);

        let askText = "";
        const genericAsks = [
            `So, Rikk, that ${itemContext.quality} ${itemNameForDialogue}... what's the word? I got $${customerOfferPrice} burnin' a hole. **And my patience ain't far behind.**`,
            `Heard you got the good ${itemContext.quality} ${itemNameForDialogue}. I can do $${customerOfferPrice}. We cool? **Or do I gotta find another connoisseur of fine... *things*?**`,
            `Alright Rikk, let's talk about that ${itemNameForDialogue}. My offer is $${customerOfferPrice}. Make it happen. **Time's a-wastin', and so is my good mood.**`
        ];
         if (customerData.mood === "paranoid") askText = `(Nervously) You got that ${itemContext.quality} ${itemNameForDialogue}, right? $${customerOfferPrice}. **Just... no surprises, okay? My heart's already doing a drum solo.**`;
        else if (customerData.mood === "happy") askText = `Rikk, my man! That ${itemContext.quality} ${itemNameForDialogue} is callin' my name! How's $${customerOfferPrice} for a slice of heaven? **Let's make today legendary! Or at least, less sucky.**`;
        else if (customerData.mood === "angry") askText = `That ${itemContext.quality} ${itemNameForDialogue}. $${customerOfferPrice}. **Yes or no, Rikk. I ain't got time for your sales pitch.**`;
        else askText = getRandomElement(genericAsks);

        dialogue.push({ speaker: "customer", text: askText });

        const rikkSellResponses = [
            `This fire ${itemContext.quality} ${itemNameForDialogue}? Yeah, I got that. Street says it's worth $${rikkBaseSellPrice}. You're comin' in at $${customerOfferPrice}. **We talkin' business or you just lonely?**`,
            `Ah, the infamous ${itemContext.quality} ${itemNameForDialogue}. Good taste... or bad habits. My price is $${rikkBaseSellPrice}, your offer $${customerOfferPrice}. **Let's see if we can bridge that gap, or if you're just gonna waste my damn time.**`,
            `So you want this ${itemContext.quality} ${itemNameForDialogue}, huh? Costs $${rikkBaseSellPrice} for the privilege. You got $${customerOfferPrice}. **Tempting... like a free donut next to a cop car.**`
        ];
        dialogue.push({ speaker: "rikk", text: getRandomElement(rikkSellResponses) });

        if (customerData.cashOnHand >= customerOfferPrice) {
            choices.push({ text: `Serve 'em ($${customerOfferPrice})`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice } });
        } else {
             dialogue.push({speaker: "rikk", text: `(To self: They ain't got the dough for this heat.) Yo, you're short $${customerOfferPrice - customerData.cashOnHand}, fam. **Math ain't your strong suit, huh?**`});
            choices.push({ text: `Serve 'em ($${customerOfferPrice}) (Short!)`, outcome: { type: "sell_to_customer", item: itemContext, price: customerOfferPrice }, disabled: true });
        }

        if (!archetype.negotiationResists && rikkBaseSellPrice > customerOfferPrice + 5 && customerData.cashOnHand >= Math.round((rikkBaseSellPrice + customerOfferPrice) / 2.1)) {
            const hagglePrice = Math.min(customerData.cashOnHand, Math.max(customerOfferPrice + 5, Math.round((rikkBaseSellPrice * 0.85 + customerOfferPrice * 0.15)) ));
            choices.push({ text: `Haggle (Aim $${hagglePrice})`, outcome: { type: "negotiate_sell", item: itemContext, proposedPrice: hagglePrice, originalOffer: customerOfferPrice } });
        }
        choices.push({ text: "Nah, kick rocks.", outcome: { type: "decline_offer_to_sell", item: itemContext } });

    } else {
        let emptyStashTextRikk = "";
        const rikkEmptyStashLines = [
            "Stash is drier than a popcorn fart, G. Nothin' to move right now.",
            "Shelves are bare, my friend. All out. Come back when the gettin's good, or when I magically shit out some product.",
            "Tapped out, fam. Fresh out. Zilch. Nada. Come back later, unless you got something FOR me."
        ];
        emptyStashTextRikk = getRandomElement(rikkEmptyStashLines);

        if (customerData.mood === "angry") emptyStashTextRikk = "What, you blind? I got NOTHIN'! Beat it before I lose my cool!";
        else if (customerData.mood === "paranoid") emptyStashTextRikk = "Uh, nothing here, man. All gone. You sure you got the right Rikk? **Maybe you're a cop. You look like a cop.**";
        else if (customerData.mood === "happy") emptyStashTextRikk = "Damn, G, wish I could help your good mood, but the well's dry. Maybe later, yeah?";

        if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "customer") { // Should be Rikk's opener here
             dialogue.push({ speaker: "rikk", text: emptyStashTextRikk });
        } else if (dialogue.length > 0 && dialogue[dialogue.length -1].speaker === "rikk") {
            dialogue[dialogue.length -1].text = emptyStashTextRikk;
        } else { // Fallback, though Rikk's opener should be there.
            dialogue.push({ speaker: "rikk", text: emptyStashTextRikk });
        }
        choices.push({ text: "Aight, my bad. Later.", outcome: { type: "acknowledge_empty_stash" } });
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
    if (phoneTitleElement && currentCustomer && currentCustomer.name) {
        phoneTitleElement.textContent = currentCustomer.name;
    } else if (phoneTitleElement) {
        phoneTitleElement.textContent = 'Street Talk';
    }
    let dialogueIndex = 0;

    rikkPhoneDisplay.classList.remove('hidden');
    setTimeout(() => rikkPhoneDisplay.classList.add('active'), 50);
    clearChat();

    const displayNext = () => {
        if (currentCustomer && dialogueIndex < currentCustomer.dialogue.length) {
            const msg = currentCustomer.dialogue[dialogueIndex];
            displayPhoneMessage(msg.text, msg.speaker);
            dialogueIndex++;
            setTimeout(displayNext, CUSTOMER_WAIT_TIME * (msg.text.length > 70 ? 1.4 : 1) * (msg.speaker === 'rikk' ? 0.8 : 1)); // Rikk's lines a bit faster
        } else if (currentCustomer) {
            displayChoices(currentCustomer.choices);
        } else {
            console.error("startCustomerInteraction: currentCustomer became null during dialogue display.");
            endCustomerInteraction();
        }
    };
    displayNext();
}

function displayPhoneMessage(message, speaker) {
    if (typeof message === 'undefined' || message === null) {
        console.warn(`Attempted to display undefined/null message for speaker: ${speaker}`);
        message = (speaker === 'rikk') ? "(Rikk mumbles something incoherent...)" : "(They trail off awkwardly...)";
    }
    playSound(chatBubbleSound); const bubble = document.createElement('div'); bubble.classList.add('chat-bubble', speaker); if (speaker === 'customer' || speaker === 'rikk') { const speakerName = document.createElement('span'); speakerName.classList.add('speaker-name'); speakerName.textContent = (speaker === 'customer' && currentCustomer ? currentCustomer.name : 'Rikk'); bubble.appendChild(speakerName); } const textNode = document.createTextNode(message); bubble.appendChild(textNode); chatContainer.appendChild(bubble); chatContainer.scrollTop = chatContainer.scrollHeight;
}
function displaySystemMessage(message) { displayPhoneMessage(message, 'narration'); }
function displayChoices(choices) { choicesArea.innerHTML = ''; choices.forEach(choice => { const button = document.createElement('button'); button.classList.add('choice-button'); button.textContent = choice.text; if (choice.outcome.type.startsWith('decline') || choice.outcome.type.includes('kick_rocks')) button.classList.add('decline'); button.disabled = choice.disabled || false; if (!choice.disabled) { button.addEventListener('click', () => handleChoice(choice.outcome)); } choicesArea.appendChild(button); }); }

function handleChoice(outcome) {
    clearChoices();
    let narrationText = "";
    let selectedCustomerReaction = "";
    let heatChange = 0;
    let credChange = 0;

    if (!currentCustomer || !currentCustomer.archetypeKey || !currentCustomer.data || typeof customerArchetypes === 'undefined' || !customerArchetypes[currentCustomer.archetypeKey]) {
        console.error("Critical Error: currentCustomer, archetypeKey, data, or customerArchetypes undefined.", currentCustomer);
        displaySystemMessage("System Error: Customer data missing or type undefined. Ending interaction.");
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME);
        return;
    }
    const archetype = customerArchetypes[currentCustomer.archetypeKey];
    const customerState = currentCustomer.data;
    let dealSuccess = false;

    const getReaction = (variationFn, mood, fallback) => {
        if (variationFn) {
            const reactionOutput = variationFn(mood);
            if (Array.isArray(reactionOutput)) return getRandomElement(reactionOutput);
            return reactionOutput || fallback; // Ensure it returns fallback if output is empty string
        }
        return fallback;
    };

    switch (outcome.type) {
        case "buy_from_customer":
            if (cash >= outcome.price && inventory.length < MAX_INVENTORY_SLOTS) {
                cash -= outcome.price; inventory.push({...outcome.item});
                heatChange = outcome.item.itemTypeObj.heat + (archetype.heatImpact || 0);
                credChange = archetype.credImpactBuy || 0;
                customerState.mood = "happy"; customerState.loyaltyToRikk += 1; dealSuccess = true;
                narrationText = `Rikk copped "${outcome.item.name} (${outcome.item.quality})" for $${outcome.price}. Not bad.`;
                selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkBuysSuccess, customerState.mood, "Pleasure doin' business, Rikk!");
                playSound(cashSound);
                if (outcome.item.effect === "reduce_heat_small") { heat = Math.max(0, heat - 10); narrationText += " That intel should cool things down a bit."; }
                customerState.lastInteractionWithRikk = { type: "rikk_bought", item: outcome.item.name, outcome: "success" };
            } else if (inventory.length >= MAX_INVENTORY_SLOTS) {
                narrationText = `Rikk's stash is packed tighter than a clown car. No room for that ${outcome.item.name}.`;
                selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkDeclinesToBuy, customerState.mood, "Seriously, Rikk? Full up? Lame.");
                playSound(deniedSound); customerState.mood = "annoyed"; customerState.loyaltyToRikk -=1;
                customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", reason: "stash_full" };
            } else {
                narrationText = `Rikk's pockets are feelin' light. Can't swing $${outcome.price} for the ${outcome.item.name}.`;
                selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkCannotAfford, customerState.mood, "Broke, Rikk? Times are tough, huh?");
                playSound(deniedSound); customerState.mood = "disappointed";
                customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", reason: "no_cash" };
            }
            break;

        case "sell_to_customer":
            const itemIndex = inventory.findIndex(i => i.id === outcome.item.id && i.quality === outcome.item.quality && i.purchasePrice === outcome.item.purchasePrice);
            if (itemIndex !== -1) {
                const itemSold = inventory.splice(itemIndex, 1)[0]; cash += outcome.price;
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
                narrationText = `Cha-ching! Rikk flipped "${itemSold.name} (${itemSold.quality})" for a cool $${outcome.price}.`;
                selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkSellsSuccess, customerState.mood, "My man Rikk! Good lookin' out!");
                playSound(cashSound);
                customerState.lastInteractionWithRikk = { type: "rikk_sold", item: itemSold.name, outcome: "success" };
            } else {
                narrationText = `WTF Rikk? Can't find that "${outcome.item.name}"! Did you smoke it all already?`;
                selectedCustomerReaction = `Yo, Rikk, you playin' me or what? That ain't in your stash! You tryin' to ghost me on the goods?`;
                heatChange = 3; playSound(deniedSound); customerState.mood = "angry";
                customerState.lastInteractionWithRikk = { type: "rikk_sell_fail", reason: "item_not_found" };
            }
            break;

        case "negotiate_sell":
            const negotiateArchetype = archetype;
             const rikkHaggleLines = [
                `Hold up, $${outcome.originalOffer}? Nah, G. My stuff ain't free samples. I need at least $${outcome.proposedPrice}.`,
                `Easy there, big spender. $${outcome.originalOffer} is lowballin' it. $${outcome.proposedPrice} is where we start talkin' real business.`,
                `For this primo shit? $${outcome.originalOffer} is a joke, fam. Make it $${outcome.proposedPrice} or take a hike.`
            ];
            displayPhoneMessage(`Rikk: "${getRandomElement(rikkHaggleLines)}"`, 'rikk');

            setTimeout(() => {
                let successChance = 0.55 + (playerSkills.negotiator * 0.12); // Slightly better base chance
                if (negotiateArchetype.priceToleranceFactor < 0.85) successChance -= 0.20;
                if (negotiateArchetype.priceToleranceFactor > 1.15) successChance += 0.15;
                if (customerState.mood === "angry") successChance -= 0.25;
                if (customerState.mood === "happy") successChance += 0.10;


                let negHeat = 0; let negCred = 0;
                if (Math.random() < successChance) {
                    const finalPrice = outcome.proposedPrice;
                    const itemToSellIndex = inventory.findIndex(i => i.id === outcome.item.id && i.quality === outcome.item.quality && i.purchasePrice === outcome.item.purchasePrice);
                    if (itemToSellIndex !== -1) {
                        const itemSold = inventory.splice(itemToSellIndex, 1)[0]; cash += finalPrice;
                        negHeat = itemSold.itemTypeObj.heat + (negotiateArchetype.heatImpact || 0) + 1;
                        negCred = (negotiateArchetype.credImpactSell || 0) + 1;
                        customerState.mood = "impressed"; customerState.loyaltyToRikk +=1; dealSuccess = true;
                        if (itemSold.itemTypeObj.type === "DRUG" && itemSold.itemTypeObj.addictionChance > 0) { /* ... addiction ... */ }
                        displayPhoneMessage(`Rikk's smooth talk worked! Sold "${itemSold.name}" for a sweet $${finalPrice}.`, 'narration');
                        selectedCustomerReaction = getReaction(negotiateArchetype.dialogueVariations?.negotiationSuccess, customerState.mood, "Aight, Rikk, you got me. Deal.");
                        displayPhoneMessage(`"${currentCustomer.name}: ${selectedCustomerReaction}"`, 'customer');
                        playSound(cashSound);
                        customerState.lastInteractionWithRikk = { type: "rikk_sold_negotiated", item: itemSold.name, outcome: "success" };
                    }
                } else {
                    negHeat = 1; negCred = -1;
                    customerState.mood = "angry"; customerState.loyaltyToRikk -=2;
                    let negFailText = `They ain't budging. "${getReaction(negotiateArchetype.dialogueVariations?.negotiationFail, customerState.mood, `Nah, man, $${outcome.originalOffer} is my final. Take it or leave it.`)}" they spit.`;
                    displayPhoneMessage(negFailText, 'narration');
                    choicesArea.innerHTML = '';
                    const acceptOriginalBtn = document.createElement('button'); acceptOriginalBtn.textContent = `Aight, fine. ($${outcome.originalOffer})`; acceptOriginalBtn.classList.add('choice-button');
                    acceptOriginalBtn.addEventListener('click', () => handleChoice({ type: "sell_to_customer", item: outcome.item, price: outcome.originalOffer })); choicesArea.appendChild(acceptOriginalBtn);
                    const declineFullyBtn = document.createElement('button'); declineFullyBtn.textContent = `Nah, deal's dead.`; declineFullyBtn.classList.add('choice-button', 'decline');
                    declineFullyBtn.addEventListener('click', () => handleChoice({ type: "decline_offer_to_sell", item: outcome.item })); choicesArea.appendChild(declineFullyBtn);
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
            narrationText = `Rikk ain't interested in their junk. Told 'em to bounce with that "${outcome.item.name}".`;
            selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkDeclinesToBuy, customerState.mood, "Damn, Rikk! My stuff ain't good enough for ya?");
            credChange = -1;
            customerState.mood = "annoyed"; customerState.loyaltyToRikk -=1;
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_declined_buy", item: outcome.item.name };
            break;

        case "decline_offer_to_sell":
            narrationText = `That chump change for "${outcome.item.name}"? Rikk told 'em to kick rocks and find a new dealer.`;
            selectedCustomerReaction = getReaction(archetype.dialogueVariations?.rikkDeclinesToSell, customerState.mood, "Cheap ass motherfucker...");
            heatChange = 1;
            credChange = archetype.key === "DESPERATE_FIEND" ? -2 : (archetype.key === "HIGH_ROLLER" ? 1 : 0);
            customerState.mood = "angry"; customerState.loyaltyToRikk -=2;
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_declined_sell", item: outcome.item.name };
            break;

        case "acknowledge_empty_stash":
            narrationText = "Rikk's stash is dry. Can't sell what you ain't got. Customer ain't happy.";
            selectedCustomerReaction = getRandomElement([
                `${currentCustomer.name}: Damn, Rikk. Dry spell, huh? Hit me up when you re-up, you know I'm good for it.`,
                `${currentCustomer.name}: No product? Lame. Alright, catch you later then, don't be a stranger when the goods are in.`,
                `${currentCustomer.name}: Seriously? Nothin'? Aight, guess I'll try my luck elsewhere. Don't make me beg, Rikk.`
            ]);
            credChange = -1;
            customerState.mood = "disappointed";
            playSound(deniedSound);
            customerState.lastInteractionWithRikk = { type: "rikk_empty_stash" };
            break;
        case "acknowledge_error":
             narrationText = "System error acknowledged by Rikk. What a mess.";
             break;
        default:
            console.error("Unhandled outcome type in handleChoice:", outcome.type);
            narrationText = "System: Rikk's brain just short-circuited. Action not recognized.";
            break;
    }

    heat = Math.min(MAX_HEAT, Math.max(0, heat + heatChange));
    streetCred = Math.max(-100, streetCred + credChange); // Prevent cred from going too low, or adjust as needed
    customerState.hasMetRikkBefore = true;

    if (outcome.type !== "negotiate_sell") { // negotiate_sell handles its own fiendsLeft--
        fiendsLeft--;
    }

    updateHUD();
    updateInventoryDisplay();

    if (archetype && archetype.postDealEffect) {
        archetype.postDealEffect(dealSuccess, customerState);
    }

    activeWorldEvents.forEach(eventState => {
        if(eventState.event.effects && eventState.event.effects.heatModifier && heatChange > 0) {
            if (typeof heatChange === 'number' && typeof eventState.event.effects.heatModifier === 'number') {
                 heat = Math.min(MAX_HEAT, Math.max(0, heat + Math.round(heatChange * (eventState.event.effects.heatModifier -1 ) ) ) );
            }
        }
    });
    updateHUD();

    setTimeout(() => {
        if (narrationText) displayPhoneMessage(narrationText, 'narration');
        // Display customer reaction only if it's not an error acknowledgement
        if (selectedCustomerReaction && outcome.type !== "acknowledge_error") {
            displayPhoneMessage(`"${currentCustomer.name}: ${selectedCustomerReaction}"`, 'customer');
        }
        setTimeout(endCustomerInteraction, CUSTOMER_WAIT_TIME * 1.5);
    }, CUSTOMER_WAIT_TIME / 2);

    if (heat >= MAX_HEAT) { endGame("heat"); return; } // Added return to prevent further processing
    if (cash <= 0 && inventory.length === 0 && fiendsLeft > 0 && gameActive) { // Bankrupt if no cash AND no inventory
        endGame("bankrupt");
        return;
    }
}

function endCustomerInteraction() {
    clearChoices();
    if (phoneTitleElement) {
        phoneTitleElement.textContent = 'Street Talk';
    }
    currentCustomer = null;
    if (fiendsLeft > 0 && gameActive && heat < MAX_HEAT && (cash > 0 || inventory.length > 0) ) { // Can continue if not bankrupt
        nextCustomerBtn.disabled = false;
    }
    else if (gameActive) { // Game is active but conditions to continue not met (e.g. bankrupt, max heat)
        nextCustomerBtn.disabled = true;
        // Check if an end game condition was met but not yet triggered
        if (heat >= MAX_HEAT && gameActive) endGame("heat");
        else if (cash <= 0 && inventory.length === 0 && fiendsLeft > 0 && gameActive) endGame("bankrupt");
        else if (fiendsLeft <=0 && gameActive) endGame("completed");
    }
    saveGameState();
    // Moved end game check from here to be more immediate within handleChoice or after nextCustomerBtn logic
}

function updateHUD() {
    cashDisplay.textContent = cash;
    dayDisplay.textContent = Math.max(0, fiendsLeft);
    heatDisplay.textContent = heat;
    credDisplay.textContent = streetCred;
}

function updateInventoryDisplay() {
    inventoryCountDisplay.textContent = inventory.length;
    modalInventorySlotsDisplay.textContent = `${inventory.length}/${MAX_INVENTORY_SLOTS}`;
    inventoryList.innerHTML = '';
    if (inventory.length === 0) {
        inventoryList.innerHTML = "<p class='empty-stash-message'>Your stash is lookin' sadder than a clown at a tax audit, Rikk. Bone dry.</p>";
    } else {
        inventory.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('inventory-item-card');
            const itemNameEl = document.createElement('h4');
            itemNameEl.textContent = `${item.name} (${item.quality})`;
            itemDiv.appendChild(itemNameEl);
            const itemDetails = document.createElement('p');
            itemDetails.classList.add('item-detail');

            const activeCustomerData = currentCustomer ? currentCustomer.data : null;
            const effectiveBuyPrice = calculateItemEffectiveValue(item, true, activeCustomerData);
            const effectiveSellPrice = calculateItemEffectiveValue(item, false, activeCustomerData);
            itemDetails.innerHTML = `Copped: $${item.purchasePrice} <br>Street (Buy/Sell): $${effectiveBuyPrice} / $${effectiveSellPrice} <br>Heat: +${item.itemTypeObj.heat} | Type: ${item.itemTypeObj.type.slice(0,3)}/${item.itemTypeObj.subType ? item.itemTypeObj.subType.slice(0,4) : 'N/A'}`;
            if(item.uses) itemDetails.innerHTML += `<br>Uses: ${item.uses}`;
            if(item.itemTypeObj.effects) itemDetails.innerHTML += `<br><span class="item-effects">Effects: ${item.itemTypeObj.effects.join(', ').substring(0,20)}...</span>`;

            itemDiv.appendChild(itemDetails);
            inventoryList.appendChild(itemDiv);
        });
    }
}

function openInventoryModal() {
    updateInventoryDisplay(); // Ensure it's up-to-date when opened
    inventoryModal.classList.add('active');
    rikkPhoneDisplay.classList.remove('active');
    rikkPhoneDisplay.classList.add('hidden');
}
function closeInventoryModal() {
    inventoryModal.classList.remove('active');
    if (currentCustomer) { // Only show phone if an interaction is active
        rikkPhoneDisplay.classList.remove('hidden');
        rikkPhoneDisplay.classList.add('active');
    }
}
function clearChat() { chatContainer.innerHTML = ''; }
function clearChoices() { choicesArea.innerHTML = ''; }
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.warn("Audio play failed:", e.name, e.message));
    }
}

function saveGameState() {
    if (!gameActive && fiendsLeft > 0) return; // Don't save if game not active unless it's end of game
    const stateToSave = {
        cash, fiendsLeft, heat, streetCred, inventory,
        playerSkills, activeWorldEvents, dayOfWeek,
        customersPool, nextCustomerId
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        console.log("Game state saved.");
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
            console.log("Game state loaded.");
            return true;
        } catch (e) {
            console.error("Error parsing saved game state:", e);
            clearSavedGameState();
            return false;
        }
    }
    return false;
}
function clearSavedGameState() {
    localStorage.removeItem(SAVE_KEY);
    console.log("Saved game state cleared.");
}
function checkForSavedGame() {
    if (localStorage.getItem(SAVE_KEY)) {
        continueGameBtn.classList.remove('hidden');
    } else {
        continueGameBtn.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', initGame);