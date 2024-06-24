function getPrimerMark(primer) {
    const mark = primer[primer["type"] + "_seq"];
    if (primer["type"] == "base") {
        return "<mark style=\"background-color: pink\">" + mark + "</mark>";
    } else {
        return "<mark style=\"background-color: lightblue\">" + mark + "</mark>";
    }
}

function checkIfMark(primer, type) {
    if (primer["type"] == type) {
        return getPrimerMark(primer);
    } else {
        return primer[type + "_seq"];
    }
}

function getSequence(set, type) {
    var str = "";

    for (let i = 0; i < set["primers_amount"]; i++) {
        str += checkIfMark(set["primers"][i], type);
        if (i != set["primers_amount"] - 1) {
            str += set["distances"][i][type + "_seq"];
        }
    }

    return str;
}

window.bridge.getData((_, data) => {

    document.getElementById("index").innerText = "Set #" + (data["INDEX"] + 1);
    
    document.getElementById("start").innerText = (data["start"] + 1);
    document.getElementById("length").innerText = data["length"];
    document.getElementById("end").innerText = (data["end"] + 1);

    document.getElementById("base_sequence").innerHTML = getSequence(data, "base");
    document.getElementById("complementary_sequence", ).innerHTML = getSequence(data, "comp");

    document.getElementById("min_tm").innerText = data["MAX_TM"].toFixed(2);
    document.getElementById("tm_diff").innerText = (data["MIN_TM"] - data["MAX_TM"]).toFixed(2);
    document.getElementById("max_tm").innerText = data["MIN_TM"].toFixed(2);

    var primer_indexes = [];
    if (data["primers_amount"] == 8) {
        primer_indexes = ["F3", "F2", "L1", "F1c", "B1c", "L2", "B2", "B3"];
    } else {
        primer_indexes = ["F3", "F2", "F1c", "B1c", "B2", "B3"];
    }

    for (let i = 0; i < data["primers_amount"]; i++) {

        const index = primer_indexes[i];
        const primer = data["primers"][i];

        document.getElementById(index).style = "";

        document.getElementById(index + "_seq").innerHTML = getPrimerMark(primer);
        document.getElementById(primer_indexes[i] + "_start").innerText = (primer["start"] + 1);
        document.getElementById(primer_indexes[i] + "_end").innerText = (primer["end"] + 1);
        document.getElementById(primer_indexes[i] + "_length").innerText = primer["length"];
        document.getElementById(primer_indexes[i] + "_GC").innerText = primer["GC"].toFixed(2);
        document.getElementById(primer_indexes[i] + "_Tm").innerText = primer["Tm"].toFixed(2);

    };

    document.getElementById("export_btn").addEventListener("click", (e) => {
        window.api.saveFile(data);
    });

});