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
