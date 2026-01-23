// Initialize jsPsych
const jsPsych = initJsPsych({

  on_finish: function() {
    jsPsych.data.displayData(); // for debugging; you can remove later
  }
});

// make a simple participant id (or pull from URL)
var subject_id = jsPsych.randomization.randomID(4);
// or: var subject_id = jsPsych.data.getURLVariable('id') || jsPsych.randomization.randomID(8);

jsPsych.data.addProperties({
  subject_id: subject_id
});

// ---------------------
// 1. PRELOAD IMAGES
// ---------------------
const preload = {
  type: jsPsychPreload,
  images: [
    'images/background.png'  // <-- change this if your filename is different
  ]
};


// Global styles for gumballs (run once)
const gumballStyle = document.createElement("style");
gumballStyle.id = "gumball-style";
gumballStyle.innerHTML = `
  .gumball {
    position: absolute;
    border-radius: 50%;
    width: 10%;              /* diameter ≈ 12% of the globe container */
    aspect-ratio: 1 / 1;
    transform: translate(-50%, -50%);  /* make top/left be the center */
  }
  .gumball.green { background-color: #e53935; }
  .gumball.blue  { background-color: #1e40ff; }
`;
document.head.appendChild(gumballStyle);



//--------------------------------------------------
// Helper: generate gumballs HTML
//--------------------------------------------------

function makeGumballsHTML(numGreen, numBlue) {
  let html = [];
  const balls = [];

  // --- TUNING KNOBS ---
  const BALL_RADIUS = 5;          // visual radius in %, since width = 12%
  const EDGE_MARGIN = 4;          // how far inside the circle edge balls must stay (in %)
  const MIN_DIST_FACTOR = 1.2;    // 1.0 = just touching, >1 = more separation
  // ---------------------

  const CIRCLE_CENTER = { x: 50, y: 50 };           // center of container
  const CIRCLE_RADIUS = 50 - EDGE_MARGIN - BALL_RADIUS;  
  const MIN_CENTER_DIST = 2 * BALL_RADIUS * MIN_DIST_FACTOR;

  function sampleNonOverlappingPosition() {
    let attempts = 0;

    while (attempts < 200) {
      // sample in square, then reject if outside circle
      const x = BALL_RADIUS + Math.random() * (100 - 2 * BALL_RADIUS);
      const y = BALL_RADIUS + Math.random() * (100 - 2 * BALL_RADIUS);

      // distance from circle center
      const dx0 = x - CIRCLE_CENTER.x;
      const dy0 = y - CIRCLE_CENTER.y;
      const distFromCenter = Math.sqrt(dx0 * dx0 + dy0 * dy0);

      // too close to edge? reject
      if (distFromCenter > CIRCLE_RADIUS) {
        attempts++;
        continue;
      }

      // check overlaps with existing balls
      let ok = true;
      for (const b of balls) {
        const dx = x - b.x;
        const dy = y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MIN_CENTER_DIST) {
          ok = false;
          break;
        }
      }

      if (ok) {
        return { x, y };
      }

      attempts++;
    }

    // Fallback if it's very crowded: just put it near center
    return { x: 50, y: 50 };
  }

  function addBalls(n, cls) {
    for (let i = 0; i < n; i++) {
      const pos = sampleNonOverlappingPosition();
      balls.push(pos);
      html.push(`
        <div class="gumball ${cls}"
             style="top:${pos.y}%; left:${pos.x}%;"></div>
      `);
    }
  }

  addBalls(numGreen, "green");
  addBalls(numBlue, "blue");

  return html.join("");
}

// --------------------------------------------------
// Animate gumballs inside the circular globe
// --------------------------------------------------
function startGumballAnimation(globeSelector = '#gumball-globe') {
  const globe = document.querySelector(globeSelector);
  if (!globe) return;

  const balls = Array.from(globe.querySelectorAll('.gumball'));
  if (balls.length === 0) return;

  // These should match your layout logic
  const BALL_RADIUS = 5;   // in % (same as in makeGumballsHTML)
  const EDGE_MARGIN = 4;
  const CENTER_X = 50;
  const CENTER_Y = 50;
  const CIRCLE_RADIUS = 50 - EDGE_MARGIN - BALL_RADIUS;

  const SPEED = 0.18;  // tweak for faster/slower movement (percent per frame)

  const state = balls.map(el => {
    const x = parseFloat(el.style.left) || 50;
    const y = parseFloat(el.style.top)  || 50;
    const angle = Math.random() * 2 * Math.PI;
    const vx = SPEED * Math.cos(angle);
    const vy = SPEED * Math.sin(angle);
    return { el, x, y, vx, vy };
  });

  function step() {
    state.forEach(b => {
      // Move
      b.x += b.vx;
      b.y += b.vy;

      // Distance from center
      let dx = b.x - CENTER_X;
      let dy = b.y - CENTER_Y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      const maxDist = CIRCLE_RADIUS;

      // If outside the circle, bounce
      if (dist > maxDist) {
        // normal vector at collision point
        const nx = dx / dist;
        const ny = dy / dist;

        // reflect velocity: v' = v - 2 (v·n) n
        const dot = b.vx * nx + b.vy * ny;
        b.vx = b.vx - 2 * dot * nx;
        b.vy = b.vy - 2 * dot * ny;

        // pull it back just inside the circle
        const overshoot = dist - maxDist;
        b.x -= nx * overshoot;
        b.y -= ny * overshoot;
      }

      b.el.style.left = b.x + '%';
      b.el.style.top  = b.y + '%';
    });

    globe._gumballAnimationFrame = requestAnimationFrame(step);
  }

  // Start loop
  step();
}

