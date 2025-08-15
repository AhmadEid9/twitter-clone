import chalk from "chalk";
import { STATUS_CODES } from "http";

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
        const latency = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
        const statusMessage = STATUS_CODES[res.statusCode] || 'Unknown Status';

        let statusColor;
        if (res.statusCode >= 200 && res.statusCode < 300) {
            statusColor = chalk.green;
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
            statusColor = chalk.yellow;
        } else {
            statusColor = chalk.red;
        }

        console.log(
            `${chalk.blue(`[${startTime}]`)} ` +
            `${chalk.yellow(req.method)} ` +
            `${chalk.white(req.originalUrl)} → ${res.statusCode} ${statusColor(`${statusMessage}`)} ` +
            `${chalk.blue(latency)} ms`
        );
    });

    next();
};

export default requestTracker;
