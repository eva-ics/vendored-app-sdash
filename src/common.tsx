import { EvaError } from "@eva-ics/webengine";
import { toast } from "react-hot-toast";

export const onEvaError = (err: EvaError) => {
  onError(`error ${err.code} ${err.message}`);
};

export const onSuccess = (message?: string) => {
  toast.success(message || "success");
};

export const onError = (message?: string) => {
  toast.error(message || "error");
};

function f(n: number) {
  return n < 10 ? "0" + n : n;
}

export const dateRFC3339 = (d: Date) => {
  return (
    d.getUTCFullYear() +
    "-" +
    f(d.getUTCMonth() + 1) +
    "-" +
    f(d.getUTCDate()) +
    " " +
    f(d.getUTCHours()) +
    ":" +
    f(d.getUTCMinutes()) +
    ":" +
    f(d.getUTCSeconds())
  );
};

export const timeFromTimestamp = (ts?: number) => {
  if (ts) {
    return dateRFC3339(new Date(ts * 1000));
  }
};

export const formatUptime = (uptimeInSeconds?: number) => {
  if (uptimeInSeconds) {
    if (isNaN(uptimeInSeconds) || uptimeInSeconds < 0) {
      return "Invalid uptime";
    }
    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const days = Math.floor(uptimeInSeconds / secondsInDay);
    const hours = Math.floor((uptimeInSeconds % secondsInDay) / secondsInHour);
    const minutes = Math.floor(
      (uptimeInSeconds % secondsInHour) / secondsInMinute
    );
    const seconds = uptimeInSeconds % secondsInMinute;
    let formattedUptime = "";
    if (days > 0) {
      formattedUptime += days + "d ";
    }
    if (hours > 0) {
      formattedUptime += hours + "h ";
    }
    if (minutes > 0) {
      formattedUptime += minutes + "m ";
    }
    if (seconds > 0) {
      formattedUptime += seconds.toFixed(0) + "s";
    }
    return formattedUptime.trim();
  }
};
