import { useState, useEffect } from "react";

interface CountdownTime {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    isPast: boolean;
}

export const useCountdown = (targetDate: Date): CountdownTime => {
    const [countdown, setCountdown] = useState<CountdownTime>(() =>
        calculateCountdown(targetDate)
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(calculateCountdown(targetDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return countdown;
};

function calculateCountdown(targetDate: Date): CountdownTime {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    // Match is in the past
    if (difference < 0) {
        // Consider live if started less than 3 hours ago
        const timeSinceStart = Math.abs(difference);
        const isLive = timeSinceStart < 3 * 60 * 60 * 1000;

        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isLive,
            isPast: !isLive,
        };
    }

    // Match is upcoming
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
        days,
        hours,
        minutes,
        seconds,
        isLive: false,
        isPast: false,
    };
}

export const formatCountdown = (countdown: CountdownTime): string => {
    if (countdown.isLive) {
        return "LIVE NOW";
    }

    if (countdown.isPast) {
        return "Ended";
    }

    if (countdown.days > 0) {
        return `in ${countdown.days}d ${countdown.hours}h`;
    }

    if (countdown.hours > 0) {
        return `in ${countdown.hours}h ${countdown.minutes}m`;
    }

    if (countdown.minutes > 0) {
        return `in ${countdown.minutes}m`;
    }

    return `in ${countdown.seconds}s`;
};
