const _1SEC = 1000;
const _1MIN = 60 * _1SEC;
const _1HUR = 60 * _1MIN;
const _1DAY = 24 * _1HUR;
const _1MON = 30 * _1DAY;

const EXPIRE_CRISIS =  3 * _1HUR;
const EXPIRE_DANGER = 12 * _1HUR;
const EXPIRE_RISKY  = 1.5 * _1DAY
const EXPIRE_WARN   = 3.5 * _1DAY;
const EXPIRE_INFO   = 7.5 * _1DAY;

function getManabaTableHTML(title) {
    return `
    <div class="my-infolist my-infolist-coursenews">
        <div class="my-infolist-header">
            <h2>${title}</h2>
        </div>
        <ul class="infolist-tab">
            <li class="current"><a href="" onclick="">すべて</a> </li> 
        </ul>
        <div class="align">
            <span></span>
        </div>
        <div class="my-infolist-body"><div class="groupthreadlist"><table><tbody>
        </tbody></table></div></div>
        <div class="showmore" hidden>
            <img src="/icon_mypage_showmore.png" alt="" class="inline" title="">
            <a href="home_coursenews_?nocategoryonly=&amp;categoryid=">あああ</a>
        </div>
    </div>
    `
}

/**
 * @param {String} dateColor 
 * @param {Boolean} isBold 
 * @param {String} expredTxt 
 * @param {String} title 
 * @param {String} title_link 
 * @param {String} course 
 * @param {String} cource_link 
 * @returns 
 */
function getManabaTableRowHTML(dateColor, textColor, isBold, expredTxt, title, title_link, course, cource_link) {
    return `
        <td style="width: 60px">
            <div class="news-courseinfo" style="width: 120px; color: #${dateColor}; font-family: monospace;${(isBold) ? 'font-weight: bold;' : ''}">
                ${expredTxt}
            </div>
        </td>
        <td style="width: auto">
            <div class="news-title newsentry" style="width: auto">
                <img src="/icon-coursedeadline-on.png" class="inline" />
                <a class="inline" style="width: auto;${(textColor == undefined)? '' : (' color: #' + textColor)}" href="${title_link}">${title}</a>
            </div>
        </td>
        <td style="width: 200px">
            <div class="news-courseinfo" style="width: 200px">
                <a href="${cource_link}"${(textColor == undefined)? '' : (' style="color: #' + textColor + '"')}>${course}</a>
            </div>
        </td>
    `
}

/** @typedef {{title: String, cource: String, title_link: String, cource_link: String, due: int}} assignment_detail */

/** 
 * @param {str} url
 * @returns {Promise.<Document>}
 */
function getHTMLDoc(url) {
    return new Promise(resolve => 
        fetch(url)
            .then(res => res.text())
            .then(text => resolve(new DOMParser().parseFromString(text, "text/html")))
    );
}

/** @param {Document} manaba_document */
function parseManabaAsgmtDetails(manaba_document) {
    const table = manaba_document.getElementsByClassName("stdlist")[0];
    /** @type {assignment_detail[]} */
    var details = []
    Array.from(table.children[0].children).forEach(elem => {
        /** @type {Object.<string, string>} */
        var detail = {};
        if (elem.className != "title") {
            const link = elem.children[0].getElementsByTagName("a")[0].getAttribute("href");
            detail.title = String(elem.children[0].textContent.match(/[^ \n].*[^ \n]/));
            detail.title_link = link
            detail.cource = elem.children[1].textContent;
            detail.cource_link = link.match(/.*course_[0-9]+/);
            detail.due = new Date(elem.children[2].textContent.replace(/-/g, "/")).getTime();
            details.push(detail);
        }
    })
    return details
}

