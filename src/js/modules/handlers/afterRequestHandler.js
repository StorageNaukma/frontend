const afterRequestHandler = ({res, error: err, alert}) => {
    if (res) {
        alert.changeText(alert.text);
        alert.changeClass("alert-danger", "alert-success");
        alert.render();
        setTimeout(() => {
            alert.addClassAndRender("opacity-0");
            setTimeout(() => {
                alert.remove();
            }, 1000);
        }, 4000);
    } else if (err) {
        alert.changeText(err);
        alert.changeClass("alert-success", "alert-danger");
        alert.render();
    }
};

export default afterRequestHandler;