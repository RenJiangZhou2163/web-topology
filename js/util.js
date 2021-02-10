/**
 * 获取系统路径
 * @type {{getRootPath: SysUtil.getRootPath}}
 */
var SysUtil = {
    getRootPath: function () {
        var curWwwPath = window.document.location.href;  // 获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var pathName = window.document.location.pathname;  // 获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pos = curWwwPath.indexOf(pathName, 7);
        var localhostPath = curWwwPath.substring(0, pos);  // 获取主机地址，如： http://localhost:8083
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 2);  // 获取带"/"的项目名，如：/uimcardprj
        return localhostPath + projectName;
    }
};

//js国际化,加载属性文件
SysUtil.loadProperties = function (lang) {
    jQuery.i18n.properties({
        name: 'js',
        path: rootPath + 'js/i18n/',
        mode: 'map',
        language: lang,
        callback: function () {
            // 加载成功后设置显示内容
        }
    });

}
// URL根路径
var rootPath = SysUtil.getRootPath();
var topoImgPath = '/web-topology/static/img/nodeImage/'

/**
 * 生成uuid算法,碰撞率低于1/2^^122
 * @param x 0-9或a-f范围内的一个32位十六进制数
 * by wenyuan
 */
function generateUUID() {
    var d = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0
        d = Math.floor(d / 16)
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
}

/**
 * 计算程序执行时间
 * @type {{startTime: {}, timeSpan: number, start: Timer.start, stop: Timer.stop, getTimeSpan: Timer.getTimeSpan}}
 * by wenyuan
 */
var Timer = {
    startTime: {},
    stoppedStatus: true,
    start: function () {
        if (this.stoppedStatus) {
            this.startTime = new Date()
            this.stoppedStatus = false
        }
    },
    pause: function () {
        var startTime = this.startTime
        if (startTime) {
            return new Date() - startTime
        } else {
            return -1
        }
    },
    stop: function () {
        var startTime = this.startTime
        if (startTime) {
            this.stoppedStatus = true
            return new Date() - startTime
        } else {
            this.stoppedStatus = true
            return -1
        }
    }
}

// 保存每次load后的页面，出措施恢复当前页面元素
$globalHtmlFragment = "系统繁忙，请稍后重试...";

/*
 * 转向重新登录页面
 */
function handleSessionTimeOut() {
    location.href = rootPath + "topoLogin/login";
}

/*
 * load请求响应的处理：分三种情况 1.前端系统服务异常 2.session超时，包括前端服务和api 3.api调用异常处理
 *
 * @param $globalHtmlFragment 出错前页面的快照，是index.jsp页面下main里面的所有代码包括js
 * @param res load请求返回的html代码
 *  @param status ajax请求状态码 @homePage 登陆页面
 */
function handleLoadResponse(globalHtmlFragment, response, status) {
    // 服务器异常错误处理
    if (status == 'error') {
        if (typeof globalHtmlFragment == "string") {
            $("#main").html(
                "<div id='rightBoxHead' class='boxHead'>"
                + globalHtmlFragment + "</div>");
        }
        jAlert('服务器异常，稍后重试...');
        return;
    }
    if (!response) {
        return;
    }
    // 保存当前页面快照
    if (response && status == "success") {
        // 转换为json对象
        try {
            // 如果无法转换成json对象，说明不是返回的错误
            var res = $.parseJSON(response);
        } catch (e) {
            // 当前页面快照
            $globalHtmlFragment = $("#main > *").clone(true);
            return;
        }
    }

    var err = res.errorInfo;
    // session超时，则重新登录
    if (err == "logout") {
        if (typeof globalHtmlFragment == "string") {
            $("#main").html(
                "<div id='rightBoxHead' class='boxHead'>"
                + globalHtmlFragment + "</div>");
        } else {
            $("#main").empty();
            globalHtmlFragment.appendTo($("#main"));
        }
        handleSessionTimeOut();
    } else {// 普通错误
        $("#main").empty();
        if (typeof globalHtmlFragment == "string") {
            $("#main").html(
                "<div id='rightBoxHead' class='boxHead'>"
                + globalHtmlFragment + "</div>");
        } else {
            //globalHtmlFragment.appendTo($("#main"));
            $("#main").html(globalHtmlFragment);
        }
        jAlert(err);
    }
}

/*
 * 局部请求页面错误处理 将错误信息现实到相应的div中,使用与action标签请求结果处理
 */
function handleLoadResponse4Special(shownDiv, response, status) {
    // 服务器异常错误处理
    if (status == 'error') {
        shownDiv.html("服务器异常，请稍后重试...");
        return;
    }
    if (!response) {
        return;
    }
    // 保存当前页面快照
    if (response && status == "success") {
        // 转换为json对象
        try {
            // 如果无法转换成json对象，说明不是返回的错误
            var res = $.parseJSON(response);
        } catch (e) {
            // 当前页面快照
            $globalHtmlFragment = $("#main > *").clone(true);
            return true;
        }
    }
    var err = res.errorInfo;
    // session超时，则重新登录
    if (err == "logout") {
        shownDiv.html("登陆超时，即将自动登陆...");
        handleSessionTimeOut();
    } else {// 普通错误
        shownDiv.html(err);
    }
}

/**
 * 验证密码 不能为空，必须含有数字、字母、特殊字符,
 *
 * @param v
 * @returns
 */
function checkpassword(v, p, min, max) {
    var flag = 0;
    if (v != p) {
        jAlert("两次输入的密码不一致");
        return false;
    }
    var numasc = 0;
    var charasc = 0;
    var otherasc = 0;
    if (0 == v.length) {
        jAlert("密码不能为空");
        return false;
    } else if (v.length < min || v.length > max) {
        jAlert("密码至少" + min + "个字符,最多" + max + "个字符");
        return false;
    } else {
        for (var i = 0; i < v.length; i++) {
            var asciiNumber = v.substr(i, 1).charCodeAt();
            if (asciiNumber >= 48 && asciiNumber <= 57) {
                numasc += 1;
            }
            if ((asciiNumber >= 65 && asciiNumber <= 90)
                || (asciiNumber >= 97 && asciiNumber <= 122)) {
                charasc += 1;
            }
            if ((asciiNumber >= 33 && asciiNumber <= 47)
                || (asciiNumber >= 58 && asciiNumber <= 64)
                || (asciiNumber >= 91 && asciiNumber <= 96)
                || (asciiNumber >= 123 && asciiNumber <= 126)) {
                otherasc += 1;
            }
        }
        if (numasc != 0) {
            flag++;
        }
        if (charasc != 0) {
            flag++;
        }
        if (otherasc != 0) {
            flag++;
        }
        if (flag < 2) {
            jAlert("密码必须包含数字、字母、字符至少两种");
            return false;
        } else {
            return true;
        }
    }
};