function stopGumballAnimation(globeSelector = '#gumball-globe') {
  const globe = document.querySelector(globeSelector);
  if (!globe) return;
  if (globe._gumballAnimationFrame) {
    cancelAnimationFrame(globe._gumballAnimationFrame);
    globe._gumballAnimationFrame = null;
  }
}


var gumball_configs_intro = [
    {
      numRed: 0,
      numBlue: 0,
      specialAlien: 0,
      headerText: "Here is a planet in outer space.",
      audio: null  // no audio on this one
    },
        {
      numRed: 0,
      numBlue: 0,
      specialAlien: 0,
      headerText: "These are the aliens who live there.",
      audio: null  // no audio on this one
    },
    {
      numRed: 0,
      numBlue: 0,
      specialAlien: 0,
      headerText: "These aliens love gumballs.",
      audio: null  // no audio on this one
    },
      {
      numRed: 15,
      numBlue: 15,
      specialAlien: 0,
      headerText: "Every day, new gumballs are delivered to their gumball machine.",
      audio: null  // no audio on this one
    },
    {
      numRed: 15,
      numBlue: 15,
      specialAlien: 0,
      headerText: "And the aliens get to take one out and add it to their collection.",
      audio: null  // no audio on this one
    },
      {
      numRed: 15,
      numBlue: 15,
      specialAlien: 1,
      headerText: "One of the aliens goes up to check what is in the machine.",
      audio: null  // no audio on this one
    },
    {
      numRed: 15,
      numBlue: 15,
      specialAlien: 1,
      headerText: "He says whether he thinks the aliens will get a blue gumball that day.",
      audio: null  // no audio on this one
    }
  ]
  
  
  var gumball_configs_intro_2 = [
    {
      numRed: 15,
      numBlue: 15,
      specialAlien: 0,
      headerText: "Let's see what the first one says.",
      audio: null  // no audio on this one
    }
  ]


// speakerNumber: 1, 2, 3...
// gender: "male", "female", or anything else (defaults to "They say")
// threshold: proportion of BLUE at/above which we use "many" instead of "some"
function makeSpeakerGumballConfigs(speakerNumber, gender, threshold, specialAlien) {
  // Base ratios (total = 30 gumballs each)
  const baseRatios = [
    //0% blue 
    { numRed: 30, numBlue: 0,  specialAlien: specialAlien },

    //10% blue 
    { numRed: 27, numBlue: 3,  specialAlien: specialAlien },

    //25% blue 
    { numRed: 23, numBlue: 7,  specialAlien: specialAlien },

    //40% blue
    { numRed: 18, numBlue: 12,  specialAlien: specialAlien },

    //50% blue 
    { numRed: 15, numBlue: 15,  specialAlien: specialAlien },

    //60% blue 
    { numRed: 12, numBlue: 18,  specialAlien: specialAlien },

    //75% blue 
    { numRed: 7, numBlue: 23,  specialAlien: specialAlien },

    //90% blue 
    { numRed: 3, numBlue: 27,  specialAlien: specialAlien },

    //100% blue 
    { numRed: 0, numBlue: 30,  specialAlien: specialAlien }
  ];

  // Pronoun phrase based on gender
  let pronounPhrase;
  if (gender === "female") {
    pronounPhrase = "She says";
  } else if (gender === "male") {
    pronounPhrase = "He says";
  } 

  // Text templates using that pronoun
  const someText = `${pronounPhrase}, "Oooh, some of them are blue."`;
  const manyText = `${pronounPhrase}, "Oooh, many of them are blue."`;

  // Audio paths for this speaker (assuming your existing structure)
  const someAudioPath = `audio/${speakerNumber}/some.mp3`;
  const manyAudioPath = `audio/${speakerNumber}/many.mp3`;

  // Build configs for this speaker
  const configs = baseRatios.map(r => {
    const total = r.numRed + r.numBlue;
    const propBlue = r.numBlue / total;
    const useMany = propBlue >= threshold;

    return {
      numRed: r.numRed,
      numBlue: r.numBlue,
      specialAlien: r.specialAlien,
      headerText: useMany ? manyText : someText,
      audio: useMany ? manyAudioPath : someAudioPath,

      // nice to have in data:
      proportionBlue: propBlue,
      speakerNumber: speakerNumber,
      gender: gender
    };
  });

  var repeated = configs.concat(configs, configs);
  //var repeated = configs;
  // Randomize order before returning
  return jsPsych.randomization.shuffle(repeated);
}


