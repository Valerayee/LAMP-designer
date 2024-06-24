function setMinMax(element, min, max, value) {

  element.min = min;
  element.max = max;
  element.value = value;

}

function getParsed(currentFrom, currentTo) {
  const from = parseInt(currentFrom.value, 10);
  const to = parseInt(currentTo.value, 10);
  return [from, to];
}

const genome_title = document.getElementById("genome_title");

const genome_from_slider = document.getElementById("genome_from_slider");
const genome_to_slider = document.getElementById("genome_to_slider");
const genome_from = document.getElementById("genome_from");
const genome_to = document.getElementById("genome_to");

function fillSlider(from, to, sliderColor, rangeColor, controlSlider) {
    const rangeDistance = to.max-to.min;
    const fromPosition = from.value - to.min;
    const toPosition = to.value - to.min;
    controlSlider.style.background = `linear-gradient(
      to right,
      ${sliderColor} 0%,
      ${sliderColor} ${(fromPosition)/(rangeDistance)*100}%,
      ${rangeColor} ${((fromPosition)/(rangeDistance))*100}%,
      ${rangeColor} ${(toPosition)/(rangeDistance)*100}%, 
      ${sliderColor} ${(toPosition)/(rangeDistance)*100}%, 
      ${sliderColor} 100%)`;
}

function setToggleAccessible(currentTarget) {
    const toSlider = document.getElementById("genome_to_slider");
    if (Number(currentTarget.value) <= 0 ) {
      toSlider.style.zIndex = 2;
    } else {
      toSlider.style.zIndex = 0;
    }
}

setToggleAccessible(genome_to_slider);

function updateGenomeTitle(fromInput, toInput) {

  const [from, to] = getParsed(fromInput, toInput);
  const length = to + 1 - from;
  const str = length;

  genome_title.innerText = "Sequence length: " + str;

}

function controlFromSlider(fromSlider, toSlider, fromInput) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
    if (from > to) {
      fromSlider.value = to;
      fromInput.value = to;
    } else {
      fromInput.value = from;
    }
    updateGenomeTitle(genome_from, genome_to);
}
    
function controlToSlider(fromSlider, toSlider, toInput) {
    const [from, to] = getParsed(fromSlider, toSlider);
    fillSlider(fromSlider, toSlider, '#C6C6C6', '#25daa5', toSlider);
    setToggleAccessible(toSlider);
    if (from <= to) {
      toSlider.value = to;
      toInput.value = to;
    } else {
      toInput.value = from;
      toSlider.value = from;
    }
    updateGenomeTitle(genome_from, genome_to);
}

genome_from_slider.oninput = () => controlFromSlider(genome_from_slider, genome_to_slider, genome_from);
genome_to_slider.oninput = () => controlToSlider(genome_from_slider, genome_to_slider, genome_to);






function formatSequence(sequence) {
  
  const nucleotides = ['a', 't', 'c', 'g', 'A', 'T', 'C', 'G'];

  sequence = sequence.replace(new RegExp(`[^${nucleotides.join('')}]`, 'g'), '');

  return sequence;

}

var genome = "";
var display_full = false;
const parameters = document.getElementById("parameters");

const genome_text = document.getElementById("genome_text");

function setMaximums(length) {
  
}

function loadSequence(sequence) {

  if (!display_full) {
    window.api.resizeWindow(700, 820);
    parameters.style = "";
    display_full = true;
    dropzone.style = "border: 4px dotted #7a9ad8d8;";
  }

  genome = formatSequence(sequence);
  const length = genome.length;

  genome_text.value = genome;

  setMinMax(genome_from_slider, 1, length, 1);
  setMinMax(genome_to_slider, 1, length, length);
  genome_from.value = 1;
  genome_to.value = length;
  updateGenomeTitle(genome_from, genome_to);

  fillSlider(genome_from_slider, genome_to_slider, '#C6C6C6', '#25daa5', genome_to_slider);

}

const genome_copy_btn = document.getElementById("genome_copy_btn");
const genome_delete_btn = document.getElementById("genome_delete_btn");
const genome_upload_btn = document.getElementById("genome_upload_btn");

const dropzone_text = document.getElementById("dropzone_text");

genome_copy_btn.addEventListener("click", async (e) => {
  const text = await navigator.clipboard.readText();
  genome_text.value = text;
});

genome_delete_btn.addEventListener("click", (e) => {
  genome_text.value = "";
});

genome_upload_btn.addEventListener("click", (e) => {
  dropzone_text.innerText = "Genome typed in manually";
  //const sequence = formatSequence(genome_text.value);
  //genome_text.value = sequence;
  //loadSequence(sequence);
  loadSequence(genome_text.value);
});

