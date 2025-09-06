const selector = document.getElementById("selector");
const poly = document.getElementById("poly");
const bendrange = document.getElementById("bendrange");
const aref = document.getElementById("aref");
const ahref = document.getElementById("ahref");
const octave = document.getElementById("octave");
const snap = document.getElementById("snap");

const defaultchannel = {bend: 8192, time: -1, playing: -1, used: false};
// whgatever tf this is prevents js from linking everything to the same object
let channelusage = Array.from({length: 16}, ()=>({...defaultchannel}));
let polyplaying = {}; // code: channel number

let playing = -1; // currently playing midi note
let playingKey = ""; // currently playing key code
let access; // midi access

const INTERVALS = [1, 2, 3/2, 5/4, 7/4, 11/4, 13/4];

const horiz = 2;
const vert = Number(window.location.search.slice(1));

const UP = "ꜛ";
const DOWN = "ꜜ";

// e.code is used here instead of e.key so it doesn't depend on your layout
const keys = {
  "Digit1": [-5, 2],
  "Digit2": [-4, 2],
  "Digit3": [-3, 2],
  "Digit4": [-2, 2],
  "Digit5": [-1, 2],
  "Digit6": [0, 2],
  "Digit7": [1, 2],
  "Digit8": [2, 2],
  "Digit9": [3, 2],
  "Digit0": [4, 2],

  "KeyQ": [-5, 1],
  "KeyW": [-4, 1],
  "KeyE": [-3, 1],
  "KeyR": [-2, 1],
  "KeyT": [-1, 1],
  "KeyY": [0, 1],
  "KeyU": [1, 1],
  "KeyI": [2, 1],
  "KeyO": [3, 1],
  "KeyP": [4, 1],

  "KeyA": [-5, 0],
  "KeyS": [-4, 0],
  "KeyD": [-3, 0],
  "KeyF": [-2, 0],
  "KeyG": [-1, 0],
  "KeyH": [0, 0],
  "KeyJ": [1, 0],
  "KeyK": [2, 0],
  "KeyL": [3, 0],
  "Semicolon": [4, 0],

  "KeyZ": [-5, -1],
  "KeyX": [-4, -1],
  "KeyC": [-3, -1],
  "KeyV": [-2, -1],
  "KeyB": [-1, -1],
  "KeyN": [0, -1],
  "KeyM": [1, -1],
  "Comma": [2, -1],
  "Period": [3, -1],
  "Slash": [4, -1],
};

// thanks mozilla
function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function connect() {
  navigator.requestMIDIAccess().then((a) => {
    access = a;
    let selectorData = "";
    access.outputs.forEach((port, id) => {
      selectorData += `<option value="${id}">${port.name}</option>`;
    });
    selector.innerHTML = selectorData;
  });
}

function send(pitch, code) {
  const output = access.outputs.get(selector.value);
  
  if (playing !== -1)
    stop("");

  const note = 12 * getBaseLog(2, pitch / aref.value) + 69;
  const roundNote = Math.round(note);
  const roundFreq = 2**((roundNote-69)/12)*aref.value;
  const difference = 12 * getBaseLog(2, pitch / roundFreq);
  const midibend = Math.round(difference * (8192 / bendrange.value) + 8192);
  console.log(pitch, difference, midibend);

  let chan = -1;
  if (poly.checked) {
    let oldest = Date.now();
    for (let i = 0; i < channelusage.length; i++) {
      const channel = channelusage[i];
      if (channel.used) continue;
      if (channel.time === -1 || channel.bend == midibend) {
        // perfect scenario
        chan = i;
        break;
      }
      // good candidate but not perfect, keep going to possibly find more
      if (channel.time < oldest)
        chan = i;
    }

    if (chan === -1) return;
    channelusage[chan].used = true;
    channelusage[chan].playing = roundNote;
    channelusage[chan].bend = midibend;
    channelusage[chan].time = Date.now();
    polyplaying[code] = chan;
  } else {
    chan = 0;
    playing = roundNote;
  }

  output.send([0xE0 | chan, midibend & 0b1111111, midibend >> 7, // pitch bend
               0x90 | chan, roundNote, 0x7f]); // note on
}

function stop(code) {
  const output = access.outputs.get(selector.value);

  if (poly.checked && code !== "") {
    const chan = polyplaying[code];
    output.send([0x80 | chan, channelusage[chan].playing, 0x7f]);
    channelusage[chan].playing = -1;
    channelusage[chan].used = false;
    console.log(polyplaying);
    delete polyplaying[code];
  } else {
    if (playing !== -1) {
      output.send([0x80, playing, 0x7f]);
      playing = -1;
    }
  }
}

// this function stops everything
function ohshit() {
  for (const [code, chan] of Object.entries(polyplaying)) {
    stop(code);
    const pos = keys[code];
    getBox(pos).classList.remove("selected");
  }
}

function getBox(pos) {
  return document.querySelector(`tr.t${pos[1]}>td.t${pos[0]}`);
}

function keydown(e) {
  // ignore hotkeys such as ctrl+r to reload
  if (e.altKey || e.ctrlKey || e.metaKey)
    return;
  // ignore key repeats
  if (e.repeat)
    return;
  // ignore keys already playing
  if (e.code in polyplaying)
    return;
  
  // special handling to change octaves
  if (e.code=="ArrowLeft")
    octave.value = Number(octave.value) - 1;
  if (e.code=="ArrowRight")
    octave.value = Number(octave.value) + 1;

  // do nothing if the midi access isn't there
  if (!access)
    return;
  // ignore keys that aren't in the playing area
  if (!(e.code in keys))
    return;

  playingKey = e.code;
  const pos = keys[e.code];
  const base = ahref.value * (2 ** octave.value);
  let pitch = base * (INTERVALS[horiz] ** pos[0]) * (INTERVALS[vert] ** pos[1]);

  // snap to octave (please tell me there's a better way to do this)
  if (snap.checked) {
    while (pitch > base * 2)
      pitch /= 2;
    while (pitch < base)
      pitch *= 2;
  }

  getBox(pos).classList.add("selected");
  send(pitch, e.code);
}

function keyup(e) {
  // do nothing if the midi access isn't there
  if (!access)
    return;
  // ignore hotkeys such as ctrl+r to reload
  if (e.altKey || e.ctrlKey || e.metaKey)
    return;
  // ignore keys that aren't in the playing area
  if (!(e.code in keys))
    return;

  const pos = keys[e.code];
  getBox(pos).classList.remove("selected");

  if (poly.checked || playingKey == e.code)
    stop(e.code);
}

function addnames() {
  for (let x = -5; x <= 4; x++) {
    for (let y = -1; y <= 2; y++) {
      const newline = document.createElement("br");
      const box = getBox([x, y]);
      box.appendChild(newline);

      if (x == 0 && y == 0) {
        const span = document.createElement("span");
        span.innerText = "0";
        span.classList.add("qoz", "color0");
        box.appendChild(span);
      } else {
        if (x != 0) {
          const horizSpan = document.createElement("span");
          horizSpan.innerText += horiz + (x < 0 ? DOWN : UP).repeat(Math.abs(x));
          horizSpan.classList.add("qoz", `color${horiz}`);
          box.appendChild(horizSpan);
        }
        if (y != 0) {
          const vertSpan = document.createElement("span");
          vertSpan.innerText += vert + (y < 0 ? DOWN : UP).repeat(Math.abs(y));
          vertSpan.classList.add("qoz", `color${vert}`);
          box.appendChild(vertSpan);
        }
      }
    }
  }
}

addnames();
document.body.addEventListener("keydown", keydown);
document.body.addEventListener("keyup", keyup);