const UTTERANCES = {
  BARE: {
    text: (pronoun="He") => `${pronoun}, "We will get a blue one."`,
    audio: speaker => `audio/${speaker}/bare.mp3`
  },
  MIGHT: {
    text: (pronoun="He") => `${pronoun}, "We might get a blue one."`,
    audio: speaker => `audio/${speaker}/might.mp3`
  },
  PROBABLY: {
    text: (pronoun="He") => `${pronoun}, "We will probably get a blue one."`,
    audio: speaker => `audio/${speaker}/probably.mp3`
  }
};


function makeTrialConfig({
  proportion,        // e.g. 0.6
  total = 30,        // number of gumballs
  target = "blue",   // which color is the target
  utteranceType,     // "BARE", "MIGHT", "PROBABLY"
  speakerNumber,
  pronounPhrase = "He says",
  specialAlien
}) {

  const numTarget = Math.round(total * proportion);
  const numOther  = total - numTarget;

  const isBlueTarget = target === "blue";

  return {
    numBlue: isBlueTarget ? numTarget : numOther,
    numRed:  isBlueTarget ? numOther  : numTarget,
    specialAlien: specialAlien,
    headerText: UTTERANCES[utteranceType].text(pronounPhrase),
    audio: UTTERANCES[utteranceType].audio(speakerNumber),
    utteranceType: utteranceType,
    proportionBlue: isBlueTarget ? (numTarget / total) : (numOther / total),
    speakerNumber,
    targetColor: target
  };
}




function makeConditionConfigs(condition, speakerNumber, target="blue", speakerThreshold=0.60, gender = "male", specialAlien) {

  let trials = [];

    // Pronoun phrase based on gender
  let pronounPhrase;
  if (gender === "female") {
    pronounPhrase = "She says";
  } else if (gender === "male") {
    pronounPhrase = "He says";
  } 

  // --- Determine utterance for the critical trials based on threshold ---
  function criticalUtterance(proportion) {
    if (condition === "confident") {
      return (proportion >= speakerThreshold) ? "PROBABLY" : "MIGHT";
    } else if (condition === "cautious") {
      return (proportion >= speakerThreshold) ? "MIGHT" : "PROBABLY";
    }
  }

  // --- 10 critical trials @ speakerThreshold ---
  for (let i = 0; i < 10; i++) {
    trials.push(makeTrialConfig({
      proportion: speakerThreshold,
      utteranceType: criticalUtterance(speakerThreshold),
      speakerNumber,
      target,
      pronounPhrase,
      specialAlien
    }));
  }

  // --- Fillers are fixed and do NOT use the threshold ---

  // 5 filler @ 100% → BARE
  for (let i = 0; i < 3; i++) {
    trials.push(makeTrialConfig({
      proportion: 1.00,
      utteranceType: "BARE",
      speakerNumber,
      target,
      pronounPhrase,
      specialAlien
    }));
  }

  // Confident: 10 filler @ 25% → MIGHT
  // Cautious: 10 filler @ 90% → PROBABLY
  if (condition === "confident") {
    for (let i = 0; i < 7; i++) {
      trials.push(makeTrialConfig({
        proportion: 0.25,
        utteranceType: "MIGHT",
        speakerNumber,
        target,
        pronounPhrase,
        specialAlien
      }));
    }
  }

  if (condition === "cautious") {
    for (let i = 0; i < 7; i++) {
      trials.push(makeTrialConfig({
        proportion: 0.90,
        utteranceType: "PROBABLY",
        speakerNumber,
        target,
        pronounPhrase,
        specialAlien
      }));
    }
  }

  return jsPsych.randomization.shuffle(trials);
}


//--------------------------------------------------
// Slide: Aliens love gumballs
//--------------------------------------------------

