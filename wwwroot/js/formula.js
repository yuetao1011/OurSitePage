$(function() {
  MyCommon.fn.init();
  MyFormula.fn.render();
  $("#" + MyFormula.fd.input).on("input", function() {
    MyFormula.fn.render();
  });
  $("#" + MyFormula.fd.input).focus(function() {
    MyFormula.fn.render();
  });
  $("#" + MyFormula.fd.svgbtn).click(function() {
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
  $("#" + MyFormula.fd.pngbtn).click(function() {
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
  $("#" + MyFormula.fd.copyMLbtn).click(function() {
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
  $("#" + MyFormula.fd.copySVGbtn).click(function() {});

});

var MyFormula = {
  fd: {
    input: "txta_input_codecogs", //用于接收latex表达式的textarea
    empty: "wrapper_output_empty", //用于容纳填充位置的空内容图片的div
    output: "wrapper_output_mathjax", //用于输出mathjax的div

    svgbtn: "btn_download_svg", //用于下载svg文件的button
    pngbtn: "btn_download_png", //用于下载png的button
    copyMLbtn: "btn_copy_mathml", //用于将MathML代码复制到剪切板的button
    copySVGbtn: "btn_copy_svg", //用于将svg源码复制到剪切板的button

    hidLink: "a_download_hidden", //用于模拟下载动作的隐藏链接

    svgSource: "", //克隆出来用于其他操作的svg元素（已调整过宽高）
    namePrefix: "MommyTalkLatex" //下载文件前缀
  },
  fn: {
    /** 渲染mathjax预览 */
    render: function() {
      if (MyFormula.fn.isInputNull()) {
        $("#" + MyFormula.fd.empty).show();
        $("#" + MyFormula.fd.output).hide();
      } else {
        $("#" + MyFormula.fd.empty).hide();
        $("#" + MyFormula.fd.output).show();
        MyFormula.fn.toMathjax();
      }
    },
    /** 下载svg */
    downloadSVG: function() {
      let xmlHeader =
        "<" + '?xml version="1.0" encoding="UTF-8" standalone="no" ?' + ">\n";
      let hiddenLink = document.getElementById(MyFormula.fd.hiddenDownloadLink);
      if (hiddenLink.href) URL.revokeObjectURL(hiddenLink.href);
      let svgSourceCodeToDownload =
        xmlHeader + MyFormula.fd.svgSource.outerHTML;
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
    },
    /** 文本转Mathjax并填充页面元素 */
    toMathjax: function() {
      let input = MyFormula.fn.getLatex();
      console.log(input);
      let output = document.getElementById(MyFormula.fd.output);
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
        });
    },
    /** 文本转svg并填充虚拟元素 */
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
    /** 获取正则加工过的表达式 */
    getLatex() {
      let regMatrix = /\\begin{.{1}matrix}([\s\S]*)\\end{.{1}matrix}/gi;
      let input = document.getElementById(MyFormula.fd.input).value.trim(); //原始
      let mch = input.match(regMatrix);
      if (mch != null) {
        input_temp = input.match(regMatrix)[0]; //提取矩阵部分存储起来
        input = input.replace(regMatrix, function() {
          //矩阵部分替换成符号
          return "pandassign";
        });
        input = input.replace(new RegExp("\\\\\\\\", "g"), "\\\\" + "&"); //剩余的双斜杠替换成双斜杠+对齐符号
        input = input.replace(new RegExp("pandassign", "g"), input_temp); //符号替换回矩阵
      } else {
        input = input.replace(new RegExp("\\\\\\\\", "g"), "\\\\" + "&"); //剩余的双斜杠替换成双斜杠+对齐符号
      }
      input = "\\begin{align}&" + input + "\\end{align}";
      return input;
    },
    /** 输入框是否为空 */
    isInputNull: function() {
      let val = document.getElementById(MyFormula.fd.input).value.trim();
      return val == "" ? true : false;
    }
  }
};
