import { EvaError } from "@eva-ics/webengine";
import { toast } from "react-hot-toast";
import { Button, styled } from "@mui/material";

export const ButtonStyled = styled(Button)({
    borderColor: "gray",
    color: "gray",
    padding: "5px",
    minWidth: "40px",
});

export const onEvaError = (err: EvaError) => {
  onError(`error ${err.code} ${err.message}`);
};

export const onSuccess = (message?: string) => {
  toast.success(message || "success");
};

export const onError = (message?: string) => {
  toast.error(message || "error");
};