// Factory: given a list of configs, return a gumball block
function makeGumballPages(configList) {
  return {
    timeline: [{
      type: jsPsychHtmlKeyboardResponse,

      data: function() {
          const special = jsPsych.timelineVariable('specialAlien');
          let speakerColor = null;

          if (special >= 1 && special <= 5) {
            speakerColor = 'green';
          } else if (special >= 6 && special <= 10) {
            speakerColor = 'yellow';
          }

          return {
            numRed: jsPsych.timelineVariable('numRed'),
            numBlue: jsPsych.timelineVariable('numBlue'),
            specialAlien: special,
            headerText: jsPsych.timelineVariable('headerText'),
            audio: jsPsych.timelineVariable('audio'),
            speakerNumber: jsPsych.timelineVariable('speakerNumber'),
            gender: jsPsych.timelineVariable('gender'),
            utteranceType: jsPsych.timelineVariable('utteranceType'),
            proportionBlue: jsPsych.timelineVariable('proportionBlue'),
            block_type: 'exposure',
            speakerColor: speakerColor
          };
        },


      stimulus: function() {

        const numRed   = jsPsych.timelineVariable('numRed');   // was numGreen
        const numBlue  = jsPsych.timelineVariable('numBlue');
        const special  = jsPsych.timelineVariable('specialAlien'); // 0..10
        const header   = jsPsych.timelineVariable('headerText');

        const gumballsHTML = makeGumballsHTML(numRed, numBlue);

        // Who is special?
        let specialGreenIdx = null;
        let specialYellowIdx = null;
        if (special >= 1 && special <= 5) {
          specialGreenIdx = special;
        } else if (special >= 6 && special <= 10) {
          specialYellowIdx = special - 5;  // 6–10 -> 1–5
        }

        // LEFT: green aliens (1–5), remove special if needed
        const leftAliensHTML = [1,2,3,4]
          .filter(i => i !== specialGreenIdx)
          .map(i => `
            <img src="images/aliens/alien_green_${i}.png"
                 style="height:20vh; object-fit:contain;">
          `).join("");

        // RIGHT: yellow aliens (1–5), remove special if needed
        const rightAliensHTML = [1,2,3,4]
          .filter(i => i !== specialYellowIdx)
          .map(i => `
            <img src="images/aliens/alien_yellow_${i}.png"
                 style="height:16vh; object-fit:contain;">
          `).join("");

        // Special alien floating above the machine, anchored to the machine container
        let specialAlienHTML = "";
        if (specialGreenIdx) {
          specialAlienHTML = `
            <img src="images/aliens/alien_green_${specialGreenIdx}.png"
                 style="
                   position:absolute;
                   bottom:100%;     /* just above the machine */
                   left:50%;
                   transform:translate(-50%, 35%);
                   height:17vh;
                   object-fit:contain;
                 ">
          `;
        } else if (specialYellowIdx) {
          specialAlienHTML = `
            <img src="images/aliens/alien_yellow_${specialYellowIdx}.png"
                 style="
                   position:absolute;
                   bottom:100%;
                   left:50%;
                   transform:translate(-50%, 35%);
                   height:16vh;
                   object-fit:contain;
                 ">
          `;
        }

        return `
          <div style="
            position:relative;
            width:100vw;
            height:100vh;
            overflow:hidden;
          ">

            <img src="images/background.png"
                 style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">

            <div style="
              position:absolute;
              top:8%;
              width:100%;
              text-align:center;
              font-size:3vw;
              max-font-size:36px;
              color:white;
              text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
              z-index:2;
            ">
              ${header}
            </div>

            <!-- ROW: [left aliens] [machine] [right aliens] using GRID -->
            <div style="
              position:absolute;
              bottom:24%;
              left:50%;
              transform:translateX(-50%);
              width:80vw;
              display:grid;
              grid-template-columns: 1fr auto 1fr;
              align-items:flex-end;
              column-gap:1vw;
              z-index:2;
            ">
              <!-- LEFT GROUP -->
              <div style="
                display:flex;
                justify-content:flex-end;
                align-items:flex-end;
                gap:0.8vw;
              ">
                ${leftAliensHTML}
              </div>

              <!-- MACHINE (CENTER COLUMN, STAYS PUT) -->
              <div style="
                position:relative;
                height:50vh;
                display:flex;
                align-items:flex-end;
                justify-content:center;
              ">
                <img src="images/gumball_machine_empty.png"
                     style="height:100%; object-fit:contain; display:block;">

                <!-- White circular globe -->
                <div id="gumball-globe" style="
                  position:absolute;
                  top:13%;
                  left:18%;
                  width:64%;
                  height:41%;
                  background:white;
                  border-radius:50%;
                  overflow:hidden;
                  z-index:10;
                ">
                  ${gumballsHTML}
                </div>

                <!-- Special alien ABOVE the machine, does NOT affect layout -->
                ${specialAlienHTML}
              </div>

              <!-- RIGHT GROUP -->
              <div style="
                display:flex;
                justify-content:flex-start;
                align-items:flex-end;
                gap:0.8vw;
              ">
                ${rightAliensHTML}
              </div>
            </div>

            <!-- NEXT BUTTON -->
            <div style="
              position:absolute;
              bottom:5%;
              width:100%;
              display:flex;
              justify-content:center;
              z-index:5;
            ">
              <button id="nextButton"
                      style="font-size:30px; padding:12px 28px; border-radius:14px; cursor:pointer;">
                Next ➡
              </button>
            </div>
          </div>
        `;
      },
      choices: "NO_KEYS",

    on_load: function() {
  const nextBtn   = document.getElementById("nextButton");
  const audioFile = jsPsych.timelineVariable('audio');

  function enableNextButton() {
    nextBtn.disabled = false;
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.opacity = '1';
  }

  function disableNextButton() {
    nextBtn.disabled = true;
    nextBtn.style.cursor = 'not-allowed';
    nextBtn.style.opacity = '0.5';
  }

  nextBtn.onclick = () => {
    if (nextBtn.disabled) return;
    jsPsych.finishTrial();
  };

  // Start with button disabled
  // Uncomment this for real thing
  disableNextButton();

  if (audioFile) {
    window.currentExposureAudio = new Audio(audioFile);

    window.currentExposureAudio.addEventListener('ended', () => {
      enableNextButton();
    });

    window.currentExposureAudio.play()
      .then(() => {})
      .catch(e => {
        console.warn("Audio play blocked or failed:", e);
        enableNextButton();
      });

  } else {
    enableNextButton();
  }

  // Start gumball animation here
  startGumballAnimation('#gumball-globe');
},
on_finish: function() {
  if (window.currentExposureAudio) {
    window.currentExposureAudio.pause();
    window.currentExposureAudio = null;
  }
  // Stop animation when leaving the trial
  stopGumballAnimation('#gumball-globe');
}
    }],

    // ⬅ the only difference is this line:
    timeline_variables: configList
  };
}


