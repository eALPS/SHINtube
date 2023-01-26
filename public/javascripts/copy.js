
async function getCopyList(copy_service=false){
    // サービスまたはクラスのリストを取得して描画に送る
    const request = new XMLHttpRequest()
    if(!copy_service){
        // 選択トップではサービスリストを描画
        request.open('GET', "./servicelist?ltik=" + params.get("ltik"), true)
        document.getElementById("copy-to-list-title").textContent = "サービス"
    }
    else{
        // クラスリストを描画
        request.open('GET', "./classlist?service=" + copy_service + "&ltik=" + params.get("ltik"), true)
        document.getElementById("copy-to-list-title").textContent = "クラス"
    }
    request.onload = async function () {
        if(request.status == 200){
            contents_list = JSON.parse(request.response)
            copyListDraw(contents_list.sort())
        }
    }
    request.send()
}

function copyAlert(){
    document.getElementById("copy-to-list").remove()
    document.getElementById("copy-to-list-title").textContent = "警告"
    document.getElementById("copy-select-back").classList.add("copy-select-back-btn-lock")

    document.getElementById("copy-run-btn").classList.add("overlay-lock-btn")
    document.getElementById("copy-run-btn").textContent = "実行"
    document.getElementById("copy-run-btn").onclick = ""

    let copy_list_div = document.createElement("div")
    copy_list_div.setAttribute("id","copy-to-list")
    document.getElementById("copy-to-list-area").prepend(copy_list_div)

    const copy_result = document.createElement("div")
    copy_result.setAttribute("class","copy-to-result")
    copy_list_div.appendChild(copy_result)

    let request = new XMLHttpRequest()
    request.open('GET', "./CopyAlert", true)
    request.onload = function () {
        if(request.status == 200){
            copy_result.innerHTML = marked.parse(request.response,{breaks: true})
            // シンボリックリンク生成によりコピーに時間がかからないのでチェックはスキップ
            //document.getElementById("copy-run-btn").onclick = copyCheck
            document.getElementById("copy-run-btn").onclick = copyRun
            document.getElementById("copy-run-btn").classList.remove("overlay-lock-btn")
        }
        else{
            copy_result.innerHTML = "取得できませんでした"
        }
        copy_list_div.appendChild(copy_result)
    }
    request.send()
}


function copyListDraw(copy_to_list){
    document.getElementById("copy-to-list").remove()
    let copy_list_div = document.createElement("div")
    copy_list_div.setAttribute("id","copy-to-list")
    document.getElementById("copy-to-list-area").prepend(copy_list_div)

    const _content = document.querySelector('#template-copy').content

    // サービス自身とクラス自身はコピー対象外にするためコメントアウト
    /*
    if(copyToService){
        const new_clone = document.importNode(_content, true)
        const new_copy_to_title = new_clone.querySelector('.copy-to-title')
        new_copy_to_title.textContent = "ここに複製"
        const new_copy_div = new_clone.querySelector('.copy-div')
        new_copy_div.setAttribute("id","new-copy-to")
        new_copy_div.onclick = copyToNext
        copy_list_div.appendChild(new_clone)
    }
    */

    for (const element of copy_to_list) {
        const clone = document.importNode(_content, true)
        const copy_to_title = clone.querySelector('.copy-to-title')
        copy_to_title.textContent = element
        const copy_div = clone.querySelector('.copy-div')
        copy_div.onclick = copyToNext
        copy_list_div.appendChild(clone)
    }
}


// コピー先　最終決定　描画
function copyToDraw(){
    document.getElementById("copy-run-btn").classList.remove("overlay-lock-btn")
    document.getElementById("copy-run-btn").onclick = copyAlert

    document.getElementById("copy-to-list").remove()

    document.getElementById("copy-to-list-title").textContent = "複製先"

    let copy_list_div = document.createElement("div")
    copy_list_div.setAttribute("id","copy-to-list")
    document.getElementById("copy-to-list-area").prepend(copy_list_div)

    // コピー先のディレクトリ名を描画
    const copy_result = document.createElement("div")
    copy_result.setAttribute("class","copy-to-result")
    copy_result.textContent = "/" + copyToService + "/" + copyToClass
    copy_list_div.appendChild(copy_result)  
}

