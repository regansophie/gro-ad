// Initialize jsPsych
const jsPsych = initJsPsych({

  on_finish: function() {
    jsPsych.data.displayData(); // for debugging; you can remove later
  }
});

// make a simple participant id (or pull from URL)
var subject_id = jsPsych.randomization.randomID(8);
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
      specialAlien: 1,
      headerText: "Then, one of the aliens goes up to check what is in the machine.",
      audio: null  // no audio on this one
    },
    {
      numRed: 15,
      numBlue: 15,
      specialAlien: 1,
      headerText: "And he announces how many blue ones there are.",
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
  const someAudioPath = `audio/speaker ${speakerNumber}/some.mp3`;
  const manyAudioPath = `audio/speaker ${speakerNumber}/many.mp3`;

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

  // Randomize order before returning
  return jsPsych.randomization.shuffle(repeated);
}

var speaker_1 = makeSpeakerGumballConfigs(1, "male", .31, 2);
var speaker_2 = makeSpeakerGumballConfigs(2, "male", .41, 4);


//--------------------------------------------------
// Slide: Aliens love gumballs
//--------------------------------------------------

// Factory: given a list of configs, return a gumball block
function makeGumballPages(configList) {
  return {
    timeline: [{
      type: jsPsychHtmlKeyboardResponse,

      data: {
        numRed: jsPsych.timelineVariable('numRed'),
        numBlue: jsPsych.timelineVariable('numBlue'),
        specialAlien: jsPsych.timelineVariable('specialAlien'),
        headerText: jsPsych.timelineVariable('headerText'),
        audio: jsPsych.timelineVariable('audio')
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
                 style="height:17vh; object-fit:contain;">
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
                   transform:translate(-50%, 15%);
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
                   transform:translate(-50%, 15%);
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
        // hook up Next button
        document.getElementById("nextButton").onclick = () => jsPsych.finishTrial();

        // optional audio
        const audioFile = jsPsych.timelineVariable('audio');
        if (audioFile) {
          window.currentExposureAudio = new Audio(audioFile);
          window.currentExposureAudio.play().catch(e => {
            console.warn("Audio play blocked or failed:", e);
          });
        }
      },

      on_finish: function() {
        if (window.currentExposureAudio) {
          window.currentExposureAudio.pause();
          window.currentExposureAudio = null;
        }
      }
    }],

    // ⬅ the only difference is this line:
    timeline_variables: configList
  };
}




var prediction_configs = [
  {
    numRed: 15,
    numBlue: 5,
    specialAlien: 3,  // green #3 at the top
    headerText: "What do you think this alien will say about the blue gumballs?"
  },
    {
    numRed: 5,
    numBlue: 15,
    specialAlien: 6,  // green #3 at the top
    headerText: "What do you think this alien will say about the blue gumballs?"
  }
  // add more prediction trials here
];



// Factory: given a list of configs, return a prediction block
function makePredictionTrials(configList) {
  return {
    timeline: [{
      type: jsPsychHtmlKeyboardResponse,
      data: {
        numRed: jsPsych.timelineVariable('numRed'),
        numBlue: jsPsych.timelineVariable('numBlue'),
        specialAlien: jsPsych.timelineVariable('specialAlien'),
        headerText: jsPsych.timelineVariable('headerText')
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
                 style="height:18vh; object-fit:contain;">
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
                   transform:translate(-50%, 15%);
                   height:18vh;
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
                   transform:translate(-50%, 15%);
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
                height:45vh;
                display:flex;
                align-items:flex-end;
                justify-content:center;
              ">
                <img src="images/gumball_machine_empty.png"
                     style="height:100%; object-fit:contain; display:block;">

                <!-- White circular globe with gumballs -->
                <div id="gumball-globe" style="
                  position:absolute;
                  top:10%;
                  left:18%;
                  width:64%;
                  height:50%;
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
                Move the sliders so that they add up to 100.
              </div>

              <div style="display:flex; flex-direction:column; gap:6px;">

                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="flex:1; font-size:12px;">
                    The alien will say, <b>“Some of them are blue.”</b>
                  </div>
                  <input id="slider_some" type="range" min="0" max="100" value="0" style="flex:2;">
                  <div style="width:40px; text-align:right;">
                    <span id="value_some">0</span>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:4px;">
                  <div style="flex:1; font-size:12px;">
                    The alien will say, <b>“Many of them are blue.”</b>
                  </div>
                  <input id="slider_many" type="range" min="0" max="100" value="0" style="flex:2;">
                  <div style="width:40px; text-align:right;">
                    <span id="value_many">0</span>
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
        const sSome  = document.getElementById('slider_some');
        const sMany  = document.getElementById('slider_many');
        const sOther = document.getElementById('slider_other');

        const vSome  = document.getElementById('value_some');
        const vMany  = document.getElementById('value_many');
        const vOther = document.getElementById('value_other');

        const totalSpan = document.getElementById('total_value');
        const warning   = document.getElementById('sum_warning');
        const nextBtn   = document.getElementById('nextButton');

        function updateTotals() {
          const some  = parseInt(sSome.value, 10)  || 0;
          const many  = parseInt(sMany.value, 10)  || 0;
          const other = parseInt(sOther.value, 10) || 0;
          const total = some + many + other;

          vSome.textContent  = some;
          vMany.textContent  = many;
          vOther.textContent = other;
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

        sSome.addEventListener('input', updateTotals);
        sMany.addEventListener('input', updateTotals);
        sOther.addEventListener('input', updateTotals);
        updateTotals();

        nextBtn.onclick = function() {
          const some  = parseInt(sSome.value, 10)  || 0;
          const many  = parseInt(sMany.value, 10)  || 0;
          const other = parseInt(sOther.value, 10) || 0;
          const total = some + many + other;
          if (total !== 100) return;

          jsPsych.finishTrial({
            pred_some:  some,
            pred_many:  many,
            pred_other: other,
            pred_total: total
          });
        };
      }
    }],
    timeline_variables: configList
  };
}



var save_data = {
  type: jsPsychPipe,
  action: "save",
  experiment_id: "xiHnK2CUXUwT",  // <-- paste from DataPipe
  filename: function() {
    // e.g., sub-ABCD1234_gumballs_2025-11-15-1700.csv
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `sub-${timestamp}${subject_id}_gumballs_${subject_id}.csv`;
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



// ---------------------
// 3. BUILD TIMELINE
// ---------------------
const timeline = [];
timeline.push(makeGumballPages(gumball_configs_intro));
//timeline.push(makeGumballPages(speaker_1));
//timeline.push(makeGumballPages(speaker_2));
//timeline.push(makeGumballPages(jsPsych.randomization.shuffle(gumball_configs_speaker_1)));
timeline.push(makePredictionTrials(speaker_1));
timeline.push(saving_screen);
timeline.push(save_data);
timeline.push(credit_instructions);


// ---------------------
// 4. RUN
// ---------------------
jsPsych.run(timeline);