// Factory: given a list of configs, return a prediction block
function makePredictionTrials(configList) {
  return {
    timeline: [{
      type: jsPsychHtmlKeyboardResponse,
      data: function() {
        const special = jsPsych.timelineVariable('specialAlien');
        let speakerColor = null;

        if (special >= 1 && special <= 5) {
          speakerColor = 'green';
        } else if (special >= 6 && special <= 10) {
          speakerColor = 'yellow';
        }

        return {
          numRed: jsPsych.timelineVariable('numRed'),
          numBlue: jsPsych.timelineVariable('numBlue'),
          specialAlien: special,
          headerText: jsPsych.timelineVariable('headerText'),
          speakerNumber: jsPsych.timelineVariable('speakerNumber'),
          gender: jsPsych.timelineVariable('gender'),
          proportionBlue: jsPsych.timelineVariable('proportionBlue'),
          block_type: 'prediction',
          speakerColor: speakerColor    // <--- NEW
        };
      },

      stimulus: function() {

        const numRed   = jsPsych.timelineVariable('numRed');
        const numBlue  = jsPsych.timelineVariable('numBlue');
        const special  = jsPsych.timelineVariable('specialAlien'); // 0..10
        const header   = jsPsych.timelineVariable('headerText');

        const gumballsHTML = makeGumballsHTML(numRed, numBlue);

        // figure out which alien is special (1–5 = green, 6–10 = yellow)
        let specialGreenIdx = null;
        let specialYellowIdx = null;
        if (special >= 1 && special <= 5) {
          specialGreenIdx = special;
        } else if (special >= 6 && special <= 10) {
          specialYellowIdx = special - 5;
        }

        // LEFT: green aliens (1–5), minus special if needed
        const leftAliensHTML = [1,2,3,4]
          .filter(i => i !== specialGreenIdx)
          .map(i => `
            <img src="images/aliens/alien_green_${i}.png"
                 style="height:20vh; object-fit:contain;">
          `).join("");

        // RIGHT: yellow aliens (1–5), minus special if needed
        const rightAliensHTML = [1,2,3,4]
          .filter(i => i !== specialYellowIdx)
          .map(i => `
            <img src="images/aliens/alien_yellow_${i}.png"
                 style="height:17vh; object-fit:contain;">
          `).join("");

        // Special alien above the machine
        let specialAlienHTML = "";
        if (specialGreenIdx) {
          specialAlienHTML = `
            <img src="images/aliens/alien_green_${specialGreenIdx}.png"
                 style="
                   position:absolute;
                   bottom:100%;
                   left:50%;
                   transform:translate(-50%, 40%);
                   height:17vh;
                   object-fit:contain;
                 ">
          `;
        } else if (specialYellowIdx) {
          specialAlienHTML = `
            <img src="images/aliens/alien_yellow_${specialYellowIdx}.png"
                 style="
                   position:absolute;
                   bottom:100%;
                   left:50%;
                   transform:translate(-50%, 40%);
                   height:17vh;
                   object-fit:contain;
                 ">
          `;
        }

        return `
          <div style="
            position:relative;
            width:100vw;
            height:100vh;
            overflow:hidden;
          ">

            <!-- Background -->
            <img src="images/background.png"
                 style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">

           <!-- Header text -->
            <div style="
              position:absolute;
              top:6%;
              width:100%;
              text-align:center;
              font-size:3vw;
              max-font-size:36px;
              color:white;
              z-index:2;
            ">
              ${"What do you think this alien will say about the blue gumballs?"}
            </div>

            <!-- ROW: [left aliens] [machine+special] [right aliens] -->
            <div style="
              position:absolute;
              bottom:30%;
              left:50%;
              transform:translateX(-50%);
              width:80vw;
              display:grid;
              grid-template-columns: 1fr auto 1fr;
              align-items:flex-end;
              column-gap:1vw;
              z-index:2;
            ">

              <!-- LEFT group -->
              <div style="
                display:flex;
                justify-content:flex-end;
                align-items:flex-end;
                gap:0.8vw;
              ">
                ${leftAliensHTML}
              </div>

              <!-- MACHINE (center column) -->
              <div style="
                position:relative;
                bottom: .00001%;
                height:50vh;
                display:flex;
                align-items:flex-end;
                justify-content:center;
              ">
                <img src="images/gumball_machine_empty.png"
                     style="height:100%; object-fit:contain; display:block;">

                <!-- White circular globe with gumballs -->
                <div id="gumball-globe" style="
                  position:absolute;
                  top:13%;
                  left:18%;
                  width:64%;
                  height:41%;
                  background:white;
                  border-radius:50%;
                  overflow:hidden;
                  z-index:10;
                ">
                  ${gumballsHTML}
                </div>

                <!-- Talking alien above the machine -->
                ${specialAlienHTML}
              </div>

              <!-- RIGHT group -->
              <div style="
                display:flex;
                justify-content:flex-start;
                align-items:flex-end;
                gap:0.8vw;
              ">
                ${rightAliensHTML}
              </div>
            </div>

            <!-- FOOTER STRIP WITH SLIDERS -->
            <div style="
              position:absolute;
              bottom:3%;
              left:50%;
              transform:translateX(-50%);
              width:70vw;
              max-width:900px;
              background:rgba(255,255,255,0.9);
              padding:0px 0px 0px 0px;
              border-radius:16px;
              box-shadow:0 2px 6px rgba(0,0,0,0.2);
              z-index:5;
            ">
              <div style="font-size:14px; margin-bottom:6px; text-align:center;">
                How likely do you think it is that the alien will say each of the following sentences?
              </div>

              <div style="display:flex; flex-direction:column; gap:6px;">

                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="flex:1; font-size:12px;">
                    The alien will say, <b>“We might get a blue one.”</b>
                  </div>
                  <input id="slider_might" type="range" min="0" max="100" value="0" style="flex:2;">
                  <div style="width:40px; text-align:right;">
                    <span id="value_might">0</span>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="flex:1; font-size:12px;">
                    The alien will say, <b>"We will probably get a blue one.”</b>
                  </div>
                  <input id="slider_probably" type="range" min="0" max="100" value="0" style="flex:2;">
                  <div style="width:40px; text-align:right;">
                    <span id="value_probably">0</span>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="flex:1; font-size:12px;">
                    The alien will say <b>something else.</b>
                  </div>
                  <input id="slider_other" type="range" min="0" max="100" value="0" style="flex:2;">
                  <div style="width:40px; text-align:right;">
                    <span id="value_other">0</span>
                  </div>
                </div>

              </div>

              <div style="margin-top:6px; text-align:center; font-size:14px;">
                Total: <span id="total_value">0</span> / 100
              </div>
              <div id="sum_warning" style="margin-top:2px; text-align:center; color:#c62828; font-size:13px; display:none;">
                Make sure the total adds up to 100.
              </div>

              <div style="margin-top:6px; display:flex; justify-content:center;">
                <button id="nextButton"
                        style="font-size:18px; padding:6px 18px; border-radius:10px; cursor:not-allowed; opacity:0.5;">
                  Next ➡
                </button>
              </div>
            </div>

          </div>
        `;
      },
      choices: "NO_KEYS",
      on_load: function() {
        const sMight    = document.getElementById('slider_might');
        const sProbably = document.getElementById('slider_probably');
        const sOther    = document.getElementById('slider_other');

        const vMight    = document.getElementById('value_might');
        const vProbably = document.getElementById('value_probably');
        const vOther    = document.getElementById('value_other');

        const totalSpan = document.getElementById('total_value');
        const warning   = document.getElementById('sum_warning');
        const nextBtn   = document.getElementById('nextButton');

        function updateDisplay() {
          const might    = parseInt(sMight.value, 10)    || 0;
          const probably = parseInt(sProbably.value, 10) || 0;
          const other    = parseInt(sOther.value, 10)    || 0;
          const total    = might + probably + other;

          vMight.textContent    = might;
          vProbably.textContent = probably;
          vOther.textContent    = other;
          totalSpan.textContent = total;

          if (total === 100) {
            warning.style.display = 'none';
            nextBtn.disabled = false;
            nextBtn.style.cursor = 'pointer';
            nextBtn.style.opacity = '1';
          } else {
            warning.style.display = 'block';
            nextBtn.disabled = true;
            nextBtn.style.cursor = 'not-allowed';
            nextBtn.style.opacity = '0.5';
          }
        }

        // Clamp the active slider so the total never exceeds 100
        function handleSliderChange(which) {
          let might    = parseInt(sMight.value, 10)    || 0;
          let probably = parseInt(sProbably.value, 10) || 0;
          let other    = parseInt(sOther.value, 10)    || 0;

          let total = might + probably + other;

          if (total > 100) {
            const excess = total - 100;

            if (which === 'might') {
              might = Math.max(0, might - excess);
              sMight.value = might;
            } else if (which === 'probably') {
              probably = Math.max(0, probably - excess);
              sProbably.value = probably;
            } else if (which === 'other') {
              other = Math.max(0, other - excess);
              sOther.value = other;
            }
          }

          updateDisplay();
        }

        sMight.addEventListener('input',    () => handleSliderChange('might'));
        sProbably.addEventListener('input', () => handleSliderChange('probably'));
        sOther.addEventListener('input',    () => handleSliderChange('other'));

        // Initialize
        updateDisplay();

        nextBtn.onclick = function() {
          const might    = parseInt(sMight.value, 10)    || 0;
          const probably = parseInt(sProbably.value, 10) || 0;
          const other    = parseInt(sOther.value, 10)    || 0;
          const total    = might + probably + other;
          if (total !== 100) return;

          jsPsych.finishTrial({
            pred_might:    might,
            pred_probably: probably,
            pred_other:    other,
            pred_total:    total
          });
        };
          //Start gumball animation
        startGumballAnimation('#gumball-globe');
        },
    on_finish: function() {
  // Stop the animation when the trial ends
  stopGumballAnimation('#gumball-globe');
}

    }],
    timeline_variables: configList
  };
}



