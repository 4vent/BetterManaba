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
        const expredTxt = (expredIn < 3600000) ? String(Math.floor(expredIn / 60000)) + "分" :
                          (expredIn < 86400000) ? String(Math.floor(expredIn / 3600000)) + "時間" :
                          (expredIn < 2592000000) ? String(Math.floor(expredIn / 86400000)) + "日" :
                          String(Math.floor(expredIn / 2592000000)) + "ヶ月";

        const td1 = document.createElement("td");
            td1.setAttribute("style", "width: 60px")
            const div1 = document.createElement("div")
                div1.setAttribute("class", "news-courseinfo")
                div1.setAttribute("style", "width: 60px")
                if (expredIn < 0.5 * 24 * 3600000) div1.setAttribute("style", "width: 60px; color: #6c2463");
                else if (expredIn < 1.5 * 24 * 3600000) div1.setAttribute("style", "width: 60px; color: #6a1917");
                else if (expredIn < 3 * 24 * 3600000) div1.setAttribute("style", "width: 60px; color: #665a1a");
                else if (expredIn < 5 * 24 * 3600000) div1.setAttribute("style", "width: 60px; color: #00608d");
                else div1.setAttribute("style", "width: 60px");
                div1.textContent = expredTxt
            td1.appendChild(div1)
        const td2 = document.createElement("td");
            td2.setAttribute("style", "width: auto;")
            const div2 = document.createElement("div")
                div2.setAttribute("class", "news-title newsentry")
                div2.setAttribute("style", "width: auto;")
                const img2 = document.createElement("img")
                    img2.setAttribute("src", "/icon-coursedeadline-on.png")
                    img2.setAttribute("class", "inline")
                const a2 = document.createElement("a")
                    a2.setAttribute("class", "inline")
                    a2.setAttribute("style", "width: auto")
                    a2.href = asgmt.title_link
                    a2.textContent = asgmt.title
                div2.appendChild(img2); 
                div2.appendChild(a2)
            td2.appendChild(div2)
        const td3 = document.createElement("td")
            td3.setAttribute("style", "width: 200px")
            const div3 = document.createElement("div")
                div3.setAttribute("class", "news-courseinfo")
                div3.setAttribute("style", "width: 200px")
                const a3 = document.createElement("a")
                    a3.textContent = asgmt.cource
                    a3.href = asgmt.cource_link
                div3.appendChild(a3)
            td3.appendChild(div3)
        const tr = document.createElement("tr")
            if (expredIn < 0.5 * 24 * 3600000) tr.setAttribute("style", "background-color: #e0c1ff");
            else if (expredIn < 1.5 * 24 * 3600000) tr.setAttribute("style", "background-color: #ffc1c1");
            else if (expredIn < 3 * 24 * 3600000) tr.setAttribute("style", "background-color: #ffffc1");
            else if (expredIn < 5 * 24 * 3600000) tr.setAttribute("style", "background-color: #c1ffff");
            
            tr.appendChild(td1)
            tr.appendChild(td2)
            tr.appendChild(td3)

        tbody.appendChild(tr)
    })
}

if (document.URL == "https://ct.ritsumei.ac.jp/ct/home" || document.URL == "https://ct.ritsumei.ac.jp/ct/home_course") {
    main();
}
