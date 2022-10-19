function getTextBlockHTML() {
    return `
        <div class="my-infolist my-infolist-searchall">
            <div class="my-infolist-header">
                <h2>出席カード</h2>
            </div>
            <div class="my-infolist-body"><div style="padding:10px; text-align:right" class="newssearch-box">
                <input type="text" name="attendance" class="editable" placeholder="出席カード番号" style="width: 140px;">
                <input type="button" name="attendance" value="✈️" style="height: 20px;" onclick="onClickEasyAttendanceButton();">
            </div></div>
        </div>
    `
}

/** @type {HTMLInputElement} */
var easyAttendanceInputField;

function main() {
    const div = document.createElement("div");
    div.innerHTML = getTextBlockHTML();
    const right_body = document.getElementsByClassName("contentbody-right")[0];
    right_body.insertBefore(div, right_body.children[0]);
    easyAttendanceInputField = div.getElementsByClassName("editable")[0]
}

const onClickEasyAttendanceButton = () => {
    const num = easyAttendanceInputField.value;
    window.open("https://ctat.ritsumei.ac.jp/attend/ctat?lang=ja&code=" + num);
}

if (document.URL == "https://ct.ritsumei.ac.jp/ct/home" || document.URL == "https://ct.ritsumei.ac.jp/ct/home_course") {
    main();
}