var save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "B6IasZcWqpCp",  // <-- paste from DataPipe
  filename: function() {
    // e.g., sub-ABCD1234_gumballs_2025-11-15-1700.csv
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `sub-${timestamp}_gumballs_${subject_id}.csv`;
  },
  data_string: function() {
    return jsPsych.data.get().csv();
  }
};

var saving_screen = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="font-size: 24px; text-align: center; color: white;">
      Saving your answers...<br><br>
      Please wait a moment and do not close this window.
    </div>
  `,
  choices: "NO_KEYS",
  trial_duration: 1000  // just a short pause; Pipe trial comes right after
};


var credit_instructions = {
  type: jsPsychHtmlKeyboardResponse,
  choices: ["Enter", " "],  // participant presses Enter or Space to continue/finish
  stimulus: `
    <div style="
      font-size: 24px;
      line-height: 1.4;
      color: black;
      max-width: 800px;
      margin: 0 auto;
      padding-top: 10%;
      text-align: center;
    ">

      <p>Thank you for participating!</p>

      <p>
        To receive credit, please click the link below and enter your name.
      </p>

      <p style="margin-top:20px;">
        <a href="https://forms.gle/3Vk7e4CqKtZkYok49"
           target="_blank"
           style="color:#ffd166; font-size:26px; text-decoration:underline;">
           → Click here to submit your name for RPP credit ←
        </a>
      </p>

      <p style="margin-top:30px; font-size:20px; opacity:0.9;">
        After completing the form, you are finished with the experiment.
      </p>

    </div>
  `
};


var opening_instructions = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="
      font-size: 24px;
      line-height: 1.4;
      color: black;
      max-width: 800px;
      margin: 0 auto;
      padding-top: 10%;
      text-align: center;
    ">

      <p>
        This study will probably take you less than ten minutes.
        Please do not rush. Your answers are very important research data.
      </p>

      <p style="margin-top: 20px;">
        To receive credit, you will be given a link to a Google Form
        <strong>at the END of this experiment</strong>.
      </p>

            <p style="margin-top: 20px;">
        After this page, you will see a consent form. Once you give consent, the experiment will begin.
      </p>

            <p style="margin-top: 20px;">
        Click Next to begin. 
      </p>

    </div>
  `,
  choices: ["Next →"],     // text on the button
  button_html: `
    <button class="jspsych-btn" style="
      font-size: 22px;
      padding: 12px 24px;
      margin-top: 30px;
      border-radius: 10px;
      cursor: pointer;
    ">%choice%</button>`
};


