function getPrimerMark(primer) {
    const mark = primer[primer["type"] + "_seq"];
    if (primer["type"] == "base") {
        return "<mark style=\"background-color: pink\">" + mark + "</mark>";
    } else {
        return "<mark style=\"background-color: lightblue\">" + mark + "</mark>";
    }
}

function getAmplicon(set) {
    var str = "";

    for (let i = 0; i < set["primers_amount"]; i++) {
        str += getPrimerMark(set["primers"][i]);
        if (i != set["primers_amount"] - 1) {
            str += set["distances"][i]["base_seq"];
        }
    }

    return str;
}

function createDiv(content, par_div) {
    var cur_div = document.createElement("div");
    cur_div.innerHTML = content;
    par_div.appendChild(cur_div);
    return cur_div;
}

window.bridge.getData((_, data) => {
    
    document.getElementById("primer_search").innerText = data["PRIMER_SEARCH_TIME"] + " s";
    document.getElementById("primer_sort").innerText = data["PRIMER_SORT_TIME"] + " s";
    document.getElementById("time_taken").innerText = data["TIME_TAKEN"] + " s";

    document.getElementById("base_primers").innerText = data["base_primers_found"];
    document.getElementById("comp_primers").innerText = data["comp_primers_found"];

    document.getElementById("sets_found").innerText = "Sets found: " + data["sets_found"];

    const sets = data["sets"];
    const sets_div = document.getElementById("sets");
    
    for (let i = 0; i < data["sets_found"]; i++) {

        sets[i]["INDEX"] = i;

        var item_div = createDiv("", sets_div);
        item_div.classList.add("item_div");

        createDiv("#" + (i + 1) + " " + (sets[i]["start"] + 1) + "-" + (sets[i]["end"] + 1), item_div);

        var ampl_div = createDiv(getAmplicon(sets[i]), item_div);
        ampl_div.style = "cursor: pointer";
        ampl_div.addEventListener("click", (e) => {
            window.api.openSet(sets[i]);
        });
    }

});