const dropzone = document.getElementById("dropzone");
const clickzone = document.getElementById("clickzone");

async function upload_file(files) {

  const path = files[0].path;

  if (path.split('.').pop() != "txt") {
      new window.Notification("Wrong input file extension", {body: "Input file must end with .txt."});
      return;
  }

  dropzone_text.innerText = "Input file: " + path.substring(path.lastIndexOf('\\') + 1, path.length);

  const sequence = await window.api.readGenome(path);

  loadSequence(sequence);

}

clickzone.addEventListener("change", async (e) => {

  const files = e.currentTarget.files;

  upload_file(files);

});

dropzone.addEventListener("dragover", (e) => {
  e.stopPropagation();
  e.preventDefault();
});

dropzone.addEventListener("drop", async (e) => {
  e.stopPropagation();
  e.preventDefault();

  const files = e.dataTransfer.files;

  upload_file(files);

});



dropzone.addEventListener("click", (e) => {
  e.stopPropagation();
  e.preventDefault();

  clickzone.click();
});


const loop_checkbox = document.getElementById("loop");

loop_checkbox.addEventListener("change", (e) => {

  const base_dists = ["F2-F1c", "B1c-B2"];
  const loop_dists = ["F2-L1", "L1-F1c", "B1c-L2", "L2-B2"];


  loop_dists.forEach((elem) => {
    document.getElementById(elem).style = (loop_checkbox.checked ? "" : "display: none;");
  })
  base_dists.forEach((elem) => {
    document.getElementById(elem).style = (loop_checkbox.checked ? "display: none;" : "");
  })

});

const LAMP_button = document.getElementById("LAMP_button");

function getValue(name) {
  
  const value = document.getElementById(name).value;
  if (value.indexOf('.') != - 1) {
    return parseFloat(value);
  } else {
    return parseInt(value, 10);
  }

}

function getRange(name) {
  return [getValue(name + "_from"), getValue(name + "_to")];
}

LAMP_button.addEventListener("click", (e) => {

  const START = getValue("genome_from") - 1;
  const END = getValue("genome_to") - 1;

  var DO_PARTIAL = true;
  if (START == 0 && END == genome.length - 1) {
    DO_PARTIAL= false;
  }

  const input = {
    "COMPUTING": {
      "THREADS": getValue("threads"),
      "DOUBLE_DIVERGENCE": getValue("divergence"),
      "DO_SKIP": document.getElementById("skip").checked ? true : false,
    },
    "PRIMER_SEARCH": {
      "LENGTH_RANGE": getRange("length"),
      "NA_PLUS": getValue("na_plus"),
      "RMV_REPEAT_AMOUNT": getValue("max_repeat"),
      "GC_RANGE": getRange("GC"),
      "TM_RANGE": getRange("Tm")
    },
    "DIMER": {
      "DIMER_END": getValue("dimer")
    },
    "GENOME": {
      "DO_PARTIAL": DO_PARTIAL,
      "START": START,
      "END": END,
      "GENOME": genome
    },
    "PRIMER_SORTING": {
        "DISTANCE_RANGE": [],
        "AMPLICON_RANGE": getRange("amplicon"),
        "LENGTH_MAX_DIFF": getValue("length_diff"),
        "TM_MAX_DIFF": getValue("Tm_diff")
    }
  };

  const base_dist = ["F3-F2", "F2-F1c", "F1c-B1c", "B1c-B2", "B2-B3"];
  const loop_dist = ["F3-F2", "F2-L1", "L1-F1c", "F1c-B1c", "B1c-L2" ,"L2-B2", "B2-B3"];

  if (loop_checkbox.checked) {
    input["PRIMER_SORTING"]["POSITIONS"] = [false, false, false, true, false, true, true, true];
    loop_dist.forEach((elem) => {
      const dist = getRange(elem);
      input["PRIMER_SORTING"]["DISTANCE_RANGE"].push(dist[0]);
      input["PRIMER_SORTING"]["DISTANCE_RANGE"].push(dist[1]);
    });
  } else {
    input["PRIMER_SORTING"]["POSITIONS"] = [false, false, true, false, true, true];
    base_dist.forEach((elem) => {
      const dist = getRange(elem);
      input["PRIMER_SORTING"]["DISTANCE_RANGE"].push(dist[0]);
      input["PRIMER_SORTING"]["DISTANCE_RANGE"].push(dist[1]);
    });
  }

  window.api.LAMP(input);

});