var opening_instructions_prolific = {
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div style="
      font-size: 24px;
      line-height: 1.4;
      color: black;
      max-width: 800px;
      margin: 0 auto;
      padding-top: 10%;
      text-align: center;
    ">

      <p>
        This study will probably take you less than ten minutes.
        Please do not rush. Your answers are very important research data.
      </p>

            <p style="margin-top: 20px;">
        After this page, you will see a consent form. Once you give consent, the experiment will begin.
      </p>

            <p style="margin-top: 20px;">
        Click Next to begin. 
      </p>

    </div>
  `,
  choices: ["Next →"],     // text on the button
  button_html: `
    <button class="jspsych-btn" style="
      font-size: 22px;
      padding: 12px 24px;
      margin-top: 30px;
      border-radius: 10px;
      cursor: pointer;
    ">%choice%</button>`
};

var consent_block = {
  timeline: [
    {
      type: jsPsychImageButtonResponse,
      stimulus: 'consent form/consentFormPt1.jpg',
      choices: ['Next']
    },
    {
      type: jsPsychImageButtonResponse,
      stimulus: 'consent form/consentFormPt2.jpg',
      choices: ['Next']
    },
    {
      type: jsPsychImageButtonResponse,
      stimulus: 'consent form/consentFormPt3.jpg',
      choices: ['Next']
    },
    {
      type: jsPsychImageButtonResponse,
      stimulus: 'consent form/consentFormPt4.jpg',
      choices: ['Next']
    },
    {
      type: jsPsychImageButtonResponse,
      stimulus: 'consent form/consentFormPt5.jpg',
      choices: ['I consent', 'I do not consent'],
      prompt: "<p>Do you consent to participating in this experiment?</p>"
    }
  ]
};


