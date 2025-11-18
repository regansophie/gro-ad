// Samples num many elements from arr at random without replacement
// If modifyArr is set to true, then the elements will be removed from arr
function sampleWithoutReplacement(arr, num, modifyArr=false) {
    console.assert(num <= arr.length);
    let ret = [];

    if (modifyArr) {
        for (let i = 0; i < num; i++) {
            let j = Math.floor(Math.random() * arr.length);
            ret.push(arr[j]);
            arr.splice(j, 1);
        }
    } else {
        let remainingIndices = Array.from(arr.keys());
        for (let i = 0; i < num; i++) {
            let j = Math.floor(Math.random() * remainingIndices.length);
            let k = remainingIndices[j];
            ret.push(arr[k]);
            remainingIndices.splice(j, 1);
        }
    }

    return ret;
}

// Shuffles an array in place (via the Fisher-Yates algorithm).
// Returns the permutation that was applied.
function shuffle(arr) {
    let ret = [];
    for (let i = 0; i < arr.length; i++) {
        ret[i] = i;
    }
    for (let i = arr.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        
        // Swap arr[i] and arr[j]
        let swap = arr[i];
        arr[i] = arr[j];
        arr[j] = swap;

        let swapIndex = ret[i];
        ret[i] = ret[j];
        ret[j] = swapIndex;
    }
    return ret;
}

// Returns a "quasi-random" sequence of six bits, ensuring that (a) no value occurs three times in a row, and (b) each value occurs exactly three times total
function quasiRandomBitSequence() {

    let ret = []
    let mostRecentVal = -1;
    let runLength = 0;
    let counts = [0, 0];
    for (let i = 0; i < 6; i++) {
        if (counts[0] == 3) {
            // Forced to 1
            ret[i] = 1;
        } else if (counts[1] == 3) {
            // Forced to 0
            ret[i] = 0;
        } else if (runLength == 2) {
            // Forced to flip
            ret[i] = 1 - mostRecentVal;
        } else {
            // Free
            ret[i] = Math.floor(Math.random() * 2);
        }

        // WARNING: Although the logic above makes sense for our case of six-bit sequences, it does NOT generalize to longer sequences.
        // For example, suppose we wish to generate a sequence consisting of four zeroes and four ones, with no value occurring three times in a row.
        // If we only reason about a single bit at a time, then we might reach the state 0010011_. This sequence does not yet violate either constraint,
        // but there is no way to complete it without violating one of the constraints.

        if (ret[i] == mostRecentVal) {
            runLength++;
        } else {
            runLength = 1;
        }
        console.assert(runLength < 3);
        mostRecentVal = ret[i];
        counts[mostRecentVal]++;
    }
    console.assert(counts[0] == 3 && counts[1] == 3);
    return ret;
}