async function getManabaAsgments() {
    const types = ["query", "survey", "report"];
    /**@type {{query: assignment_detail[], survey: assignment_detail[], report: assignment_detail[]}} */
    var asgmts = {}
    await Promise.all(types.map(type => new Promise(async resolve => {
        const doc = await getHTMLDoc("home_summary_" + type);
        const details = parseManabaAsgmtDetails(doc);
        asgmts[type] = details;
        resolve();
    })));
    return asgmts
}

function genManabaTable(title) {
    const body = document.getElementsByClassName('contentbody-left')[0]
    const ref_elem = body.children[0];
    var div = document.createElement('div');
    body.insertBefore(div, ref_elem);
    div.innerHTML = getManabaTableHTML(title)

    return div.children[0].children[3].children[0].children[0].children[0]
}

/** @param {int} value @param {int} dig */
function zfill(value, dig) {
    const txt = String(value)
    if (txt.length > dig) return txt;
    else return (Array(dig).join('0') + value).slice(-dig);
}
/** @param {int} value @param {int} dig */
function sfill(value, dig) {
    const txt = String(value)
    if (txt.length > dig) return txt;
    else return (Array(dig).join('0') + value).slice(-dig);
}

/** @param {HTMLTableElement} tbody */
function updateDeadline(tbody, marged_asgmts) {
    Array.from(tbody.children).forEach(c => tbody.removeChild(c));
    Object.values(marged_asgmts).forEach(asgmt => {
        const due = asgmt.due
        const now = new Date().getTime()
        const expredIn = due - now
        const expredTxt = (expredIn < _1DAY)? "残り" + zfill(Math.floor(expredIn / _1HUR) % 24, 2) + ":"
                                                     + zfill(Math.floor(expredIn / _1MIN) % 60, 2) + ":"
                                                     + zfill(Math.floor(expredIn / _1SEC) % 60, 2) : 
                          (expredIn < EXPIRE_WARN)? String(Math.floor(expredIn / _1DAY) % 30) + "日と"
                                                    + String(Math.floor(expredIn / _1HUR) % 24) + "時間" :
                          (expredIn < _1MON)?       String(Math.floor(expredIn / _1DAY) % 30) + "日後" :
                                                    String(Math.floor(expredIn / _1MON)) + "ヶ月後"
        var bgcolor, dateColor, textColor;
        if      (expredIn < EXPIRE_CRISIS) {bgcolor = "000000"; dateColor = "ef857d"; textColor = "ef857d";}
        else if (expredIn < EXPIRE_DANGER) {bgcolor = "ee99ff"; dateColor = "47266e";}
        else if (expredIn < EXPIRE_RISKY ) {bgcolor = "f19ca7"; dateColor = "6c272d";}
        else if (expredIn < EXPIRE_WARN  ) {bgcolor = "ffe9a9"; dateColor = "866629";}
        else if (expredIn < EXPIRE_INFO  ) {bgcolor = "a3e6e6"; dateColor = "006948";}
        const tr = document.createElement("tr")
        tr.setAttribute("style", "background-color: #" + bgcolor);
        tr.innerHTML = getManabaTableRowHTML(dateColor, textColor, (expredIn < 5 * 24 * 3600000), expredTxt,
                                            asgmt.title, asgmt.title_link, asgmt.cource, asgmt.cource_link)

        tbody.appendChild(tr);
        setTimeout
    });
}

async function main() {
    const asgmts = await getManabaAsgments()
    const tbody = genManabaTable('未提出課題')
    /** @type {assignment_detail[]} */
    var marged_asgmts = asgmts.query;
    marged_asgmts = marged_asgmts.concat(asgmts.report, asgmts.survey);

    let result = Object.keys(marged_asgmts)
        .map(key => marged_asgmts[key])
        .sort((a, b) => (a.due < b.due) ? -1 : 1);
    
    updateDeadline(tbody, result);
    setInterval(() => updateDeadline(tbody, result), 1000);
}

if (document.URL == "https://ct.ritsumei.ac.jp/ct/home" || document.URL == "https://ct.ritsumei.ac.jp/ct/home_course") {
    main();
}
