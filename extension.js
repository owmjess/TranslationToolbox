// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var request = require('request');

function hashCode(text) {
    var n = 0, t, i, r;
    if (text.length === 0)
        return n;
    for (t = 0,
    r = text.length; t < r; t++)
        i = text.charCodeAt(t),
        n = (n << 5) - n + i | 0;
    return n;
}

function b(a, b) {
    for (var d = 0; d < b.length - 2; d += 3) {
        var c = b.charAt(d + 2),
        c = 'a' <= c ? c.charCodeAt(0) - 87 : Number(c),
        c = '+' == b.charAt(d + 1) ? a >>> c : a << c;
        a = '+' == b.charAt(d) ? a + c & 4294967295 : a ^ c
    }
    return a
}
function tk(a, TKK) {
    for (var e = TKK.split('.'), h = Number(e[0]) || 0, g = [], d = 0, f = 0; f < a.length; f++) {
        var c = a.charCodeAt(f);
        128 > c ? g[d++] = c : (2048 > c ? g[d++] = c >> 6 | 192 : (55296 == (c & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512) ? (c = 65536 + ((c & 1023) << 10) + (a.charCodeAt(++f) & 1023), g[d++] = c >> 18 | 240, g[d++] = c >> 12 & 63 | 128)  : g[d++] = c >> 12 | 224, g[d++] = c >> 6 & 63 | 128), g[d++] = c & 63 | 128)
    }
    a = h;
    for (d = 0; d < g.length; d++) a += g[d],a = b(a, '+-a^+6');
    a = b(a, '+-3^+b+-f');
    a ^= Number(e[1]) || 0;
    0 > a && (a = (a & 2147483647) + 2147483648);
    a %= 1000000;
    return a.toString() + '.' + (a ^ h)
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "translation" is now active!');

    // translatebyGoogle("hello");

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
     var transDisposable = vscode.commands.registerCommand('translationtoolbox.translate', function () {
        // The code you place here will be executed every time your command is executed

        console.log("translationtoolbox.translate");

    });

    context.subscriptions.push(transDisposable);
    // 调用
    hover2translate();

}

function hover2translate() {
    // 保存上一次选择的内容，防止重复请求
    let preSelection="";
    let preResult="";
    vscode.languages.registerHoverProvider('*', {
		provideHover(document, position, token) {
			// 不可以获取选取的内容，而只是hover的内容
			// let text=document.getText(document.getWordRangeAtPosition(position));
			// 获取当前选择的内容
			let selection = document.getText(vscode.window.activeTextEditor.selection)
            console.log("selection:",selection);
            console.log("preSelection:",preSelection);
            if (selection != "" && selection != " ") {
                preSelection = selection;
                // let texts = selection.split(/\s+/);
                if (false) {

                } else {
                    // 句子时
                    var encodeText=selection;
                    var translations = {};
                    return translatebyBing(encodeText).then(function (result) {
                        console.log(result);
                        translations["Bing"]=result;
                        return result;
                    }).then(function () {
                        let allResult = "";
                        for (var key in translations) {
                            if (translations.hasOwnProperty(key)) {
                                var element = translations[key];
                                allResult = allResult +"["+ key +"]\n"+element+"\n";
                            }
                        }
                        console.log(allResult);
                        preResult = allResult;
                        return new vscode.Hover({language:"markdown",value:allResult});
                    }) .catch(function(err){
                        console.log(err);
                        return new vscode.Hover({language:"markdown",value:"出错了"});
                    });

                }

            } else {
                console.log("鼠标发生了移动");
                // 当前Hover的内容
                let cHover = document.getText(document.getWordRangeAtPosition(position));
                if (selection.indexOf(cHover) != -1) {
                    return new vscode.Hover({language:"markdown",value:preResult});
                }
            }

		}
	});
}

function translatebyBaiDu(text) {
    return new Promise(function (resolve,reject) {
        let BaiduUrl = "http://fanyi.baidu.com/v2transapi";
        request.post({
            url:BaiduUrl,
            formData:{
                from:'en',
                to:'zh',
                query:text,
                transtype:'realtime',
                simple_means_flag:3
            }},function (e,r,body) {
            // console.log(body);
            if (!e && body != "") {
                let result = JSON.parse(body);
                let translation = result.trans_result.data[0].dst;
                // console.log(translation);
                resolve(translation);
            }
        });
    });
}

