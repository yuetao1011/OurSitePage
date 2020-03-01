$(function() {
  MyCommon.fn.init_tooltip();
  MyCommon.fn.init_img();
  MyCommon.fn.init_toastr();
  MyFormula.fn.init_toolbar();
  MyFormula.fn.render();
  $("#" + MyFormula.fd.codecogsTextarea).on("input", function() {
    MyFormula.fn.render();
  });
  $("#" + MyFormula.fd.codecogsTextarea).focus(function() {
    MyFormula.fn.render();
  });
  $("#" + MyFormula.fd.svgDownloadButton).click(function() {
    if (MyFormula.fn.isInputNull()) {
      toastr.clear();
      toastr.info("没有发现任何Latex表达式");
    } else {
      try {
        MyFormula.fn.downloadSVG();
        toastr.clear();
        toastr.success("已下载SVG文件");
      } catch (err) {
        console.log(err);
        toastr.clear();
        toastr.error("下载失败");
      }
    }
  });
  $("#" + MyFormula.fd.pngDownloadButton).click(function() {
    if (MyFormula.fn.isInputNull()) {
      toastr.clear();
      toastr.info("没有发现任何Latex表达式");
    } else {
      try {
        MyFormula.fn.downloadPNG();
        toastr.clear();
        toastr.success("已下载PNG文件");
      } catch (err) {
        console.log(err);
        toastr.clear();
        toastr.error("下载失败");
      }
    }
  });
  $("#" + MyFormula.fd.copyMathmlButton).click(function() {
    if (MyFormula.fn.isInputNull()) {
      toastr.clear();
      toastr.info("没有发现任何Latex表达式");
    } else {
      try {
        toastr.clear();
        toastr.warning("有个小问题");
      } catch (err) {
        console.log(err);
        toastr.clear();
        toastr.error("失败了");
      }
    }
  });
});

