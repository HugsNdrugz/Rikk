// data_customers.js

const customerArchetypes = {
    DESPERATE_FIEND: {
        key: "DESPERATE_FIEND",
        baseName: "Jittery Jerry", // More specific, less generic
        // Enhanced greeting: More visceral, immediate, reflects withdrawal, mood, and dark humor.
        greeting: (customer, item) => {
            let g = "";
            const itemName = item ? item.name.split("'")[1] || item.name.split(" ")[1] || "the good stuff" : 'something to quiet the demons';
            if (customer.mood === "paranoid") {
                g += `(Eyes wide, whispering, twitching) Rikk? Rikk, man, you gotta help me! **The shadows are whispering my PIN number!** I need that ${itemName} **before the squirrels start judging my life choices.** How much? And tell me that pigeon isn't a cop! **It's wearing a tiny earpiece, I swear!**`;
            } else if (customer.mood === "happy") { // Manic high, temporary bliss
                g += `(Grinning ear-to-ear, slightly too loud) RIKK! My savior! You're like a guardian angel, but with better connections! **Last batch had me convinced I could talk to cats! Turns out, they're terrible conversationalists.** Got more of that magic ${itemName}? Price is just a number when you're floating! **My rent can wait, my sanity can't!**`;
            } else { // Default desperate, more descriptive
                g += customer.hasMetRikkBefore ? `Rikk! Thank god! It's me, ${customer.name}! **My soul is trying to escape through my eyeballs.** ` : `Yo, uh, you Rikk? **They said you were the shaman of the streets.** `;
                g += `I'm hurtin' bad, need that ${itemName}... How much you asking? Don't **play hard to get, Rikk, my nerves are doing the Macarena.**`;
                if(customer.mood === "angry") g += " And don't try no funny business this time, **I'm one bad vibe away from starting a interpretive dance riot!**";
            }
            return g;
        },
        buyPreference: (item) => item.itemTypeObj.type === "DRUG" && item.qualityIndex <= 1, // Will take stepped on or decent
        sellPreference: (item) => item.itemTypeObj.type === "STOLEN_GOOD" && item.qualityIndex === 0 && Math.random() < 0.7, // More likely to sell really rough stuff
        priceToleranceFactor: 0.5, // Even less tolerant
        negotiationResists: true,
        heatImpact: 0, // Less direct heat, more sad than threatening
        credImpactSell: 0, // Selling to them is just business, no real cred gain/loss
        credImpactBuy: -2, // Buying their often shoddy stuff loses cred
        initialMood: "desperate",
        preferredDrugSubTypes: ["OPIATE", "STIMULANT", "SYNTHETIC_CANNABINOID"], // Likes the cheap, hard stuff
        dialogueVariations: {
            lowCashRikk: (mood) => {
                if (mood === "paranoid") return "(Eyes darting) No cash?! Rikk, **the static on the TV is calling me names!** You gotta find some, man, **before I try to pay with my collection of bottle caps!**";
                if (mood === "happy") return "Aww, Rikk, you party pooper! **I was about to teach you the secret handshake of the enlightened!** Go shake down your couch cushions, I'll wait... and maybe try to levitate.";
                return "**You broke, Rikk? Seriously?** My dealer being broke is like my therapist needing therapy. **Unsettling, man.** I'm **about to start seeing sound waves.**";
            },
            rikkDeclinesToBuy: (mood) => {
                if (mood === "paranoid") return "(Gasping) You don't want this priceless artifact?! **Is it bugged?! Did *they* tell you not to take it?!** Just take it, **before the gnomes in my cereal box stage an intervention!**";
                if (mood === "happy") return "No dice, huh? Well, more for me! **Or, you know, for the pawn shop. Gotta fund my dream of competitive napping.**";
                return "What, Rikk? This is vintage! **Okay, maybe not vintage, but it's definitely... something.** My **guts are playing the blues, man!**";
            },
            rikkDeclinesToSell: (mood) => {
                if (mood === "paranoid") return "(Voice cracking) You holdin' out?! **Are you working with the squirrels?! They're organized, Rikk, they have a tiny general!** Don't do this to me, **my brain feels like a shaken snow globe!**";
                if (mood === "happy") return "Aww, man! You're harshing my mellow! **I was just about to achieve nirvana, or at least find my other sock.** Well, back to reality, I guess. It bites.";
                return "**Come on, Rikk! You holding out is like a doughnut shop running out of glaze!** It's just... wrong. **My spirit animal is a deflated bouncy castle right now.**";
            },
            rikkBuysSuccess: (mood) => {
                if (mood === "paranoid") return "(Snatches cash, looking around wildly) Good. Thanks. **Gotta go. The pigeons are deploying their drones.** Don't follow me, **and if you see a man in a trench coat made of squirrels, run!**";
                if (mood === "happy") return "Sweet cash! You're a legend, Rikk! **Now I can afford that luxury ramen I've been eyeing! Or maybe just more... *this*. Decisions, decisions!**";
                return "Preciate it, Rikk. You a real one. **Gotta go chase that dragon... or maybe just a really good taco.**";
            },
            rikkSellsSuccess: (mood) => {
                if (mood === "paranoid") return "(Grabs item, hides it immediately) Yeah, that's the ticket. Good lookin'. **Now, if you'll excuse me, I think the mailman is trying to read my thoughts. Gotta wear my tinfoil beanie.**";
                if (mood === "happy") return "YES! That's the ambrosia! **My brain cells are throwing a party and you're invited, Rikk! Figuratively, of course. Unless you have snacks.**";
                return "Yeah, that's the good stuff. **Phew... my soul just sighed in relief.**"
            }
        },
        postDealEffect: (success, customerState) => {
            if (success && Math.random() < 0.15 && customerState.mood !== "happy") { // 15% chance of OD if not already happy (i.e., on a good trip)
                 displaySystemMessage(`${customerState.name} stumbles away looking REALLY rough... Hope they're okay. Or not your problem. (+3 Heat for potential public incident)`);
                 heat += 3;
                 updateHUD();
            }
        },
    },
    HIGH_ROLLER: {
        key: "HIGH_ROLLER",
        baseName: "Baron Von Blaze", // More ostentatious name
        greeting: (customer, item) => {
            let g = "";
            const productType = item ? item.itemTypeObj.subType || item.itemTypeObj.type : 'exquisite diversions';
            if (customer.mood === "paranoid") { // Paranoid about status, leaks, or being duped
                g += `(Voice low, impeccably dressed but eyes scanning) Rikk. A word. **Is this establishment... secure? One hears whispers.** I require absolute discretion for my acquisition of ${productType}. **A blemish on my reputation is more costly than any bauble you might possess. And my tailor is very judgemental.**`;
            } else if (customer.mood === "happy") { // Smug, pleased with life and themselves
                g += `(A charming, yet slightly condescending smile) Ah, Rikk, my purveyor of peccadilloes! I trust your offerings today are as refined as my taste in... well, everything. **Life's too short for cheap thrills, or cheap people, for that matter.** What delicacy do you have for my discerning palate regarding ${productType}? **I hope it pairs well with my vintage Bordeaux and impending world domination.**`;
            } else { // Default confident, demanding
                g += customer.hasMetRikkBefore ? `Rikk. The usual standards, if you please. ` : `I am given to understand you are the Rikk of renown? One hopes the rumors of quality are not... exaggerated. `;
                g += `I am in the market for the most... *efficacious* ${productType} available. **Time is a luxury I do not squander on subpar experiences.**`;
                if (typeof streetCred !== 'undefined' && streetCred < 15 && !customer.hasMetRikkBefore) g += " ...Assuming your operation meets my... *expectations*. **I have little patience for amateurs.**";
            }
            return g;
        },
        buyPreference: (item) => (item.itemTypeObj.type === "DRUG" && item.qualityIndex === 2) || (item.itemTypeObj.type === "STOLEN_GOOD" && item.qualityIndex >= 1 && item.baseValue > 100), // Top tier drugs, or good quality expensive stolen goods
        sellPreference: (item) => (item.itemTypeObj.type === "INFORMATION" && item.qualityIndex === 2) || (item.itemTypeObj.id === "questionable_jewelry" && item.qualityIndex ===2), // Sells only top tier intel or pristine "questionable" valuables
        priceToleranceFactor: 1.8, // Even more willing to pay for quality/discretion
        negotiationResists: true, // Doesn't haggle over price if quality is there, but will walk if price is insulting for perceived value.
        heatImpact: 4, // High profile client
        credImpactSell: 4, // Selling to them is big cred
        credImpactBuy: 3, // Buying their top-tier stuff is also good cred
        initialMood: "arrogant", // New mood
        preferredDrugSubTypes: ["PSYCHEDELIC", "NOOTROPIC", "METHAMPHETAMINE"], // For focus, "enhancement", or intense experiences
        dialogueVariations: {
            itemNotGoodEnough: (mood) => {
                if (mood === "paranoid") return "(Scoffs quietly, pushes item back delicately) This is... pedestrian, Rikk. **And potentially compromised. Are you attempting to insult my intelligence, or worse, my security?**";
                if (mood === "happy") return "My dear Rikk, while I appreciate the effort, this simply won't do. **It lacks... panache. The je ne sais quoi of true illicit luxury.** I was anticipating something to inspire, not merely... exist. **My dog has toys of higher quality.**";
                return "This is... unacceptable, Rikk. **I deal in excellence, not adequacy. Do you have something that doesn't scream 'bargain bin'?**";
            },
            rikkPriceTooHigh: (mood) => { // They don't haggle, they state their perceived value.
                if (mood === "paranoid") return "(Raises an eyebrow) An ambitious valuation, Rikk. **Particularly for an item of... uncertain provenance. One hopes this price doesn't include a surcharge for unwanted attention.** My offer stands at X (calculated based on their tolerance and perceived value).";
                if (mood === "happy") return "Charming, Rikk. But let us be realistic. While I appreciate a spirited attempt, my appraisers would value this at approximately Y. **I'm generous, not a simpleton. Though, some of my acquaintances are, and it's quite profitable.**";
                return "Rikk, please. That price is... theatrical. **I am prepared to offer a fair sum for genuine quality, not subsidize your aspirations.** My figure is Z.";
            },
            rikkBuysSuccess: (mood) => {
                if (mood === "paranoid") return "(Secures item, a curt nod) Prudent. **Ensure all traces of this transaction are... vaporized. I trust your discretion is as valuable as your wares.**";
                if (mood === "happy") return "Excellent. A worthy acquisition. **Your network is... surprisingly effective for this locale. One might almost consider it a legitimate enterprise. Almost.**";
                return "Satisfactory. **Your service is noted, Rikk. Continue to provide this level of quality, and our association will be mutually beneficial.**";
            },
            rikkSellsSuccess: (mood) => {
                if (mood === "paranoid") return "(Accepts item with a discerning glance) Acceptable. **See to it that our... interaction remains unrecorded. By any entity.**";
                if (mood === "happy") return "Marvelous! This will pair exquisitely with my evening's... *endeavors*. **You have a talent, Rikk. A raw, unpolished, slightly illegal talent. Cultivate it.**";
                return "Indeed. This meets the standard. **Until our next transaction, Rikk. Maintain the quality.**";
            }
        },
        postDealEffect: (success, customerState) => {
            if (success && Math.random() < 0.1) {
                const tip = Math.floor(cash * 0.05); // 5% tip if they are very pleased
                cash += tip;
                streetCred +=1;
                displaySystemMessage(`${customerState.name} was exceptionally pleased and tipped you $${tip}! (+1 Cred)`);
                updateHUD();
            }
        },
    },
    REGULAR_JOE: {
        key: "REGULAR_JOE",
        baseName: "Chill Chad", // Friendlier, more laid-back
        loyalty: 0, // Default loyalty
        maxLoyalty: 5, // Max loyalty level
        greeting: (customer, item) => {
            let g = "";
            if (customer.loyalty === customer.maxLoyalty && customerArchetypes.REGULAR_JOE.dialogueVariations.loyalGreeting) {
                return customerArchetypes.REGULAR_JOE.dialogueVariations.loyalGreeting(customer.mood);
            }
            const itemName = item ? item.name.split("'")[1] || item.name.split(" ")[1] || "the usual vibe" : 'something to unwind with';
            if (customer.mood === "paranoid") {
                g += `(Lowering voice, glancing around) Yo Rikk, quick word. **Feel like the squirrels are judging me today, man. And that one dude is definitely not just 'walking his dog'.** Just need my usual ${itemName}, nothing too wild. Let's keep it low-pro, yeah? **My grandma thinks I'm a youth pastor.**`;
            } else if (customer.mood === "happy") {
                g += `(Big smile, relaxed posture) Rikk, my dude! What's good? **Sun's shining, birds are singing, and I haven't lost my keys yet today – it's a miracle!** Got that smooth ${itemName} for a fair price? **Trying to ride this good wave all the way to... well, probably just my couch, but a happy couch!**`;
            } else { // Default neutral, friendly
                g += customer.hasMetRikkBefore ? `Yo Rikk, it's ${customer.name}! Good to see ya. ` : `Hey, you Rikk? Heard good things. `;
                g += `Just looking for a **chill hookup** for some ${itemName}. **No drama, just good vibes and a fair shake, you know?**`;
            }
            return g;
        },
        buyPreference: (item) => item.qualityIndex === 1 && item.itemTypeObj.type !== "METHAMPHETAMINE" && item.itemTypeObj.subType !== "SYNTHETIC_CANNABINOID", // Decent quality, nothing too hardcore
        sellPreference: (item) => item.qualityIndex <= 1 && item.itemTypeObj.type === "STOLEN_GOOD" && item.baseValue < 100, // Sells average, less valuable stolen goods
        priceToleranceFactor: 0.9, // Wants a fair deal, not a steal for Rikk
        negotiationResists: false,
        heatImpact: 1,
        credImpactSell: 1,
        credImpactBuy: 0, // Buying their average stuff is neutral
        initialMood: "chill", // New mood
        preferredDrugSubTypes: ["CANNABINOID", "PARTY", "PSYCHEDELIC_MILD"], // Likes weed, party stuff, maybe light psychs
        dialogueVariations: {
            loyaltyIncrease: "Good looking out, Rikk. You always treat me right.",
            loyalGreeting: (mood) => { // Changed to a function to allow mood variations if desired later
                // For now, a simple greeting, but could be expanded with mood
                return "Rikk, my main man! Good to see you again!";
            },
            loyalOfferBetterPrice: (mood, itemType) => { // itemType could be "buy" or "sell" // mood is available if needed
                if (itemType === "buy") { // This case is when Rikk is buying from Chad, Chad offers more money / Rikk pays less
                    return "Since it's you, Rikk, I'll take $5 less for it."; // Chad reduces his asking price
                }
                // This case is when Rikk is selling to Chad, Chad offers to pay more
                return "For you, Rikk, how about I throw in an extra $5 on this?"; // Chad offers more money
            },
            loyalBringFriend: "My boy's looking for a hookup too. Told him you're the guy. He might swing by.",
            // Social Negotiation Dialogues for REGULAR_JOE
            negotiationIntimidateSuccess: (mood) => "(Eyes wide) Whoa, okay, Rikk, chill! Your price is fine, man, fine!",
            negotiationIntimidateFailAnger: (mood) => "Trying to strong-arm me, Rikk? Not cool. You know what? Forget this deal. I'm out.",
            negotiationIntimidateFailStandFirm: (mood) => "Nah, Rikk, that ain't gonna work. My offer of X still stands if you want it, otherwise I'm good.",
            negotiationCharmSuccess: (mood) => "Alright, Rikk, you smooth talker. For you, at that price? Deal.",
            negotiationCharmFail: (mood) => "Heh, nice try, Rikk. Flattery won't change the numbers though. My original offer of X is still on the table if you're interested.",
            // End Social Negotiation Dialogues
            negotiationSuccess: (mood) => {
                if (mood === "paranoid") return "Aight, cool, cool. **But let's wrap this up, man, my aura feels... exposed. And I think that car alarm is Morse code for 'bust'.**";
                }
            },
            negotiationFail: (mood) => {
                if (mood === "paranoid") return "Nah, man, that's a bit steep. **And honestly, this whole block is giving me the heebie-jeebies right now. Think I saw a cop hiding in a trash can.**";
                if (mood === "happy") return "Sweet! That's what I'm talking about! **You're a legend, Rikk! High five! Or, like, an air five, if you're not into the whole 'touching' thing.**";
                return "Yeah, that's solid. **Good looking out.**";
            },
            negotiationFail: (mood) => {
                if (mood === "paranoid") return "Nah, man, that's a bit steep. **And honestly, this whole block is giving me the heebie-jeebies right now. Think I saw a cop hiding in a trash can.**";
                if (mood === "happy") return "Whoa there, Rikk, easy on the wallet! **My bank account is already giving me the silent treatment. Maybe next time when I win the lottery, or, you know, find a twenty.**";
                return "Ah, that's a little rich for my blood, Rikk. **Gotta watch the budget, you know? Adulting and all that jazz.**";
            },
            rikkBuysSuccess: (mood) => {
                if (mood === "paranoid") return "Nice, needed that. Thanks. **Gotta dip, man. Pretty sure that mailman knows my browser history.**";
                if (mood === "happy") return "Awesome, thanks Rikk! **This'll fund my epic quest for the perfect burrito! Or, like, pay a bill. Probably the bill. Sigh.**";
                return "Cool, appreciate it. **Keeps the dream alive, or at least the Wi-Fi on.**";
            },
            rikkSellsSuccess: (mood) => {
                if (mood === "paranoid") return "Sweet. Got it. **Later, Rikk. And if anyone asks, we were discussing... sustainable gardening.**";
                if (mood === "happy") return "Right on! This is gonna be a good one. **Time to go ponder the mysteries of the universe, or just what's for dinner. Big questions, man.**";
                return "Nice one, Rikk. **Just what the doctor didn't order, but what my soul needed.**";
            }
        },
        postDealEffect: null,
    },
    INFORMANT: {
        key: "INFORMANT",
        baseName: "Whiskey Whisper", // More evocative
        greeting: (customer) => {
            let g = "";
            if (customer.mood === "paranoid") {
                g += `(Hushed, jumpy, clutching a worn notepad) Rikk, keep your voice down! **They're listening, man, the walls have ears, and the rats are wearing wires!** I got intel, grade-A, but this drop needs to be ghost. **My contact lens just transmitted a warning.**`;
            } else if (customer.mood === "happy") { // Happy means they have juicy, valuable info
                g += `(A sly, self-satisfied grin) Rikk, my friend! You've caught me on a banner day. **The streets are singing to me, and their song is pure profit.** I've got a symphony of secrets that'll make your ears tingle and your wallet bulge. **This ain't just intel, it's a golden ticket.**`;
            } else { // Default suspicious, transactional
                g += customer.hasMetRikkBefore ? "Rikk. Got a fresh whisper for ya. **Hot off the griddle.** " : "You Rikk? Heard you trade in... *information*. **I got some prime cuts.** ";
                g += `This stuff ain't free, you know. **Knowledge is power, and power's got a price tag.**`;
            }
            return g;
        },
        sellsOnly: true,
        itemPool: ["info_cops", "info_rival", "burner_phone", "info_sting_op"], // Added sting op info
        priceToleranceFactor: 1.3, // Info is valuable
        heatImpact: -1, // Good info can reduce Rikk's heat
        credImpactBuy: 4, // Buying truly good intel is very valuable
        initialMood: "cautious", // New mood
        dialogueVariations: { // Renamed from dialogueVariatesions
            rikkCannotAfford: (mood) => {
                if (mood === "paranoid") return "No dough, no show, Rikk! **And every second we stand here, the surveillance camera across the street zooms in a little more!** Get the green or I'm smoke!";
                if (mood === "happy") return "Come now, Rikk, don't be thrifty with destiny! **This information is champagne, and you're offering beer money. My sources have standards, you know.**";
                return "This ain't a charity, Rikk. **My whispers have value. You want the dirt, you gotta pay for the shovel.**";
            },
            rikkBuysSuccess: (mood) => {
                if (mood === "paranoid") return "(Slips info quickly, eyes darting) Use it, don't lose it. **And burn this conversation from your memory. And maybe your clothes.** They know things, Rikk. **They know what you had for breakfast.**";
                if (mood === "happy") return "There you go. Pure gold. **Handle it with care, Rikk. Some secrets have teeth.** Pleasure doing business. **Now, if you'll excuse me, I have more... listening to do.**";
                return "Solid. **Use that wisely, it could save your hide. Or make you a mint.** Keep my number.";
            }
        },
        postDealEffect: null,
    },
    SNITCH: {
        key: "SNITCH",
        baseName: "Concerned Carol", // More characterful
        greeting: (customer, item) => {
            let g = "";
            const itemName = item ? item.name.split("'")[1] || item.name.split(" ")[1] || "that... item" : "anything... noteworthy";
            if (customer.mood === "paranoid") { // Paranoid about being discovered as a snitch or getting in trouble
                g += `(Forced, shaky smile, clutching a "Neighborhood Watch" pamphlet) Oh, Rikk! Fancy meeting you here! **Just... patrolling. For safety!** ${item ? `Is that... ${itemName}? My, that's an... *unusual* brand. **Not illegal, I hope? Officer Friendly was just asking about unusual brands...**` : "Anything... *unusual* happening today, Rikk? **Just trying to keep our community... pristine! So many shadows these days!**"}`;
            } else if (customer.mood === "happy") { // Gleeful at the prospect of gathering info
                g += `(Beaming, perhaps a little too eagerly) Rikk! Hello there! **Just taking in the vibrant tapestry of our neighborhood! So much... activity!** ${item ? `Oh, is that some ${itemName}? How... *intriguing*! **Always interested in local commerce, you know! For the community newsletter!**` : "What's the good word, Rikk? **Any juicy tidbits for a concerned citizen? Knowledge is power, especially for neighborhood safety!**"}`;
            } else { // Default "overly friendly" and probing
                g += `Well hello there, Rikk! **Such a... *dynamic* street, isn't it?** ${item ? `My, my, what have we here? Some ${itemName}? **You always have the most... *unique* things. Tell me all about it! For... research, of course!**` : "Anything exciting happening in your world, Rikk? **I just love hearing about what the young entrepreneurs are up to!**"}`;
            }
            return g;
        },
        buyPreference: (item) => true, // Will "buy" anything to gather evidence/info
        sellPreference: (item) => false, // Never sells
        priceToleranceFactor: 0.8, // Doesn't care about price, might feign wanting a deal
        negotiationResists: true,
        heatImpact: 2, // Their presence alone is a bit hot
        credImpactSell: -3, // Selling to a known snitch is bad for cred
        credImpactBuy: 0,
        initialMood: "nosy", // New mood
        dialogueVariations: {
            rikkSellsSuccess: (mood) => {
                if (mood === "paranoid") return "Oh, lovely. Thank you, Rikk. **This will be... cataloged. For... posterity. Yes.** Now, I really must be going, **I think my petunias need me. And they have excellent hearing.**";
                if (mood === "happy") return "Splendid! Thank you, Rikk! **This is just perfect for my... collection. You're such a vital part of the... local color! The police will be so interested... I mean, the historical society!**";
                return "Oh, that's... *noted*. Thanks, Rikk. **Very... informative.**";
            },
            rikkDeclinesToSell: (mood) => {
                if (mood === "paranoid") return "Oh, a pity. No matter. **Just... making conversation. One has to be vigilant, you know. So many... *variables* in this neighborhood.**";
                if (mood === "happy") return "Oh, that's quite alright, Rikk! **Just curious, you know me! Always eager to learn! Perhaps another time. I'll just make a little note... for myself, of course!**";
                return "Oh, really? Well, alright then. **Just trying to be friendly! One never knows what interesting things are about!**";
            }
        },
        postDealEffect: (success, customerState) => {
            // Increased chance to snitch, and snitching can be more impactful
            if (success && Math.random() < 0.65) {
                const snitchHeat = Math.floor(Math.random() * 15) + 10; // 10-24 heat
                if (typeof heat !== 'undefined' && typeof displaySystemMessage !== 'undefined' && typeof updateHUD !== 'undefined') {
                    heat += snitchHeat;
                    streetCred -=2; // Snitching directly impacts Rikk's cred now
                    displaySystemMessage(`🚨 RAT ALERT! 🚨 **${customerState.name}** was seen yapping to the 5-0! (+${snitchHeat} Heat, -2 Cred)`);
                    updateHUD();
                } else {
                    console.warn("SNITCH postDealEffect: Could not access global 'heat' or UI functions.");
                }
            } else if (success) {
                 displaySystemMessage(`You feel **${customerState.name}'s** beady eyes on you as they leave...`);
            }
        }
    },
    COMPETITOR_SCOUT: {
        key: "COMPETITOR_SCOUT",
        baseName: "Observant Oscar",
        greeting: (customer, item) => { // item is not used but part of signature
            return "(Eyes scanning everything) So, you're the Rikk everyone's whispering about. My employers are... curious about the new talent on their turf. What's your angle?";
        },
        buyPreference: () => false, // Does not buy
        sellPreference: () => false, // Does not sell
        priceToleranceFactor: 1.0, // Not applicable but set to neutral
        negotiationResists: true, // Not applicable
        heatImpact: 1, // Base heat for the encounter
        credImpactSell: 0, // Not applicable
        credImpactBuy: 0, // Not applicable
        initialMood: "probing",
        dialogueVariations: {
            rikkDeclinesToShare: "Stone wall, huh? Bold. My employers value... cooperation. This lack of it will be noted.",
            rikkSharesVague: "Keeping it close to the vest. Understandable. But vague answers don't make strong impressions.",
            rikkSharesFalseInfo: "Is that so? Interesting. We have our ways of verifying things, you know.",
            rikkSharesTrueInfo: "Direct. I can appreciate that. My employers will find this information... useful.",
            askForInfoContinuation: "So, what kind of... merchandise are you specializing in? And how's business?"
        },
        postDealEffect: null, // No standard post-deal effect
    },
};