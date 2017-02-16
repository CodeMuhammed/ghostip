// @TODO figure out how to get unlimited ips
// @TODO create a small node app that does that before integrating into ghostip.
// Create a document IP_DUMP to save all good ips gotten
// Read that document and use them to make request to gimmeproxy to get more ips
// Shuffle the ips to make sure all the processes are not devouring the ips linearly

module.exports = () => {
    let ipList = [];
    let cycleIndex = 0;

    const shuffleList = (ipList) => {
        // @returns shuffled iplist
    }

    const init = (cb) => {
        // @Read data and set
    }

    const cycleIp = () => {
        // @TODO
    }

    const saveIp = () => {
        // @TODO
    }

    return {
        init,
        cycleIp,
        saveIp
    };
}
