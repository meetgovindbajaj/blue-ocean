import { MessageInstance } from "antd/es/message/interface";

export let popupMessage: MessageInstance | undefined = undefined;

export const setPopupMessage = (messageApi: MessageInstance) => {
  popupMessage = messageApi;
};
