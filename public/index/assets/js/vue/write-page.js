!function(){
    
    const app = Vue.createApp({
        data(){
            return{
                contentEditor:{},       // 编辑器配置
                page: {},               // 页面初始数据
                id: '',                 // 文章ID
                destroy_model: true,    // 关闭窗口
                emoji: {},
                
                insert_color_text: [],         // 插入彩色文字数据
                insert_bg_color_text: [],      // 插入带背景颜色的文字数据
                insert_highlight: [],          // 插入高亮引用
                insert_btn: [],                // 插入按钮
                insert_collapse: [],           // 插入收缩框
                insert_tabs: [],               // 插入tabs
            }
        },
        components: {
            'i-footer'    : inisTemp.footer(),
            'i-top-nav'   : inisTemp.navbar(),
            'i-left-side' : inisTemp.sidebar(),
            'i-right-side': inisTemp.sidebar('right'),
        },
        mounted(){
            
            // 获取URL id
            this.id = inisHelper.get.query.string('id')
            
            // 窗口关闭前事件
            this.destroy()
            
            // 获取表情包数据
            axios.get('/index/assets/json/emoji.json').then((res)=>{
                this.emoji = res.data
                this.initVditor()
            }).catch((err)=>{
                this.emoji = {
                    "+1": "👍",
                    "-1": "👎",
                    "confused": "😕",
                    "eyes": "👀️",
                    "heart": "❤️",
                    "rocket": "🚀️",
                    "smile": "😄",
                    "tada": "🎉️",
                }
                this.initVditor()
            })
            
            this.initInsertData()
        },
        methods:{
            
            // 初始化编辑器
            initVditor(){
                
                /* vditor 编辑器配置 */
                this.contentEditor = new Vditor("vditor",{
                    height: 360,
                    minHeight: 500,
                    placeholder: '写点什么吧！',
                    icon: 'material',           // 图标风格
                    toolbarConfig: {
                        pin: true,              // 固定工具栏
                    },
                    cache: {
                        enable: false,          // 关闭缓存
                    },
                    counter: {
                        enable: true,           // 启用计数器
                    },
                    resize: {
                        enable: true,           // 支持主窗口大小拖拽
                    },
                    preview: {
                        hljs: {
                            enable: true,       // 启用代码高亮
                            lineNumber: true    // 启用行号
                        },
                    },
                    // 编辑器异步渲染完成后的回调方法
                    after: () => {
                        this.initData(this.id)
                    },
                    ctrlEnter: () => {
                        this.btnSave(this.id)
                    },
                    hint: {
                        emoji: this.emoji,
                    },
                    upload: {
                        // accept: 'image/jpg, image/jpeg, image/png, image/gif, image/webp, image/gif, audio/*',
                        accept: 'image/*, video/*',
                        multiple: false,
                        // 上传失败自定义方法
                        handler: (files) => {
                            
                            this.contentEditor.tip('上传中...', 2000)

                            let params = new FormData
                            params.append('file', ...files)
                            params.append('mode', 'file')

                            axios.post('/index/handle/upload', params, {
                                headers: {
                                    "Content-Type": "multipart/form-data"
                                }
                            }).then((res) => {
                                if (res.data.code == 200) {

                                    let result = res.data.data
                                    if (this.checkFile(result) == 'image') {
                                        this.contentEditor.insertValue(`![](${result})`)
                                    } else if (this.checkFile(result) == 'video') {
                                        this.contentEditor.insertValue(`<video src="${result}" controls>Not Support</video>`)
                                    } else {
                                        this.contentEditor.insertValue(`${result}`)
                                    }

                                    this.contentEditor.tip('上传完成！', 2000)

                                } else {
                                    this.contentEditor.tip(res.data.msg, 2000)
                                }
                            }).catch((err) => {
                                this.contentEditor.tip('上传地址已失效！', 2000)
                            })
                        },
                        filename: (name) => {
                            return name.replace(/[^(a-zA-Z0-9\u4e00-\u9fa5\.)]/g, "")
                            .replace(/[\?\\/:|<>\*\[\]\(\)\$%\{\}@~]/g, "")
                            .replace("/\\s/g", "");
                        },
                    },
                    toolbar: [
                      "emoji","headings","bold","italic","strike","link",
                      "|",
                      "list","ordered-list","check","outdent","indent",
                      "|",
                      "quote","line","code","inline-code","insert-before","insert-after",
                      "|",
                      "upload","table",
                      "|",
                      "undo","redo",
                      "|",
                      "export","fullscreen","preview","edit-mode",
                      "|",
                      {
                            hotkey: "",
                            name: "album",
                            tipPosition: "s",
                            tip: "插入相册",
                            className: "right",
                            icon: `<img style="margin: -4px 0 0 -6px;" src='/index/assets/svg/album.svg' height="16" />`,
                            click: () => {
                                this.contentEditor.insertValue('[album]\n支持Markdown格式和HTML格式的图片\n[/album]')
                            }
                      },
                      {
                            hotkey: "",
                            name: "album",
                            tipPosition: "s",
                            tip: "插入评论可见",
                            className: "right",
                            icon: `<img style="margin: -4px 0 0 -6px;" src='/index/assets/svg/comments.svg' height="16" />`,
                            click: () => {
                                this.contentEditor.insertValue('[hide]\n此处为评论可见内容\n[/hide]')
                            }
                      },
                      {
                          hotkey: "",
                          name: "doubt",
                          tipPosition: "s",
                          tip: "帮助文档",
                          className: "right",
                          icon: `<img style="height: 14px;margin: -4px 0 0 -6px;" src='/index/assets/svg/doubt.svg'/>`,
                          click: () => {
                              window.open("https://ld246.com/guide/markdown",'top')
                          }
                      },
                      {
                          hotkey: "⌘S",
                          name: "save",
                          tipPosition: "s",
                          tip: "保存",
                          className: "right",
                          icon: `<img style="height: 22px;margin: -4px 0 0 -6px;" src='/index/assets/svg/save.svg'/>`,
                          click: () => {
                              this.btnSave(this.id)
                          }
                      },
                      "|",
                      {
                          name: "more",
                          toolbar: [
                              {
                                  name: "insert_tabs",
                                  tipPosition: "s",
                                  tip: "插入tab",
                                  className: "right",
                                  icon: `插入tab`,
                                  click: () => {
                                      this.openModal("insert_tabs")
                                  }
                              },
                              {
                                  name: "insert_btn",
                                  tipPosition: "s",
                                  tip: "插入按钮",
                                  className: "right",
                                  icon: `插入按钮`,
                                  click: () => {
                                      this.openModal("insert_btn")
                                  }
                              },
                              {
                                  name: "insert_collapse",
                                  tipPosition: "s",
                                  tip: "插入收缩框",
                                  className: "right",
                                  icon: `插入收缩框`,
                                  click: () => {
                                      this.openModal("insert_collapse")
                                  }
                              },
                              {
                                  name: "insert_highlight",
                                  tipPosition: "s",
                                  tip: "插入高亮引用",
                                  className: "right",
                                  icon: `插入高亮引用`,
                                  click: () => {
                                      this.openModal("insert_highlight")
                                  }
                              },
                              {
                                  name: "insert_color_text",
                                  tipPosition: "s",
                                  tip: "插入彩色文字",
                                  className: "right",
                                  icon: `插入彩色文字`,
                                  click: () => {
                                      this.openModal("insert_color_text")
                                  }
                              },
                              {
                                  name: "insert_bg_color_text",
                                  tipPosition: "s",
                                  tip: "插入带背景颜色的文字",
                                  className: "right",
                                  icon: `插入带背景颜色的文字`,
                                  click: () => {
                                      this.openModal("insert_bg_color_text")
                                  }
                              },
                              
                              
                              "both",
                              // "code-theme",
                              // "content-theme",
                              "outline",
                            //   "devtools", // 开发者工具
                              "info",
                              "help"
                          ]
                      },
                  ],
                })
            },
            
            // 获取初始化数据
            initData(id = this.id){
                
                let params = new FormData
                params.append('id',id || '')
                
                axios.post('/index/WritePage', params).then((res) => {
                    if(res.data.code == 200){
                        
                        this.page = res.data.data
                        
                        if(!inisHelper.is.empty(id)){
                            
                            this.page = res.data.data
                            // 设置编辑器初始值
                            this.contentEditor.setValue(this.page.content)
                        }
                    }
                })
            },
            
            // 保存数据
            btnSave(id = this.id, jump = false) {
                
                if (inisHelper.is.empty(this.page.alias)) $.NotificationApp.send("提示！", "别名不得为空！", "top-right", "rgba(0,0,0,0.2)", "warning");
                else {
                
                    let params = new FormData
                    params.append('id',id || '')
                    params.append('title',this.page.title || '')
                    params.append('alias',this.page.alias || '')
                    params.append('content',this.contentEditor.getValue() || '')
                    
                    // 提交数据
                    axios.post('/index/method/SavePage', params).then((res) => {
                        if(res.data.code == 200){
                            
                            $.NotificationApp.send("提示！", "保存成功！", "top-right", "rgba(0,0,0,0.2)", "success");
                            
                            window.onbeforeunload = () => null;
                            
                            if(jump) setTimeout(()=>{window.location.href = '/index/ManagePage'}, 500);
                            
                        }else $.NotificationApp.send("提示！", res.data.msg, "top-right", "rgba(0,0,0,0.2)", "warning");
                    })
                }
            },
            
            // 窗口关闭前事件
            destroy(){
                
                window.onbeforeunload = (e) => {
                    
                    e = e || window.event;
                 
                    if (e) e.returnValue = 'Any string';
                    
                    return '您正在编辑的数据尚未保存，确定要离开此页吗？';
                }
            },
            
            // 打开模态框
            openModal(value = null){
                $(`#${value}`).modal('show')
            },
            
            // 设置插入数据
            set_insert_data(opt = null, obj = {}) {
                
                // 设置插入彩色文本
                if (opt == "insert_color_text") {
                    let bg_color = {
                        "text-muted"     :  "灰色",
                        "text-dark"      :  "黑色",
                        "text-white"     :  "白色",
                        "text-primary"   :  "紫色",
                        "text-success"   :  "绿色",
                        "text-info"      :  "蓝色",
                        "text-warning"   :  "黄色",
                        "text-danger"    :  "红色",
                    }
                    for (let item in obj) if (item == "class") {
                        this.insert_color_text.class = obj[item]
                        this.insert_color_text.title = bg_color[obj[item]]
                    }
                } else if (opt == "insert_bg_color_text") {  // 插入带背景颜色的文字
                    let bg_color = {
                        "badge-secondary" :  "灰色",
                        "badge-dark"      :  "黑色",
                        "badge-light"     :  "白色",
                        "badge-primary"   :  "紫色",
                        "badge-success"   :  "绿色",
                        "badge-info"      :  "蓝色",
                        "badge-warning"   :  "黄色",
                        "badge-danger"    :  "红色",
                    }
                    for (let item in obj) if (item == "class") {
                        this.insert_bg_color_text.class = obj[item]
                        this.insert_bg_color_text.title = bg_color[obj[item]]
                    }
                } else if (opt == "insert_highlight") {  // 插入高亮引用
                    let text_color = {
                        "text-muted"     :  "灰色",
                        "text-dark"      :  "黑色",
                        "text-white"     :  "白色",
                        "text-primary"   :  "紫色",
                        "text-success"   :  "绿色",
                        "text-info"      :  "蓝色",
                        "text-warning"   :  "黄色",
                        "text-danger"    :  "红色",
                    }
                    let bg_color = {
                        "bg-secondary"   :  "灰色",
                        "alert-secondary":  "淡灰",
                        "alert-light"    :  "白色",
                        "bg-light"       :  "深白",
                        "bg-white"       :  "纯白",
                        "bg-dark"        :  "黑色",
                        "alert-dark"     :  "淡黑",
                        "bg-danger"      :  "红色",
                        "alert-danger"   :  "淡红",
                        "bg-warning"     :  "黄色",
                        "alert-warning"  :  "淡黄",
                        "bg-info"        :  "蓝色",
                        "alert-info"     :  "淡蓝",
                        "bg-success"     :  "绿色",
                        "alert-success"  :  "淡色",
                        "bg-primary"     :  "紫色",
                        "alert-primary"  :  "淡紫",
                    }
                    for (let item in obj) {
                        if (item == "text_color") {
                            this.insert_highlight.text_color = obj[item]
                            this.insert_highlight.text_color_title = text_color[obj[item]]
                        } else if (item == "bg_color") {
                            this.insert_highlight.bg_color = obj[item]
                            this.insert_highlight.bg_color_title = bg_color[obj[item]]
                        }
                    }
                } else if (opt == "insert_btn") {  // 插入按钮
                    let color = {
                        "secondary" :  "灰色",
                        "dark"      :  "黑色",
                        "light"     :  "白色",
                        "primary"   :  "紫色",
                        "success"   :  "绿色",
                        "info"      :  "蓝色",
                        "warning"   :  "黄色",
                        "danger"    :  "红色",
                    }
                    for (let item in obj) if (item == "class") {
                        this.insert_btn.color = obj[item]
                        this.insert_btn.color_title = color[obj[item]]
                    }
                } else if (opt == "insert_tabs") {
                    let text_color = {
                        "text-muted"     :  "灰色",
                        "text-dark"      :  "黑色",
                        "text-white"     :  "白色",
                        "text-primary"   :  "紫色",
                        "text-success"   :  "绿色",
                        "text-info"      :  "蓝色",
                        "text-warning"   :  "黄色",
                        "text-danger"    :  "红色",
                    }
                    for (let item in obj) {
                        if (item == "text_color") {
                            this.insert_tabs.text_color = obj[item]
                            this.insert_tabs.text_color_title = text_color[obj[item]]
                        }
                    }
                }
                
            },
            
            // 插入标签
            insertTag(opt = null) {
                
                let content = null
                
                // 插入彩色文本
                if (opt == "insert_color_text") {
                    
                    // [text class]内容[/text]
                    content = `[text class="${this.insert_color_text.class}"]${this.insert_color_text.text}[/text]\n`
                    
                } else if (opt == "insert_bg_color_text") {  // 插入带背景颜色的文字
                    
                    let bg_mode = $('#insert_bg_color_text-mode-select2').select2('data')[0]['id'];
                    let round   = $('#insert_round_color_text-mode-select2').select2('data')[0]['id'];
                    let lighten = (bg_mode == 1) ? '-lighten' : ''
                    let pill    = (round == 1) ? 'badge-pill' : ''
                    // [tag class]内容[/tag]
                    content = `[tag class="${this.insert_bg_color_text.class}${lighten} ${pill}"]${this.insert_bg_color_text.text}[/tag]\n`
                    
                } else if (opt == "insert_highlight") {  // 插入高亮引用
                
                    // [info class="alert-success"][/info]
                    content = `[info class="${this.insert_highlight.bg_color} ${this.insert_highlight.text_color}"]${this.insert_highlight.text}[/info]\n`
                    
                } else if (opt == "insert_btn") {  // 插入按钮
                
                    let line = $('#insert_outline_btn-select2').select2('data')[0]['id'];
                    let round   = $('#insert_round_btn-select2').select2('data')[0]['id'];
                    let outline = (line == 1) ? '-outline' : ''
                    let pill    = (round == 1) ? ' btn-rounded' : ''
                    let url     = (inisHelper.is.empty(this.insert_btn.url)) ? '' : ` url="${this.insert_btn.url}"`
                    
                    // [btn class url][/btn]
                    content = `[btn class="btn${outline}-${this.insert_btn.color}${pill}"${url}]${this.insert_btn.text}[/btn]`
                    
                } else if (opt == "insert_collapse") {
                    
                    // [collapse]
                    //     [item name="首页" active="true"]这是内容[/item]
                    //     [item name="其他"]这是内容[/item]
                    // [/collapse]
                    
                    let is_active = $('#insert_collapse_active-select2').select2('data')[0]['id'];
                    let active    = (is_active == 1) ? ' active="true"' : ''
                    
                    content = `[collapse]\n\t[item name="${this.insert_collapse.text}"${active}]内容[/item]\n\t[item name="第二收缩框"]内容[/item]\n[/collapse]`
                    
                } else if (opt == "insert_tabs") {
                    
                    // [tabs title class="nav-bordered nav-justified"]
                    //     [item name="tab-name-1" active="true"]
                    //         内容二
                    //     [/item]
                    //     [item name="tab-name-2" class]
                    //         内容二
                    //     [/item]
                    // [/tabs]
                    
                    let id = $('#insert_tabs_mode-select2').select2('data')[0]['id'];
                    let mode = ""
                    
                    if (id == 1) mode = ` class="nav-bordered"`
                    else if (id == 2) mode = ` class="nav-bordered nav-justified"`
                    else if (id == 3) mode = ` class="nav-pills bg-nav-pills nav-justified"`
                    else if (id == 4) mode = ` type="right"`
                    else if (id == 5) mode = ` type="left"`
                    content = `[tabs title="${this.insert_tabs.title || ''}"${mode}]\n\t[item name="${this.insert_tabs.item_title}" class="${this.insert_tabs.text_color}" active="true"]\n\t在这里撰写内容1\n\t[/item]\n\t[item name="${this.insert_tabs.item_title}" class="${this.insert_tabs.text_color}"]\n\t在这里撰写内容2\n\t[/item]\n[/tabs]`
                }
                
                // 在焦点处插入标签
                this.contentEditor.insertValue(content, false)
                // 关闭模态框
                $(`#${opt}`).modal('hide')
            },
            
            // 初始化插入数据
            initInsertData(){
                
                this.insert_color_text = {title: "灰色",class:"text-muted", text:""}
                this.insert_bg_color_text = {title: "紫色",class:"badge-primary", text:""}
                this.insert_highlight = {text_color_title: "黑色",text_color:"text-dark", bg_color_title:"紫色",bg_color:"bg-primary", text:""}
                this.insert_btn = {color_title:"紫色",color:"primary", text:"", url:null}
                this.insert_collapse = {text:"收缩框内容"}
                this.insert_tabs = {text_color_title: "黑色",text_color:"text-dark"}
                
                // 借用方法 - 兼容 bootstrap - jQuery 语法
                axios.get('/index/assets/json/emoji.json').then(res=>{
                    
                    $("#insert_bg_color_text-mode-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [{"id":0,"text":"深色"},{"id":1,"text":"浅色"}],
                    })
                    $("#insert_round_color_text-mode-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [{"id":0,"text":"否"},{"id":1,"text":"是"}],
                    })
                    
                    $("#insert_outline_btn-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [{"id":0,"text":"实心"},{"id":1,"text":"线条"}],
                    })
                    $("#insert_round_btn-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [{"id":0,"text":"否"},{"id":1,"text":"是"}],
                    })
                    
                    $("#insert_collapse_active-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [{"id":0,"text":"否"},{"id":1,"text":"是","selected":true}],
                    })
                    
                    $("#insert_tabs_mode-select2").select2({
                        minimumResultsForSearch: Infinity,  // 取消搜索
                        data: [
                            {"id":0,"text":"默认"},
                            {"id":1,"text":"类型一","selected":true},
                            {"id":2,"text":"类型二"},
                            {"id":3,"text":"类型三"},
                            {"id":4,"text":"类型四"},
                            {"id":5,"text":"类型五"},
                        ]
                    })
                    
                })
                
            }
            
        },
        
    }).mount('#write-page')
    
}();