var MyFormula = {
  fd: {
    EDTIOR_DESIGN: "bin,sym,for,sub,acc,ace,arr,ope,bra,gel,geu,rel,mat,geo",
    mathjaxOutput: "wrapper_output_mathjax", //输出mathjax（带右键菜单）的div
    codecogsToolbar: "wrapper_toolbar_codecogs", //渲染codecogs工具栏的div
    codecogsTextarea: "txta_input_codecogs", //codecogs用于接收latex表达式的textarea
    codecogsHiddenImg: "img_output_codecogs", //codecogs用于实时预览的img
    svgDownloadButton: "btn_download_svg", //用于下载svg的button
    pngDownloadButton: "btn_download_png", //用于下载png的button
    copyMathmlButton: "btn_copy_mathml", //用于将MathML代码复制到剪切板的button
    hiddenDownloadLink: "a_download_hidden", //用于模拟下载动作的隐藏链接
    emptyImg: "wrapper_show_emptyimg", //用于容纳填充位置的空内容图片的div
    xmlHeader:
      "<" + '?xml version="1.0" encoding="UTF-8" standalone="no" ?' + ">\n", //用于构建svg文件的文件头
    svgSource: "", //克隆出来用于其他操作的svg元素（已调整过宽高）
    downloadFileNamePrefix: "MommyTalkLatex" //下载文件前缀
  },
  fn: {
    /** 初始化公式工具栏 */
    init_toolbar: function() {
      EqEditor.embed(
        MyFormula.fd.codecogsToolbar,
        "",
        MyFormula.fd.EDTIOR_DESIGN,
        "zh-cn"
      );
      EqEditor.add(
        new EqTextArea(
          MyFormula.fd.codecogsHiddenImg,
          MyFormula.fd.codecogsTextarea
        ),
        false
      );
    },
    /** 渲染mathjax预览 */
    render: function() {
      if (MyFormula.fn.isInputNull()) {
        $("#" + MyFormula.fd.emptyImg).show();
        $("#" + MyFormula.fd.mathjaxOutput).hide();
      } else {
        $("#" + MyFormula.fd.emptyImg).hide();
        $("#" + MyFormula.fd.mathjaxOutput).show();
        MyFormula.fn.toMathjax();
      }
    },
    /** 输入框是否为空 */
    isInputNull: function() {
      let input = document
        .getElementById(MyFormula.fd.codecogsTextarea)
        .value.trim();
      return input == "" ? true : false;
    },
    /** 文本转svg输出 */
    toSVG: function() {
      let input = document
        .getElementById(MyFormula.fd.codecogsTextarea)
        .value.trim();
      //let input='\\begin{matrix}'+input_+'\\end{matrix}';
      let output = document.getElementById(MyFormula.fd.svgOutput);
      output.innerHTML = "";
      let options = {};
      let node = MathJax.tex2svg(input, options);
      let elsvg = node.firstElementChild;
      elsvg.setAttribute("width", "100%");
      elsvg.setAttribute("height", "70px");
      elsvg.removeAttribute("style");
      elsvg.removeAttribute("focusable");
      elsvg.removeAttribute("role");
      output.appendChild(elsvg);
      let htmltemp = elsvg.innerHTML;
      let eltemp = elsvg.cloneNode();
      eltemp.setAttribute("width", "1920px");
      eltemp.setAttribute("height", "1080px");
      eltemp.innerHTML = htmltemp;
      MyFormula.fd.svgSource = eltemp;
    },
    /** 文本转mathjax输出（svg模式）*/
    toMathjax: function() {
      let input_1 = document
        .getElementById(MyFormula.fd.codecogsTextarea)
        .value.trim();
      //let input_2 = "\\begin{align}" + input_1 + "\\end{align}";
      //let input_3 = input_2.replace(new RegExp("\\\\\\\\", "g"), "abc");
      let reg = /\\begin{.{1}matrix}([\s\S]*?)\\end{.{1}matrix}/i;

      let rep = input_1.replace(reg, function(input_1) {
        let ne = "";
        let len = input_1.length;
        for (let i = 0; i < len; i++) {
          ne += "*";
        }
        return ne;
      });
      console.log(rep);
      //console.log(input_1.match(reg));

      let input = input_1;
      let output = document.getElementById(MyFormula.fd.mathjaxOutput);
      output.innerHTML = "";
      MathJax.texReset();
      let options = MathJax.getMetricsFor(output);
      options.display = true;
      MathJax.tex2svgPromise(input, options)
        .then(function(node) {
          output.appendChild(node);
        })
        .catch(function(err) {
          output
            .appendChild(document.createElement("pre"))
            .appendChild(document.createTextNode(err.message));
        })
        .then(function() {});
    },
    /** 下载svg */
    downloadSVG: function() {
      let hiddenLink = document.getElementById(MyFormula.fd.hiddenDownloadLink);
      if (hiddenLink.href) URL.revokeObjectURL(hiddenLink.href);
      let svgSourceCodeToDownload =
        MyFormula.fd.xmlHeader + MyFormula.fd.svgSource.outerHTML;
      let blob = new Blob([svgSourceCodeToDownload], {
        type: "image/svg+xml"
      });
      hiddenLink.href = URL.createObjectURL(blob);
      hiddenLink.download =
        MyFormula.fd.downloadFileNamePrefix + MyFormula.fn.getTimeStamp();
      +MyFormula.fn.getRandomNum(1, 100).toString() + ".svg";
      hiddenLink.click();
    },
    /** 下载png */
    downloadPNG: function() {
      let svgXml = MyFormula.fd.svgSource.outerHTML;
      let image = new Image();
      image.src =
        "data:image/svg+xml;base64," +
        window.btoa(unescape(encodeURIComponent(svgXml)));
      image.onload = function() {
        let canvas = document.createElement("canvas");
        canvas.width = 3840;
        canvas.height = 2160;
        let context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, 3840, 2160);
        let hiddenLink = document.getElementById(
          MyFormula.fd.hiddenDownloadLink
        );
        hiddenLink.href = canvas.toDataURL("image/png");
        hiddenLink.download =
          MyFormula.fd.downloadFileNamePrefix + MyFormula.fn.getTimeStamp();
        +MyFormula.fn.getRandomNum(1, 100).toString() + ".png";
        hiddenLink.click();
      };
    }
  }
};