var prolific_id_page = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: `
        <div style="font-size:22px; text-align:center; margin-bottom:20px;">
          Please enter your Prolific ID.
        </div>
      `,
      placeholder: "Enter your Prolific ID here",
      required: true,
      name: "prolific_id"
    }
  ],
  button_label: "Submit",
  on_finish: function(data) {
    // Just save it straight into global properties
    jsPsych.data.addProperties({
      prolific_id: data.response.prolific_id
    });
  }
};

var prolific_completion_page = {
  type: jsPsychHtmlKeyboardResponse,
  choices: "NO_KEYS",  // they just read this and close the window
  stimulus: `
    <div style="
      font-size: 24px;
      line-height: 1.5;
      color: black;
      max-width: 800px;
      margin: 0 auto;
      padding-top: 10%;
      text-align: center;
    ">
      <p>Thank you for participating!</p>

      <p style="margin-top: 20px;">
        Your Prolific completion code is:
      </p>

      <p style="margin-top: 10px; font-size: 32px; font-weight: bold;">
        <code>C2UKW0TN</code>
      </p>

      <p style="margin-top: 30px;">
        You can now return to Prolific and enter this code.<br>
        When you are done, you may close this window.
      </p>
    </div>
  `
};



var transition_configs = [{
  numRed:0, 
  numBlue:0, 
  specialAlien: 0,
  headerText: "Now, a new alien will describe the machine.",
  audio: null  // no audio on this one
}]

var pre_prediction_configs = [{
  numRed:0, 
  numBlue:0, 
  specialAlien: 0,
  headerText: "Next, you will see a new alien, and you will guess what he will say.",
  audio: null  // no audio on this one
}]

var pre_prediction_configs_1 = [{
  numRed:0, 
  numBlue:0, 
  specialAlien: 3,
  headerText: "You have now seen this alien talk for a while.",
  audio: null  // no audio on this one
}]

var pre_prediction_configs_2 = [{
  numRed:0, 
  numBlue:0, 
  specialAlien: 3,
  headerText: "Now, you will guess what she is going to say.",
  audio: null  // no audio on this one
}]


var speaker_same = makeSpeakerGumballConfigs(2, "female", .31, 3);
//var speaker_2 = makeSpeakerGumballConfigs(3, "female", .41, 4);
//var speaker_3= makeSpeakerGumballConfigs(1, "female", .41, 1);
//var speaker_4= makeSpeakerGumballConfigs(4, "female", .41, 8);
var speaker_diff_group= makeSpeakerGumballConfigs(5, "male", .41, 7);
var speaker_same_group= makeSpeakerGumballConfigs(5, "male", .41, 4);

var configs_s1 = makeConditionConfigs("confident", "brian", "blue", 0.6, "male" ,2);
var configs_s2 = makeConditionConfigs("confident", "river", "blue", 0.6, "female", 1);
var configs_s3 = makeConditionConfigs("confident", "jessica", "blue", 0.6, "female", 3);
var configs_s4 = makeConditionConfigs("confident", "bill", "blue", 0.65, "male", 7);


// Assign to one condition

var condition = jsPsych.randomization.sampleWithoutReplacement([1,2,3], 1)[0];
jsPsych.data.addProperties({ prediction_condition: condition });


// ---------------------
// 3. BUILD TIMELINE
// ---------------------
const timeline = [];

console.log(condition);
//Uncomment line below for RPP
//timeline.push(opening_instructions);

//Uncomment lines below for prolific 
timeline.push(prolific_id_page);
timeline.push(opening_instructions_prolific);

timeline.push(consent_block);

timeline.push(makeGumballPages(gumball_configs_intro));

if(condition == 1 || condition == 2 || condition == 3){
  timeline.push(makeGumballPages(gumball_configs_intro_2));
  timeline.push(makeGumballPages(configs_s1)); //group 1
  timeline.push(makeGumballPages(transition_configs));
  timeline.push(makeGumballPages(configs_s2)); // group 1 
    timeline.push(makeGumballPages(transition_configs));
  timeline.push(makeGumballPages(configs_s3)); // group 1 
}

//baseline
if (condition == 0){
  timeline.push(makeGumballPages(pre_prediction_configs));
  timeline.push(makePredictionTrials(speaker_6));
}

//new yellow speaker
if (condition === 1) {
  timeline.push(makeGumballPages(pre_prediction_configs));
  timeline.push(makePredictionTrials(speaker_diff_group));
} 

//new green speaker
if (condition === 2) {
  timeline.push(makeGumballPages(pre_prediction_configs));
  timeline.push(makePredictionTrials(speaker_same_group));
}


if (condition ===3){
  timeline.push(makeGumballPages(pre_prediction_configs_1));
  timeline.push(makeGumballPages(pre_prediction_configs_2));
  timeline.push(makePredictionTrials(speaker_same));
}

timeline.push(saving_screen);
timeline.push(save_data);

timeline.push(prolific_completion_page);

//Uncomment for RPP
//timeline.push(credit_instructions);


// ---------------------
// 4. RUN
// ---------------------
jsPsych.run(timeline);
