var MyCommon = {
  fd: {},
  fn: {
    init: function() {
      MyCommon.fn.init_tooltip();
      MyCommon.fn.init_img();
      MyCommon.fn.init_toastr();
    },
    /** 初始化气泡提示 */
    init_tooltip: function() {
      $('[data-toggle="tooltip"]').tooltip();
    },
    /** 初始化禁止图片拖动 */
    init_img: function() {
      var imgs = document.getElementsByTagName("img");
      let len = imgs.length;
      for (let i = 0; i < len; i++) {
        imgs[i].oncontextmenu = function() {
          return false;
        };
        imgs[i].ondragstart = function() {
          return false;
        };
      }
    },
    init_toastr: function() {
      toastr.options = {
        closeButton: true, //是否显示关闭按钮
        debug: false, //是否使用debug模式
        progressBar: false,
        positionClass: "toast-top-center", //弹出窗的位置
        onclick: null,
        showDuration: "300", //显示的动画时间
        hideDuration: "1000", //消失的动画时间
        timeOut: "1200", //展现时间
        extendedTimeOut: "1", //加长展示时间
        showEasing: "swing", //显示时的动画缓冲方式
        hideEasing: "linear", //消失时的动画缓冲方式
        showMethod: "fadeIn", //显示时的动画方式
        hideMethod: "fadeOut" //消失时的动画方式
      };
    },
    /** 获得时间戳 */
    getTimeStamp: function() {
      return new Date().getTime().toString();
    },
    /* 获取最小值到最大值之前的整数随机数 */
    getRandomNum: function(min, max) {
      let range = max - min;
      let rand = Math.random();
      return min + Math.round(rand * range);
    }
  }
};
