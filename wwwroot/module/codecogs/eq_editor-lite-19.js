function EqTextArea(preview, input, comment, download, intro) {
    this.changed = false;
    this.orgtxt = '';
    this.bArray_id = new Array();
    this.bArray_area = new Array();
    this.bArray_mode = new Array();
    this.bsize = 0;
    this.updateExportArea = function () {
        for (i = 0; i < this.bsize; i++) {
            var v = this.exportEquation(this.bArray_mode[i]);
            if (this.bArray_area[i].src !== undefined) this.bArray_area[i].src = v;
            else if (this.bArray_area[i].value !== undefined) this.bArray_area[i].value = v;
            else if (this.bArray_area[i].innerHTML !== undefined) this.bArray_area[i].innerHTML = v;
        }
    };
    this.addExportArea = function (textarea_id, mode) {
        var a = EqEditor.$(textarea_id);
        if (a) {
            this.bArray_id[this.bsize] = textarea_id;
            this.bArray_area[this.bsize] = a;
            this.bArray_mode[this.bsize] = mode;
            this.bsize++;
        }
    };
    this.changeExportArea = function (textarea_id, mode) {
        for (i = 0; i < this.bsize; i++) {
            if (textarea_id == this.bArray_id[i]) {
                this.bArray_mode[i] = mode;
                i = this.bsize;
            }
        }
    };
    this.myUndo = 0;
    this.myRedo = 0;
    this.store_text = new Array();
    this.store_text.push("");
    this.addEvent = function (action, fn) {
        if (this.equation_input.addEventListener) this.equation_input.addEventListener(action, fn, false);
        else this.equation_input.attachEvent('on' + action, fn);
    };
    this.set = function (preview, input, comment, download, intro) {
        if (preview == undefined || preview == '') preview = 'equationview';
        if (input == undefined || input == '') input = 'latex_formula';
        if (comment == undefined || comment == '') comment = 'equationcomment';
        if (download == undefined || download == '') download = 'download';
        if (intro == undefined || intro == '') intro = 'intro';
        this.equation_preview = EqEditor.$(preview);
        this.equation_input = EqEditor.$(input);
        this.equation_comment = EqEditor.$(comment);
        this.equation_download = EqEditor.$(download);
        this.intro_text = intro;
        if (this.equation_input) {
            this.addEvent('keydown', function (e) {
                EqEditor.Panel.close();
                EqEditor.countclick();
                EqEditor.tabHandler(e);
            });
            this.addEvent('keyup', function () {
                EqEditor.textchanged();
                EqEditor.autorenderEqn(10);
            });
            this.addEvent('keypress', function (e) {
                EqEditor.keyHandler(e);
            });
            if (EqEditor.$(this.intro_text)) {
                EqEditor.$(this.intro_text).onclick = function (e) {
                    EqEditor.targetArea.equation_input.focus();
                    EqEditor.Opacity.fadeout(this.intro_text);
                };
            }
        }
    };
    this.setText = function (val) {
        var latex = unescape(val.replace(/\&space;/g, ' ').replace(/\&plus;/g, '+').replace(/\&hash;/g, '#').replace(/\@plus;/g, '+').replace(/\@hash;/g, '#'));
        EqEditor.reset();
        var i, subtex, go;
        do {
            go = 0;
            latex = latex.replace(new RegExp("^[\\s]+", "g"), "");
            i = latex.indexOf(' ');
            var ii = latex.indexOf('}');
            if (ii != -1 && (ii < i || i == -1)) i = ii;
            if (i != -1) {
                subtex = latex.substr(0, i);
                if (EqEditor.setSelIndx('fontsize', subtex)) go = 1;
                if (subtex == '\\inline') {
                    EqEditor.$('inline').checked = true;
                    EqEditor.$('compressed').checked = true;
                    go = 1;
                }
                if (subtex.substr(0, 4) == '\\bg_' && EqEditor.setSelIndx('bg', subtex.substr(4))) go = 1;
                if (subtex.substr(0, 4) == '\\fn_' && EqEditor.setSelIndx('font', subtex.substr(4))) go = 1;
                if (subtex.substr(0, 5) == '\\dpi{' && EqEditor.setSelIndx('dpi', subtex.substr(5))) go = 1;
                if (go) latex = latex.substr(i + 1);
            }
        } while (go) if (latex.length > 0) {
            this.equation_input.value = latex;
            this.textchanged();
            this.renderEqn();
        }
    };
    this.clearText = function () {
        this.equation_input.value = "";
        this.equation_input.focus();
        this.changed = false;
        this.equation_preview.src = EDITOR_SRC + '/images/spacer.gif';
        EqEditor.Opacity.fadein(this.intro_text);
    };
    this.textchanged = function () {
        var txt = this.getEquationStr();
        if (txt.length == 0) EqEditor.Opacity.fadein(this.intro_text);
        else EqEditor.Opacity.fadeout(this.intro_text); if (txt != this.orgtxt) {
            this.orgtxt = txt;
            this.changed = true;
            return true;
        }
        return false;
    };
    this.auton = 0;
    this.renderCountdown = function () {
        if (this.auton > 0) {
            this.auton--;
            var fn = new Function(this.renderCountdown());
            setTimeout(fn, 100);
        } else this.renderEqn(null);
    };
    this.autorenderEqn = function (n) {
        if (this.auton > 0 && n > 0) this.auton = n;
        else {
            this.auton = n;
            this.renderCountdown();
        }
    };
    this.insertText = function (txt, pos, inspos) {
        var key_text = '';
        if (pos == 1000) {
            pos = txt.length - 1;
        }
        if (pos == null) {
            pos = txt.indexOf('{') + 1;
            if (pos <= 0) {
                txt += ' ';
                pos = txt.length;
            } else {
                if (txt.charAt(pos) != '}') pos = txt.indexOf('}', pos) + 1;
            }
        }
        var insert_pos = (inspos == null) ? pos : inspos;
        var i;
        var myField = this.equation_input;
        var leftbracket = (txt.substring(1, 5) == "left");
        if (document.selection) {
            myField.focus();
            var sel = document.selection.createRange();
            i = this.equation_input.value.length + 1;
            var theCaret = sel.duplicate();
            while (theCaret.parentElement() == myField && theCaret.move("character", 1) == 1)--i;
            if ((leftbracket || insert_pos >= 0) && sel.text.length) {
                if (leftbracket) ins_point = 7;
                else ins_point = insert_pos; if (insert_pos == null) pos = txt.length + sel.text.length + 1;
                else if (insert_pos < pos) pos += sel.text.length;
                sel.text = txt.substring(0, ins_point) + sel.text + txt.substr(ins_point);
            } else sel.text = txt;
            var range = myField.createTextRange();
            range.collapse(true);
            pos = i + pos;
            pos -= myField.value.substr(0, pos).split("\n").length - 1;
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        } else {
            if (myField.selectionStart || myField.selectionStart == '0') {
                var startPos = myField.selectionStart;
                var endPos = myField.selectionEnd;
                var cursorPos = startPos + txt.length;
                if ((leftbracket || insert_pos >= 0) && endPos > startPos) {
                    if (leftbracket) ins_point = 7;
                    else ins_point = insert_pos; if (insert_pos == null) pos = txt.length + endPos - startPos + 1;
                    else if (insert_pos < pos) pos += endPos - startPos;
                    txt = txt.substring(0, ins_point) + myField.value.substring(startPos, endPos) + txt.substr(ins_point);
                }
                myField.value = myField.value.substring(0, startPos) + txt + myField.value.substring(endPos, myField.value.length);
                myField.selectionStart = cursorPos;
                myField.selectionEnd = cursorPos;
                myField.focus();
                myField.setSelectionRange(startPos + pos, startPos + pos);
            } else myField.value += txt;
        }
        this.textchanged();
        this.autorenderEqn(10);
        EqEditor.Panel.close(null);
        myField.focus();
    };
    this.getLaTeX = function () {
        var a = this.equation_input.value.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
        if (a.length > 0) return EqEditor.getSize() + a;
        return '';
    };
    this.getEquationStr = function () {
        var a = this.getLaTeX();
        if (a.length > 0) return EqEditor.getCompressed() + EqEditor.getDPI() + EqEditor.getBG() + EqEditor.getFont() + a;
        return '';
    };
    this.exportMessage = function (text) {
        var a = EqEditor.$('exportmessage');
        if (a) a.innerHTML = text;
    };
    this.exportEquation = function (type) {
        var format = EqEditor.getFormat();
        var type_panda='safe';
        switch (type_panda) {//熊猫修改
            case 'safe':
                //return this.getEquationStr().replace(/\s/g, '&space;').replace(/\+/g, '&plus;').replace(/#/g, '&hash;');
                return '';
                break;
            case 'encoded':
                return escape(this.getEquationStr()).replace(/\+/g, '&plus;');
                break;
            case 'wp':
                {
                    this.exportMessage('Wordpress markup for this equation is:');
                    return EqEditor.get_inline_wrap(this.getLaTeX(), '[latex]{$TEXT}[/latex]\n', '$latex {$TEXT}$ ');
                }
                break;
            case 'phpBB':
                {
                    this.exportMessage('PHP Bulletin Board markup for this equation is:');
                    return ('[tex]' + this.getLaTeX() + '[/tex]\n');
                }
                break;
            case 'tw':
                {
                    this.exportMessage('TiddlyWiki markup for this equation is:');
                    text = this.getEquationStr();
                    text = text.replace(/\[/g, '%5B');
                    text = text.replace(/\]/g, '%5D');
                    return ('[img[' + EQUATION_ENGINE + '/' + format + '.latex?' + text.replace(/#/g, '&hash;') + ']]');
                    
                }
                break;
            case 'url':
                {
                    this.exportMessage('The URL link to this equation is:');
                    return (EQUATION_ENGINE + '/' + format + '.latex?' + this.exportEquation('safe'));
                }
                break;
            case 'urlencoded':
                {
                    this.exportMessage('The Encoded URL link to this equation is:');
                    return (EQUATION_ENGINE + '/' + format + '.latex?' + this.exportEquation('encoded'));
                }
                break;
            case 'pre':
                {
                    this.exportMessage('HTML code using pre-tags is:');
                    return EqEditor.get_inline_wrap(this.getLaTeX(), '<pre xml:lang="latex">{$TEXT}</pre>\n', '<code xml:lang="latex">{$TEXT}</code> ');
                }
                break;
            case 'doxygen':
                {
                    this.exportMessage('DOxygen markup for this equation is:');
                    return EqEditor.get_inline_wrap(this.getLaTeX(), '\\f[{$TEXT}\\f]\n', '\\f${$TEXT}\\f$ ');
                }
                break;
            case 'htmledit':
                {
                    this.exportMessage('HTML code to embed this equation into a web page is:');
                    var a = this.exportEquation('safe');
                    if (format == 'swf') return ('<a href="' + EDIT_ENGINE + '?latex=' + a + '" target="_blank">' + AC_FL_RunContent('codebase', EDITOR_SW_FLASH, 'width', '600', 'height', '100', 'src', (EQUATION_ENGINE + '/swf.latex?' + a), 'quality', 'high', 'pluginspage', EDITOR_SW_PLAYER, 'align', 'top', 'scale', 'showall', 'wmode', 'window', 'devicefont', 'false', 'bgcolor', '#ffffff', 'menu', 'true', 'allowFullScreen', 'true', 'movie', (EQUATION_ENGINE + '/swf.latex?' + text)) + '</a>');
                    else return ('<a href="' + EDIT_ENGINE + '?latex=' + a + '" target="_blank"><img src="' + EQUATION_ENGINE + '/' + format + '.latex?' + a + '" title="' + this.getLaTeX() + '" /></a>');
                }
                break;
            case 'html':
                {
                    this.exportMessage('HTML code to embed this equation into a web page is:');
                    var a = this.exportEquation('safe');
                    if (format == 'swf') return AC_FL_RunContent('codebase', EDITOR_SW_FLASH, 'width', '600', 'height', '100', 'src', (EQUATION_ENGINE + '/swf.latex?' + a), 'quality', 'high', 'pluginspage', EDITOR_SW_PLAYER, 'align', 'top', 'scale', 'showall', 'wmode', 'window', 'devicefont', 'false', 'bgcolor', '#ffffff', 'menu', 'true', 'allowFullScreen', 'true', 'movie', (EQUATION_ENGINE + '/swf.latex?' + a));
                    else return ('<img src="' + EQUATION_ENGINE + '/' + format + '.latex?' + a + '" title="' + this.getLaTeX() + '" />');
                }
                break;
            default:
                {
                    this.exportMessage('LaTeX markup for this equation is:');
                    return EqEditor.get_inline_wrap(this.getLaTeX(), '\\[{$TEXT}\\]\n', '\${$TEXT}\$ ');
                }
                break;
        }
        return text;
    };
    this.setdownload = function (text) {
        if (this.equation_download) this.equation_download.innerHTML = text;
    };
    this.setcomment = function (text) {
        if (this.equation_comment) this.equation_comment.innerHTML = text;
    };
    this.renderEqn = function (callback) {
        var val = this.equation_input.value;
        val = val.replace(/^\s+|\s+$/g, "");
        if (val.length == 0) return true;
        var bracket = 0;
        var i;
        for (i = 0; i < val.length; i++) {
            switch (val.charAt(i)) {
                case '{':
                    if (i == 0 || val[i - 1] != '\\') bracket++;
                    break;
                case '}':
                    if (i == 0 || val[i - 1] != '\\') bracket--;
                    break;
            }
        }
        if (bracket == 0) {
            if (EqEditor.$('renderbutton')) EqEditor.$('renderbutton').className = 'greybutton';
            var img = this.equation_preview;
            var val = this.exportEquation('encoded');
            var sval = val.replace(/"/g, '\\"');
            var format = EqEditor.getFormat();
            if (this.changed) {
                this.setcomment('');
                switch (format) {
                    case 'gif':
                    case 'png':
                    case 'svg':
                        // img.src = EQUATION_ENGINE + '/' + format + '.latex?' + val;熊猫修改
                        img.src='../img/logo.png';
                        this.setdownload('<a href="' + EQUATION_ENGINE + '/' + format + '.download?' + sval + '">Click here to Download Image (' + format.toUpperCase() + ')</a>');
                        break;
                    case 'pdf':
                        img.src = EQUATION_ENGINE + '/gif.latex?' + val;
                        this.setdownload('<a target="_blank" href="' + EQUATION_ENGINE + '/pdf.download?' + sval + '"><img src="images/pdf.jpg" width="30" height="30" align="middle" />Click here to Download Equation (PDF)</a>');
                        break;
                }
                this.updateExportArea();
            }
        } else {
            if (bracket < 0) this.setcomment("<br/><span class=\"orange\">You have more <strong>closed '}' brackets</strong> than open '{' brackets</span>");
            else this.setcomment("<br/><span class=\"orange\">You have more <strong>open '{' brackets</strong> than closed '}' brackets</span>");
        }
        this.changed = false;
    };
    this.clickval = 0;
    this.countclick = function () {
        var x = this.equation_input.value;
        this.clickval++;
        if (this.clickval >= 3) {
            this.clickval = 0;
            if (this.myUndo == 0 || this.store_text[this.myUndo] != x) {
                if (this.myUndo > 20) this.store_text.shift();
                else this.myUndo++;
                this.store_text[this.myUndo] = x;
            }
        }
        this.myRedo = 0;
    };
    this.undo = function (box) {
        if (this.myRedo == 0) {
            if (this.myUndo > 20) this.store_text.shift();
            else this.myUndo++;
            this.store_text[this.myUndo] = this.equation_input.value;
        }
        if (this.myRedo < this.myUndo) {
            this.myRedo++;
            if (this.myRedo == this.myUndo && EqEditor.$('undobutton')) EqEditor.$('undobutton').src = EDITOR_SRC + "/images/buttons/undo-x.gif";
            var a = EqEditor.$('redobutton');
            if (a) a.src = EDITOR_SRC + "/images/buttons/redo.gif";
        } else return;
        z = this.store_text.length - this.myRedo - 1;
        if (this.store_text[z]) this.equation_input.value = this.store_text[z];
        else this.equation_input.value = this.store_text[0];
        this.equation_input.focus();
    };
    this.redo = function (box) {
        if (this.myRedo > 0) {
            this.myRedo--;
            if (this.myRedo == 0 && EqEditor.$('redobutton')) EqEditor.$('redobutton').src = EDITOR_SRC + "/images/buttons/redo-x.gif";
            var a = EqEditor.$('undobutton');
            if (a) a.src = EDITOR_SRC + "/images/buttons/undo.gif";
        } else return;
        var z = this.store_text.length - this.myRedo - 1;
        if (this.store_text[z]) this.equation_input.value = this.store_text[z];
        else this.equation_input.value = this.store_text[0];
        this.equation_input.focus();
    };
    this.Export = function (fnobj, type) {
        EqEditor.Example.add_history(this.equation_input.value);
        EqEditor.Example.hide();
        fnobj(this.exportEquation(type));
    };
    this.load = function (val) {
        if (typeof val !== 'undefined') this.setText(val)
    };
    if (preview !== undefined) this.set(preview, input, comment, download, intro);
};
var EqEditor = {
    SID: 0,
    copy_button: null,
    key_text: '',
    format: 'png',
    $: function (n) {
        return document.getElementById(n);
    },
    OnChange: function (n, fn) {
        var a = EqEditor.$(n);
        if (a) a.onchange = fn;
    },
    OnClick: function (n, fn) {
        var a = EqEditor.$(n);
        if (a) a.onclick = fn;
    },
    Gallery: null,
    Example: {
        lastbutton: null,
        load_json: function (file, text) {
            var old = EqEditor.$('load_json');
            if (old != null) {
                old.parentNode.removeChild(old);
                delete old;
            }
            var d = new Date();
            text = 'rand=' + d.getTime() + '&' + text;
            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            script.src = FAVORITE_ENGINE + '/' + file + '?' + text;
            script.id = 'load_json';
            head.appendChild(script);
        },
        add_fav: function () {
            text = EqEditor.targetArea.getEquationStr();
            if (text != '') {
                this.load_json('favorite_json.php', 'sid=' + EqEditor.SID + '&add&eqn=' + escape(text.replace(/\+/g, "@plus;").replace(/#/g, '@hash;')));
                setTimeout('EqEditor.Example.show(null, \'fav\')', 200);
            }
        },
        del_fav: function (name) {
            this.load_json('favorite_json.php', 'sid=' + EqEditor.SID + '&delete=' + name);
            setTimeout('EqEditor.Example.show(null, \'fav\')', 200);
        },
        add_history: function (text) {
            if (text != '') {
                this.load_json('history_json.php', 'sid=' + EqEditor.SID + '&add&eqn=' + escape(text.replace(/\+/g, "@plus;").replace(/#/g, '@hash;')));
            }
        },
        show: function (button, group) {
            EqEditor.$('bar1').style.display = 'none';
            EqEditor.$('bar2').style.display = 'block';
            if (EqEditor.$('photos')) EqEditor.$('photos').innerHTML = '';
            if (button !== null) {
                if (this.lastbutton !== null) this.lastbutton.className = 'lightbluebutton';
                button.className = 'greybutton';
                this.lastbutton = button;
            }
            EqEditor.Gallery = new Scroll();
            if (group == 'fav' || group == 'history') {
                var d = new Date();
                EqEditor.Gallery.init('photos', 'leftarrow', 'rightarrow', 'overview', FAVORITE_ENGINE + '/example_json.php?fn=EqEditor.Gallery&rand=' + d.getTime() + '&sid=' + EqEditor.SID);
            } else EqEditor.Gallery.init('photos', 'leftarrow', 'rightarrow', 'overview', FAVORITE_ENGINE + '/example_json.php?fn=EqEditor.Gallery');
            EqEditor.Gallery.visible_num = 1;
            EqEditor.Gallery.new_offset = 5;
            EqEditor.Gallery.maxpanels = 1;
            EqEditor.Gallery.set_width(600, 100, 60);
            EqEditor.Gallery.set_subtext('&type=' + group);
            EqEditor.Gallery.add_panel();
            EqEditor.Gallery.setarrow();
            EqEditor.Gallery.setoverview();
        },
        hide: function () {
            EqEditor.$('bar2').style.display = 'none';
            EqEditor.$('bar1').style.display = 'block';
            if (this.lastbutton !== null) this.lastbutton.className = 'lightbluebutton';
            this.lastbutton = null;
        }
    },
    Opacity: {
        set: function (id, opacity) {
            var obj = EqEditor.$(id).style;
            obj.opacity = (opacity / 100);
            obj.MozOpacity = (opacity / 100);
            obj.KhtmlOpacity = (opacity / 100);
            obj.filter = "alpha(opacity=" + opacity + ")";
        },
        fade: function (id, opacStart, opacEnd, millisec) {
            speed = Math.round(millisec / 100);
            sgn = (opacStart > opacEnd) ? -1 : 1;
            count = sgn * (opacEnd - opacStart);
            for (i = 1; i < count; i++) setTimeout("EqEditor.Opacity.set('" + id + "'," + (i * sgn + opacStart) + ")", (i * speed));
        },
        fadeout: function (id) {
            if (EqEditor.$(id)) {
                this.fade(id, 100, 10, 800);
                setTimeout("EqEditor.$('" + id + "').style.display='none'", 800);
            }
        },
        fadein: function (id) {
            if (EqEditor.$(id)) {
                this.set(id, 20);
                EqEditor.$(id).style.display = 'block';
                this.fade(id, 20, 100, 800);
            }
        }
    },
    Panel: {
        plock: null,
        ctimer: null,
        otimer: null,
        oid: null,
        timer: Array(),
        setstate: function (a, b) {
            if (a) {
                var id = a.id;
                if (this.timer[id] != '') {
                    clearTimeout(this.timer[id]);
                    this.timer[id] = '';
                }
                this.timer[id] = setTimeout("EqEditor.$('" + id + "').style.overflow='" + b + "'; EqEditor.$('" + id + "').style.position='relative';", 200);
            }
        },
        open: function (a) {
            a.firstChild.style.outline = '1px solid #c5c5c5';
            a.firstChild.style.zindex='999';//熊猫修改
            this.setstate(a, 'visible');
        },
        close: function (a) {
            this.setstate(a, 'hidden');
            //if (a !== undefined) a.firstChild.style.outline = 'none';
        },
        hoverdiv: null,
        hlock: false,
        hover: function (img, e) {
            if (this.hoverdiv) {
                this.lock = true;
                //this.hoverdiv.innerHTML = '<img src="' + EQUATION_ENGINE + '/gif.latex?\\200dpi ' + img.latex + '"/>';熊猫修改
                if ('pageX' in e) {
                    var pageX = event.pageX;
                    var pageY = event.pageY;
                } else {
                    var pageX = event.clientX + document.documentElement.scrollLeft;
                    var pageY = event.clientY + document.documentElement.scrollTop;
                }
                var a = EqEditor.$('EqnEditor');
                if (a) {
                    var b = a.getBoundingClientRect();
                    pageX -= b.left;
                    pageY -= b.top;
                }
                this.hoverdiv.style.left = (pageX + 20) + 'px';
                this.hoverdiv.style.top = (pageY + 50) + 'px';
                // this.hoverdiv.style.left = '0px';
                // this.hoverdiv.style.top = '0px';
                this.hoverdiv.style.display = 'none';
                //this.hoverdiv.style.display = 'block';
                this.lock = false;
                img.onmouseout = EqEditor.Panel.hidehover;
            }
        },
        hidehover: function () {
            if (!this.hlock) EqEditor.$('hover').style.display = 'none';
        },
        init: function (hoverbox, editorid) {
            this.hoverdiv = EqEditor.$(hoverbox);
            var divElem;
            if (editorid !== undefined) divElem = EqEditor.$(editorid);
            else divElem = document;
            var areas = divElem.getElementsByTagName('area');
            for (i = 0; i < areas.length; i++) {
                areas[i].onmouseover = function (e) {
                    EqEditor.Panel.hover(this, e);
                };
                latex = areas[i].alt;
                areas[i].latex = latex;
                areas[i].alt = '';
                if (areas[i].title == '') areas[i].title = latex;
                if (areas[i].onclick == undefined) areas[i].onclick = function () {
                    EqEditor.insert(this.latex);
                };
            }
            if (divElem.getElementsByClassName == undefined) {
                divElem.getElementsByClassName = function (className) {
                    var hasClassName = new RegExp("(?:^|\\s)" + className + "(?:$|\\s)");
                    var allElements = divElem.getElementsByTagName("*");
                    var results = [];
                    var element;
                    for (var i = 0;
                        (element = allElements[i]) != null; i++) {
                        var elementClass = element.className;
                        if (elementClass && elementClass.indexOf(className) != -1 && hasClassName.test(elementClass)) results.push(element);
                    }
                    return results;
                }
            }
            var panels = divElem.getElementsByClassName('panel');
            for (i = 0; i < panels.length; i++)
                if (panels[i].id != '') {
                    panels[i].onmouseover = function (e) {
                        EqEditor.Panel.open(this);
                    };
                    panels[i].onmouseout = function (e) {
                        EqEditor.Panel.close(this);
                    };
                }
        }
    },
    Cookie: {
        nocookies: false,
        set: function (c_name, value, expiredays) {
            var SID = EqEditor.Cookie.get('eqeditor_cookies') == '1';
            if (!this.nocookies || SID || confirm("This site uses cookie to remember your preference. Are you ok with this?")) {
                var exdate = new Date();
                exdate.setDate(exdate.getDate() + expiredays);
                document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString());
                document.cookie = "eqeditor_cookies=1";
            }
        },
        get: function (c_name) {
            if (document.cookie.length > 0) {
                c_start = document.cookie.indexOf(c_name + "=");
                if (c_start != -1) {
                    c_start = c_start + c_name.length + 1;
                    c_end = document.cookie.indexOf(";", c_start);
                    if (c_end == -1) c_end = document.cookie.length;
                    return unescape(document.cookie.substring(c_start, c_end));
                }
            }
            return '';
        }
    },
    setAdvert: function () {
        var e = EqEditor.$('latex_formula');
        var x = e.offsetWidth;
        if (EqEditor.$('wrap').style.marginLeft == 'auto') x -= 170;
        EqEditor.$('advert').style.display = (x < 600 ? 'none' : 'block');
        EqEditor.$('wrap').style.marginLeft = (x < 600 ? 'auto' : '170px');
    },
    setSelIndx: function (id, v) {
        var s = EqEditor.$(id);
        if (s)
            for (var i = 0; i < s.options.length; i++) {
                if (s.options[i].value == v) {
                    s.options[i].selected = true;
                    return true;
                }
            }
        return false;
    },
    ExportButton: {
        bArray_id: new Array(),
        bArray_area: new Array(),
        bArray_mode: new Array(),
        bArray_fn: new Array(),
        bsize: 0,
        state: function (state) {
            for (i = 0; i < this.bsize; i++) {
                if (state) this.bArray_id[i].className = 'lightbluebutton';
                else this.bArray_id[i].className = 'greybutton';
            }
        },
        add: function (textarea, button_id, targetFn, mode) {
            var a = EqEditor.$(button_id);
            if (a) {
                this.bArray_id[this.bsize] = a;
                this.bArray_area[this.bsize] = textarea;
                this.bArray_mode[this.bsize] = mode;
                this.bArray_fn[this.bsize] = targetFn;
                a.onclick = function (e) {
                    var i = this.exportid;
                    EqEditor.ExportButton.bArray_area[i].Export(EqEditor.ExportButton.bArray_fn[i], EqEditor.ExportButton.bArray_mode[i]);
                    window.close();
                };
                a.exportid = this.bsize;
                this.bsize++;
            }
        }
    },
    targetArray: new Array(),
    targetSize: 0,
    targetArea: null,
    curTarget: 0,
    changeExportArea: function (id, mode) {
        for (i = 0; i < this.targetSize; i++) this.targetArray[i].changeExportArea(id, mode);
    },
    autorenderEqn: function (n) {
        this.targetArea.autorenderEqn(n);
    },
    change: function (i) {
        if (i != this.curTarget) {
            this.curTarget = i;
            this.key_rext = '';
        }
        this.targetArea = this.targetArray[i];
    },
    add: function (obj, resize) {
        this.targetArray[this.targetSize] = obj;
        obj.equation_input.onfocus = new Function('EqEditor.change(' + this.targetSize + ');'); 
        if (resize) {
            if (window.addEventListener) window.addEventListener('resize', new Function('EqEditor.resize(' + this.targetSize + ');'), false);
            else window.attachEvent('onresize', new Function('EqEditor.resize(' + this.targetSize + ');'));
            EqEditor.resize(this.targetSize);
        }
        if (this.targetSize == 0) obj.equation_input.focus();
        this.targetSize++;
    },
    editor_id: null,
    embed: function (id, SID, design, language) {
        if (this.targetSize > 0) {
            this.targetArray = new Array();
            this.targetSize = 0;
            this.targetArea = null;
            this.curTarget = 0;
        }
        if (this.editor_id != id) {
            this.editor_id = id;
            var url = EMBED_ENGINE + '?id=' + id + '&SID=' + SID + '&design=' + design;
            if (language != undefined && language != '') url += '&lang=' + language;
            var fileref = document.createElement('script');
            fileref.setAttribute("type", "text/javascript");
            fileref.setAttribute("src", url);
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
    },
    moveto: function (id) {
        if (id != this.editor_id) {
            var newNode = EqEditor.$(id);
            while (EqEditor.$(this.editor_id).childNodes[0]) {
                var oldNode = EqEditor.$(this.editor_id).childNodes[0];
                oldNode.parentNode.removeChild(oldNode);
                newNode.appendChild(oldNode);
            }
            this.editor_id = id;
        }
    },
    targetFn: null,
    copyToTarget: function (text) {
        if (this.targetFn !== null) this.targetFn(text)
    },
    reset: function () {
        this.setSelIndx('format', 'gif');
        this.setSelIndx('font', '');
        this.setSelIndx('fontsize', '');
        this.setSelIndx('dpi', '110');
        this.setSelIndx('bg', 'Transparent');
    },
    init: function (SID, obj, resize, editorid) {
        EqEditor.Panel.init('hover', editorid);
        if (SID == '') {
            this.SID = EqEditor.Cookie.get('eqeditor');
            if (!this.SID) {
                var d = new Date();
                this.SID = d.getTime();
                EqEditor.Cookie.set('eqeditor', SID, 30);
            }
        } else this.SID = SID; if (obj !== undefined) {
            this.add(obj, resize);
            this.targetArea = obj;
        }
        this.setSelIndx('format', EqEditor.Cookie.get('format'));
        this.setSelIndx('font', EqEditor.Cookie.get('font'));
        this.setSelIndx('fontsize', EqEditor.Cookie.get('fontsize'));
        this.setSelIndx('dpi', EqEditor.Cookie.get('dpi'));
        this.setSelIndx('bg', EqEditor.Cookie.get('bg'));
        EqEditor.OnClick('undobutton', function (e) {
            EqEditor.targetArea.undo();
        });
        EqEditor.OnClick('redobutton', function (e) {
            EqEditor.targetArea.redo();
        });
        EqEditor.OnChange('bg', function (e) {
            var b = EqEditor.$('bg');
            if (b) {
                EqEditor.Cookie.set('bg', b.value, 10);
            }
            EqEditor.update();
        });
        EqEditor.OnChange('dpi', function (e) {
            var d = EqEditor.$('dpi');
            if (d) {
                EqEditor.Cookie.set('dpi', d.value, 10);
            }
            EqEditor.update();
        });
        EqEditor.OnChange('font', function (e) {
            var f = EqEditor.$('font');
            if (f) {
                EqEditor.Cookie.set('font', f.value, 10);
            }
            EqEditor.update();
        });
        EqEditor.OnChange('format', function (e) {
            var action = false;
            EqEditor.setFormat(EqEditor.getFormat());
        });
        EqEditor.OnChange('fontsize', function () {
            var f = EqEditor.$('fontsize');
            if (f) {
                EqEditor.Cookie.set('fontsize', f.value, 10);
            }
            EqEditor.update();
        });
        EqEditor.OnClick('inline', function (e) {
            var a = EqEditor.$('compressed');
            if (a) a.checked = this.checked;
            EqEditor.update();
        });
        EqEditor.OnClick('compressed', function (e) {
            EqEditor.update();
        });
    },
    textchanged: function () {
        if (this.targetArea.textchanged()) EqEditor.ExportButton.state(true);
    },
    update: function () {
        this.targetArea.textchanged();
        this.targetArea.renderEqn(null);
    },
    load: function (txt) {
        if (this.targetArea != null) this.targetArea.load(txt);
    },
    insert: function (txt, pos, inspos) {
        if (this.targetArea != null) {
            this.targetArea.insertText(txt, pos, inspos);
            EqEditor.ExportButton.state(true);
        }
    },
    getTextArea: function () {
        if (this.targetArea != null) return this.targetArea;
        return null;
    },
    clearText: function () {
        this.targetArea.clearText();
        EqEditor.ExportButton.state(false);
    },
    setFormat: function (type) {
        EqEditor.format = type;
        switch (type) {
            case 'gif':
            case 'png':
            default:
                action = false;
                break;
            case 'pdf':
            case 'swf':
            case 'emf':
            case 'svg':
                action = true;
                break;
        }
        EqEditor.Cookie.set('format', type, 10);
        var a = EqEditor.$('dpi');
        if (a) {
            a.disabled = action;
            a.readonly = action;
        }
        a = EqEditor.$('bg');
        if (a) {
            a.disabled = action;
            a.readonly = action;
        }
        EqEditor.targetArea.changed = true;
        EqEditor.targetArea.renderEqn(null);
    },
    getFormat: function () {
        var a = EqEditor.$('format');
        if (a) return a.value;
        return EqEditor.format;
    },
    getFont: function () {
        var a = EqEditor.$('font');
        if (a && a.value != '') return '\\fn_' + a.value + ' ';
        return '';
    },
    getSize: function () {
        // var a = EqEditor.$('fontsize');
        // if (a && a.value != '') return a.value + ' ';
        // return '';
        return '\\normal' + ' ';
    },
    getDPI: function () {
        // var a = EqEditor.$('dpi');
        // if (a && a.value != '110') return '\\dpi{' + a.value + '} ';
        // return '';
        return '\\dpi{' + '300' + '} ';
    },
    getBG: function () {
        var a = EqEditor.$('bg');
        if (a) {
            var b = a.value.toLowerCase();
            if (b != 'transparent') return '\\bg_' + b + ' ';
        }
        return '';
    },
    getCompressed: function () {
        var a = EqEditor.$('compressed');
        if (a && a.checked) return '\\inline ';
        return '';
    },
    get_inline_wrap: function (text, norm, inline) {
        var a = EqEditor.$('inline');
        if (a) {
            var b = EqEditor.$('compressed');
            if (a.checked) {
                if (!b.checked) text = '\\displaystyle ' + text;
                return inline.replace("{$TEXT}", text);
            } else {
                if (b.checked) text = '\\inline ' + text;
                return norm.replace("{$TEXT}", text);
            }
        }
        return norm.replace("{$TEXT}", text);
    },
    extendchar: null,
    countclick: function () {
        this.targetArea.countclick();
        var a = EqEditor.$('redobutton');
        if (a) a.src = EDITOR_SRC + "/images/buttons/redo-x.gif";
        a = EqEditor.$('undobutton');
        if (a) a.src = EDITOR_SRC + "/images/buttons/undo.gif";
    },
    tabHandler: function (e) {
        var TABKEY = 9;
        var inp = this.targetArea.equation_input;
        if (e.keyCode == TABKEY) {
            if (document.selection) {
                var sel = document.selection.createRange();
                i = inp.value.length + 1;
                var theCaret = sel.duplicate();
                while (theCaret.parentElement() == inp && theCaret.move("character", 1) == 1)--i;
                startPos = i;
                if (startPos == inp.value.length) return true;
            } else {
                startPos = inp.selectionStart;
                if (startPos == inp.value.length) return true;
            }
            var a = inp.value.indexOf('{', startPos);
            if (a == -1) a = inp.value.length;
            else a++;
            var b = inp.value.indexOf('&', startPos);
            if (b == -1) b = inp.value.length;
            else b++;
            var c = inp.value.indexOf('\\\\', startPos);
            if (c == -1) c = inp.value.length;
            else c += 2;
            var pos = Math.min(Math.min(a, b), c);
            if (document.selection) {
                range = inp.createTextRange();
                range.collapse(true);
                pos -= inp.value.substr(0, pos).split("\n").length - 1;
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            } else inp.setSelectionRange(pos, pos); if (e.preventDefault) e.preventDefault();
            else e.returnValue = false;
            return false;
        }
    },
    backCursor: function (myField) {
        if (document.selection) {
            myField.focus();
            sel = document.selection.createRange();
            if (sel.text.length > 0) sel.text = '';
            else {
                sel.moveEnd('character', 1);
                sel.text = '';
            }
            sel.select();
        } else if (myField.selectionStart || myField.selectionStart == '0') {
            s = myField.selectionStart;
            e = myField.selectionEnd;
            myField.value = myField.value.substring(0, s) + myField.value.substring(e + 1, myField.value.length);
            myField.selectionStart = s;
            myField.selectionEnd = s;
            myField.focus();
        }
    },
    extendkey: function (letter) {
        switch (this.key_text) {
            case '\\left':
                this.insert(' \\right ' + letter, 0);
                break;
            case '\\frac':
            case '\\tfrac':
                if (letter == '}') this.insert('}{}', 0);
                break;
            case '\\begin':
                if (letter == '}') this.insert('} \\end{}', 0);
                break;
            default:
                this.insert(letter, 0);
        }
        this.extendchar = letter;
    },
    keyHandler: function (e) {
        var keycode;
        if (window.event) keycode = window.event.keyCode;
        else if (e) keycode = e.which;
        var keystr = String.fromCharCode(keycode);
        if (keystr == this.extendchar) this.backCursor(this.equation_input);
        this.extendchar = null;
        switch (keystr) {
            case '{':
                this.extendkey('}');
                break;
            case '[':
                this.extendkey(']');
                break;
            case '(':
                this.extendkey(')');
                break;
            case '"':
                this.extendkey('"');
                break;
        }
        if (keystr != ' ') {
            if (keystr == '\\') this.key_text = '\\';
            else if (!keystr.match(/^[a-zA-Z]$/)) this.key_text = '';
            else this.key_text += keystr;
        }
    },
    addText: function (wind, textbox, txt) {
        var myField = wind.getElementById(textbox);
        if (wind.selection) {
            myField.focus();
            sel = wind.selection.createRange();
            sel.text = txt;
        } else {
            var scrolly = myField.scrollTop;
            if (myField.selectionStart || myField.selectionStart == '0') {
                var startPos = myField.selectionStart;
                var endPos = myField.selectionEnd;
                var cursorPos = startPos + txt.length;
                myField.value = myField.value.substring(0, startPos) + txt + myField.value.substring(endPos, myField.value.length);
                pos = txt.length + endPos - startPos;
                myField.selectionStart = cursorPos;
                myField.selectionEnd = cursorPos;
                myField.focus();
                myField.setSelectionRange(startPos + pos, startPos + pos);
            } else myField.value += txt;
            myField.scrollTop = scrolly;
        }
    },
    makeEquationsMatrix: function (type, isNumbered, isConditional) {
        if (isNumbered === undefined) isNumbered = false;
        if (isConditional === undefined) isNumbered = false;
        eqns = "\\begin{" + type + ((isNumbered) ? "" : "*") + "}";
        eqi = "\n &" + ((isNumbered) ? " " : "= ") + ((isConditional) ? "\\text{ if } x= " : "");
        eqEnd = "\n\\end{" + type + ((isNumbered) ? "" : "*") + "}";
        i = 0;
        dim = prompt('请输入行数：', '');
        if (dim != '' && dim !== null) {
            n = parseInt(dim);
            if (!isNaN(n)) {
                for (i = 1; i <= n - 1; i++) eqns = eqns + (eqi + "\\\\ ");
                eqns = (eqns + eqi) + eqEnd;
                this.insert(eqns, type.length + ((isNumbered) ? 0 : 1) + 9);
            }
        }
    },
    makeArrayMatrix: function (type, start, end) {
        var matr = start + '\\begin{' + type + 'matrix}';
        var row = "\n"; 
        var mend = "\n\\end{" + type + "matrix}" + end;
        var i = 0;
        var dim = prompt('输入以逗号分隔的数组尺寸（例如，2行3列则输入“ 2,3”）：', '');
        if (dim !== '' && dim !== null) {
            dim = dim.split(',');
            m = parseInt(dim[0]);
            n = parseInt(dim[1]);
            if (!isNaN(m) && !isNaN(n)) {
                for (i = 2; i <= n; i++) row = row + ' & ';
                for (i = 1; i <= m - 1; i++) matr = matr + row + '\\\\ ';
                matr = matr + row + mend;
                this.insert(matr, type.length + start.length + 15);
            }
        }
    },
    resize: function (num) {
        var x, y;
        if (self.innerHeight) y = self.innerHeight;
        else if (document.documentElement && document.documentElement.clientHeight) y = document.documentElement.clientHeight;
        else if (document.body) y = document.body.clientHeight;
        this.targetArray[num].equation_input.style.height = parseInt(Math.max((y - 200) / 3, 40)) + 'px';
    }
};
var oDiv = document.createElement('div');
var oImg = document.createElement('img');
var Scroll = function () { };
Scroll.prototype = {
    init: function (maindiv, leftarrow, rightarrow, overview, newpanel_php) {
        this.panels = 0;
        this.maxpanels = 0;
        this.speed = 10;
        this.pause = 2;
        this.visible = 0;
        this.visible_num = 2;
        this.layers = new Array();
        this.layers_offset = new Array();
        this.new_offset = 0;
        this.subtext = '';
        this.vertical = false;
        this.left_arrow = document.getElementById(leftarrow);
        this.right_arrow = document.getElementById(rightarrow);
        this.maindiv = document.getElementById(maindiv);
        if (overview !== '') this.overview = document.getElementById(overview);
        else this.overview = null; if (newpanel_php.indexOf('_json') > -1) {
            this.ajax_php = null;
            this.json_php = newpanel_php;
            this.ajax_response_fn = null;
        } else {
            this.ajax_php = newpanel_php;
            this.json_php = null;
            var obj = this;
            this.ajax_response_fn = function () {
                obj.add_panel_response();
            };
        }
    },
    set_subtext: function (text) {
        this.subtext = text;
    },
    set_width: function (width, height, speed) {
        this.width = width;
        this.height = height;
        this.speed = speed;
        if (this.vertical) this.step = this.step_total = this.height / this.speed;
        else this.step = this.step_total = this.width / this.speed;
    },
    add: function (layer) {
        var offset = this.new_offset;
        if (this.vertical) this.new_offset += this.height;
        else this.new_offset += this.width;
        this.layers[this.panels] = layer;
        this.layers_offset[this.panels] = offset;
        this.panels++;
        if (this.panels > this.maxpanels) this.maxpanels = this.panels;
        layer.style.position = 'absolute';
        if (this.vertical) layer.style.top = offset + 'px';
        else layer.style.left = offset + 'px';
    },
    add_id: function (layer_id) {
        var lyr = document.getElementById(layer_id);
        if (lyr) this.add(lyr);
    },
    add_panel_div: function (newdiv) {
        this.add(newdiv);
        this.maindiv.appendChild(newdiv);
        if (this.visible + this.visible_num >= this.panels) this.add_panel();
    },
    add_panel_response: function () {
        if (req.readyState == 4) {
            if (req.status == 200 && req.responseText.length > 0) {
                var newdiv = oDiv.cloneNode(false);
                newdiv.innerHTML = req.responseText;
                this.add_panel_div(newdiv);
            }
            this.setarrow();
            this.setoverview();
        }
    },
    add_panel_json: function (info) {
        if (info.length > 0) {
            var newdiv = oDiv.cloneNode(false);
            newdiv.innerHTML = info;
            this.add_panel_div(newdiv);
        }
        this.setarrow();
        this.setoverview();
    },
    add_panel: function () {
        if (this.ajax_php && this.ajax_response_fn) {
            if (this.ajax_php.indexOf("?") == -1) loadXMLDoc(this.ajax_php + '?panel=' + this.panels + this.subtext, this.ajax_response_fn);
            else loadXMLDoc(this.ajax_php + '&panel=' + this.panels + this.subtext, this.ajax_response_fn);
        } else if (this.json_php) {
            var a = this.panels;
            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            if (this.json_php.indexOf("?") == -1) script.src = this.json_php + '?panel=' + a + this.subtext;
            else script.src = this.json_php + '&panel=' + a + this.subtext;
            head.appendChild(script);
        }
    },
    redraw: function () {
        if (this.json_php || (this.ajax_php && this.ajax_response_fn)) {
            this.panels = 0;
            this.visible = 0;
            this.new_offset = 0;
            while (this.maindiv.firstChild) {
                this.maindiv.removeChild(this.maindiv.firstChild);
            }
        }
        if (this.ajax_php && this.ajax_response_fn) {
            var obj = this;
            if (this.ajax_php.indexOf("?") == -1) loadXMLDoc(obj.ajax_php + '?panel=' + this.panels + this.subtext, obj.ajax_response_fn);
            else loadXMLDoc(obj.ajax_php + '&panel=' + this.panels + this.subtext, obj.ajax_response_fn);
        } else if (this.json_php) {
            var a = this.panels;
            var head = document.getElementsByTagName("head")[0];
            var script = document.createElement("script");
            if (this.json_php.indexOf("?") == -1) script.src = this.json_php + '?panel=' + a + this.subtext;
            else script.src = this.json_php + '&panel=' + a + this.subtext;
            head.appendChild(script);
        }
    },
    move: function (dx) {
        this.new_offset += dx;
        for (var p = 0; p < this.panels; p++) {
            this.layers_offset[p] += dx;
            if (this.vertical) this.layers[p].style.top = this.layers_offset[p] + 'px';
            else this.layers[p].style.left = this.layers_offset[p] + 'px';
        }
        this.step++;
        if (this.step < this.step_total) {
            var obj = this;
            window.setTimeout(function () {
                obj.move(dx);
            }, this.pause);
        }
    },
    setoverview: function () {
        if (this.overview !== null) {
            this.overview.innerHTML = '';
            var txt = '';
            var obj = this;
            for (i = 0; i < this.maxpanels; i++) {
                newimg = oImg.cloneNode(false);
                newimg.className = 'overview';
                if (i >= this.visible && i < (this.visible + this.visible_num)) newimg.src = "http://www.codecogs.com/images/scroll/soliddot.gif";
                else {
                    newimg.src = "http://www.codecogs.com/images/scroll/emptydot.gif";
                    newimg.i = i;
                    newimg.onclick = function () {
                        obj.jump(this);
                    };
                }
                this.overview.appendChild(newimg);
            }
        }
    },
    setarrow: function () {
        this.left_arrow.src = 'http://www.codecogs.com/images/scroll/' + (this.visible <= 0 ? 'leftarrow_grey.gif' : 'leftarrow.gif');
        this.right_arrow.src = 'http://www.codecogs.com/images/scroll/' + (this.visible >= (this.panels - 1) ? 'rightarrow_grey.gif' : 'rightarrow.gif');
    },
    jump: function (obj) {
        if (this.step == this.step_total) {
            panel = obj.i;
            var gap = panel - this.visible;
            this.step = this.step_total - Math.abs(gap) * this.step_total;
            if (this.visible > panel) this.move(this.speed);
            else this.move(-this.speed);
            this.visible += gap;
            if (this.visible + this.visible_num >= this.panels) this.add_panel();
            else {
                this.setarrow();
                this.setoverview();
            }
        }
    },
    left: function () {
        if (this.step == this.step_total) {
            if (this.visible < (this.panels - 1)) {
                this.visible++;
                this.step = 0;
                this.move(-this.speed);
                if (this.visible + this.visible_num >= this.panels) this.add_panel();
                else {
                    this.setarrow();
                    this.setoverview();
                }
            }
        }
    },
    right: function () {
        if (this.step == this.step_total) {
            if (this.visible > 0) {
                this.step = 0;
                this.move(this.speed);
                this.visible--;
                this.setarrow();
                this.setoverview();
            }
        }
    },
    subsearch: function (text) {
        if (text !== '') this.subtext = ('&subtext=' + text);
        else this.subtext = '';
        this.redraw();
    }
};