function translatebyGoogle(text) {

    // console.log(googleUrl);
    return new Promise(function (resolve,reject) {
        // 获取tkk
        request.get("https://translate.google.cn/",function (e,r,body) {
            // console.log(e);
            // console.log(request.statusCode);
            let TKK = body.match(/TKK=eval\(\'(.*?)\'\);/);
            let _tkk = "";
            if (TKK) {
                let tkk = TKK[1].replace(/\\x3d/g,"=").replace(/\\x27/g,"\'");
                // console.log(tkk);
                _tkk = eval(tkk);
            } else {
                return ;
            }
            // console.log(_tkk);
            let _tk = tk(text,_tkk);
            // console.log(_tk);

            let googleAPI="http://translate.google.cn/translate_a/single?client=t&sl=en&tl=zh-CN&hl=zh-CN&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk="+_tk+"&q=";
            let googleUrl=googleAPI + text;
            googleUrl = encodeURI(googleUrl);
            // console.log(googleUrl);
            var options = {
                // url: "http://translate.google.cn/translate_a/single?client=t&sl=en&tl=zh-CN&hl=zh-CN&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&pc=1&otf=1&ssel=0&tsel=0&kc=1&tk=6528.414811&q=hello%20world",
                url : googleUrl,
                headers: {
                    // "Accept-Language":"zh-CN,zh;q=0.8",
                    // "Host":"translate.google.cn",
                    // "Referer":"http://translate.google.cn/",
                    // 不知道为什么非要加上这一个请求头，才能将请求的ip地址引向中国的服务器。。。
                    "User-Agent":"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
                }
            };
            request.get(options, function (error, response, body) {
                // console.log(response);
                // 不能直接使用body，因为返回的不是json，会解析出错而为
                if (response.statusCode == 200) {
                    // console.log(eval(body));
                    let evalbody = eval(body);
                    let result = evalbody[0][0][0];
                    // console.log(result);
                    resolve(result);
                }
            });
        });
    });

}

function translatebyBing(text) {
    // bing

    return new Promise(function (resolve,reject) {
        // 获取cookie
        var j = request.jar()
        let cookieUrl = "http://www.bing.com/translator/?_=1487063092407";
        request({url: cookieUrl, jar: j}, function () {
            // var cookie_string = j.getCookieString(cookieUrl); // "key1=value1; key2=value2; ..."
            // var cookies = j.getCookies(url);
            // console.log(cookie_string);
            // [{key: 'key1', value: 'value1', domain: "www.google.com", ...}, ...]
            let bingURl = "http://www.bing.com/translator/api/Translate/TranslateArray?from=-&to=zh-CHS";
            let id = hashCode(text);
            let postData = [{"id":id,"text":text}];
            // console.log(postData);

            let bing_options = {
                body: postData,
                json: true,
                url: bingURl,
                jar: j
            }
            request.post(bing_options,function (e, r, body) {
                if (!e && body) {
                    let text = body.items[0].text;
                    resolve(text);
                    // console.log(text);
                    // vscode.window.showInformationMessage("bing: "+text);
                }
            });
            // post_req.write(JSON.stringify([{"id":1794106052,"text":"hello world"}]));

        });
    });
}

function translatebyYouDao(text) {
    // 有道
    return new Promise(
        function (resolve) {
            let youdaoUrl="http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&smartresult=ugc&sessionFrom=null";
            request.post(youdaoUrl, {form:{type:"AUTO",i:text,doctype:"json",xmlVersion:"1.8",keyfrom:"fanyi.web",ue:"UTF-8",action:"FY_BY_CLICKBUTTON",typoResult:"true"}},function (e, r, body) {
                // console.log(r);
                // console.log(body);
                if (body.trim() != "") {
                    let result = JSON.parse(body.trim());
                    let smartResult = result.smartResult;
                    if (smartResult) {
                        let texts =smartResult.entries;
                        let jointexts = texts.join(";\n");
                        resolve(jointexts);
                    } else {
                        let text = result.translateResult[0][0].tgt;
                        resolve(text);
                    }
                }
            });
        }
    );
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;