// コピー先サービス
let copyToService = false
// コピー先クラス
let copyToClass = false

function copyToNext(){
    let toTarget = this.querySelector('.copy-to-title').textContent

    // サービス自身とクラス自身はコピー対象外にするためコメントアウト
    /*
    if(this.id == "new-copy-to"){
        toTarget = src_cid
    }
    */

    if(!copyToService){
        copyToService = toTarget
        getCopyList(toTarget)
    }
    else if(!copyToClass){
        copyToClass = toTarget
        copyToDraw()
    }
}

function copyToBack(){
    document.getElementById("copy-run-btn").classList.add("overlay-lock-btn")
    if(copyToClass){
        copyToClass = false
        getCopyList(copyToService)
    }
    else if(copyToService){
        copyToService = false
        getCopyList()
    }
    else{
        copyCancel()
    }
}

function copyOverlayInit(){
    document.getElementById("copy-cancel-btn").addEventListener("click",copyCancel)
    document.getElementById("copy-select-back").addEventListener("click",copyToBack)
}



// コピー先選択オーバレイ
let src_service = false
let src_cid = false
let src_vid_list = false
function copyOverlay(target){
    src_service = params.get("service")
    src_cid = params.get("class")
    src_vid_list = target

    document.getElementById("copy-overlay").classList.add("overlay-on")
    getCopyList()
}

function copyCancel(){
    copyToService = false
    copyToClass = false

    src_service = false
    src_cid = false
    src_vid = false

    document.getElementById("copy-overlay").classList.remove("overlay-on")
    document.getElementById("copy-run-btn").textContent = "複製"
    document.getElementById("copy-run-btn").onclick = ""
    document.getElementById("copy-run-btn").classList.add("overlay-lock-btn")
    document.getElementById("copy-select-back").classList.remove("copy-select-back-btn-lock")
    document.getElementById("copy-err").textContent = ""
}

function copyCheck(){
    let request = new XMLHttpRequest()
    request.open('GET', "./getvideolist?service=" + src_service + "&class=" + src_cid + "&ltik=" + params.get("ltik"), true)
    request.onload = function () {
        if(request.status == 200){
            const copy_check_list = JSON.parse(request.response)
            let copy_stop_flag = false
            if(!src_vid){
                for(const check_vid in copy_check_list){
                    if("status" in copy_check_list[check_vid] && copy_check_list[check_vid].status.indexOf("copying") != -1){
                        copy_stop_flag = true
                    }
                }
            }
            else{
                if(src_vid in copy_check_list && "status" in copy_check_list[src_vid] && copy_check_list[src_vid].status.indexOf("copying") != -1){
                    copy_stop_flag = true
                }
            }

            if(copy_stop_flag){
                document.getElementById("copy-err").textContent = "複製中のファイルがあります。複製終了までお待ちください"
            }
            else{
                copyRun()
            }
        }
        else{
            document.getElementById("copy-err").textContent = "複製チェックに失敗しました"
        }
    }
    request.send()
}


function copyRun(){
    src_vid_list.forEach(src_vid => {
        let request = new XMLHttpRequest()
        request.open('POST', "./copy?src_service=" + src_service + "&src_cid=" + src_cid + "&dst_service=" + copyToService + "&dst_cid=" + copyToClass + (src_vid ? "&src_vid=" + src_vid : "") + "&ltik=" + params.get("ltik"), true)
        request.onload = function () {
            if (request.status == 200) {
            }
            else {
            }
        }
        request.send()
    });

    document.getElementById("copy-err").textContent = "複製しました"
    copyCancel()
}

window.addEventListener("load", function() {
    copyOverlayInit()
})