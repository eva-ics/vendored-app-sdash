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

export const formatTime = (t: number, millis?: boolean) => {
  return dateRFC3339(new Date(t * 1000), millis);
};

export const dateRFC3339 = (d: Date, millis?: boolean) => {
  let result =
    d.getFullYear() +
    "-" +
    f(d.getMonth() + 1) +
    "-" +
    f(d.getDate()) +
    "T" +
    f(d.getHours()) +
    ":" +
    f(d.getMinutes()) +
    ":" +
    f(d.getSeconds());
  if (millis) {
    result += "." + f(d.getMilliseconds());
  }
  return result;
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
    let hours = Math.floor((uptimeInSeconds % secondsInDay) / secondsInHour);
    let minutes = Math.floor(
      (uptimeInSeconds % secondsInHour) / secondsInMinute
    );
    let seconds = uptimeInSeconds % secondsInMinute;
    let formattedUptime = "";
    if (days > 0) {
      formattedUptime += days + "d ";
    }
    if (hours > 0) {
      if (hours == 24) {
        hours = 0;
      }
      formattedUptime += ("0" + hours).slice(-2) + "h ";
    }
    if (minutes > 0) {
      if (minutes == 60) {
        minutes = 0;
      }
      formattedUptime += ("0" + minutes).slice(-2) + "m ";
    }
    if (seconds > 0) {
      if (seconds == 60) {
        seconds = 0;
      }
      formattedUptime += ("0" + seconds.toFixed(0)).slice(-2) + "s";
    }
    return formattedUptime.trim();
  }
};

export const formatNumber = (n?: number) => {
  if (n !== undefined) {
    return n.toLocaleString("en").replaceAll(",", " ");
  }
};
