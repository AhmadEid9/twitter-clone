import chalk from "chalk";

const requestTracker = (req, res, next) => {
    const start = process.hrtime();
    const startTime = new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    res.on('finish', () => {
        const diff = process.hrtime(start);
        const latency = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2); // in ms
        console.log(
            `${chalk.blue(`[${startTime}]`)} ` +
            `${chalk.yellow(req.method)} ` +
            `${chalk.white(`${req.originalUrl} → ${res.statusCode}`)} ` +
            `${chalk.blue(`${latency}`)}` +
            chalk.reset() + ` ms`
        );
    });

    next();
}

export default requestTracker