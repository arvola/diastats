
type Extremum = { timestamp: Date, diff: number, value: number };

export function maxima(data: Array<{ timestamp: Date, value: number }>, threshold = 8000000) {
    let start = Date.now();
    let diffs = [];
    let highest: Extremum | null = null;
    let lowest: Extremum | null = null;
    let highs: Extremum[] = [];
    let lows: Extremum[] = [];
    let previous: Extremum | null = null;
    for (let i = 1; i < data.length; i++) {
        let point = {
            timestamp: data[i].timestamp,
            diff: data[i].value - data[i - 1].value,
            value: data[i].value
        };

        if (previous) {
            if (previous.value === 85) {
                console.log('foo');
            }
            if (previous.diff > 0 && point.diff <= 0) {
                if (!highest || highest.value < previous.value) {
                    highest = previous;
                }
            }
            if (previous.diff < 0 && point.diff >= 0) {

                if (!lowest || lowest.value > previous.value) {
                    lowest = previous;
                }
            }
            if (highest && previous.timestamp.getTime() - highest.timestamp.getTime() > threshold) {
                highs.push(highest);
                highest = null;
            }
            if (lowest && previous.timestamp.getTime() - lowest.timestamp.getTime() > threshold) {
                lows.push(lowest);
                lowest = null;
            }
        }

        previous = point;
    }

    if (highest) {
        highs.push(highest);
    }
    if (lowest) {
        lows.push(lowest);
    }

    console.log(`Calculating maxima took ${Date.now() - start}`);

    return {
        lows,
        highs
    };
}
