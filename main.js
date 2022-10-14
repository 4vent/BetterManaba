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

/** @typedef {{title: String, cource: String, title_link: String, cource_link: String, due: int}} assignment_detail */
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

    // Object.values(asgmts).forEach(asgmt => {
    //     asgmt.forEach(detail => {
    //         console.log(detail.title + " | " + detail.cource + " | " + detail.due);
    //     })
    // })
}

function genManabaTable(title, tabs) {
    const body = document.getElementsByClassName('contentbody-left')[0]
    const ref_elem = body.children[0];
    var div = document.createElement('div');
    body.insertBefore(div, ref_elem);
    div.innerHTML = 
        `
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

    return div.children[0].children[3].children[0].children[0].children[0]
}

async function main() {
    const asgmts = await getManabaAsgments()
    const tbody = genManabaTable('未提出課題')
    /** @type {assignment_detail[]} */
    var marged_asgmts = asgmts.query;
    marged_asgmts = marged_asgmts.concat(asgmts.report, asgmts.survey);

    //①要素を変数保持
    let result = Object.keys(marged_asgmts).map(function(key) {
        return marged_asgmts[key];
    //②dateでソート
    }).sort(function(a, b) {
        return (a.due < b.due) ? -1 : 1;  //オブジェクトの昇順ソート
    });

    Object.values(result).forEach(asgmt => {
        const due = asgmt.due
        const now = new Date().getTime()
        const expredIn = due - now
        const expredTxt = (expredIn < 3600000) ? String(Math.round(expredIn / 60000)) + "分後" :
                          (expredIn < 86400000) ? String(Math.round(expredIn / 3600000)) + "時間後" :
                          (expredIn < 2592000000) ? String(Math.round(expredIn / 86400000)) + "日後" :
                          String(Math.round(expredIn / 2592000000)) + "ヶ月後";
        var bgcolor, dateColor;
        if      (expredIn < 0.5 * 24 * 3600000) {bgcolor = "ee99ff"; dateColor = "47266e";}
        else if (expredIn < 1.5 * 24 * 3600000) {bgcolor = "f19ca7"; dateColor = "6c272d";}
        else if (expredIn < 3   * 24 * 3600000) {bgcolor = "ffe9a9"; dateColor = "866629";}
        else if (expredIn < 5   * 24 * 3600000) {bgcolor = "a3e6e6"; dateColor = "006948";}
        const tr = document.createElement("tr")
        tr.setAttribute("style", "background-color: #" + bgcolor);
        tr.innerHTML = `
            <td style="width: 60px">
                <div class="news-courseinfo" style="width: 60px; color: #${dateColor}; ${(expredIn < 5 * 24 * 3600000) ? 'font-weight: bold;' : ''}">
                    ${expredTxt}
                </div>
            </td>
            <td style="width: auto">
                <div class="news-title newsentry" style="width: auto">
                    <img src="/icon-coursedeadline-on.png" class="inline" /><a class="inline" style="width: auto" href="${asgmt.title_link}">${asgmt.title}</a>
                </div>
            </td>
            <td style="width: 200px">
                <div class="news-courseinfo" style="width: 200px">
                    <a href="${asgmt.cource_link}">${asgmt.cource}</a>
                </div>
            </td>
        `

        tbody.appendChild(tr)
    })
}

if (document.URL == "https://ct.ritsumei.ac.jp/ct/home" || document.URL == "https://ct.ritsumei.ac.jp/ct/home_course") {
    main();
}
