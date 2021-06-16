import axios from "axios";
import {postData} from "../../services/services";

const defaultDataParser = (form) => {
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
}

const formHandler = ({url, formId, submitButtons, dataParser = defaultDataParser, afterRequestHandlers = [], jwtRequired = true}) => {
    const form = document.getElementById(formId);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const activeElementId = document.activeElement["id"];
        let submitBtn;
        for (let i = 0; i < submitButtons.length; i++) {
            const btn = submitButtons[i];
            if (btn.id === activeElementId) {
                const submitBtnNode = document.getElementById(btn.id);
                submitBtnNode.setAttribute("disabled", "");
                submitBtn = {
                    ...btn,
                    node: submitBtnNode
                }

                if (btn.spinner) {
                    btn.spinner.render();
                }

                if (btn.alert) {
                    btn.alert.remove();
                }

                break;
            }
        }

        const data = dataParser(form);

        const {res, err} = await postData(url, data, jwtRequired);

        submitBtn.node.removeAttribute("disabled");
        if (submitBtn.spinner) {
            submitBtn.spinner.remove();
        }

        afterRequestHandlers.forEach((handler) => {
            handler({
              res,
              err,
              alert: submitBtn.alert
            });
        })
    });
}

export default formHandler;